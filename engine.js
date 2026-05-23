// -------------------------------
const answers = {};
let currentStep = 1;
let totalSteps = 6;

// Proper navigation history
let historyStack = [];

// -------------------------------
function start() {
  currentStep = 1;
  historyStack = [];
  showProjectSpecifics();
}

// -------------------------------
function saveState(fn) {
  // Deep copy answers
  const snapshot = JSON.parse(JSON.stringify(answers));

  historyStack.push({
    step: currentStep,
    answers: snapshot,
    fn: fn
  });
}

// -------------------------------
function goBack() {
  if (historyStack.length === 0) return;

  const prev = historyStack.pop();

  // restore state
  Object.assign(answers, prev.answers);
  currentStep = prev.step;

  prev.fn();
}

// -------------------------------
function render(html) {
  const app = document.getElementById("app");

  const percent = Math.round((currentStep / totalSteps) * 100);

  let progress = `
    <div class="progress-container">
      Step ${currentStep} of ${totalSteps}
      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>
    </div>
  `;

  app.innerHTML = progress + html;
}

// -------------------------------
function buttonRow(nextFn) {
  return `
    <div style="display:flex; justify-content:space-between; margin-top:20px;">
      ${historyStack.length > 0 ? `<button onclick="goBack()">Back</button>` : `<div></div>`}
      <button onclick="${nextFn}">Next</button>
    </div>
  `;
}

// ----------------------------------------------------
// PROJECT SPECIFICS
// ----------------------------------------------------
function showProjectSpecifics() {
  let html = "<h2>Project Specifics</h2>";

  html += `
    <label>Design Stage</label><br>
    <select id="stage">
      <option ${answers.designStage==="Concept"?"selected":""}>Concept</option>
      <option ${answers.designStage==="Detailed"?"selected":""}>Detailed</option>
    </select><br><br>

    <label>Project Risk Level</label><br>
    <select id="risk">
      <option ${answers.riskLevel==="Low"?"selected":""}>Low</option>
      <option ${answers.riskLevel==="High"?"selected":""}>High</option>
    </select><br><br>

    <label>Project Focus</label><br>
    <select id="focus">
      <option ${answers.objective==="Hydraulics"?"selected":""}>Hydraulics</option>
      <option ${answers.objective==="Scour"?"selected":""}>Scour</option>
    </select><br><br>

    <label>Known Hydraulic Issues</label><br>
    <select id="issues">
      <option ${answers.issues==="None"?"selected":""}>None</option>
      <option ${answers.issues==="Some"?"selected":""}>Some</option>
      <option ${answers.issues==="Critical"?"selected":""}>Critical</option>
    </select>
  `;

  html += buttonRow("saveProjectSpecifics()");

  render(html);
}

function saveProjectSpecifics() {
  saveState(showProjectSpecifics);

  answers.designStage = document.getElementById("stage").value;
  answers.riskLevel = document.getElementById("risk").value;
  answers.objective = document.getElementById("focus").value;
  answers.issues = document.getElementById("issues").value;

  currentStep++;
  if (answers.designStage === "Concept") {
    showDischarge();
  } else {
    showGeometry();
  }
}

// ----------------------------------------------------
function showGeometry() {
  let html = "<h2>Prototype Geometry</h2>";

  html += `
    Length (m)<br><input id="len" value="${answers.length || ""}"><br>
    Upstream (m)<br><input id="up" value="${answers.upstream || ""}"><br>
    Downstream (m)<br><input id="down" value="${answers.downstream || ""}"><br>
    Width (m)<br><input id="width" value="${answers.width || ""}"><br>
  `;

  html += buttonRow("saveGeometry()");

  render(html);
}

function saveGeometry() {
  saveState(showGeometry);

  answers.length = parseFloat(len.value) || 0;
  answers.upstream = parseFloat(up.value) || 0;
  answers.downstream = parseFloat(down.value) || 0;
  answers.width = parseFloat(width.value) || 0;

  currentStep++;
  showDischarge();
}

// ----------------------------------------------------
function showDischarge() {
  let html = "<h2>Prototype Flow</h2>";

  html += `
    Discharge (m³/s)<br>
    <input id="Qp" value="${answers.discharge || ""}">
  `;

  html += buttonRow("saveDischarge()");

  render(html);
}

function saveDischarge() {
  saveState(showDischarge);

  answers.discharge = parseFloat(Qp.value) || 0;

  currentStep++;
  showLab();
}

// ----------------------------------------------------
function showLab() {
  let html = "<h2>Laboratory Conditions</h2>";

  html += `
    Bay Length (m)<br><input id="bayL" value="${answers.bayLength || ""}"><br>
    Bay Width (m)<br><input id="bayW" value="${answers.bayWidth || ""}"><br>
    Available Flow (L/s)<br><input id="Qavail" value="${answers.availableFlow || ""}">
  `;

  html += buttonRow("saveLab()");

  render(html);
}

function saveLab() {
  saveState(showLab);

  answers.bayLength = parseFloat(bayL.value) || 0;
  answers.bayWidth = parseFloat(bayW.value) || 0;
  answers.availableFlow = parseFloat(Qavail.value) || 0;

  currentStep++;
  showResults();
}

// ----------------------------------------------------
function computeScales() {
  const Lp = (answers.length||0)+(answers.upstream||0)+(answers.downstream||0);
  const Qp = answers.discharge||0;
  const bayL = answers.bayLength||0;
  const bayW = answers.bayWidth||0;
  const Qavail = (answers.availableFlow||0)/1000;

  const scales=[20,40,60,80,100,150,200];
  const results=[];

  for(let i=0;i<scales.length;i++){
    let N=scales[i];

    let Lm=Lp/N;
    let Wm=(answers.width||0)/N;
    let Qm=Qp/Math.pow(N,2.5);

    let fitsGeo=(Lm<=bayL)&&(Wm<=bayW);
    let fitsFlow=(Qm<=Qavail);

    results.push({N,Lm,Wm,Qm,fitsGeo,fitsFlow,pass:fitsGeo&&fitsFlow});
  }
  return results;
}

// ----------------------------------------------------
function showResults() {
  const results=computeScales();

  let selected=results.findIndex(r=>r.pass);

  let html="<h2>Scale Assessment & Recommendation</h2>";

  html+= selected>=0
    ? `<div class="recommend">✅ Recommended Scale: 1:${results[selected].N}</div>`
    : `<div class="recommend">❌ No viable scale</div>`;

  html+="<table><tr><th>Scale</th><th>L</th><th>W</th><th>Q</th><th>Geo</th><th>Flow</th></tr>";

  for(let i=0;i<results.length;i++){
    let r=results[i];
    let style=(i===selected)?"style='background:#d9f2ff;font-weight:bold;'":"";

    html+=`<tr ${style}>
      <td>1:${r.N}</td>
      <td>${r.Lm.toFixed(2)}</td>
      <td>${r.Wm.toFixed(2)}</td>
      <td>${r.Qm.toFixed(3)}</td>
      <td>${r.fitsGeo?"✓":"✗"}</td>
      <td>${r.fitsFlow?"✓":"✗"}</td>
    </tr>`;
  }

  html+="</table>";

  html+=buttonRow("start()");

  render(html);
}
