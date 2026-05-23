// rebuild
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
    <button onclick="selectObjective('General Behaviour')">
