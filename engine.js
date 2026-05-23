// -------------------------------
// VERSION CONTROL
// -------------------------------
const VERSION = "v1.3";
const REVISION = "R4";
const LAST_UPDATED = "23 May 2026";

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
    <div class="footer">
      PHM Scale Tool ${VERSION} | ${REVISION} | Updated ${LAST_UPDATED}
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
      "Viscous effects are not fully preserved due to Reynolds number mismatch.",
      "Turbulence behaviour may vary depending on achievable model scale."
    ]
  },

  scour: {
    title: "Scour and Sediment Transport Considerations",
    points: [
      "Sediment transport cannot satisfy all similarity relationships simultaneously.",
      "Model results should be interpreted comparatively rather than as direct prototype prediction.",
      "Scour behaviour is sensitive to scale and model configuration."
    ]
  },

  scaleEffects: {
    title: "General Scale Effects",
    points: [
      "Surface tension and viscosity become more significant at smaller scales.",
      "Air entrainment and jet breakup processes may not fully reproduce prototype conditions."
    ]
  }
};

////////////////////////////////////////////////////////
// PROJECT SPECIFICS
////////////////////////////////////////////////////////

function showProjectSpecifics() {
  let html = "<h2>Step 1 – Project Specifics</h2>";

  html += `
    <label>Design Stage</label>
    <select id="stage">
      <option ${answers.designStage==="Concept"?"selected":""}>Concept</option>
      <option ${answers.designStage==="Detailed"?"selected":""}>Detailed</option>
    </select>

    <label>Project Risk Level</label>
    <select id="risk">
      <option ${answers.riskLevel==="Low"?"selected":""}>Low</option>
      <option ${answers.riskLevel==="High"?"selected":""}>High</option>
    </select>

    <label>Project Focus</label>
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
  let html = "<h2>Step 2 – Prototype Details</h2>";

  html += `
    <label>Total Structure Length (m)</label>
    <input id="len" value="${answers.length || ""}">

    <label>Upstream Extent (m)</label>
    <input id="up" value="${answers.upstream || ""}">

    <label>Downstream Extent (m)</label>
    <input id="down" value="${answers.downstream || ""}">

    <label>Width of Interest (m)</label>
    <input id="width" value="${answers.width || ""}">

    <label>Prototype Discharge (m³/s)</label>
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

////////////////////////////////////////////////////////
// LAB CONDITIONS
////////////////////////////////////////////////////////

function showLab() {
  let html = "<h2>Step 3 – Laboratory Conditions</h2>";

  html += `
    <label>Available Bay Length (m)</label>
    <input id="bayL" value="${answers.bayLength || ""}">

    <label>Available Bay Width (m)</label>
    <input id="bayW" value="${answers.bayWidth || ""}">

    <label>Available Flow Supply (L/s)</label>
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

////////////////////////////////////////////////////////
// SCALE CALCULATION
////////////////////////////////////////////////////////

function computeScales() {
  const Lp = (answers.length||0)+(answers.upstream||0)+(answers.downstream||0);
  const Wp = answers.width || 0;
  const Qp = answers.discharge || 0;

  const bayL = answers.bayLength || 0;
  const bayW = answers.bayWidth || 0;
  const Qavail = (answers.availableFlow || 0) / 1000;

  const scales=[20,30,40,50,60,70,80,90,100];
  const results=[];

  for(let i=0;i<scales.length;i++){
    let N=scales[i];

    let Lm=Lp/N;
    let Wm=Wp/N;
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
    kb.points.forEach(p => html += "<li>"+p+"</li>");
    html += "</ul>";
  }

  if (answers.objective === "Scour") {
    let kb = KNOWLEDGE_BASE.scour;
    html += "<p><b>" + kb.title + "</b></p><ul>";
    kb.points.forEach(p => html += "<li>"+p+"</li>");
    html += "</ul>";
  }

  let kb2 = KNOWLEDGE_BASE.scaleEffects;
  html += "<p><b>" + kb2.title + "</b></p><ul>";
  kb2.points.forEach(p => html += "<li>"+p+"</li>");
  html += "</ul>";

  html += "</div>";
  return html;
}

////////////////////////////////////////////////////////
// RESULTS
////////////////////////////////////////////////////////

function showResults() {
  const results=computeScales();

  // ✅ Select largest feasible model (smallest N)
  let selected = results.findIndex(r => r.pass);

  let html="<h2>Scale Assessment & Recommendation</h2>";

  if(selected>=0){
    html += `<div class="recommend">RECOMMENDED SCALE<br>1:${results[selected].N}</div>`;
  } else {
    html += `<div class="recommend">No feasible scale within laboratory limits</div>`;
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

    let confidenceClass = r.N <= 40 ? "conf-high"
      : (r.N <= 70 ? "conf-moderate" : "conf-low");

    let confidenceText = r.N <= 40 ? "High"
      : (r.N <= 70 ? "Moderate" : "Lower");

    html += "<div class='reasoning'>";
    html += "<h3>Assessment Summary</h3>";
    html += `<p><b>⚙ Governing factor:</b> ${governing}</p>`;
    html += `<p><b>📊 Confidence:</b> <span class='${confidenceClass}'>${confidenceText}</span></p>`;
    html += "<p><i>Confidence is primarily driven by achievable model scale. Larger physical models generally provide improved representation of hydraulic processes.</i></p>";
    html += `<p>Geometry utilisation: ${geoUtil}%</p>`;
    html += `<p>Flow utilisation: ${flowUtil}%</p>`;
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
