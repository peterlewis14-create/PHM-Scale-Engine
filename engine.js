const VERSION = "v1.8";
const REVISION = "R1";
const LAST_UPDATED = "23 May 2026";

const answers = {};
let step = 1;
let history = [];

//////////////////////////////////////////////////
// ✅ MODELLING RULES TABLE (EDITABLE BACKEND)
//////////////////////////////////////////////////

const MODELLING_RULES = [

  {
    id: "scour",
    triggers: { objectives: ["Scour"] },
    message: "Sediment transport behaviour is scale sensitive and may not fully reproduce prototype response.",
    references: []
  },

  {
    id: "energy",
    triggers: { objectives: ["Energy"] },
    message: "Air entrainment and energy dissipation behaviour can be sensitive to model scale effects.",
    references: []
  },

  {
    id: "uplift",
    triggers: { objectives: ["Uplift"] },
    message: "Uplift pressures and local pressure fluctuations may be influenced by model scale.",
    references: []
  },

  {
    id: "erosion",
    triggers: { issues: ["Erosion"] },
    message: "Observed erosion indicates sensitivity to local hydraulic conditions which may be scale dependent.",
    references: []
  },

  {
    id: "cavitation",
    triggers: { issues: ["Cavitation"] },
    message: "Cavitation behaviour is highly sensitive to pressure scaling and may not be fully replicated.",
    references: []
  },

  {
    id: "risk",
    triggers: { risk: ["High"] },
    message: "High-risk projects require careful interpretation of modelling limitations and uncertainties.",
    references: []
  },

  {
    id: "scale",
    triggers: { scaleMin: 80 },
    message: "Coarser model scales may reduce representation of local hydraulic processes.",
    references: []
  }

];

//////////////////////////////////////////////////
// CORE NAVIGATION
//////////////////////////////////////////////////

function start(){ step=1; history=[]; showProject(); }

function save(fn){
  history.push({
    step,
    data: JSON.parse(JSON.stringify(answers)),
    fn
  });
}

function back(){
  let h = history.pop();
  if(!h) return;
  Object.assign(answers,h.data);
  step = h.step;
  h.fn();
}

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
    PHM Scale Tool ${VERSION} | ${REVISION} | Updated ${LAST_UPDATED}
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
// STEP 1 – PROJECT CONTEXT
//////////////////////////////////////////////////

function showProject(){

  let html = `<h2>Step 1 – Project Context</h2>

  <label>Design Stage</label>
  <select id="stage">
    <option>Concept</option>
    <option>Preliminary</option>
    <option>Detailed</option>
  </select>

  <label>Project Objective (multi-select)</label>
  <select id="objective" multiple size="5">
    <option value="Hydraulics">Understanding the general hydraulics</option>
    <option value="Scour">Concerns about downstream scour and sediment transport</option>
    <option value="Energy">Energy dissipation / air entrainment</option>
    <option value="Uplift">Uplift pressures</option>
  </select>

  <label>Risk Level</label>
  <select id="risk">
    <option>Low</option>
    <option>Moderate</option>
    <option>High</option>
  </select>

  <label>Known Issues (multi-select)</label>
  <select id="issues" multiple size="5">
    <option value="Erosion">Erosion occurring downstream</option>
    <option value="Uplift">Uplift pressures</option>
    <option value="Cavitation">Cavitation</option>
    <option value="Velocity">High velocities</option>
    <option value="Anchors">Anchors failing</option>
  </select>
  `;

  html += nav("saveProject()");
  render(html);
}

function saveProject(){

  save(showProject);

  answers.stage = stage.value;
  answers.risk = risk.value;

  answers.objectives = Array.from(objective.selectedOptions).map(o=>o.value);
  answers.issues = Array.from(issues.selectedOptions).map(o=>o.value);

  step++;
  showPrototype();
}

//////////////////////////////////////////////////
// STEP 2 / 3 (UNCHANGED)
//////////////////////////////////////////////////

function showPrototype(){

  let html = `<h2>Step 2 – Prototype</h2>

  <label>Total Length (m)</label><input id="len">
  <label>Width (m)</label><input id="width">
  <label>Discharge (m³/s)</label><input id="Q">`;

  html += nav("savePrototype()");
  render(html);
}

