let chart;

// ---------- NAV ----------
function go(n){ toggle(n,n+1); }
function back(n){ toggle(n,n-1); }

function toggle(a,b){
  document.getElementById("s"+a).classList.add("hidden");
  document.getElementById("s"+b).classList.remove("hidden");
  step.innerText = b;
}

// ---------- INIT ----------
window.onload = () => {
  const objs = [
    "General hydraulics",
    "Scour / sediment transport",
    "Energy dissipation",
    "Air entrainment"
  ];
  objectives.innerHTML = objs.map(o =>
    `<label><input type="checkbox" value="${o}"> ${o}</label>`
  ).join("");
};

// ---------- VALIDATION ----------
function validate(p){
  if(Object.values(p).some(v => v <= 0)) return false;
  if(p.Hmax <= p.Elev) return false;
  return true;
}

// ---------- MAIN ----------
function run(){

let p = {
  L:+Lp.value, W:+Wp.value, Q:+Qp.value,
  Hmax:+Hmax.value, Elev:+Elev.value
};

let lab = {
  L:+Lb.value, W:+Wb.value, H:+Hb.value, Q:+Qb.value
};

if(!validate(p)) {
  alert("Invalid inputs — please check values");
  return;
}

let scales = [];

for(let N=5; N<=100; N+=5){

let Lm=p.L/N;
let Wm=p.W/N;
let Qm=(p.Q/Math.pow(N,2.5))*1000;
let Hm=((p.Hmax-p.Elev)/N)+0.2;

let geo=Lm<=lab.L && Wm<=lab.W;
let flow=Qm<=lab.Q;
let height=Hm<=lab.H;

let feasible=geo && flow && height;

let geoU=(Lm/lab.L)*100;
let flowU=(Qm/lab.Q)*100;

scales.push({N,Lm,Wm,Qm,Hm,geo,flow,height,feasible,geoU,flowU});
}

// ---- SELECTION ----
let feasible = scales.filter(s => s.feasible);

if(feasible.length === 0){
  alert("No feasible scale found");
  return;
}

let best = selectBest(feasible);

render(scales,best);
toggle(3,4);
}

// ---------- SCORING ----------
function selectBest(scales){

return scales.map(s=>{
let score=0;

score += (100 - s.N); // bigger better
if(s.N>=50 && s.N<=60) score += 30;

if(s.geoU>90) score -= 50;
if(s.flowU>90) score -= 50;

if(s.geoU>=70 && s.geoU<=90) score += 20;
if(s.flowU>=70 && s.flowU<=90) score += 20;

return {...s,score};

}).sort((a,b)=>b.score-a.score)[0];
}

// ---------- RENDER ----------
function render(scales,best){

scale.innerText = "1:" + best.N;

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

renderChart(scales);
renderTable(scales,best);

let objs = [...document.querySelectorAll("input[type=checkbox]:checked")]
.map(o=>o.value);

let warns = applyRules(best, objs);

warnings.innerHTML = warns.map(w =>
`<div class='warning ${w.priority}'>${w.message}</div>`
).join("");
}

// ---------- RULES ----------
const rules = [
{
  triggers:{
    objectives:["Scour / sediment transport"],
    scale_max:50
  },
  message:"Scale may be too small for sediment transport",
  priority:"high"
}
];

function applyRules(best, objectives){

return rules.filter(r=>{

let match = true;

if(r.triggers.objectives){
match = r.triggers.objectives.some(o => objectives.includes(o));
}

if(r.triggers.scale_max){
match = match && best.N > r.triggers.scale_max;
}

return match;
});
}

// ---------- TABLE ----------
function renderTable(scales,best){

let html = `<table>
<tr><th>Scale</th><th>L</th><th>W</th><th>H</th><th>Q</th><th>Status</th></tr>`;

scales.forEach(s=>{
html += `<tr class='${s.N===best.N?"selected":""}'>
<td>1:${s.N}</td>
<td>${s.Lm.toFixed(2)}</td>
<td>${s.Wm.toFixed(2)}</td>
<td>${s.Hm.toFixed(2)}</td>
<td>${s.Qm.toFixed(0)}</td>
<td>${s.feasible?"✅":"❌"}</td>
</tr>`;
});

html += "</table>";
table.innerHTML = html;
}

// ---------- CHART ----------
function renderChart(scales){

if(chart) chart.destroy();

chart = new Chart(document.getElementById("chart"), {
type: "line",
data: {
labels: scales.map(s=>s.N),
datasets: [
{
  label:"Geometry %",
  data: scales.map(s=>s.geoU),
  borderColor:"#0078d4"
},
{
  label:"Flow %",
  data: scales.map(s=>s.flowU),
  borderColor:"#00a36c"
}
]
},
options: {
responsive:true,
plugins:{legend:{position:"bottom"}},
scales:{y:{min:0,max:120}}
}
});
}

// ---------- EXPORT ----------
function exportReport(){

let txt = `
Hydraulic Model Scale Report
----------------------------

Recommended Scale: ${scale.innerText}

${summary.innerText}

Warnings:
${warnings.innerText}
`;

let blob = new Blob([txt]);
let a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "scale-report.txt";
a.click();
}
