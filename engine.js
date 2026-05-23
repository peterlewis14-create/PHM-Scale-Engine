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
function getProgressBar() {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return `
    <div class="progress-container">
      <div class="progress-text">Step ${currentStep} of ${totalSteps}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>
    </div>
  `;
}

// -------------------------------
function render(content) {
  const app = document.getElementById("app");
  app.innerHTML = getProgressBar() + content;
}

// ----------------------------------------------------
// DESIGN STAGE
// ----------------------------------------------------
function showDesignStage() {
  render(`
    <h2>Design Stage</h2>
    <button onclick="selectDesignStage('Concept')">Concept</button>
    <button onclick="selectDesignStage('Detailed')">Detailed</button>
  `);
}

function selectDesignStage(stage) {
  answers.designStage = stage;

  totalSteps = (stage === "Concept") ? 5 : 7;

  currentStep++;
  showRiskLevel();
}

// ----------------------------------------------------
function showRiskLevel() {
  render(`
    <h2>Risk Level</h2>
    <button onclick="selectRisk('Low')">Low</button>
    <button onclick="selectRisk('High')">High</button>
  `);
}

function selectRisk(level) {
  answers.riskLevel = level;
  currentStep++;
  showObjectives();
}

// ----------------------------------------------------
function showObjectives() {
  render(`
    <h2>Primary Objective</h2>
    <button onclick="selectObjective('Hydraulics')">Hydraulics</button>
    <button onclick="selectObjective('Scour')">Scour / Erosion</button>
  `);
}

function selectObjective(obj) {
  answers.objective = obj;
  currentStep++;

  if (answers.designStage === "Concept") {
    showPrototypeDischarge();
  } else {
    showGeometry();
  }
}

// ----------------------------------------------------
// GEOMETRY (GROUPED)
// ----------------------------------------------------
function showGeometry() {
  render(`
    <h2>Prototype Geometry</h2>

    <label>Total Length (m)</label>
    <input id="len" type="number">

    <label>Upstream Extent (m)</label>
    <input id="up" type="number">

    <label>Downstream Extent (m)</label>
    <input id="down" type="number">

    <label>Width (m)</label>
    <input id="width" type="number">

    <br><br>
    <button onclick="saveGeometry()">Next</button>
  `);
}

function saveGeometry() {
  answers.length = parseFloat(document.getElementById("len").value) || 0;
  answers.upstream = parseFloat(document.getElementById("up").value) || 0;
  answers.downstream = parseFloat(document.getElementById("down").value) || 0;
  answers.width = parseFloat(document.getElementById("width").value) || 0;

  currentStep++;
  showPrototypeDischarge();
}

// ----------------------------------------------------
// HYDRAULICS
// ----------------------------------------------------
function showPrototypeDischarge() {
  render(`
    <h2>Prototype Discharge</h2>

    <label>Flow (m³/s)</label>
    <input id="Qp" type="number">

    <br><br>
    <button onclick="saveDischarge()">Next</button>
  `);
}

function saveDischarge() {
  answers.discharge = parseFloat(document.getElementById("Qp").value) || 0;
  currentStep++;
  showFacility();
}

// ----------------------------------------------------
// FACILITY (GROUPED)
// ----------------------------------------------------
function showFacility() {
  render(`
    <h2>Facility Requirements</h2>

    <label>Bay Length (m)</label>
    <input id="bayL" type="number">

    <label>Bay Width (m)</label>
    <input id="bayW" type="number">

    <label>Available Flow (L/s)</label>
    <input id="Qavail" type="number">

    <br><br>
    <button onclick="saveFacility()">Run Analysis</button>
  `);
}

function saveFacility() {
  answers.bayLength = parseFloat(document.getElementById("bayL").value) || 0;
  answers.bayWidth = parseFloat(document.getElementById("bayW").value) || 0;
  answers.availableFlow = parseFloat(document.getElementById("Qavail").value) || 0;

  currentStep++;
  showResults();
}

// ----------------------------------------------------
// SCALE LOGIC
// ----------------------------------------------------
function computeScales() {
  const Lp = (answers.length || 0) + (answers.upstream || 0) + (answers.downstream || 0);
  const Wp = answers.width || 0;
  const Qp = answers.discharge || 0;

  const bayL = answers.bayLength || 0;
  const bayW = answers.bayWidth || 0;
  const Qavail = (answers.availableFlow || 0) / 1000;

  const trial = [20, 40, 60, 80, 100, 150, 200];
  const results = [];

  trial.forEach(N => {
    const Lm = Lp / N;
    const Wm = Wp / N;
    const Qm = Qp / Math.pow(N, 2.5);

    const fitsGeo = (Lm <= bayL) && (Wm <= bayW);
    const fitsFlow = Qm <= Qavail;

    results.push({
      N, Lm, Wm, Qm,
      fitsGeo, fitsFlow,
      pass: fitsGeo && fitsFlow
    });
  });

  return results;
}

// ----------------------------------------------------
// RESULTS
// ----------------------------------------------------
function showResults() {
  const results = computeScales();
  const passing = results.filter(r => r.pass);

  let recommendation = "";

  if (passing.length > 0) {
    recommendation = `✅ Recommended Scale: 1:${passing[0].N}`;
  } else {
    recommendation = "❌ No suitable scale — adjust geometry or flow constraints";
  }

  let table = `
    <table border="1" cellpadding="5">
      <tr>
        <th>Scale</th>
        <th>Length</th>
        <th>Width</th>
        <th>Flow</th>
        <th>Geo</th>
        <th>Flow</th>
        <th>Pass</th>
      </tr>
  `;

  results.forEach(r => {
    table += `
      <tr>
        <td>1:${r.N}</td>
        <td>${r.Lm.toFixed(2)}</td>
        <td>${r.Wm.toFixed(2)}</td>
        <td>${r.Qm.toFixed(3)}</td>
        <td>${r.fitsGeo ? "✅" : "❌"}</td>
        <td>${r.fitsFlow ? "✅" : "❌"}</td>
        <td>${r.pass ? "✅" : "❌"}</td>
      </tr>
    `;
  });

  table += "</table>";

  render(`
    <h2>Results</h2>
    <p>${recommendation}</p>
    ${table}
    <br>
    <button onclick="start()">Restart</button>
  `);
}
