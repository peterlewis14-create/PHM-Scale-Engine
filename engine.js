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
// QUESTIONS
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
  totalSteps = (stage === "Concept") ? 5 : 7;
  currentStep++;
  showRiskLevel();
}

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
// GEOMETRY
// ----------------------------------------------------
function showGeometry() {
  let html = "";
  html += "<h2>Prototype Geometry</h2>";
  html += "Total Length (m)<br><input id='len'><br>";
  html += "Upstream (m)<br><input id='up'><br>";
  html += "Downstream (m)<br><input id='down'><br>";
  html += "Width (m)<br><input id='width'><br>";
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
// FLOW
// ----------------------------------------------------
function showDischarge() {
  let html = "";
  html += "<h2>Prototype Flow</h2>";
  html += "Discharge (m3/s)<br><input id='Qp'><br>";
  html += "<br><button onclick='saveDischarge()'>Next</button>";
  render(html);
}

function saveDischarge() {
  answers.discharge = parseFloat(document.getElementById("Qp").value) || 0;
  currentStep++;
  showFacility();
}

// ----------------------------------------------------
// FACILITY
// ----------------------------------------------------
function showFacility() {
  let html = "";
  html += "<h2>Facility Constraints</h2>";
  html += "Bay Length (m)<br><input id='bayL'><br>";
  html += "Bay Width (m)<br><input id='bayW'><br>";
  html += "Available Flow (L/s)<br><input id='Qavail'><br>";
  html += "<br><button onclick='saveFacility()'>Run Analysis</button>";
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
      N, Lm, Wm, Qm,
      fitsGeo, fitsFlow,
      pass: fitsGeo && fitsFlow
    });
  }

  return results;
}

// ----------------------------------------------------
// RESULTS + ENGINEERING LOGIC
// ----------------------------------------------------
function showResults() {
  const results = computeScales();
  let selected = null;

  for (let i = 0; i < results.length; i++) {
    if (results[i].pass) {
      selected = results[i];
      break;
    }
  }

  let recommendation = "";
  let governing = "";
  let actions = "";

  if (selected) {
    recommendation = "✅ Recommended Scale: 1:" + selected.N;
  } else {
    recommendation = "❌ No viable scale found";
  }

  // ---------------- GOVERNING CONSTRAINT ----------------
  let geoFails = results.filter(r => !r.fitsGeo).length;
  let flowFails = results.filter(r => !r.fitsFlow).length;

  if (geoFails > flowFails) {
    governing = "Geometry (model size exceeds facility limits)";
  } else if (flowFails > geoFails) {
    governing = "Flow capacity (required discharge too high)";
  } else {
    governing = "Both geometry and flow constraints are critical";
  }

  // ---------------- RECOMMENDATIONS ----------------
  actions += "<ul>";

  if (flowFails > 0) {
    actions += "<li>Consider increasing scale (coarser model) to reduce flow demand</li>";
    actions += "<li>Reduce design flow range if acceptable</li>";
  }

  if (geoFails > 0) {
    actions += "<li>Reduce model extent (truncate upstream/downstream)</li>";
    actions += "<li>Consider sectional or partial model</li>";
  }

  if (!selected) {
    actions += "<li>Consider distorted scale or multiple models</li>";
  }

  actions += "</ul>";

  // ---------------- TABLE ----------------
  let table = "<table><tr>";
  table += "<th>Scale</th><th>L</th><th>W</th><th>Q</th><th>Geo</th><th>Flow</th><th>Pass</th></tr>";

  for (let i = 0; i < results.length; i++) {
    let r = results[i];

    table += "<tr>";
    table += "<td>1:" + r.N + "</td>";
    table += "<td>" + r.Lm.toFixed(2) + "</td>";
    table += "<td>" + r.Wm.toFixed(2) + "</td>";
    table += "<td>" + r.Qm.toFixed(3) + "</td>";

    table += "<td class='" + (r.fitsGeo ? "good" : "bad") + "'>" + (r.fitsGeo ? "✓" : "✗") + "</td>";
    table += "<td class='" + (r.fitsFlow ? "good" : "bad") + "'>" + (r.fitsFlow ? "✓" : "✗") + "</td>";
    table += "<td class='" + (r.pass ? "good" : "bad") + "'>" + (r.pass ? "✓" : "✗") + "</td>";

    table += "</tr>";
  }

  table += "</table>";

  // ---------------- FINAL OUTPUT ----------------
  let html = "";
  html += "<h2>Results</h2>";
  html += "<div class='recommend'>" + recommendation + "</div>";
  html += table;

  html += "<div class='reasoning'>";
  html += "<h3>Governing Constraint</h3>";
  html += "<p>" + governing + "</p>";

  html += "<h3>Recommended Actions</h3>";
  html += actions;
  html += "</div>";

  html += "<br><button onclick='start()'>Restart</button>";

  render(html);
}
