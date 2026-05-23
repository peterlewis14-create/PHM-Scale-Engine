const VERSION = "v1.7";
const REVISION = "R1";
const LAST_UPDATED = "23 May 2026";

const answers = {};
let step = 1;
let history = [];

function start(){
  step = 1;
  history = [];
  showProject();
}

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
// ✅ STEP 1 – PROJECT CONTEXT (MULTI-SELECT)
//////////////////////////////////////////////////

function showProject(){

  let html = `<h2>Step 1 – Project Context</h2>

  <label>Design Stage</label>
  <select id="stage">
    <option ${answers.stage==="Concept"?"selected":""}>Concept</option>
    <option ${answers.stage==="Preliminary"?"selected":""}>Preliminary</option>
    <option ${answers.stage==="Detailed"?"selected":""}>Detailed</option>
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
    <option ${answers.risk==="Low"?"selected":""}>Low</option>
    <option ${answers.risk==="Moderate"?"selected":""}>Moderate</option>
    <option ${answers.risk==="High"?"selected":""}>High</option>
  </select>

  <label>Known Issues (multi-select)</label>
  <select id="issues" multiple size="6">
    <option value="Erosion">Erosion occurring downstream</option>
    <option value="Uplift">Uplift pressures</option>
    <option value="Cavitation">Cavitation</option>
    <option value="Velocity">High velocities</option>
    <option value="Anchors">Anchors failing</option>
  </select>
  `;

  html += nav("saveProject()");
  render(html);

  // ✅ restore selections
  if(answers.objectives){
    Array.from(objective.options).forEach(o=>{
      o.selected = answers.objectives.includes(o.value);
    });
  }

  if(answers.issues){
    Array.from(issues.options).forEach(o=>{
      o.selected = answers.issues.includes(o.value);
    });
  }
}

function saveProject(){
  save(showProject);

  answers.stage = stage.value;
  answers.risk = risk.value;

  answers.objectives = Array.from(objective.selectedOptions).map(o => o.value);
  answers.issues = Array.from(issues.selectedOptions).map(o => o.value);

  step++;
  showPrototype();
}

//////////////////////////////////////////////////
// STEP 2 – PROTOTYPE
//////////////////////////////////////////////////

function showPrototype(){

  let html = `<h2>Step 2 – Prototype Details</h2>

  <label>Total Length (m)</label>
  <input id="len" value="${answers.length||""}">

  <label>Width (m)</label>
  <input id="width" value="${answers.width||""}">

  <label>Discharge (m³/s)</label>
  <input id="Q" value="${answers.discharge||""}">
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
// STEP 3 – LAB
//////////////////////////////////////////////////

function showLab(){

  let html = `<h2>Step 3 – Laboratory Conditions</h2>

  <label>Bay Length (m)</label>
  <input id="bayL" value="${answers.bayLength||""}">

  <label>Bay Width (m)</label>
  <input id="bayW" value="${answers.bayWidth||""}">

  <label>Available Flow (L/s)</label>
  <input id="Qavail" value="${answers.availableFlow||""}">
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
// CALCULATIONS (UNCHANGED CORE LOGIC)
//////////////////////////////////////////////////

function compute(){
  const scales=[20,30,40,50,60,70,80,90,100];
  const results=[];

  scales.forEach(N=>{
    let Lm = answers.length / N;
    let Wm = answers.width / N;
    let Qm = (answers.discharge / Math.pow(N,2.5)) * 1000;

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
// ✅ PROJECT INTERPRETATION (NEW)
//////////////////////////////////////////////////

function buildProjectInterpretation(){

  let html = "<div class='reasoning'><h3>Project Interpretation</h3>";

  html += `<p><b>Design stage:</b> ${answers.stage}</p>`;
  html += `<p><b>Risk level:</b> ${answers.risk}</p>`;

  html += "<p><b>Objectives:</b></p><ul>";
  answers.objectives?.forEach(o => html += `<li>${o}</li>`);
  html += "</ul>";

  if(answers.issues?.length){
    html += "<p><b>Known issues:</b></p><ul>";
    answers.issues.forEach(i => html += `<li>${i}</li>`);
    html += "</ul>";
  }

  html += "</div>";
  return html;
}

//////////////////////////////////////////////////
// RESULTS
//////////////////////////////////////////////////

function showResults(){

  let results = compute();
  let selected = results.findIndex(r=>r.pass);

  let html = `<h2>Scale Assessment</h2>`;

  if(selected>=0){
    let r = results[selected];

    let geoUtil = (r.Lm/answers.bayLength)*100;
    let flowUtil = (r.Qm/answers.availableFlow)*100;

    let governing = flowUtil>geoUtil
      ? "Flow capacity limits achievable scale"
      : "Facility geometry limits achievable scale";

    html += `
    <div class="recommend">
      RECOMMENDED SCALE<br>1:${r.N}
      <div class="subtext">Largest feasible model within laboratory constraints</div>
    </div>

    <div class="subtext">⚙ ${governing}</div>

    <p>A scale of 1:${r.N} provides a practical balance between model size and facility capacity.</p>
    `;
  }

  html += `
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

  html += `</table>`;

  if(selected>=0){
    let r = results[selected];

    let geoUtil = (r.Lm/answers.bayLength)*100;
    let flowUtil = (r.Qm/answers.availableFlow)*100;

    let confClass = r.N<=40?'high':(r.N<=70?'moderate':'low');
    let confText = r.N<=40?'High':(r.N<=70?'Moderate':'Lower');

    html += `
    <div class="reasoning">
      <h3>Assessment Summary</h3>

      📊 Confidence:
      <span class="badge ${confClass}">${confText}</span>

      <p class="subtext">
      Confidence is primarily driven by achievable model scale.
      Larger models generally provide improved hydraulic representation.
      </p>

      <p><b>Utilisation</b> (values close to 100% indicate efficient use)</p>

      Geometry utilisation
      <div class="util-bar"><div class="util-fill" style="width:${geoUtil}%"></div></div>
      ${geoUtil.toFixed(1)}%

      Flow utilisation
      <div class="util-bar"><div class="util-fill" style="width:${flowUtil}%"></div></div>
      ${flowUtil.toFixed(1)}%
    </div>
    `;
  }

  // ✅ NEW CONTEXT BLOCK
  html += buildProjectInterpretation();

  html += `
  <div style="display:flex; justify-content:space-between; margin-top:20px;">
    <button onclick="back()">Back</button>
    <button onclick="start()">Restart</button>
  </div>`;

  render(html);
}
