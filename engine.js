const answers = {};
let step = 1;
let history = [];

//////////////////////////////////////////////////
// RULE TABLE
//////////////////////////////////////////////////

const MODELLING_RULES = [
  {
    triggers: { objectives: ["Scour"] },
    message: "Sediment transport behaviour is scale sensitive.",
    priority: "high",
    references: [{ title: "Heller (2011)", link: "#" }]
  },
  {
    triggers: { issues: ["Cavitation"] },
    message: "Cavitation effects may not scale correctly.",
    priority: "high",
    references: []
  },
  {
    triggers: { risk: ["High"] },
    message: "High-risk projects require careful interpretation.",
    priority: "high",
    references: []
  },
  {
    triggers: { objectives: ["Energy"] },
    message: "Energy dissipation may be affected by scale.",
    priority: "medium",
    references: []
  },
  {
    triggers: { scaleMin: 80 },
    message: "Coarser scales reduce hydraulic detail.",
    priority: "medium",
    references: []
  }
];

//////////////////////////////////////////////////
// NAV
//////////////////////////////////////////////////

function start() {
  step = 1;
  history = [];
  showProject();
}

function save(fn) {
  history.push({
    step,
    data: JSON.parse(JSON.stringify(answers)),
    fn
  });
}

function back() {
  let h = history.pop();
  if (!h) return;
  Object.assign(answers, h.data);
  step = h.step;
  h.fn();
}

function render(html) {
  document.getElementById("app").innerHTML = `
    <div>Step ${step} of 4</div>
    ${html}
  `;
}

function nav(next) {
  return `
  <div style="display:flex; justify-content:space-between; margin-top:20px;">
    ${history.length ? `<button onclick="back()">Back</button>` : `<div></div>`}
    <button onclick="${next}">Next</button>
  </div>`;
}

//////////////////////////////////////////////////
// STEP 1 ✅ FIXED
//////////////////////////////////////////////////

function showProject() {

  let html = `
  <h2>Project Context</h2>

  <label>Design Stage
    <span class="info">i</span>
    <div class="tooltip">Level of design maturity</div>
  </label>

  <select id="stage">
    <option>Concept</option>
    <option>Preliminary</option>
    <option>Detailed</option>
  </select>

  <label>Objectives
    <span class="info">i</span>
    <div class="tooltip">Select modelling goals</div>
  </label>

  <div class="checkbox-group objectives">
    <label><input type="checkbox" value="Hydraulics"> Hydraulics</label>
    <label><input type="checkbox" value="Scour"> Scour</label>
    <label><input type="checkbox" value="Energy"> Energy</label>
    <label><input type="checkbox" value="Uplift"> Uplift</label>
  </div>

  <label>Risk Level</label>
  <select id="risk">
    <option>Low</option>
    <option>Moderate</option>
    <option>High</option>
  </select>

  <label>Known Issues</label>
  <div class="checkbox-group issues">
    <label><input type="checkbox" value="Erosion"> Erosion</label>
    <label><input type="checkbox" value="Cavitation"> Cavitation</label>
    <label><input type="checkbox" value="Velocity"> High velocity</label>
  </div>
  `;

  html += nav("saveProject()");
  render(html);
}

function saveProject() {

  save(showProject);

  answers.stage = stage.value;
  answers.risk = risk.value;

  // ✅ FIXED: separate groups
  answers.objectives = Array.from(
    document.querySelectorAll(".objectives input:checked")
  ).map(i => i.value);

  answers.issues = Array.from(
    document.querySelectorAll(".issues input:checked")
  ).map(i => i.value);

  step++;
  showPrototype();
}

//////////////////////////////////////////////////
// STEP 2
//////////////////////////////////////////////////

function showPrototype() {

  let html = `
  <h2>Prototype</h2>

  <label>Length (m)</label>
  <input id="len">

  <label>Width (m)</label>
  <input id="width">

  <label>Flow (m³/s)</label>
  <input id="Q">
  `;

  html += nav("savePrototype()");
  render(html);
}

