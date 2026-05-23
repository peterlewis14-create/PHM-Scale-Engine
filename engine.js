// ================= STATE =================
const state = {
  step: 1,
  project: {},
  prototype: {},
  lab: {},
  results: {}
};

// ================= CONFIG =================
const OPTIONS = {
  stage: ["Concept","Preliminary","Detailed"],
  risk: ["Low","Moderate","High"],
  objectives: [
    "General hydraulics",
    "Scour / sediment transport",
    "Energy dissipation",
    "Air entrainment",
    "Uplift pressures"
  ]
};

// ================= INIT =================
window.onload = () => {
  populateInputs();
};

// ================= UI INIT =================
function populateInputs(){
  OPTIONS.stage.forEach(s => addOption("stage", s));
  OPTIONS.risk.forEach(r => addOption("risk", r));

  let html="";
  OPTIONS.objectives.forEach(o=>{
    html+=`<label><input type="checkbox" class="obj" value="${o}"> ${o}</label>`;
  });
  document.getElementById("objectives").innerHTML = html;
}

function addOption(id,val){
  let opt = document.createElement("option");
  opt.textContent = val;
  document.getElementById(id).appendChild(opt);
}

// ================= NAV =================
function nextStep(n){
  if(!validateStep(n)) return;
  toggle(n,n+1);
}
function prevStep(n){ toggle(n,n-1); }

function toggle(a,b){
  document.getElementById("step"+a).classList.add("hidden");
  document.getElementById("step"+b).classList.remove("hidden");
  document.getElementById("currentStep").innerText=b;
}

// ================= VALIDATION =================
function validateStep(step){
  if(step === 2){
    let Hmax = +HmaxEl.value;
    let Elev = +Elev.value;
    if(Hmax <= Elev){
      alert("Headwater must exceed elevation"); return false;
    }
  }
  return true;
}

// ================= CALCULATION =================
function runCalculation(){

  const p = {
    L:+Lp.value, W:+Wp.value, Q:+Qp.value,
    Hmax:+Hmax.value, Elev:+Elev.value
  };

  const lab = {
    L:+Lb.value, W:+Wb.value, H:+Hb.value, Q:+Qb.value
  };

  const objectives = [...document.querySelectorAll(".obj:checked")]
    .map(o=>o.value);

  let scales=[];

  for(let N=5;N<=100;N+=5){
    let Lm=p.L/N;
    let Wm=p.W/N;
    let Qm=(p.Q/Math.pow(N,2.5))*1000;
    let Hm=((p.Hmax-p.Elev)/N)+0.2;

    let geo=Lm<=lab.L && Wm<=lab.W;
    let flow=Qm<=lab.Q;
    let height=Hm<=lab.H;
    let feasible=geo && flow && height;

    let geoUtil=(Lm/lab.L)*100;
    let flowUtil=(Qm/lab.Q)*100;

    scales.push({N,Lm,Wm,Qm,Hm,geo,flow,height,feasible,geoUtil,flowUtil});
  }

  const feasible = scales.filter(s=>s.feasible);

  const best = selectBest(feasible);

  const infeasibleAbove = scales.filter(s=>!s.feasible && s.N < best.N).slice(0,3);
  const alt = feasible.filter(s=>s.N!==best.N).slice(0,3);

  state.results = {scales,best,infeasibleAbove,alt,objectives};

  render();
  toggle(3,4);
}

// ================= SELECTION =================
function selectBest(feasible){
  let ranked = feasible.sort((a,b)=>a.N-b.N);

  return ranked.find(s =>
    s.N<=60 &&
    s.geoUtil>=70 && s.geoUtil<=90 &&
    s.flowUtil>=70 && s.flowUtil<=90
  ) || ranked[0];
}

// ================= RULE ENGINE =================
const rules = [
{
  triggers:{ objectives:["Scour / sediment transport"], scale_max:50 },
  message:"Scale may be too small for sediment transport processes.",
  priority:"high"
},
{
  triggers:{ risk:["High"], scale_min:40 },
  message:"High-risk project – consider larger scale.",
  priority:"medium"
}
];

function applyRules(best, objectives){
  let matches=[];

  rules.forEach(r=>{
    let ok=true;

    if(r.triggers.objectives){
      ok = r.triggers.objectives.some(o=>objectives.includes(o));
    }

    if(r.triggers.scale_max && best.N > r.triggers.scale_max) ok=true;
    if(r.triggers.scale_min && best.N < r.triggers.scale_min) ok=true;

    if(ok) matches.push(r);
  });

  return matches.sort(pSort);
}

function pSort(a,b){
  return ["high","medium","info"].indexOf(a.priority)
       - ["high","medium","info"].indexOf(b.priority);
}

// ================= RENDER =================
function render(){
  let {scales,best,infeasibleAbove,alt,objectives} = state.results;

  recommend.innerText=`1:${best.N}`;

  constraint.innerHTML =
    `<b>Governing:</b> ${
      !best.geo ? "Geometry" :
      !best.flow ? "Flow" :
      !best.height ? "Height" : "Balanced"
    }`;

  confidence.innerHTML = `<b>Confidence:</b> ${
    best.N <=50 ? "High" :
    best.N <=70 ? "Moderate" : "Lower"
  }`;

  utilisation.innerHTML = `
    Geometry ${best.geoUtil.toFixed(0)}%
    <div class="progress"><div class="progress-bar" style="width:${best.geoUtil}%"></div></div>
    Flow ${best.flowUtil.toFixed(0)}%
    <div class="progress"><div class="progress-bar" style="width:${best.flowUtil}%"></div></div>
  `;

  alternatives.innerHTML = `
    <b>Alternatives:</b><br>
    Feasible: ${alt.map(a=>"1:"+a.N).join(", ")}<br>
    Larger (infeasible): ${infeasibleAbove.map(a=>"1:"+a.N).join(", ")}
  `;

  let table=`<table><tr>
  <th>Scale</th><th>L</th><th>W</th><th>H</th><th>Q</th>
  <th>Geom</th><th>Flow</th><th>Height</th><th>Status</th></tr>`;

  scales.forEach(s=>{
    table+=`<tr class='${s.N===best.N?"selected":""}'>
    <td>1:${s.N}</td>
    <td>${s.Lm.toFixed(2)}</td>
    <td>${s.Wm.toFixed(2)}</td>
    <td>${s.Hm.toFixed(2)}</td>
    <td>${s.Qm.toFixed(0)}</td>
    <td>${s.geo?'✅':'❌'}</td>
    <td>${s.flow?'✅':'❌'}</td>
    <td>${s.height?'✅':'❌'}</td>
    <td>${s.feasible?'Feasible':'Fail'}</td>
    </tr>`;
  });

  table+="</table>";
  document.getElementById("table").innerHTML=table;

  let warn = applyRules(best,objectives);
  warnings.innerHTML = warn.map(w =>
    `<div class='warning ${w.priority}'>[${w.priority.toUpperCase()}] ${w.message}</div>`
  ).join("");
}

// ================= EXPORT =================
function exportReport(){
  const b=state.results.best;
  const txt = `
Hydraulic Model Scale Report
---------------------------
Recommended Scale: 1:${b.N}

Governing Constraint: ${constraint.innerText}

Warnings:
${warnings.innerText}
`;

  let blob=new Blob([txt],{type:"text/plain"});
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=\"report.txt\";
  a.click();
}
