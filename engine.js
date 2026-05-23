const VERSION = "v2.0";
const REVISION = "R1";
const LAST_UPDATED = "23 May 2026";

const answers = {};
let step = 1;
let history = [];

//////////////////////////////////////////////////
// ✅ RULE TABLE (WITH PRIORITY + REFERENCES)
//////////////////////////////////////////////////

const MODELLING_RULES = [

  {
    id: "scour",
    triggers: { objectives: ["Scour"] },
    message: "Sediment transport behaviour is scale sensitive and may not fully reproduce prototype response.",
    priority: "high",
    references: [
      { title: "Heller (2011) – Scale Effects", link: "#" }
    ]
  },

  {
    id: "energy",
    triggers: { objectives: ["Energy"] },
    message: "Air entrainment and energy dissipation behaviour may be sensitive to model scale.",
    priority: "medium",
    references: []
  },

  {
    id: "cavitation",
    triggers: { issues: ["Cavitation"] },
    message: "Cavitation behaviour is highly sensitive to pressure scaling.",
    priority: "high",
    references: []
  },

  {
    id: "risk",
    triggers: { risk: ["High"] },
    message: "High-risk projects require careful interpretation of modelling limitations.",
    priority: "high",
    references: []
  },

  {
    id: "scale",
    triggers: { scaleMin: 80 },
    message: "Coarser model scales may reduce representation of local hydraulic processes.",
    priority: "medium",
    references: []
  }

];

//////////////////////////////////////////////////
// CORE NAV
//////////////////////////////////////////////////

function start(){ step=1; history=[]; showProject(); }
function save(fn){ history.push({ step,data:JSON.parse(JSON.stringify(answers)),fn }); }
function back(){ let h=history.pop(); if(!h)return; Object.assign(answers,h.data); step=h.step; h.fn(); }

function render(content){

  let progress = `
  <div class="progress-container">
    Step ${step} of 4
    <div class="progress-bar">
      <div class="progress-fill" style="width:${step*25}%"></div>
    </div>
  </div>`;

  let footer = `
  <div class="footer">
    PHM Scale Tool ${VERSION} | ${REVISION}
  </div>`;

  document.getElementById("app").innerHTML = progress + content + footer;
}

function nav(next){
  return `
  <div style="display:flex; justify-content:space-between; margin-top:20px;">
    ${history.length ? `<button onclick="back()">Back</button>` : `<div></div>`}
    <button onclick="${next}">Next</button>
  </div>`;
}

//////////////////////////////////////////////////
// STEP 1 (MULTI SELECT)
//////////////////////////////////////////////////

function showProject(){

  let html = `<h2>Step 1 – Project Context</h2>

  <label>Design Stage</label>
  <select id="stage">
    <option>Concept</option>
    <option>Preliminary</option>
    <option>Detailed</option>
  </select>

  <label>Project Objective</label>
  <select id="objective" multiple size="5">
    <option value="Hydraulics">General hydraulics</option>
    <option value="Scour">Scour / sediment</option>
    <option value="Energy">Energy dissipation</option>
    <option value="Uplift">Uplift pressures</option>
  </select>

  <label>Risk Level</label>
  <select id="risk">
    <option>Low</option><option>Moderate</option><option>High</option>
  </select>

  <label>Known Issues</label>
  <select id="issues" multiple size="5">
    <option value="Erosion">Erosion</option>
    <option value="Cavitation">Cavitation</option>
    <option value="Velocity">High velocity</option>
  </select>`;

  html += nav("saveProject()");
  render(html);
}

function saveProject(){
  save(showProject);
  answers.stage=stage.value;
  answers.risk=risk.value;
  answers.objectives=Array.from(objective.selectedOptions).map(o=>o.value);
  answers.issues=Array.from(issues.selectedOptions).map(o=>o.value);
  step++; showPrototype();
}

//////////////////////////////////////////////////
// STEP 2 / 3
//////////////////////////////////////////////////

function showPrototype(){
  let html=`<h2>Step 2 – Prototype</h2>
  <label>Length (m)</label><input id="len">
  <label>Width (m)</label><input id="width">
  <label>Flow (m³/s)</label><input id="Q">`;
  html+=nav("savePrototype()");
  render(html);
}

function savePrototype(){
  save(showPrototype);
  answers.length=parseFloat(len.value)||0;
  answers.width=parseFloat(width.value)||0;
  answers.discharge=parseFloat(Q.value)||0;
  step++; showLab();
}

function showLab(){
  let html=`<h2>Step 3 – Lab</h2>
  <label>Bay Length</label><input id="bayL">
  <label>Bay Width</label><input id="bayW">
  <label>Flow (L/s)</label><input id="Qavail">`;
  html+=nav("saveLab()");
  render(html);
}

