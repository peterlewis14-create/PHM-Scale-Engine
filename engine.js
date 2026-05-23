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
