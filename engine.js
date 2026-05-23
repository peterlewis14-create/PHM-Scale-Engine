// -------------------------------
// STATE
// -------------------------------
const answers = {};
let currentStep = 1;
let totalSteps = 6;

// -------------------------------
function start() {
  currentStep = 1;
  showProjectSpecifics();
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
// PROJECT SPECIFICS (GROUPED)
// ----------------------------------------------------
function showProjectSpecifics() {
  let html = "";
  html += "<h2>Project Specifics</h2>";

  html += "<label>Design Stage</label><br>";
  html += "<select id='stage'>";
  html += "<option>Concept</option>";
  html += "<option>Detailed</option>";
  html += "</select><br><br>";

  html += "<label>Project Risk Level</label><br>";
  html += "<select id='risk'>";
  html += "<option>Low</option>";
  html += "<option>High</option>";
  html += "</select><br><br>";

  html += "<label>Project Focus</label><br>";
  html += "<select id='focus'>";
  html += "<option>Hydraulics</option>";
  html += "<option>Scour</option>";
  html += "</select><br><br>";

  html += "<label>Known Hydraulic Issues</label><br>";
  html += "<select id='issues'>";
  html += "<option>None</option>";
  html += "<option>Some</option>";
  html += "<option>Critical</option>";
  html += "</select>";

  html += "<br><br><button onclick='saveProjectSpecifics()'>Next</button>";

  render(html);
}

function saveProjectSpecifics() {
  answers.designStage = document.getElementById("stage").value;
  answers.riskLevel = document.getElementById("risk").value;
  answers.objective = document.getElementById("focus").value;
  answers.issues = document.getElementById("issues").value;

  if (answers.designStage === "Concept") {
    totalSteps = 4;
  } else {
    totalSteps = 6;
  }

  currentStep++;
  if (answers.designStage === "Concept") {
    showDischarge();
  } else {
    showGeometry();
  }
}

// ----------------------------------------------------
// PROTOTYPE GEOMETRY
// ----------------------------------------------------
function showGeometry() {
  let html = "";
  html += "<h2>Prototype Geometry</h2>";

  html += "<label>Total Structure Length (m)</label><br><input id='len'><br>";
  html += "<label>Upstream Extent (m)</label><br><input id='up'><br>";
  html += "<label>Downstream Extent (m)</label><br><input id='down'><br>";
  html += "<label>Width of Interest (m)</label><br><input id='width'><br>";

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
// PROTOTYPE FLOW
// ----------------------------------------------------
function showDischarge() {
  let html = "";
  html += "<h2>Prototype Flow</h2>";

  html += "<label>Discharge (m³/s)</label><br>";
  html += "<input id='Qp'><br>";

  html += "<br><button onclick='saveDischarge()'>Next</button>";

  render(html);
}

function saveDischarge() {
  answers.discharge = parseFloat(document.getElementById("Qp").value) || 0;

  currentStep++;
  showLaboratoryConditions();
}

// ----------------------------------------------------
// LABORATORY CONDITIONS (RENAMED)
// ----------------------------------------------------
function showLaboratoryConditions() {
  let html = "";
  html += "<h2>Laboratory Conditions</h2>";

  html += "<label>Available Bay Length (m)</label><br>";
  html += "<input id='bayL'><br>";

  html += "<label>Available Bay Width (m)</label><br>";
  html += "<input id='bayW'><br>";

  html += "<label>Available Flow Supply (L/s)</label><br>";
  html += "<input id='Qavail'><br>";

  html += "<br><button onclick='saveLaboratoryConditions()'>Run Assessment</button>";

  render(html);
}

function saveLaboratoryConditions() {
  answers.bayLength = parseFloat(document.getElementById("bayL").value) || 0;
  answers.bayWidth = parseFloat(document.getElementById("bayW").value) || 0;
  answers.availableFlow = parseFloat(document.getElementById("Qavail").value) || 0;

  currentStep++;
  showResults();
}

// ----------------------------------------------------
// SCALE CALCULATION
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

  let recommendation = selected
    ? "✅ Recommended Scale: 1:" + selected.N
    : "❌ No viable scale identified";

  let geoFails = results.filter(r => !r.fitsGeo).length;
  let flowFails = results.filter(r => !r.fitsFlow).length;

  let governing = "";
  if (geoFails > flowFails) {
    governing = "Geometry governs (model size exceeds laboratory capacity)";
  } else if (flowFails > geoFails) {
    governing = "Flow governs (required discharge exceeds supply capacity)";
  } else {
    governing = "Both geometry and flow constraints are equally critical";
  }

  let actions = "<ul>";

  if (flowFails > 0) {
    actions += "<li>Consider increasing scale (coarser model) to reduce required discharge</li>";
    actions += "<li>Assess whether full design flow range is required</li>";
  }

  if (geoFails > 0) {
    actions += "<li>Reduce upstream/downstream extents if feasible</li>";
    actions += "<li>Consider sectional or partial modelling approach</li>";
  }

  if (!selected) {
    actions += "<li>Consider distorted scale or multiple-model strategy</li>";
  }

  actions += "</ul>";

  // Table
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

  let html = "";
  html += "<h2>Scale Assessment & Recommendation</h2>";
  html += "<div class='recommend'>" + recommendation + "</div>";
  html += table;

  html += "<div class='reasoning'>";
  html += "<h3>Governing Condition</h3>";
  html += "<p>" + governing + "</p>";
  html += "<h3>Recommended Next Steps</h3>";
  html += actions;
  html += "</div>";

  html += "<br><button onclick='start()'>Restart</button>";

  render(html);
}