function saveLab(){
  save(showLab);
  answers.bayLength=parseFloat(bayL.value)||0;
  answers.bayWidth=parseFloat(bayW.value)||0;
  answers.availableFlow=parseFloat(Qavail.value)||0;
  step++; showResults();
}

//////////////////////////////////////////////////
// CALC
//////////////////////////////////////////////////

function compute(){
  let scales=[20,30,40,50,60,70,80,90,100];
  return scales.map(N=>{
    let Lm=answers.length/N;
    let Wm=answers.width/N;
    let Qm=(answers.discharge/Math.pow(N,2.5))*1000;

    let geo=Lm<=answers.bayLength && Wm<=answers.bayWidth;
    let flow=Qm<=answers.availableFlow;

    return {N,Lm,Wm,Qm,geo,flow,pass:geo&&flow};
  });
}

//////////////////////////////////////////////////
// RULE ENGINE
//////////////////////////////////////////////////

function evaluateRules(scale){

  let out=[];

  MODELLING_RULES.forEach(r=>{

    let hit=false;

    if(r.triggers.objectives){
      if(answers.objectives?.some(o=>r.triggers.objectives.includes(o))) hit=true;
    }

    if(r.triggers.issues){
      if(answers.issues?.some(i=>r.triggers.issues.includes(i))) hit=true;
    }

    if(r.triggers.risk){
      if(r.triggers.risk.includes(answers.risk)) hit=true;
    }

    if(r.triggers.scaleMin){
      if(scale>=r.triggers.scaleMin) hit=true;
    }

    if(hit) out.push(r);

  });

  return out;
}

//////////////////////////////////////////////////
// REPORT EXPORT
//////////////////////////////////////////////////

function buildReport(results,selected,warnings){

  let r = results[selected];

  let text = `PHM Scale Assessment Report\n\n`;
  text += `Scale: 1:${r.N}\n\n`;

  warnings.forEach(w=>{
    text += `- ${w.message}\n`;
    w.references.forEach(ref=>{
      text += `   (${ref.title})\n`;
    });
  });

  return text;
}

function exportReport(results,selected,warnings){

  let content = buildReport(results,selected,warnings);
  let blob = new Blob([content], {type:"text/plain"});
  let url = URL.createObjectURL(blob);

  let a=document.createElement("a");
  a.href=url;
  a.download="PHM_Report.txt";
  a.click();
}

//////////////////////////////////////////////////
// RESULTS
//////////////////////////////////////////////////

function showResults(){

  let results=compute();
  let selected=results.findIndex(r=>r.pass);

  let html=`<h2>Scale Assessment</h2>`;

  if(selected>=0){
    let r=results[selected];
    html+=`
    <div class="recommend">
      RECOMMENDED SCALE<br>1:${r.N}
    </div>`;
  }

  html+=`<table>
  <tr><th>Scale</th><th>Length</th><th>Width</th><th>Flow (L/s)</th><th>Geo</th><th>Flow</th></tr>`;

  results.forEach((r,i)=>{
    html+=`
    <tr class="${i===selected?'selected':''}">
      <td>1:${r.N}</td>
      <td>${r.Lm.toFixed(2)}</td>
      <td>${r.Wm.toFixed(2)}</td>
      <td>${r.Qm.toFixed(1)}</td>
      <td>${r.geo?'✓':'✗'}</td>
      <td>${r.flow?'✓':'✗'}</td>
    </tr>`;
  });

  html+=`</table>`;

  if(selected>=0){

    let warnings=evaluateRules(results[selected].N);

    if(warnings.length){

      html+=`<div class="reasoning"><h3>Modelling Considerations</h3><ul>`;

      warnings.forEach(w=>{

        let cls = w.priority==="high"?"warning-high":
                  w.priority==="medium"?"warning-medium":"warning-info";

        let icon = w.priority==="high"?"⚠":"ℹ";

        html+=`<li class="${cls}"><b>${icon}</b> ${w.message}`;

        if(w.references.length){
          html+=`<div class="references"><ul>`;
          w.references.forEach(r=>{
            html+=`<li><a href="${r.link}" target="_blank">${r.title}</a></li>`;
          });
          html+=`</ul></div>`;
        }

        html+=`</li>`;
      });

      html+=`</ul></div>`;
    }

    // ✅ EXPORT BUTTON
    html+=`<button onclick='exportReport(${JSON.stringify(results)},${selected},${JSON.stringify(warnings)})'>
      Export Report
    </button>`;
  }

  html+=`
  <div style="display:flex;justify-content:space-between;margin-top:20px;">
    <button onclick="back()">Back</button>
    <button onclick="start()">Restart</button>
  </div>`;

  render(html);
}
