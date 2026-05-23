// -------------------------------
// SIMPLE SAFE VERSION
// -------------------------------

function start() {
  document.getElementById("app").innerHTML = `
    <div>
      <h2>Step 1</h2>
      <p>Design Stage</p>
      <button onclick="nextStep()">Continue</button>
    </div>
  `;
}

function nextStep() {
  document.getElementById("app").innerHTML = `
    <h2>✅ Working</h2>
    <p>Your engine.js is now fully loading without errors.</p>
  `;
}