function savePrototype() {
  save(showPrototype);

  answers.length = parseFloat(len.value) || 0;
  answers.width = parseFloat(width.value) || 0;
  answers.discharge = parseFloat(Q.value) || 0;

  step++;
  showLab();
}

//////////////////////////////////////////////////
// STEP 3
//////////////////////////////////////////////////

function showLab() {

  let html = `
  <h2>Laboratory</h2>

  <label>Bay Length</label>
  <input id="bayL">

  <label>Bay Width</label>
  <input id="bayW">

  <label>Available Flow (L/s)</label>
  <input id="Qavail">
  `;

  html += nav("saveLab()");
  render(html);
}

function saveLab() {

  save(showLab);

  answers.bayLength = parseFloat(bayL.value) || 0;
  answers.bayWidth = parseFloat(bayW.value) || 0;
  answers.availableFlow = parseFloat(Qavail.value) || 0;

  step++;
  showResults();
}

//////////////////////////////////////////////////
// CALC
//////////////////////////////////////////////////

function compute() {

  const scales = [20,30,40,50,60,70,80,90,100];

  return scales.map(N => {

    let Lm = answers.length / N;
    let Wm = answers.width / N;
    let Qm = (answers.discharge / Math.pow(N, 2.5)) * 1000;

    let geo = Lm <= answers.bayLength && Wm <= answers.bayWidth;
    let flow = Qm <= answers.availableFlow;

    return { N, Lm, Wm, Qm, geo, flow, pass: geo && flow };
  });
}

//////////////////////////////////////////////////
// RULE ENGINE ✅ SORTED
//////////////////////////////////////////////////

function evaluateRules(scale) {

  let warnings = [];

  MODELLING_RULES.forEach(r => {

    let hit = false;

    if (r.triggers.objectives)
      if (answers.objectives?.some(o => r.triggers.objectives.includes(o)))
        hit = true;

    if (r.triggers.issues)
      if (answers.issues?.some(i => r.triggers.issues.includes(i)))
        hit = true;

    if (r.triggers.risk)
      if (r.triggers.risk.includes(answers.risk))
        hit = true;

    if (r.triggers.scaleMin)
      if (scale >= r.triggers.scaleMin)
        hit = true;

    if (hit) warnings.push(r);
  });

  const order = { high:0, medium:1, info:2 };
  warnings.sort((a,b)=>order[a.priority]-order[b.priority]);

  return warnings;
}

//////////////////////////////////////////////////
// EXPORT
//////////////////////////////////////////////////

function exportReport(warnings) {

  let text = "PHM Scale Assessment\n\n";

  warnings.forEach(w => {
    text += "- " + w.message + "\n";
    w.references.forEach(r => {
      text += "   (" + r.title + ")\n";
    });
  });

  let blob = new Blob([text]);
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "PHM_Report.txt";
  a.click();
}

//////////////////////////////////////////////////
// RESULTS
//////////////////////////////////////////////////

function showResults() {

  let results = compute();
  let selected = results.findIndex(r => r.pass);

  let html = "<h2>Results</h2>";

  if (selected >= 0) {
    html += `<div><b>Recommended Scale: 1:${results[selected].N}</b></div>`;
  }

  let scale = results[selected]?.N || 100;

  let warnings = evaluateRules(scale);

  html += "<ul>";

  warnings.forEach(w => {

    let cls = "warning-" + w.priority;
    let icon = w.priority === "high" ? "⚠" : "ℹ";

    html += `<li class="${cls}">${icon} ${w.message}`;

    if (w.references.length) {
      html += "<ul>";
      w.references.forEach(r => {
        html += `<li><a href="${r.link}" target="_blank">${r.title}</a></li>`;
      });
      html += "</ul>";
    }

    html += "</li>";
  });

  html += "</ul>";

  html += `
  <button onclick='exportReport(${JSON.stringify(warnings)})'>
    Export Report
  </button>
  `;

  render(html);
}
