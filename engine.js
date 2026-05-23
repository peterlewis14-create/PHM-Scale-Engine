// -------------------------------
// ANSWER STORAGE
// -------------------------------
const answers = {};

function start() {
  showDesignStage();
}

// ----------------------------------------------------
// QUESTION 1 — DESIGN STAGE
// ----------------------------------------------------
function showDesignStage() {
  render(`
    <h2>Design Stage</h2>
    <button onclick="selectDesignStage('Concept')">Concept</button>
    <button onclick="selectDesignStage('Preliminary')">Preliminary</button>
    <button onclick="selectDesignStage('Detailed')">Detailed</button>
  `);
}

function selectDesignStage(stage) {
  answers.designStage = stage;
  showRiskLevel();
}

// ----------------------------------------------------
function showRiskLevel() {
  render(`
    <h2>Risk Level</h2>
    <button onclick="selectRisk('Low')">Low</button>
    <button onclick="selectRisk('Medium')">Medium</button>
    <button onclick="selectRisk('High')">High</button>
  `);
}

function selectRisk(level) {
  answers.riskLevel = level;
  showObjectives();
}

// ----------------------------------------------------
function showObjectives() {
  render(`
    <h2>Primary Objective</h2>
    <button onclick="selectObjective('Hydraulics')">Hydraulics</button>
    <button onclick="selectObjective('Energy Dissipation')">Energy Dissipation</button>
    <button onclick="selectObjective('Scour')">Scour / Erosion</button>
    <button onclick="selectObjective('General')">General Behaviour</button>
  `);
}

function selectObjective(obj) {
  answers.objective = obj;
  showKnownIssues();
}

// ----------------------------------------------------
function showKnownIssues() {
  render(`
    <h2>Known Issues</h2>
    <button onclick="selectIssues('None')">None</button>
    <button onclick="selectIssues('Some')">Some</button>
    <button onclick="selectIssues('Critical')">Critical</button>
  `);
}

function selectIssues(issue) {
  answers.issues = issue;

  if (answers.designStage === 'Concept') {
    showPrototypeDischarge();
  } else {
    showPrototypeLength();
  }
}

// ----------------------------------------------------
// GEOMETRY
// ----------------------------------------------------
function showPrototypeLength() {
  render(`
    <h2>Total Structure Length (m)</h2>
    <input id="len" type="number">
    <button onclick="saveLength()">Next</button>
  `);
}

function saveLength() {
  answers.length = parseFloat(document.getElementById("len").value) || 0;
  showUpstreamExtent();
}

function showUpstreamExtent() {
  render(`
    <h2>Upstream Extent (m)</h2>
    <input id="up" type="number">
    <button onclick="saveUpstream()">Next</button>
  `);
}

function saveUpstream() {
  answers.upstream = parseFloat(document.getElementById("up").value) || 0;
  showDownstreamExtent();
}

function showDownstreamExtent() {
  render(`
    <h2>Downstream Extent (m)</h2>
    <input id="down" type="number">
    <button onclick="saveDownstream()">Next</button>
  `);
}

function saveDownstream() {
  answers.downstream = parseFloat(document.getElementById("down").value) || 0;
  showWidthOfInterest();
}

function showWidthOfInterest() {
  render(`
    <h2>Width of Interest (m)</h2>
    <input id="width" type="number">
    <button onclick="saveWidth()">Next</button>
  `);
}

function saveWidth() {
  answers.width = parseFloat(document.getElementById("width").value) || 0;
  showPrototypeDischarge();
}

// ----------------------------------------------------
// HYDRAULICS
// ----------------------------------------------------
function showPrototypeDischarge() {
  render(`
    <h2>Prototype Discharge (m³/s)</h2>
    <input id="Qp" type="number">
    <button onclick="saveDischarge()">Next</button>
  `);
}

function saveDischarge() {
  answers.discharge = parseFloat(document.getElementById("Qp").value) || 0;
  showBayLength();
}

function showBayLength() {
  render(`
    <h2>Facility Length (m)</h2>
    <input id="bayL" type="number">
    <button onclick="saveBayLength()">Next</button>
  `);
}

function saveBayLength() {
  answers.bayLength = parseFloat(document.getElementById("bayL").value) || 0;
  showBayWidth();
}

