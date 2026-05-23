const VERSION = "v2.1";
const REVISION = "R2";

const answers = {};
let step = 1;
let history = [];

//////////////////////////////////////////////////
// ✅ RULE TABLE
//////////////////////////////////////////////////

const MODELLING_RULES = [

  {
    triggers: { objectives: ["Scour"] },
    message: "Sediment transport behaviour is scale sensitive.",
    priority: "high",
    references: [{ title: "Heller 2011", link: "#" }]
  },

  {
    triggers: { issues: ["Cavitation"] },
    message: "Cavitation may not be properly reproduced.",
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
    message: "Air entrainment effects may be scale sensitive.",
    priority: "medium",
    references: []
  },

  {
    triggers: { scaleMin: 80 },
    message: "Coarser model scales reduce hydraulic detail.",
    priority: "medium",
    references: []
  }

];

//////////////////////////////////////////////////
// NAV
//////////////////////////////////////////////////

function start(){ step=1; history=[]; showProject(); }
function save(fn){ history.push({step,data:JSON.parse(JSON.stringify(answers)),fn}); }
function back(){ let h=history.pop(); if(!h)return; Object.assign(answers,h.data); step=h.step; h.fn(); }

function render(content){
  document.getElementById("app").innerHTML = `
    <div>Step ${step} of 4</div>
    ${content}
    <div class="footer">v${VERSION} | ${REVISION}</div>
  `;
}

function nav(next){
  return `
  <div style="margin-top:20px;">
    ${history.length?'<button onclick="back()">Back</button>':''}
    <button onclick="${next}">Next</button>
  </div>`;
}

//////////////////////////////////////////////////
// ✅ STEP 1 (CHECKBOX + INFO)
//////////////////////////////////////////////////

function showProject(){

  let html = `<h2>Project Context</h2>

  <label>Design Stage
    <span class="info">i</span>
    <div class="tooltip">Level of design maturity.</div>
  </label>

  <select id="stage">
    <option>Concept</option>
    <option>Preliminary</option>
    <option>Detailed</option>
  </select>

  <label>Objectives
    <span class="info">i</span>
    <div class="tooltip">Select all key modelling objectives.</div>
  </label>

  <div class="checkbox-group">
    <label><input type="checkbox" value="Hydraulics"> General hydraulics</label>
    <label><input type="checkbox" value="Scour"> Scour</label>
    <label><input type="checkbox" value="Energy"> Energy dissipation</label>
    <label><input type="checkbox" value="Uplift"> Uplift</label>
  </div>

  <label>Risk Level</label>
  <select id="risk">
    <option>Low</option><option>Moderate</option><option>High</option>
  </select>

  <label>Known Issues
    <span class="info">i</span>
    <div class="tooltip">Existing performance concerns.</div>
  </label>

  <div class="checkbox-group">
    <label><input type="checkbox" value="Erosion"> Erosion</label>
    <label><input type="checkbox" value="Cavitation"> Cavitation</label>
    <label><input type="checkbox" value="Velocity"> High velocity</label>
  </div>
  `;

  html += nav("saveProject()");
  render(html);
}

function saveProject(){

  save(showProject);

  answers.stage = stage.value;
  answers.risk = risk.value;

  answers.objectives = Array.from(
    document.querySelectorAll(".checkbox-group input:checked")
  ).map(i=>i.value);

  answers.issues = answers.objectives; // simplified grouping

  step++;
  showPrototype();
}

//////////////////////////////////////////////////
// CALC (UNCHANGED)
//////////////////////////////////////////////////

function compute(){
  let scales=[20,30,40,50,60,70,80,90,100];
  return scales.map(N=>{
    let Qm=(answers.discharge/Math.pow(N,2.5))*1000;
    let geo=true, flow=true;
    return {N,Qm,geo,flow,pass:true};
  });
}

//////////////////////////////////////////////////
// ✅ RULE ENGINE + PRIORITY SORT
//////////////////////////////////////////////////

function evaluateRules(scale){

  let out=[];

  MODELLING_RULES.forEach(r=>{
    let hit=false;

    if(r.triggers.scaleMin && scale>=r.triggers.scaleMin) hit=true;
    if(r.triggers.risk && r.triggers.risk.includes(answers.risk)) hit=true;
    if(r.triggers.objectives && answers.objectives?.some(o=>r.triggers.objectives.includes(o))) hit=true;

    if(hit) out.push(r);
  });

  // ✅ SORT BY PRIORITY
  const order = {high:0, medium:1, info:2};
  out.sort((a,b)=>order[a.priority]-order[b.priority]);

  return out;
}

//////////////////////////////////////////////////
// REPORT EXPORT
//////////////////////////////////////////////////

function exportReport(warnings){

  let text="PHM Report\n\n";

  warnings.forEach(w=>{
    text += "- " + w.message + "\n";
    w.references.forEach(r=>{
      text += "   ("+r.title+")\n";
    });
  });

  let blob=new Blob([text]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="report.txt";
  a.click();
}

//////////////////////////////////////////////////
// RESULTS
//////////////////////////////////////////////////

function showResults(){

  let results=compute();
  let warnings=evaluateRules(60);

  let html="<h2>Results</h2>";

  html+="<ul>";

  warnings.forEach(w=>{

    let cls = "warning-"+w.priority;
    let icon = w.priority==="high"?"⚠":"ℹ";

    html+=`<li class="${cls}">
      ${icon} ${w.message}
    `;

    if(w.references.length){
      html+=`<div class="references"><ul>`;
      w.references.forEach(r=>{
        html+=`<li><a href="${r.link}" target="_blank">${r.title}</a></li>`;
      });
      html+=`</ul></div>`;
    }

    html+="</li>";
  });

  html+="</ul>";

  html+=`<button onclick='exportReport(${JSON.stringify(warnings)})'>Export Report</button>`;

  render(html);
}
