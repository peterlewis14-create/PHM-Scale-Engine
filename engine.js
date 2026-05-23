const VERSION = "v1.5";
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
// ✅ STEP 1 (RESTORED FRONT PAGE)
//////////////////////////////////////////////////

function showProject(){

  let html = `<h2>Step 1 – Project Overview</h2>

  <label>Project Focus</label>
  <select id="focus">
    <option ${answers.objective==="Hydraulics"?"selected":""}>Hydraulics</option>
    <option ${answers.objective==="Scour"?"selected":""}>Scour</option>
  </select>
  `;

  html += nav("saveProject()");
  render(html);
}

function saveProject(){
  save(showProject);

  answers.objective = focus.value;
  step++;
  showPrototype();
}

//////////////////////////////////////////////////
// STEP 2
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
// STEP 3
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
// CALCULATIONS
//////////////////////////////////////////////////

function compute(){

  const scales = [20,30,40,50,60,70,80,90,100];
  const results=[];

  scales.forEach(N=>{

    let Lm = answers.length / N;
    let Wm = answers.width / N;

    // ✅ convert to L/s
    let Qm = (answers.discharge / Math.pow(N,2.5)) * 1000;

    let geo = Lm <= answers.bayLength && Wm <= answers.bayWidth;
    let flow = Qm <= answers.availableFlow;

    results.push({N,Lm,Wm,Qm,geo,flow,pass:geo&&flow});
  });

  return results;
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

    html += `
    <div class="recommend">
      RECOMMENDED SCALE<br>1:${r.N}
      <div class="subtext">Largest feasible model within constraints</div>
    </div>
    `;
  }

  // ✅ FIXED COLUMN HEADINGS
  html += `
  <table>
    <tr>
      <th>Scale</th>
      <th>Length (m)</th>
      <th>Width (m)</th>
      <th>Flowrate (L/s)</th>
      <th>Geometry</th>
      <th>Flow</th>
    </tr>
  `;

  results.forEach((r,i)=>{
    html += `
    <tr class="${i===selected?'selected':''}">
      <td>1:${r.N}</td>
      <td>${r.Lm.toFixed(2)}</td>
      <td>${r.Wm.toFixed(2)}</td>
      <td>${r.Qm.toFixed(1)}</td>
      <td>${r.geo?'✓':'✗'}</td>
      <td>${r.flow?'✓':'✗'}</td>
    </tr>`;
  });

  html += `</table>`;

  if(selected>=0){
    let r = results[selected];

    let geoUtil = (r.Lm / answers.bayLength)*100;
    let flowUtil = (r.Qm / answers.availableFlow)*100;

    let confClass = r.N<=40?'high':(r.N<=70?'moderate':'low');
    let confText = r.N<=40?'High':(r.N<=70?'Moderate':'Lower');

    let governing = flowUtil > geoUtil
      ? "Flow capacity"
      : "Geometry";

    html += `
    <div class="reasoning">
      <h3>Assessment Summary</h3>

      ⚙ Governing: ${governing}<br><br>

      📊 Confidence: <span class="badge ${confClass}">${confText}</span>

      <p class="subtext">Confidence is primarily based on achievable model scale.</p>

      Geometry utilisation
      <div class="util-bar">
        <div class="util-fill" style="width:${geoUtil}%"></div>
      </div>
      ${geoUtil.toFixed(1)}%

      Flow utilisation
      <div class="util-bar">
        <div class="util-fill" style="width:${flowUtil}%"></div>
      </div>
      ${flowUtil.toFixed(1)}%
    </div>
    `;
  }

  html += `
  <div style="display:flex; justify-content:space-between; margin-top:20px;">
    <button onclick="back()">Back</button>
    <button onclick="start()">Restart</button>
  </div>`;

  render(html);
}