function showBayWidth() {
  render(`
    <h2>Facility Width (m)</h2>
    <input id="bayW" type="number">
    <button onclick="saveBayWidth()">Next</button>
  `);
}

function saveBayWidth() {
  answers.bayWidth = parseFloat(document.getElementById("bayW").value) || 0;
  showAvailableFlow();
}

function showAvailableFlow() {
  render(`
    <h2>Available Flow (L/s)</h2>
    <input id="Qavail" type="number">
    <button onclick="saveAvailableFlow()">Run Analysis</button>
  `);
}

function saveAvailableFlow() {
  answers.availableFlow = parseFloat(document.getElementById("Qavail").value) || 0;
  showResults();
}

// ----------------------------------------------------
// SCALE LOGIC
// ----------------------------------------------------
function getScaleRange() {
  if (answers.objective === "Scour") return [20, 80];
  if (answers.riskLevel === "High") return [20, 100];
  if (answers.designStage === "Concept") return [50, 200];
  return [30, 150];
}

function computeScales() {
  const Lp = answers.length + answers.upstream + answers.downstream;
  const Wp = answers.width;
  const Qp = answers.discharge;

  const bayL = answers.bayLength;
  const bayW = answers.bayWidth;
  const Qavail = answers.availableFlow / 1000; // L/s → m³/s

  const [minS, maxS] = getScaleRange();

  const trial = [20, 30, 40, 50, 75, 100, 125, 150, 200];

  const results = [];

  trial.forEach(N => {
    if (N < minS || N > maxS) return;

    const Lm = Lp / N;
    const Wm = Wp / N;
    const Qm = Qp / Math.pow(N, 2.5);

    const fitsGeo = (Lm <= bayL) && (Wm <= bayW);
    const fitsFlow = Qm <= Qavail;

    results.push({
      N,
      Lm,
      Wm,
      Qm,
      fitsGeo,
      fitsFlow,
      pass: fitsGeo && fitsFlow
    });
  });

  return results;
}

// ----------------------------------------------------
// RESULTS DISPLAY
// ----------------------------------------------------
function showResults() {
  const results = computeScales();
  const passing = results.filter(r => r.pass);

  let recommendation = "";

  if (passing.length > 0) {
    recommendation = `✅ Recommended Scale: 1:${passing[0].N}`;
  } else {
    const anyGeo = results.some(r => r.fitsGeo);
    const anyFlow = results.some(r => r.fitsFlow);

    if (!anyGeo && anyFlow) {
      recommendation = "⚠ Geometry does not fit → Reduce extents or use sectional model";
    } else if (anyGeo && !anyFlow) {
      recommendation = "⚠ Flow limited → Use coarser scale";
    } else {
      recommendation = "❌ No feasible scale → Consider distorted or sectional model";
    }
  }

  let table = `
    <table>
      <tr>
        <th>Scale</th>
        <th>Length</th>
        <th>Width</th>
        <th>Flow</th>
        <th>Geometry</th>
        <th>Flow Check</th>
        <th>Result</th>
      </tr>
  `;

  results.forEach(r => {
    table += `
      <tr>
        <td>1:${r.N}</td>
        <td>${r.Lm.toFixed(2)}</td>
        <td>${r.Wm.toFixed(2)}</td>
        <td>${r.Qm.toFixed(3)}</td>
        <td class="${r.fitsGeo ? 'pass' : 'fail'}">
          ${r.fitsGeo ? "✓" : "✗"}
        </td>
        <td class="${r.fitsFlow ? 'pass' : 'fail'}">
          ${r.fitsFlow ? "✓" : "✗"}
        </td>
        <td class="${r.pass ? 'pass' : 'fail'}">
          ${r.pass ? "PASS" : "FAIL"}
        </td>
      </tr>
    `;
  });

  table += "</table>";

  render(`
    <h2>Results</h2>

    <div class="recommend">${recommendation}</div>

    ${table}

    <br>
    <button onclick="start()">Restart</button>
  `);
}
// ----------------------------------------------------
// RENDER
// ----------------------------------------------------
function render(html) {
  document.getElementById("app").innerHTML = html;
}
``

