const VERSION = "v1.4";
const REVISION = "R1";
const LAST_UPDATED = "23 May 2026";

const answers = {};
let currentStep = 1;
let totalSteps = 5;
let historyStack = [];

function start() {
  currentStep = 1;
  historyStack = [];
  showProject();
}

function saveState(fn){
  historyStack.push({
    step: currentStep,
    answers: JSON.parse(JSON.stringify(answers)),
    fn
  });
}

function goBack(){
  let prev = historyStack.pop();
  if(!prev) return;

  Object.assign(answers, prev.answers);
  currentStep = prev.step;
  prev.fn();
}

function render(html){

  let percent = Math.round((currentStep/totalSteps)*100);

  let layout = `
    <div class="progress-container">
      Step ${currentStep} of ${totalSteps}
      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>
    </div>

    ${html}

    <div class="footer">
      PHM Scale Tool ${VERSION} | ${REVISION} | Updated ${LAST_UPDATED}
    </div>
  `;

  document.getElementById("app").innerHTML = layout;
}

function buttons(next){
  return `
  <div style="display:flex; justify-content:space-between; margin-top:20px;">
    ${historyStack.length?'<button onclick="goBack()">Back</button>':'<div></div>'}
    <button onclick="${next}">Next</button>
  </div>`;
}

/* ---------------------------------- */

function showProject(){
  let html = `<h2>Step 1 – Project</h2>

  <label>Project Focus</label>
  <select id="focus">
    <option>Hydraulics</option>
    <option>Scour</option>
  </select>`;

  html += buttons("saveProject()");
  render(html);
}

function saveProject(){
  saveState(showProject);

  answers.objective = focus.value;
  currentStep++;
  showPrototype();
}

/* ---------------------------------- */

function showPrototype(){
  let html = `<h2>Step 2 – Prototype</h2>

  <label>Total Length (m)</label><input id="len">
  <label>Width (m)</label><input id="width">
  <label>Flow (m³/s)</label><input id="Q">`;

  html += buttons("savePrototype()");
  render(html);
}

function savePrototype(){
  saveState(showPrototype);

  answers.length=len.value;
  answers.width=width.value;
  answers.discharge=Q.value;

  currentStep++;
  showLab();
}

/* ---------------------------------- */

function showLab(){
  let html = `<h2>Step 3 – Laboratory</h2>

  <label>Bay Length (m)</label><input id="bayL">
  <label>Bay Width (m)</label><input id="bayW">
  <label>Flow (L/s)</label><input id="Qavail">`;

  html += buttons("saveLab()");
  render(html);
}

function saveLab(){
  saveState(showLab);

  answers.bayLength=bayL.value;
  answers.bayWidth=bayW.value;
  answers.availableFlow=Qavail.value;

  currentStep++;
  showResults();
}

/* ---------------------------------- */

function compute(){

  const scales=[20,40,60,80,100];
  let results=[];

  scales.forEach(N=>{

    let L=answers.length/N;
    let W=answers.width/N;
    let Q=answers.discharge/Math.pow(N,2.5);

    let geo = L<=answers.bayLength && W<=answers.bayWidth;
    let flow = Q<=answers.availableFlow/1000;

    results.push({N,L,W,Q,geo,flow,pass:geo&&flow});
  });

  return results;
}

/* ---------------------------------- */

function showResults(){

  let results=compute();
  let selected=results.findIndex(r=>r.pass);

  let html=`<h2>Scale Assessment</h2>`;

  if(selected>=0){
    let r=results[selected];

    html+=`
    <div class="recommend">
      RECOMMENDED SCALE<br>1:${r.N}
      <div class="subtext">Largest feasible model within constraints</div>
    </div>
    `;
  }

  html+=`<table>
    <tr><th>Scale</th><th>L</th><th>W</th><th>Q</th><th>Geo</th><th>Flow</th></tr>`;

  results.forEach((r,i)=>{
    html+=`
    <tr class="${i===selected?'selected':''}">
      <td>1:${r.N}</td>
      <td>${r.L.toFixed(2)}</td>
      <td>${r.W.toFixed(2)}</td>
      <td>${r.Q.toFixed(3)}</td>
      <td>${r.geo?'✓':'✗'}</td>
      <td>${r.flow?'✓':'✗'}</td>
    </tr>`;
  });

  html+=`</table>`;

  if(selected>=0){
    let r=results[selected];

    let geoUtil=r.L/answers.bayLength*100;
    let flowUtil=r.Q/(answers.availableFlow/1000)*100;

    let conf = r.N<=40?'high':(r.N<=70?'moderate':'low');
    let confText = r.N<=40?'High':(r.N<=70?'Moderate':'Lower');

    let governing = flowUtil>geoUtil?'Flow capacity':'Geometry';

    html+=`
    <div class="reasoning">
      <h3>Assessment Summary</h3>

      ⚙ Governing: ${governing}<br><br>

      📊 Confidence: <span class="badge ${conf}">${confText}</span>

      <p class="subtext">Confidence is primarily based on model scale.</p>

      Geometry utilisation
      <div class="util-bar"><div class="util-fill" style="width:${geoUtil}%"></div></div>

      Flow utilisation
      <div class="util-bar"><div class="util-fill" style="width:${flowUtil}%"></div></div>
    </div>
    `;
  }

  html+=`
  <div style="display:flex;justify-content:space-between;margin-top:20px;">
    <button onclick="goBack()">Back</button>
    <button onclick="start()">Restart</button>
  </div>`;

  render(html);
}
