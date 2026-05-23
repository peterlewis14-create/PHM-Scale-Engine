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
    <p>What is the current design stage?</p>
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
// QUESTION 2 — RISK LEVEL
// ----------------------------------------------------
function showRiskLevel() {
  render(`
    <h2>Risk Level</h2>
    <p>What is the project risk level?</p>
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
// QUESTION 3 — PRIMARY OBJECTIVES
// ----------------------------------------------------
function showObjectives() {
  render(`
    <h2>Primary Objectives</h2>
    <p>What is the main objective of the physical model?</p>
    <button onclick="selectObjective('Hydraulics')">Hydraulics</button>
    <button onclick="selectObjective('Energy Dissipation')">Energy Dissipation</button>
    <button onclick="selectObjective('Scour / Erosion')">Scour / Erosion</button>
    <button onclick="selectObjective('General Behaviour')">General Behaviour</button>
  `);
}

function selectObjective(obj) {
  answers.objective = obj;
  showKnownIssues();
}

// ----------------------------------------------------
// QUESTION 4 — KNOWN ISSUES
// ----------------------------------------------------
function showKnownIssues() {
  render(`
    <h2>Known Issues</h2>
    <p>Are there any known issues or sensitivities?</p>
    <button onclick="selectIssues('None')">None</button>
    <button onclick="selectIssues('Some')">Some</button>
    <button onclick="selectIssues('Critical')">Critical</button>
  `);
}

function selectIssues(issue) {
  answers.issues = issue;

  // Branching: if Concept stage → skip detailed geometry
  if (answers.designStage === 'Concept') {
    showPrototypeDischarge();
  } else {
    showPrototypeLength();
  }
}

// ----------------------------------------------------
// GEOMETRY QUESTIONS (only for Preliminary/Detailed)
// ----------------------------------------------------
function showPrototypeLength() {
  render(`
    <h2>Prototype Geometry</h2>
    <p>Enter spillway + basin length (m):</p>
    <input id="len" type="number" />
    <button onclick="saveLength()">Next</button>
  `);
}

function saveLength() {
  answers.length = document.getElementById("len").value;
  showUpstreamExtent();
}

function showUpstreamExtent() {
  render(`
    <h2>Upstream Extent</h2>
    <p>Enter upstream extent (m):</p>
    <input id="up" type="number" />
    <button onclick="saveUpstream()">Next</button>
  `);
}

function saveUpstream() {
  answers.upstream = document.getElementById("up").value;
  showDownstreamExtent();
}

function showDownstreamExtent() {
  render(`
    <h2>Downstream Extent</h2>
    <p>Enter downstream extent (m):</p>
    <input id="down" type="number" />
    <button onclick="saveDownstream()">Next</button>
  `);
}

function saveDownstream() {
  answers.downstream = document.getElementById("down").value;
  showWidthOfInterest();
}

function showWidthOfInterest() {
  render(`
    <h2>Width of Interest</h2>
    <p>Enter width of interest (m):</p>
    <input id="width" type="number" />
    <button onclick="saveWidth()">Next</button>
  `);
}

function saveWidth() {
  answers.width = document.getElementById("width").value;
  showPrototypeDischarge();
}

// ----------------------------------------------------
// HYDRAULICS QUESTIONS
// ----------------------------------------------------
function showPrototypeDischarge() {
  render(`
    <h2>Prototype Discharge</h2>
    <p>Enter prototype discharge (m³/s):</p>
    <input id="Qp" type="number" />
    <button onclick="saveDischarge()">Next</button>
  `);
}

function saveDischarge() {
  answers.discharge = document.getElementById("Qp").value;
  showBayLength();
}

function showBayLength() {
  render(`
    <h2>Facility Bay Length</h2>
    <p>Enter available bay length (m):</p>
    <input id="bayL" type="number" />
    <button onclick="saveBayLength()">Next</button>
  `);
}

function saveBayLength() {
  answers.bayLength = document.getElementById("bayL").value;
  showBayWidth();
}

function showBayWidth() {
  render(`
    <h2>Facility Bay Width</h2>
    <p>Enter available bay width (m):</p>
    <input id="bayW" type="number" />
    <button onclick="saveBayWidth()">Next</button>
  `);
}

function saveBayWidth() {
  answers.bayWidth = document.getElementById("bayW").value;
  showAvailableFlow();
}

function showAvailableFlow() {
  render(`
    <h2>Available Flow</h2>
    <p>Enter available flow in the facility (L/s):</p>
    <input id="Qavail" type="number" />
    <button onclick="saveAvailableFlow()">Next</button>
  `);
}

function saveAvailableFlow() {
  answers.availableFlow = document.getElementById("Qavail").value;
  showSummary();
}

// ----------------------------------------------------
// SUMMARY (placeholder for real logic engine)
// ----------------------------------------------------
function showSummary() {
  render(`
    <h2>Summary of Inputs</h2>
    <pre>${JSON.stringify(answers, null, 2)}</pre>
    <p>This is where the real scale-selection logic will go.</p>
    <button onclick="start()">Restart</button>
  `);
}

// ----------------------------------------------------
// RENDER HELPER
// ----------------------------------------------------
function render(html) {
  document.getElementById("app").innerHTML = html;
}
