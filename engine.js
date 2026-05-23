// -------------------------------
// STATE
// -------------------------------
const answers = {};
let currentStep = 1;
let totalSteps = 7;

// -------------------------------
function start() {
  currentStep = 1;
  showDesignStage();
}

// -------------------------------
function render(html) {
  const app = document.getElementById("app");

  const percent = Math.round((currentStep / totalSteps) * 100);

  let progress = "";
  progress += "<div class='progress-container'>";
  progress += "Step " + currentStep + " of " + totalSteps;
  progress += "<div class='progress-bar'>";
  progress += "<div class='progress-fill' style='width:" + percent + "%'></div>";
  progress += "</div></div>";

  app.innerHTML = progress + html;
}

// ----------------------------------------------------
// STEP 1
// ----------------------------------------------------
function showDesignStage() {
  let html = "";
  html += "<h2>Design Stage</h2>";
  html += "<button onclick=\"selectDesignStage('Concept')\">Concept</button>";
  html += "<button onclick=\"selectDesignStage('Detailed')\">Detailed</button>";

  render(html);
}

function selectDesignStage(stage) {
  answers.designStage = stage;

  if (stage === "Concept") {
    totalSteps = 5;
  } else {
    totalSteps = 7;
  }

  currentStep++;
  showRiskLevel();
}

// ----------------------------------------------------
// STEP 2
// ----------------------------------------------------
function showRiskLevel() {
  let html = "";
  html += "<h2>Risk Level</h2>";
  html += "<button onclick=\"selectRisk('Low')\">Low</button>";
  html += "<button onclick=\"selectRisk('High')\">High</button>";

  render(html);
}

function selectRisk(level) {
  answers.riskLevel = level;
  currentStep++;
  showObjectives();
}

// ----------------------------------------------------
// STEP 3
// ----------------------------------------------------
function showObjectives() {
  let html = "";
  html += "<h2>Objective</h2>";
  html += "<button onclick=\"selectObjective('Hydraulics')\">Hydraulics</button>";
  html += "<button onclick=\"selectObjective('Scour')\">Scour</button>";

  render(html);
}

function selectObjective(obj) {
  answers.objective = obj;
  currentStep++;

  if (answers.designStage === "Concept") {
    showDischarge();
  } else {
    showGeometry();
  }
}

// ----------------------------------------------------
// STEP 4 (Geometry grouped)
// ----------------------------------------------------
function showGeometry() {
  let html = "";
  html += "<h2>Geometry</h2>";

  html += "Length (m):<br><input id='len'><br>";
  html += "Upstream (m):<br><input id='up'><br>";
  html += "Downstream (m):<br><input id='down'><br>";
  html += "Width (m):<br><input id='width'><br>";

  html += "<br><button onclick='saveGeometry()'>Next</button>";

  render(html);
}

function saveGeometry() {
  answers.length = parseFloat(document.getElementById("len").value) || 0;
  answers.upstream = parseFloat(document.getElementById("up").value) || 0;
  answers.downstream = parseFloat(document.getElementById("down").value) || 0;
  answers.width = parseFloat(document.getElementById("width").value) || 0;

  currentStep++;
  showDischarge();
}

// ----------------------------------------------------
// STEP 5
// ----------------------------------------------------
function showDischarge() {
  let html = "";
  html += "<h2>Prototype Flow</h2>";
  html += "Flow (m3/s):<br><input id='Qp'><br>";
  html += "<br><button onclick='saveDischarge()'>Next</button>";

  render(html);
}

function saveDischarge() {
  answers.discharge = parseFloat(document.getElementById("Qp").value) || 0;
  currentStep++;
  showFacility();
}

// ----------------------------------------------------
// STEP 6 (Facility grouped)
// ----------------------------------------------------
function showFacility() {
  let html = "";
  html += "<h2>Facility</h2>";

  html += "Bay Length (m):<br><input id='bayL'><br>";
  html += "Bay Width (m):<br><input id='bayW'><br>";
  html += "Available Flow (L/s):<br><input id='Qavail'><br>";

  html += "<br><button onclick='saveFacility()'>Run</button>";

  render(html);
}

function saveFacility() {
  answers.bayLength = parseFloat(document.getElementById("bayL").value) || 0;
  answers.bayWidth = parseFloat(document.getElementById("bayW").value) || 0;
  answers.availableFlow = parseFloat(document.getElementById("Qavail").value) || 0;

  currentStep++;
  showResults();
}

// ----------------------------------------------------
// SCALE CALC
// ----------------------------------------------------
function computeScales() {
  const Lp = (answers.length || 0) + (answers.upstream || 0) + (answers.downstream || 0);
  const Wp = answers.width || 0;
  const Qp = answers.discharge || 0;

  const bayL = answers.bayLength || 0;
  const bayW = answers.bayWidth || 0;
  const Qavail = (answers.availableFlow || 0) / 1000;

  const scales = [20, 40, 60, 80, 100, 150, 200];
  const results = [];

  for (let i = 0; i < scales.length; i++) {
    let N = scales[i];

    let Lm = Lp / N;
    let Wm = Wp / N;
    let Qm = Qp / Math.pow(N, 2.5);

    let fitsGeo = (Lm <= bayL) && (Wm <= bayW);
    let fitsFlow = Qm <= Qavail;

    results.push({
      N: N,
      Lm: Lm,
      Wm: Wm,
      Qm: Qm,
      fitsGeo: fitsGeo,
      fitsFlow: fitsFlow,
      pass: fitsGeo && fitsFlow
    });
  }

  return results;
}

// ----------------------------------------------------
// RESULTS
// ----------------------------------------------------
function showResults() {
  const results = computeScales();

  let rec = "No viable scale";
  for (let i = 0; i < results.length; i++) {
    if (results[i].pass) {
      rec = "Recommended scale: 1:" + results[i].N;
      break;
    }
  }

  let html = "";
  html += "<h2>Results</h2>";
  html += "<p>" + rec + "</p>";

  html += "<table border='1'><tr>";
  html += "<th>Scale</th><th>L</th><th>W</th><th>Q</th><th>Geo</th><th>Flow</th><th>Pass</th>";
  html += "</tr>";

  for (let i = 0; i < results.length; i++) {
    let r = results[i];

    html += "<tr>";
    html += "<td>1:" + r.N + "</td>";
    html += "<td>" + r.Lm.toFixed(2) + "</td>";
    html += "<td>" + r.Wm.toFixed(2) + "</td>";
    html += "<td>" + r.Qm.toFixed(3) + "</td>";
    html += "<td>" + (r.fitsGeo ? "✓" : "✗") + "</td>";
    html += "<td>" + (r.fitsFlow ? "✓" : "✗") + "</td>";
    html += "<td>" + (r.pass ? "✓" : "✗") + "</td>";
    html += "</tr>";
  }

  html += "</table>";
  html += "<br><button onclick='start()'>Restart</button>";

  render(html);
}
