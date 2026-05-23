// -------------------------------
// STATE
// -------------------------------
const answers = {};
let currentStep = 1;
let totalSteps = 6;

// History stack for Back button
let historyStack = [];

// -------------------------------
function start() {
  currentStep = 1;
  historyStack = [];
  showProjectSpecifics();
}

// -------------------------------
function goBack() {
  if (historyStack.length > 0) {
    const prev = historyStack.pop();
    currentStep--;
    prev();
  }
}

// -------------------------------
function render(html, saveStateFn) {
  const app = document.getElementById("app");

  if (saveStateFn) {
    historyStack.push(saveStateFn);
  }

  const percent = Math.round((currentStep / totalSteps) * 100);

  let progress = "";
  progress += "<div class='progress-container'>";
  progress += "Step " + currentStep + " of " + totalSteps;
  progress += "<div class='progress-bar'>";
  progress += "<div class='progress-fill' style='width:" + percent + "%'></div>";
  progress += "</div></div>";

  let backBtn = "";
  if (historyStack.length > 0) {
    backBtn = "<button onclick='goBack()'>Back</button><br><br>";
  }

  app.innerHTML = progress + backBtn + html;
}

// ----------------------------------------------------
// PROJECT SPECIFICS
// ----------------------------------------------------
function showProjectSpecifics() {
  let html = "";
  html += "<h2>Project Specifics</h2>";

  html += "<label>Design Stage</label><br>";
  html += "<select id='stage'><option>Concept</option><option>Detailed</option></select><br><br>";

  html += "<label>Project Risk Level</label><br>";
  html += "<select id='risk'><option>Low</option><option>High</option></select><br><br>";

  html += "<label>Project Focus</label><br>";
  html += "<select id='focus'><option>Hydraulics</option><option>Scour</option></select><br><br>";

  html += "<label>Known Hydraulic Issues</label><br>";
  html += "<select id='issues'><option>None</option><option>Some</option><option>Critical</option></select>";

  html += "<br><br><button onclick='saveProjectSpecifics()'>Next</button>";

  render(html, showProjectSpecifics);
}

function saveProjectSpecifics() {
  answers.designStage = document.getElementById("stage").value;
  answers.riskLevel = document.getElementById("risk").value;
  answers.objective = document.getElementById("focus").value;
  answers.issues = document.getElementById("issues").value;

  totalSteps = (answers.designStage === "Concept") ? 4 : 6;

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

  render(html, showGeometry);
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

  html += "Discharge (m³/s)<br><input id='Qp'><br>";

  html += "<br><button onclick='saveDischarge()'>Next</button>";

  render(html, showDischarge);
}

function saveDischarge() {
  answers.discharge = parseFloat(document.getElementById("Qp").value) || 0;

  currentStep++;
  showLaboratoryConditions();
}

// ----------------------------------------------------
// LAB CONDITIONS
// ----------------------------------------------------
function showLaboratoryConditions() {
  let html = "";
  html += "<h2>Laboratory Conditions</h2>";

  html += "Bay Length (m)<br><input id='bayL'><br>";
  html += "Bay Width (m)<br><input id='bayW'><br>";
  html += "Available Flow (L/s)<br><input id='Qavail'><br>";

  html += "<br><button onclick='saveLaboratoryConditions()'>Run Assessment</button>";

  render(html, showLaboratoryConditions);
}

function saveLaboratoryConditions() {
  answers.bayLength = parseFloat(document.getElementById("bayL").value) || 0;
  answers.bayWidth = parseFloat(document.getElementById("bayW").value) || 0;
  answers.availableFlow = parseFloat(document.getElementById("Qavail").value) || 0;

  currentStep++;
  showResults();
}

// ----------------------------------------------------
// CALC
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

    results.push({ N, Lm, Wm, Qm, fitsGeo, fitsFlow, pass: fitsGeo && fitsFlow });
  }

  return results;
}

// ----------------------------------------------------
// RESULTS
// ----------------------------------------------------
function showResults() {
  const results = computeScales();

  let selectedIndex = -1;
  for (let i = 0; i < results.length; i++) {
    if (results[i].pass) {
      selectedIndex = i;
      break;
    }
  }

  let html = "";
  html += "<h2>Scale Assessment & Recommendation</h2>";

  if (selectedIndex >= 0) {
    html += "<div class='recommend'>✅ Recommended Scale: 1:" + results[selectedIndex].N + "</div>";
  } else {
    html += "<div class='recommend'>❌ No viable scale identified</div>";
  }

  html += "<table><tr><th>Scale</th><th>L</th><th>W</th><th>Q</th><th>Geo</th><th>Flow</th></tr>";

  for (let i = 0; i < results.length; i++) {
    let r = results[i];
    let highlight = (i === selectedIndex) ? " style='background:#d9f2ff; font-weight:bold;'" : "";

    html += "<tr" + highlight + ">";
    html += "<td>1:" + r.N + "</td>";
    html += "<td>" + r.Lm.toFixed(2) + "</td>";
    html += "<td>" + r.Wm.toFixed(2) + "</td>";
    html += "<td>" + r.Qm.toFixed(3) + "</td>";
    html += "<td>" + (r.fitsGeo ? "✓" : "✗") + "</td>";
    html += "<td>" + (r.fitsFlow ? "✓" : "✗") + "</td>";
    html += "</tr>";
  }

  html += "</table>";

  // UTILISATION BARS
  if (selectedIndex >= 0) {
    let r = results[selectedIndex];

    let geoUtil = ((r.Lm / answers.bayLength) * 100).toFixed(0);
    let flowUtil = ((r.Qm / (answers.availableFlow / 1000)) * 100).toFixed(0);

    html += "<h3>Utilisation</h3>";

    html += "Geometry: " + geoUtil + "%";
    html += "<div class='progress-bar'><div class='progress-fill' style='width:" + geoUtil + "%'></div></div>";

    html += "Flow: " + flowUtil + "%";
    html += "<div class='progress-bar'><div class='progress-fill' style='width:" + flowUtil + "%'></div></div>";
  }

  html += "<br><button onclick='start()'>Restart</button>";

  render(html, showResults);
}
