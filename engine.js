let chart;
let state = {};

// NAV
function go(n){toggle(n,n+1);}
function back(n){toggle(n,n-1);}
function toggle(a,b){
document.getElementById("s"+a).classList.add("hidden");
document.getElementById("s"+b).classList.remove("hidden");
step.innerText=b;
}

// INIT
window.onload=()=>{
const objs=[
"General hydraulics",
"Scour / sediment transport",
"Energy dissipation",
"Air entrainment"
];
objectives.innerHTML=objs.map(o=>
`<label><input type="checkbox" value="${o}">${o}</label>`
).join("");
};

// VALIDATION
function validate(p){
return !(Object.values(p).some(v=>v<=0) || p.Hmax<=p.Elev);
}

// MAIN ENGINE
function run(){

let p={
L:+Lp.value,W:+Wp.value,Q:+Qp.value,
Hmax:+Hmax.value,Elev:+Elev.value
};

let lab={
L:+Lb.value,W:+Wb.value,H:+Hb.value,Q:+Qb.value
};

if(!validate(p)) return alert("Invalid inputs");

let scales=[];

for(let N=5;N<=100;N+=5){

let Lm=p.L/N;
let Wm=p.W/N;
let Qm=(p.Q/Math.pow(N,2.5))*1000;
let Hm=((p.Hmax-p.Elev)/N)+0.2;

let geo=Lm<=lab.L && Wm<=lab.W;
let flow=Qm<=lab.Q;
let height=Hm<=lab.H;

let feasible=geo&&flow&&height;

scales.push({N,Lm,Wm,Qm,Hm,geo,flow,height,feasible});
}

let feasible=scales.filter(s=>s.feasible);

let best=feasible.map(s=>{
let score=(100-s.N);
if(s.N>=50 && s.N<=60) score+=30;
return {...s,score};
}).sort((a,b)=>b.score-a.score)[0];

state={scales,best,p,lab};

render();
toggle(3,4);

// link sliders
initSliders();
}

// RENDER
function render(){

let {scales,best}=state;

scale.innerText="1:"+best.N;

summary.innerHTML=`
Constraint: ${
!best.geo?"Geometry":
!best.flow?"Flow":
!best.height?"Height":"Balanced"
}
`;

renderTable();
renderChart();
renderWarnings();
renderLayout();
}

// CHART
function renderChart(){

let {scales,best}=state;

if(chart) chart.destroy();

chart=new Chart(chartCanvas(),{
type:"line",
data:{
labels:scales.map(s=>s.N),
datasets:[
{
label:"Geometry %",
data:scales.map(s=>s.Lm),
borderColor:"#0078d4"
},
{
label:"Flow (L/s)",
data:scales.map(s=>s.Qm),
borderColor:"#00a36c"
}
]
},
options:{
scales:{
y:{title:{display:true,text:"Value"}},
x:{title:{display:true,text:"Scale"}}
},
plugins:{
annotation:{
annotations:{
line1:{
type:'line',
xMin:best.N,
xMax:best.N,
borderColor:'red'
}
}
}
}
}
});
}

function chartCanvas(){
return document.getElementById("chart");
}

// TABLE
function renderTable(){
let {scales,best}=state;

table.innerHTML=`<table>
<tr><th>Scale</th><th>L</th><th>W</th><th>H</th><th>Q</th><th>Status</th></tr>
${scales.map(s=>`
<tr class="${s.N===best.N?"selected":""}">
<td>1:${s.N}</td>
<td>${s.Lm.toFixed(2)}</td>
<td>${s.Wm.toFixed(2)}</td>
<td>${s.Hm.toFixed(2)}</td>
<td>${s.Qm.toFixed(0)}</td>
<td>${s.feasible?"✅":"❌"}</td>
</tr>`).join("")}
</table>`;
}

// WARNINGS (FULL LIBRARY)
const rules=[
{scale_max:50,msg:"Sediment scaling distortion",priority:"high"},
{scale_min:70,msg:"Air entrainment distortion",priority:"medium"}
];

function renderWarnings(){

let {best}=state;

warnings.innerHTML=rules.filter(r=>{
if(r.scale_max && best.N>r.scale_max) return true;
if(r.scale_min && best.N<r.scale_min) return true;
}).map(r=>
`<div class="warning ${r.priority}">${r.msg}</div>`
).join("");
}

// SLIDERS
function initSliders(){

scaleSlider.value=state.best.N;
scaleSlider.oninput=()=>{
let s=state.scales.find(x=>x.N==scaleSlider.value);
sliderOutput.innerText=
`L=${s.Lm.toFixed(2)}m, Q=${s.Qm.toFixed(1)}L/s`;
};

flowSlider.value=state.lab.Q;
flowSlider.oninput=(e)=>{
Qb.value=e.target.value;
run();
};
}

// LAYOUT
function renderLayout(){

let {best,lab}=state;

let ctx=document.getElementById("layout").getContext("2d");

ctx.clearRect(0,0,400,200);

ctx.fillStyle="#ddd";
ctx.fillRect(0,0,400,200);

let scaleX=400/lab.L;
let scaleY=200/lab.W;

ctx.fillStyle="#0078d4";

ctx.fillRect(0,0,best.Lm*scaleX,best.Wm*scaleY);
}

// PDF
function exportReport(){

const {jsPDF}=window.jspdf;

let doc=new jsPDF();

doc.text("Hydraulic Model Scale Report",10,10);
doc.text(`Scale: ${state.best.N}`,10,30);
doc.text(summary.innerText,10,50);

doc.save("report.pdf");
}
