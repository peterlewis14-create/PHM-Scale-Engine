let chart;

// ---------- INIT ----------
window.onload = () => {
  init();
  loadState();
};

function init() {
  ["Concept","Preliminary","Detailed"].forEach(v=>add("stage",v));
  ["Low","Moderate","High"].forEach(v=>add("risk",v));

  let objectivesList = [
    "General hydraulics",
    "Scour / sediment transport",
    "Energy dissipation",
    "Air entrainment",
    "Uplift pressures"
  ];

  objectives.innerHTML = objectivesList.map(o =>
    `<label><input type="checkbox" value="${o}"> ${o}</label>`
  ).join("");
}

function add(id,val){
  let o=document.createElement("option");
  o.textContent = val;
  document.getElementById(id).appendChild(o);
}

// ---------- NAV ----------
function next(n){ saveState(); toggle(n,n+1); }
function back(n){ toggle(n,n-1); }

function toggle(a,b){
  document.getElementById("step"+a).classList.add("hidden");
  document.getElementById("step"+b).classList.remove("hidden");
  stepNo.innerText = b;
}

// ---------- STATE ----------
function saveState(){
  localStorage.setItem("hydraulicApp", JSON.stringify(getInputs()));
}

function loadState(){
  let data = JSON.parse(localStorage.getItem("hydraulicApp"));
  if(!data) return;
  Object.keys(data).forEach(k=>{
    let el = document.getElementById(k);
    if(el) el.value = data[k];
  });
}

function getInputs(){
  return {
    Lp: Lp.value, Wp: Wp.value, Qp: Qp.value,
    Hmax: Hmax.value, Elev: Elev.value,
    Lb: Lb.value, Wb: Wb.value, Hb: Hb.value, Qb: Qb.value
  };
}

// ---------- ENGINE ----------
function run(){

let p = {
L:+Lp.value, W:+Wp.value, Q:+Qp.value,
H:+Hmax.value, E:+Elev.value
};

let lab = {
L:+Lb.value, W:+Wb.value, H:+Hb.value, Q:+Qb.value
};

let scales = [];

for(let N=5; N<=100; N+=5){

let Lm=p.L/N;
let Wm=p.W/N;
let Qm=(p.Q/Math.pow(N,2.5))*1000;
let Hm=((p.H-p.E)/N)+0.2;

let geo=Lm<=lab.L && Wm<=lab.W;
let flow=Qm<=lab.Q;
let height=Hm<=lab.H;

let feasible=geo && flow && height;

let geoUtil=(Lm/lab.L)*100;
let flowUtil=(Qm/lab.Q)*100;

scales.push({N,Lm,Wm,Hm,Qm,geo,flow,height,feasible,geoUtil,flowUtil});
}

// ---- SELECTION ----
let feasible = scales.filter(s=>s.feasible);

let best = feasible.find(s =>
s.N<=60 &&
s.geoUtil>=70 && s.geoUtil<=90 &&
s.flowUtil>=70 && s.flowUtil<=90
) || feasible[0];

// ---- ALTERNATIVES ----
let alt = feasible.filter(s=>s.N!==best.N).slice(0,3);
let infeasible = scales.filter(s=>!s.feasible && s.N<best.N).slice(0,3);

render(scales,best,alt,infeasible);

toggle(3,4);
}

// ---------- RENDER ----------
function render(scales,best,alt,infeasible){

scaleOut.innerText = "1:"+best.N;

summary.innerHTML = `
<b>Constraint:</b> ${
!best.geo ? "Geometry" :
!best.flow ? "Flow" :
!best.height ? "Height" : "Balanced"
}
<br>
<b>Confidence:</b> ${
best.N <=50 ? "High" :
best.N <=70 ? "Moderate" : "Lower"
}
`;

alternatives.innerHTML = `
<b>Alternatives:</b><br>
Feasible: ${alt.map(a=>"1:"+a.N).join(", ")}<br>
Larger (fail): ${infeasible.map(a=>"1:"+a.N).join(", ")}
`;

renderTable(scales,best);
renderChart(scales,best);
renderWarnings(best);
}

// ---------- TABLE ----------
function renderTable(scales,best){

let html="<table><tr><th>Scale</th><th>L</th><th>W</th><th>H</th><th>Q</th><th>Status</th></tr>";

scales.forEach(s=>{
html+=`<tr class="${s.N===best.N?'selected':''}">
<td>1:${s.N}</td>
<td>${s.Lm.toFixed(2)}</td>
<td>${s.Wm.toFixed(2)}</td>
<td>${s.Hm.toFixed(2)}</td>
<td>${s.Qm.toFixed(0)}</td>
<td>${s.feasible?'✅':'❌'}</td>
</tr>`;
});

html+="</table>";
table.innerHTML = html;
}

// ---------- CHART ----------
function renderChart(scales,best){

if(chart) chart.destroy();

chart = new Chart(chartCanvas(),{
type:"line",
data:{
labels:scales.map(s=>s.N),
datasets:[
{
label:"Geometry %",
data:scales.map(s=>s.geoUtil),
borderColor:"#0078d4"
},
{
label:"Flow %",
data:scales.map(s=>s.flowUtil),
borderColor:"#00a36c"
}
]
},
options:{
plugins:{legend:{position:"bottom"}}
}
});
}

function chartCanvas(){
return document.getElementById("chart");
}

// ---------- RULE SYSTEM ----------
const rules = [
{
triggers:{ scale_max:50 },
message:"Scale may be too small for sediment transport",
priority:"high"
}
];

function renderWarnings(best){

let html = "";

rules.forEach(r=>{
if(r.triggers.scale_max && best.N>r.triggers.scale_max){
html+=`<div class="warning ${r.priority}">${r.message}</div>`;
}
});

warnings.innerHTML = html;
}

// ---------- EXPORT ----------
function exportReport(){

const txt = `
Hydraulic Model Scale Report
----------------------------
Recommended Scale: ${scaleOut.innerText}

${summary.innerText}

${alternatives.innerText}

${warnings.innerText}
`;

let blob = new Blob([txt], {type:"text/plain"});
let a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "hydraulic-report.txt";
a.click();
}
