// -------------------------------
// BUILD TIMESTAMP (GENERATED ON LOAD)
// -------------------------------
const BUILD_TIMESTAMP = new Date().toLocaleString("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

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

  let footer = `
    <div style="margin-top:30px;font-size:12px;color:#777;text-align:right;">
      Tool build time: ${BUILD_TIMESTAMP}
    </div>
  `;

  app.innerHTML = progress + html + footer;
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

////////////////////////////////////////////////////////
// KNOWLEDGE BASE (NON-PRESCRIPTIVE)
////////////////////////////////////////////////////////

const KNOWLEDGE_BASE = {

  hydraulics: {
    title: "Hydraulic Modelling Considerations",
    points: [
      "Flow patterns and water surface profiles are generally well represented under Froude similarity.",
      "Gravitational forces are preserved, but viscous effects are not fully replicated.",
      "Turbulence behaviour may be influenced at smaller model scales."
    ]
  },

  scour: {
    title: "Scour and Sediment Transport Considerations",
    points: [
      "Sediment transport cannot simultaneously satisfy all scaling laws.",
      "Results should be interpreted comparatively rather than as direct predictions.",
      "Scour behaviour is sensitive to scale and model configuration."
    ]
  },

  scaleEffects: {
    title: "General Scale Effects",
    points: [
      "Surface tension and viscous forces become more significant at smaller scales.",
      "Air entrainment and jet breakup processes may not fully reproduce prototype behaviour."
    ]
  }
};

////////////////////////////////////////////////////////
// PROJECT SPECIFICS
////////////////////////////////////////////////////////

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

  currentStep++;
  showPrototypeDetails();
}

////////////////////////////////////////////////////////
// PROTOTYPE DETAILS
////////////////////////////////////////////////////////

function showPrototypeDetails() {
  let html = "<h2>Prototype Details</h2>";

  html += `
    <label>Total Length (m)</label><input id="len" value="${answers.length || ""}"><br>
    <label>Upstream (m)</label><input id="up" value="${answers.upstream || ""}"><br>
    <label>Downstream (m)</label><input id="down" value="${answers.downstream || ""}"><br>
    <label>Width (m)</label><input id="width" value="${answers.width || ""}"><br>
    <label>Discharge (m³/s)</label><input id="Qp" value="${answers.discharge || ""}">
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

////////////////////////////////////////////////////////
// LAB CONDITIONS
////////////////////////////////////////////////////////

function showLab() {
  let html = "<h2>Laboratory Conditions</h2>";

  html += `
    <label>Bay Length (m)</label><input id="bayL" value="${answers.bayLength || ""}"><br>
    <label>Bay Width (m)</label><input id="bayW" value="${answers.bayWidth || ""}"><br>
    <label>Available Flow (L/s)</label><input id="Qavail" value="${answers.availableFlow || ""}">
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

////////////////////////////////////////////////////////
// SCALE CALC
////////////////////////////////////////////////////////

function computeScales() {
  const Lp = (answers.length||0)+(answers.upstream||0)+(answers.downstream||0);
  const Qp = answers.discharge||0;
  const bayL = answers.bayLength||0;
  const bayW = answers.bayWidth||0;
  const Qavail = (answers.availableFlow||0)/1000;

  const scales=[20,30,40,50,60,70,80,90,100];
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

////////////////////////////////////////////////////////
// OBJECTIVE NOTES
////////////////////////////////////////////////////////

function buildObjectiveNotesHTML() {

  let html = "<div class='reasoning'><h3>Engineering Modelling Considerations</h3>";

  if (answers.objective === "Hydraulics") {
    let kb = KNOWLEDGE_BASE.hydraulics;
    html += "<p><b>" + kb.title + "</b></p><ul>";
    kb.points.forEach(p => html += "<li>" + p + "</li>");
    html += "</ul>";
  }

  if (answers.objective === "Scour") {
    let kb = KNOWLEDGE_BASE.scour;
    html += "<p><b>" + kb.title + "</b></p><ul>";
    kb.points.forEach(p => html += "<li>" + p + "</li>");
    html += "</ul>";
  }

  let kb2 = KNOWLEDGE_BASE.scaleEffects;
  html += "<p><b>" + kb2.title + "</b></p><ul>";
  kb2.points.forEach(p => html += "<li>" + p + "</li>");
  html += "</ul>";

  html += "</div>";
  return html;
}

////////////////////////////////////////////////////////
// RESULTS
////////////////////////////////////////////////////////

function showResults() {
  const results=computeScales();

  let selected = results.findIndex(r => r.pass);

  let html="<h2>Scale Assessment & Recommendation</h2>";

  if(selected>=0){
    html += `<div class="recommend">✅ Recommended Scale: 1:${results[selected].N}</div>`;
  } else {
    html += `<div class="recommend">❌ No viable scale within ≤1:100</div>`;
  }

  html+="<table><tr><th>Scale</th><th>L</th><th>W</th><th>Q</th><th>Geo</th><th>Flow</th></tr>";

  results.forEach((r,i)=>{
    let style=(i===selected)?"style='background:#d9f2ff;font-weight:bold;'":"";

    html+=`<tr ${style}>
      <td>1:${r.N}</td>
      <td>${r.Lm.toFixed(2)}</td>
      <td>${r.Wm.toFixed(2)}</td>
      <td>${r.Qm.toFixed(3)}</td>
      <td>${r.fitsGeo?"✓":"✗"}</td>
      <td>${r.fitsFlow?"✓":"✗"}</td>
    </tr>`;
  });

  html+="</table>";

  if(selected>=0){
    let r = results[selected];

    let geoUtil = (r.Lm / answers.bayLength * 100).toFixed(1);
    let flowUtil = (r.Qm / (answers.availableFlow/1000) * 100).toFixed(1);

    let governing = (flowUtil > geoUtil)
      ? "Flow capacity limits achievable model scale"
      : "Facility geometry limits achievable model scale";

    let confidence = "";
    if(r.N <= 40) confidence = "High";
    else if(r.N <= 70) confidence = "Moderate";
    else confidence = "Lower";

    html += "<div class='reasoning'>";
    html += "<h3>Assessment Summary</h3>";
    html += "<p><b>Governing factor:</b> " + governing + "</p>";
    html += "<p><b>Confidence:</b> " + confidence + "</p>";

    html += "<p><i>Confidence is primarily based on achievable model scale. ";
    html += "Larger physical models generally provide improved representation of hydraulic processes.</i></p>";

    html += "<p><b>Geometry utilisation:</b> " + geoUtil + "%</p>";
    html += "<p><b>Flow utilisation:</b> " + flowUtil + "%</p>";
    html += "</div>";
  }

  html += buildObjectiveNotesHTML();

  html += `
    <div style="display:flex; justify-content:space-between; margin-top:20px;">
      <button onclick="goBack()">Back</button>
      <button onclick="start()">Restart</button>
    </div>
  `;

  render(html);
}
