// -------------------------------
// STATE
// -------------------------------
const answers = {};
let currentStep = 1;
let totalSteps = 9; // reduced because of grouping

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
function render(html) {
  document.getElementById("app").innerHTML =
    getProgressBar() + html;
}

// ----------------------------------------------------
// DESIGN STAGE
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

  if (stage === "Concept") {
    totalSteps = 6;
  } else {
    totalSteps = 9; // fewer steps now
  }

  currentStep++;
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
  currentStep++;
  showObjectives();
}

// ----------------------------------------------------
function showObjectives() {
  render(`
    <h2>Primary Objective</h2>
    <button onclick="selectObjective('Hydraulics')">Hydraulics</button>
    <button onclick="selectObjective('Energy')">Energy Dissipation</button>
    <button onclick="selectObjective('Scour')">Scour / Erosion</button>
    <button onclick="selectObjective('General')">General Behaviour</button>
  `);
}

function selectObjective(obj) {
  answers.objective = obj;
