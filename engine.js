// ================= STATE =================
const state = {
  project: {},
  prototype: {},
  lab: {},
  results: {}
};

// =============== NAVIGATION ===============
function nextStep(s) {
  document.getElementById("step" + s).classList.add("hidden");
  document.getElementById("step" + (s + 1)).classList.remove("hidden");
}

function prevStep(s) {
  document.getElementById("step" + s).classList.add("hidden");
  document.getElementById("step" + (s - 1)).classList.remove("hidden");
}

// =============== CALCULATION CORE ===============
function calculateScales(p, lab) {
  let scales = [];

  for (let N = 5; N <= 100; N += 5) {
    let Lm = p.L / N;
    let Wm = p.W / N;
    let Qm = (p.Q / Math.pow(N, 2.5)) * 1000;
    let Hm = ((p.Hmax - p.Elev) / N) + 0.2;

    let geo = Lm <= lab.L && Wm <= lab.W;
    let flow = Qm <= lab.Q;
    let height = Hm <= lab.H;

    let feasible = geo && flow && height;

    let geoUtil = (Lm / lab.L) * 100;
    let flowUtil = (Qm / lab.Q) * 100;

    scales.push({ N, Lm, Wm, Qm, Hm, geo, flow, height, feasible, geoUtil, flowUtil });
  }

  return scales;
}

function selectBestScale(scales) {
  const feasible = scales.filter(s => s.feasible);

  if (feasible.length === 0) return null;

  return feasible.find(s =>
    s.geoUtil < 90 &&
    s.flowUtil < 90 &&
    s.N <= 60
  ) || feasible[0];
}

// =============== RULE SYSTEM ===============
const rules = [
  {
    triggers: {
      objectives: ["Scour / sediment transport"],
      scale_max: 50
    },
    message: "Scale may be too small for sediment transport.",
    priority: "high"
  }
];

function applyRules(scale, objectives) {
  let matches = [];

  rules.forEach(r => {
    let match = false;

    if (r.triggers.objectives) {
      match = r.triggers.objectives.some(o => objectives.includes(o));
    }

    if (r.triggers.scale_max && scale.N > r.triggers.scale_max) match = true;
    if (r.triggers.scale_min && scale.N < r.triggers.scale_min) match = true;

    if (match) matches.push(r);
  });

  return matches;
}

// =============== MAIN RUN ===============
function runCalculation() {
  const prototype = {
    L: +document.getElementById("Lp").value,
    W: +document.getElementById("Wp").value,
    Q: +document.getElementById("Qp").value,
    Hmax: +document.getElementById("Hmax").value,
    Elev: +document.getElementById("Elev").value
  };

  const lab = {
    L: +document.getElementById("Lb").value,
    W: +document.getElementById("Wb").value,
    H: +document.getElementById("Hb").value,
    Q: +document.getElementById("Qb").value
  };

  const objectives = Array.from(document.querySelectorAll(".obj:checked"))
    .map(o => o.value);

  const scales = calculateScales(prototype, lab);
  const best = selectBestScale(scales);

  state.results = { scales, best };

  renderResults(scales, best, objectives);

  nextStep(3);
}

// =============== RENDER ===============
function renderResults(scales, best, objectives) {
  document.getElementById("recommend").innerText = `1:${best.N}`;

  document.getElementById("constraint").innerHTML =
    "<b>Governing:</b> " +
    (!best.geo ? "Geometry" : !best.flow ? "Flow" : !best.height ? "Height" : "Balanced");

  document.getElementById("utilisation").innerHTML = `
    Geometry ${best.geoUtil.toFixed(0)}%
    <div class="progress"><div class="progress-bar" style="width:${best.geoUtil}%"></div></div>
    Flow ${best.flowUtil.toFixed(0)}%
    <div class="progress"><div class="progress-bar" style="width:${best.flowUtil}%"></div></div>
  `;

  let table = "<table><tr><th>Scale</th><th>L</th><th>W</th><th>H</th><th>Q</th><th>Geom</th><th>Flow</th><th>Height</th><th>Status</th></tr>";

  scales.forEach(s => {
    table += `
      <tr class="${s.N === best.N ? "selected" : ""}">
      <td>1:${s.N}</td>
      <td>${s.Lm.toFixed(2)}</td>
      <td>${s.Wm.toFixed(2)}</td>
      <td>${s.Hm.toFixed(2)}</td>
      <td>${s.Qm.toFixed(0)}</td>
      <td>${s.geo ? "✅" : "❌"}</td>
      <td>${s.flow ? "✅" : "❌"}</td>
      <td>${s.height ? "✅" : "❌"}</td>
      <td>${s.feasible ? "Feasible" : "Fail"}</td>
      </tr>
    `;
  });

  table += "</table>";
  document.getElementById("table").innerHTML = table;

  const warnings = applyRules(best, objectives);

  let warnHTML = "";
  warnings.forEach(w => {
    warnHTML += `<div class="warning ${w.priority}">[${w.priority.toUpperCase()}] ${w.message}</div>`;
  });

  document.getElementById("warnings").innerHTML = warnHTML;
}

// =============== EXPORT ===============
function exportReport() {
  const b = state.results.best;
  const text = `Hydraulic Model Scale Report\nRecommended Scale: 1:${b.N}`;

  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "report.txt";
  a.click();
}
``
