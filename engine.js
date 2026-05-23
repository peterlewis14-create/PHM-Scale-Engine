const VERSION = "v2.2";
const REVISION = "R3";

const answers = {};
let step = 1;
let history = [];

//////////////////////////////////////////////////
// ✅ RULE TABLE (WITH PRIORITY + REFERENCES)
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
    message: "Coarser models reduce hydraulic detail.",
    priority: "medium",
    references: []
  }
];

//////////////////////////////////////////////////
// NAV
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
  Object.assign(answers, h.data);
  step = h.step;
  h.fn();
}

function render(content){
  document.getElementById("app").innerHTML = `
    <div>Step ${step} of 4</div>
    ${content}
    <div class="footer">${VERSION} | ${REVISION}</div>
  `;
}

function nav(next){
  return `
  <div style="display:flex; justify-content:space-between; margin-top:20px;">
    ${history.length ? `<button onclick="back()">Back</button>` : `<div></div>`}
    <button onclick="${next}">Next</button>
  </div>`;
}

//////////////////////////////////////////////////
// STEP 1 ✅ FIXED
//////////////////////////////////////////////////

function showProject(){

  let html = `
  <h2>Project Context</h2>

  <label>Design Stage</label>
  <select id="stage">
    <option>Concept</option>
    <option>Preliminary</option>
    <option>Detailed</option>
  </select>

  <label>Objectives</label>
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

function saveProject(){

  save(showProject);

  answers.stage = stage.value;
  answers.risk = risk.value;

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

function showPrototype(){

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

function savePrototype(){

  save(showPrototype);

  answers.length = parseFloat(len.value)||0;
  answers.width = parseFloat(width.value)||0;
  answers.discharge = parseFloat(Q.value)||0;

  step++;
  showLab();
}

//////////////////////////////////////////////////
// STEP 3
//////////////////////////////////////////////////

function showLab(){

  let html = `
  <h2>Laboratory</h2>

  <label>Bay Length (m)</label>
  <input id="bayL">

  <label>Bay Width (m)</label>
  <input id="bayW">

  <label>Available Flow (L/s)</label>
  <input id="Qavail">
  `;

  html += nav("saveLab()");
  render(html);
}

function saveLab(){

  save(showLab);

  answers.bayLength = parseFloat(bayL.value)||0;
  answers.bayWidth = parseFloat(bayW.value)||0;
  answers.availableFlow = parseFloat(Qavail.value)||0;

  step++;
  showResults();
}

//////////////////////////////////////////////////
// CALC ✅ FULL (RESTORED)
//////////////////////////////////////////////////

function compute(){

  const scales=[20,30,40,50,60,70,80,90,100];
  const results=[];

  scales.forEach(N=>{

    let Lm = answers.length/N;
    let Wm = answers.width/N;
    let Qm = (answers.discharge/Math.pow(N,2.5))*1000;

    let geo = Lm<=answers.bayLength && Wm<=answers.bayWidth;
    let flow = Qm<=answers.availableFlow;

    let reason = !geo ? "Geometry exceeds facility"
                : !flow ? "Flow exceeds supply"
                : "Feasible";

    results.push({N,Lm,Wm,Qm,geo,flow,pass:geo&&flow,reason});
  });

  return results;
}

//////////////////////////////////////////////////
// RULE ENGINE ✅ SORTED
//////////////////////////////////////////////////

function evaluateRules(scale){

  let warnings=[];

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

    if(hit) warnings.push(r);
  });

  const order={high:0, medium:1, info:2};
  warnings.sort((a,b)=>order[a.priority]-order[b.priority]);

  return warnings;
}

//////////////////////////////////////////////////
// EXPORT
//////////////////////////////////////////////////

function exportReport(results, selected, warnings){

  let r = results[selected];

  let text = "PHM Scale Assessment\n\n";
  text += "Recommended Scale: 1:" + r.N + "\n\n";

  warnings.forEach(w=>{
    text += "- " + w.message + "\n";
    w.references.forEach(ref=>{
      text += "   ("+ref.title+")\n";
    });
  });

  let blob = new Blob([text]);
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "PHM_Report.txt";
  a.click();
}

//////////////////////////////////////////////////
// RESULTS ✅ FULL RESTORED
//////////////////////////////////////////////////

function showResults(){

  let results = compute();
  let selected = results.findIndex(r=>r.pass);

  let html="<h2>Scale Assessment</h2>";

  if(selected>=0){
    let r = results[selected];

    html+=`
    <div class="recommend">
      RECOMMENDED SCALE<br>1:${r.N}
    </div>
    `;
  }

  // ✅ TABLE RESTORED
  html+=`
  <table>
    <tr>
      <th>Scale</th>
      <th>Length (m)</th>
      <th>Width (m)</th>
      <th>Flowrate (L/s)</th>
      <th>Geometry</th>
      <th>Flow</th>
      <th>Reason</th>
    </tr>
  `;

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
  // ✅ WARNINGS ADDED UNDERNEATH (SAFE)
  //////////////////////////////////////////////////

  if(selected>=0){

    let scale = results[selected].N;
    let warnings = evaluateRules(scale);

    if(warnings.length){

      html+=`<div class="reasoning"><h3>Modelling Considerations</h3><ul>`;

      warnings.forEach(w=>{

        let cls = "warning-"+w.priority;
        let icon = w.priority==="high"?"⚠":"ℹ";

        html+=`<li class="${cls}">${icon} ${w.message}`;

        if(w.references.length){
          html+=`<ul>`;
          w.references.forEach(r=>{
            html+=`<li><a href="${r.link}" target="_blank">${r.title}</a></li>`;
          });
          html+=`</ul>`;
        }

        html+=`</li>`;
      });

      html+="</ul></div>";

      html += `
      <button onclick='exportReport(${JSON.stringify(results)}, ${selected}, ${JSON.stringify(warnings)})'>
        Export Report
      </button>`;
    }
  }

  html+=`
  <div style="display:flex; justify-content:space-between; margin-top:20px;">
    <button onclick="back()">Back</button>
    <button onclick="start()">Restart</button>
  </div>`;

  render(html);
}