function savePrototype(){
  save(showPrototype);

  answers.length=parseFloat(len.value)||0;
  answers.width=parseFloat(width.value)||0;
  answers.discharge=parseFloat(Q.value)||0;

  step++;
  showLab();
}

function showLab(){

  let html = `<h2>Step 3 – Laboratory</h2>

  <label>Bay Length (m)</label><input id="bayL">
  <label>Bay Width (m)</label><input id="bayW">
  <label>Flow (L/s)</label><input id="Qavail">`;

  html += nav("saveLab()");
  render(html);
}

function saveLab(){
  save(showLab);

  answers.bayLength=parseFloat(bayL.value)||0;
  answers.bayWidth=parseFloat(bayW.value)||0;
  answers.availableFlow=parseFloat(Qavail.value)||0;

  step++;
  showResults();
}

//////////////////////////////////////////////////
// CALCULATIONS (UNCHANGED)
//////////////////////////////////////////////////

function compute(){

  const scales=[20,30,40,50,60,70,80,90,100];
  let results=[];

  scales.forEach(N=>{

    let Lm=answers.length/N;
    let Wm=answers.width/N;
    let Qm=(answers.discharge/Math.pow(N,2.5))*1000;

    let geo=Lm<=answers.bayLength && Wm<=answers.bayWidth;
    let flow=Qm<=answers.availableFlow;

    let reason = !geo ? "Geometry exceeds facility"
                : !flow ? "Flow exceeds supply"
                : "Feasible";

    results.push({N,Lm,Wm,Qm,geo,flow,pass:geo&&flow,reason});
  });

  return results;
}

//////////////////////////////////////////////////
// ✅ RULE ENGINE
//////////////////////////////////////////////////

function evaluateRules(scale){

  let triggered=[];

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

    if(hit) triggered.push(r);

  });

  return triggered;
}

//////////////////////////////////////////////////
// RESULTS
//////////////////////////////////////////////////

function showResults(){

  let results=compute();
  let selected=results.findIndex(r=>r.pass);

  let html="<h2>Scale Assessment</h2>";

  if(selected>=0){
    let r=results[selected];

    let geoUtil=(r.Lm/answers.bayLength)*100;
    let flowUtil=(r.Qm/answers.availableFlow)*100;

    let governing = flowUtil>geoUtil
      ? "Flow capacity limits achievable scale"
      : "Facility geometry limits achievable scale";

    html+=`
    <div class="recommend">
      RECOMMENDED SCALE<br>1:${r.N}
      <div class="subtext">Largest feasible model within constraints</div>
    </div>

    <div class="subtext">⚙ ${governing}</div>
    `;
  }

  html+=`
  <table>
    <tr>
      <th>Scale</th><th>Length (m)</th><th>Width (m)</th>
      <th>Flowrate (L/s)</th><th>Geometry</th><th>Flow</th><th>Reason</th>
    </tr>`;

  results.forEach((r,i)=>{
    html+=`
    <tr class="${i===selected?'selected':''}">
      <td>1:${r.N}</td>
      <td>${r.Lm.toFixed(2)}</td>
      <td>${r.Wm.toFixed(2)}</td>
      <td>${r.Qm.toFixed(1)}</td>
      <td>${r.geo?'✓':'✗'}</td>
      <td>${r.flow?'✓':'✗'}</td>
      <td>${r.reason}</td>
    </tr>`;
  });

  html+="</table>";

  //////////////////////////////////////////////////
  // ✅ DYNAMIC WARNINGS
  //////////////////////////////////////////////////

  if(selected>=0){
    let scale=results[selected].N;
    let warnings=evaluateRules(scale);

    if(warnings.length){
      html+=`
      <div class="reasoning">
        <h3>Modelling Considerations</h3>
        <ul>
      `;

      warnings.forEach(w=>{
        html+=`<li>${w.message}</li>`;
      });

      html+="</ul></div>";
    }
  }

  html+=`
  <div style="display:flex;justify-content:space-between;margin-top:20px;">
    <button onclick="back()">Back</button>
    <button onclick="start()">Restart</button>
  </div>`;

  render(html);
}
