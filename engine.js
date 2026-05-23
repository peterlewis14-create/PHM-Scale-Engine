// Store user answers here
const answers = {};

// Start the tool
function start() {
  showDesignStage();
}

// -------------------------
// QUESTION 1 — Design Stage
// -------------------------
function showDesignStage() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>Question 1: What is the design stage?</h2>
    <button onclick="selectDesignStage('Concept')">Concept</button>
    <button onclick="selectDesignStage('Preliminary')">Preliminary</button>
    <button onclick="selectDesignStage('Detailed')">Detailed</button>
  `;
}

function selectDesignStage(stage) {
  answers.designStage = stage;
  showRiskLevel();
}

// -------------------------
// QUESTION 2 — Risk Level
// -------------------------
function showRiskLevel() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>Question 2: What is the project risk level?</h2>
    <button onclick="selectRisk('Low')">Low</button>
    <button onclick="selectRisk('Medium')">Medium</button>
    <button onclick="selectRisk('High')">High</button>
  `;
}

function selectRisk(level) {
  answers.riskLevel = level;

  // For now, just show what we captured
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>Great — you’ve answered two questions.</h2>
    <p><strong>Design Stage:</strong> ${answers.designStage}</p>
    <p><strong>Risk Level:</strong> ${answers.riskLevel}</p>

    <p>This proves the multi-step flow is working.</p>

    <button onclick="start()">Restart</button>
  `;
}
