// -------------------------------
const answers = {};
let currentStep = 1;
let totalSteps = 5;

let historyStack = [];

// -------------------------------
function start() {
  currentStep = 1;
  historyStack = [];
  showProjectSpecifics();
}

// -------------------------------
function saveState(fn) {
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

  answers.designStage = stage.value;
  answers.riskLevel = risk.value;
  answers.objective = focus.value;
  answers.issues = issues.value;

  currentStep++;
  showPrototypeDetails();
}

// ----------------------------------------------------
// ✅ NEW COMBINED PAGE
// ----------------------------------------------------
function showPrototypeDetails() {
  let html = "<h2>Prototype Details</h2>";

  html += `
    <label>Total Structure Length (m)</label><br>
    <input id="len" value="${answers.length || ""}"><br>

    <label>Upstream Extent (m)</label><br>
    <input id="up" value="${answers.upstream || ""}"><br>

    <label>Downstream Extent (m)</label><br>
    <input id="down" value="${answers.downstream || ""}"><br>

    <label>Width of Interest (m)</label><br>
    <input id="width" value="${answers.width || ""}"><br>

    <label>Prototype Discharge (m³/s)</label><br>
    <input id="Qp" value="${answers.discharge || ""}">
  `;

  html += buttonRow("savePrototypeDetails()");
  render(html);
}

function savePrototypeDetails() {
  saveState(showPrototypeDetails);

  answers.length = parseFloat(len.value) || 0;
  answers.upstream = parseFloat(up.value) || 0;
  answers.downstream = parseFloat(down.value) || 0;
  answers.width = parseFloat(width.value) || 0;
  answers.discharge = parseFloat(Qp.value) || 0;

  currentStep++;
  showLab();
}

// ----------------------------------------------------
// LAB CONDITIONS
// ----------------------------------------------------
function showLab() {
  let html = "<h2>Laboratory Conditions</h2>";

  html += `
    <label>Bay Length (m)</label><br>
    <input id="bayL" value="${answers.bayLength || ""}"><br>

    <label>Bay Width (m)</label><br>
    <input id="bayW" value="${answers.bayWidth || ""}"><br>

    <label>Available Flow (L/s)</label><br>
    <input id="Qavail" value="${answers.availableFlow || ""}">
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
// CALC
// ----------------------------------------------------
function computeScales() {
  const Lp = (answers.length||0)+(answers.upstream||0)+(answers.downstream||0);
  const Qp = answers.discharge||0;
  const bayL = answers.bayLength||0;
  const bayW = answers.bayWidth||0;
  const Qavail = (answers.availableFlow||0)/1000;

  // ✅ Limit scales to engineering range
  const scales=[20,30,40,50,60,70,80,90,100];

  const results=[];

  for(let i=0;i<scales.length;i++){
    let N=scales[i];

    let Lm=Lp/N;
    let Wm=(answers.width||0)/N;
    let Qm=Qp/Math.pow(N,2.5);

    let fitsGeo=(Lm<=bayL)&&(Wm<=bayW);
    let fitsFlow=(Qm<=Qavail);

    let pass = fitsGeo && fitsFlow;

    // ✅ Engineering rating
    let rating="";
    if(N===50 && pass){
      rating="Preferred";
    } else if(N<50 && pass){
      rating="Very good (fine scale)";
    } else if(N<=80 && pass){
      rating="Acceptable";
    } else if(N<=100 && pass){
      rating="Marginal";
    } else {
      rating="Not suitable";
    }

    results.push({
      N,Lm,Wm,Qm,
      fitsGeo,fitsFlow,
      pass,
      rating
    });
  }

  return results;
}

// ----------------------------------------------------
// RESULTS
// ----------------------------------------------------
function showResults() {
  const results=computeScales();

  // ✅ Choose best scale based on engineering preference
  let selected = -1;

  // Priority 1: 1:50
  selected = results.findIndex(r => r.N===50 && r.pass);

  // Priority 2: smallest acceptable scale
  if(selected === -1){
    selected = results.findIndex(r => r.pass);
  }

  let html="<h2>Scale Assessment & Recommendation</h2>";

  if(selected>=0){
    html += `<div class="recommend">✅ Recommended Scale: 1:${results[selected].N}</div>`;
  } else {
    html += `<div class="recommend">❌ No viable scale within acceptable engineering range (≤1:100)</div>`;
  }

  // ----------------------------------------------------
  // TABLE
  // ----------------------------------------------------
  html+="<table><tr>";
  html+="<th>Scale</th><th>L</th><th>W</th><th>Q</th><th>Geo</th><th>Flow</th><th>Assessment</th></tr>";

  for(let i=0;i<results.length;i++){
    let r=results[i];

    let highlight = (i===selected) ? "style='background:#d9f2ff;font-weight:bold;'" : "";

    html+=`<tr ${highlight}>
      <td>1:${r.N}</td>
      <td>${r.Lm.toFixed(2)}</td>
      <td>${r.Wm.toFixed(2)}</td>
      <td>${r.Qm.toFixed(3)}</td>
      <td>${r.fitsGeo?"✓":"✗"}</td>
      <td>${r.fitsFlow?"✓":"✗"}</td>
      <td>${r.rating}</td>
    </tr>`;
  }

  html+="</table>";

  // ----------------------------------------------------
  // ENGINEERING LOGIC TEXT
  // ----------------------------------------------------
  html += "<div class='reasoning'>";

  html += "<h3>Engineering Basis</h3>";
  html += "<ul>";
  html += "<li>Preferred modelling scale is approximately 1:50</li>";
  html += "<li>Scales up to 1:80 may be acceptable depending on objectives</li>";
  html += "<li>Scales coarser than 1:80 reduce hydraulic fidelity</li>";
  html += "<li>Maximum recommended scale is 1:100</li>";
  html += "</ul>";

  html += "</div>";

  // ✅ Only back + restart (no next)
  html += `
    <div style="display:flex; justify-content:space-between; margin-top:20px;">
      <button onclick="goBack()">Back</button>
      <button onclick="start()">Restart</button>
    </div>
  `;

  render(html);
}

``
