import { STAGES, SC, CONS, CM, THR, APPS, COV, GAPS, PERS, LCOL } from "./data.js";
import { normaliseWeights, urgency, band, chosenAction, curve, mean, stageMeans } from "./model.js";

const $ = (s) => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

/* ---------- tabs (WAI-ARIA tabs pattern: click, arrow keys, Home/End) ---------- */
const tabs = [...document.querySelectorAll("nav button")];
function selectTab(b, focus) {
  tabs.forEach((x) => {
    const on = x === b;
    x.setAttribute("aria-selected", on);
    x.tabIndex = on ? 0 : -1;
    $("#v-" + x.dataset.v).hidden = !on;
  });
  if (focus) b.focus();
}
tabs.forEach((b, i) => {
  b.onclick = () => selectTab(b, false);
  b.onkeydown = (e) => {
    const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    selectTab(tabs[(k + tabs.length) % tabs.length], true);
  };
});

/* ---------- simulator state ---------- */
let sc = SC[2], persona = "op", stage = -1, choice = null, auto = false, timer = null;

const W = () => normaliseWeights(+$("#w1").value, +$("#w2").value, +$("#w3").value);
const U = () => urgency(sc, W());
const action = () => chosenAction({ choice, operatorAvailable: $("#avail").checked, bandKey: band(U()).k });

function drawChart(show) {
  const svg = $("#chart");
  const X = (t) => 28 + t / 20 * 244, Y = (v) => 10 + (1 - v) * 115;
  let h = "";
  for (const v of [0, 0.5, 1]) h += `<line x1="28" x2="272" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="4" y="${Y(v) + 3}">${v.toFixed(1)}</text>`;
  for (const t of [0, 5, 10, 15, 20]) h += `<text x="${X(t) - 4}" y="140">${t}</text>`;
  h += `<line x1="${X(3)}" x2="${X(3)}" y1="10" y2="125" stroke="var(--muted)" stroke-dasharray="3 3"/><text x="${X(3) + 3}" y="20">event</text>`;
  if (show) {
    const { res, conv } = curve(sc, { bandKey: band(U()).k, action: action() });
    const p = (a) => a.map((v, i) => (i ? "L" : "M") + X(i / 2).toFixed(1) + " " + Y(v).toFixed(1)).join("");
    h += `<path d="${p(conv)}" fill="none" stroke="var(--crit)" stroke-width="2"/><path d="${p(res)}" fill="none" stroke="var(--ok)" stroke-width="2.4"/>`;
    $("#ri").textContent = mean(res).toFixed(2);
    $("#ci").textContent = mean(conv).toFixed(2);
  } else {
    $("#ri").textContent = "--";
    $("#ci").textContent = "--";
  }
  svg.innerHTML = h;
}

const setState = (t) => { $("#state").innerHTML = t; };

function renderLife() {
  $("#life").innerHTML = STAGES.map((s, i) => `<div class="${i < stage ? "done" : i === stage ? "now" : ""}">${s}</div>`).join("");
}

function layerCard(i, title, tag, body, on) {
  return `<div class="layer ${on ? "on" : ""}" style="--c:${LCOL[i]}"><div class="hd"><b>Layer ${i + 1} - ${title}</b>${tag}</div>${body}</div>`;
}

function renderLayers() {
  const u = U(), b = band(u), act = action();
  const pill = (t, c) => `<span class="pill ${c}">${t}</span>`;
  const L = [];
  L.push(layerCard(0, "CPS assets", stage >= 0 ? pill("event seen", "info") : "",
    `<p>${stage >= 0 ? `<b>${sc.name}.</b> ${sc.sub}. Legacy PLCs, cobots and IIoT gateways in the affected cell.` : "Sensors, PLCs, cobots and edge gateways. Waiting for an event."}</p>`, stage >= 0));
  L.push(layerCard(1, "Zero trust and digital twin", stage >= 1 ? pill(sc.cyber ? "anomaly" : "deviation", sc.cyber ? "crit" : "warn") : "",
    `<p>${stage >= 0 ? "<b>Prevent:</b> " + sc.prevent : "Mutual authentication, segmentation, twin consistency, anomaly detector."}</p>` +
    (stage >= 1 ? `<p><b>Detect:</b> ${sc.twin}</p><div class="mono">detection confidence ${sc.pD.toFixed(2)}</div>` : ""), stage >= 0));
  L.push(layerCard(2, "Explainable analytics", stage >= 2 ? pill(sc.cyber ? "cyber indicators" : "no cyber indicators", sc.cyber ? "crit" : "ok") : "",
    stage >= 2 ? `<p>${persona === "op" ? sc.op : sc.an}</p><div class="mono">explanation confidence ${sc.pE.toFixed(2)} &middot; severity ${sc.s.toFixed(2)}</div>`
               : `<p>XAI and constrained-LLM explanation, knowledge graph, cyber-to-machine link.</p>`, stage >= 2));
  const l4 = stage >= 3
    ? `<p><b>Recommended:</b> ${b.k === "Safe-stop" ? sc.safe : b.k === "Isolate" ? sc.iso : "Continue and monitor."}</p>` +
      (act ? `<p><b>Action taken:</b> ${act === "safe" ? sc.safe : act === "iso" ? sc.iso : "Held and monitored."}</p>` : "")
    : `<p>Operator alert view, guarded override, analyst dashboard.</p>`;
  L.push(layerCard(3, "Human-in-the-loop", stage >= 3 ? pill(b.k, b.c) : "", l4, stage >= 3));
  if (stage >= 4) {
    L.push(`<div class="layer on" style="--c:var(--ok)"><div class="hd"><b style="color:var(--ok)">Resilience engine</b>${pill(stage >= 6 ? "learning logged" : stage >= 5 ? "recovering" : "adapting", "ok")}</div>` +
      `<p><b>Adapt:</b> ${act === "safe" ? "Degraded-safe mode, reduced speed and tighter permissions." : act === "iso" ? "Segment isolated, adjacent cells re-routed." : "Thresholds tightened; operator on watch."}</p>` +
      (stage >= 5 ? `<p><b>Recover:</b> ${sc.recover}</p>` : "") + (stage >= 6 ? `<p><b>Learn:</b> ${sc.learn}</p>` : "") + `</div>`);
  }
  $("#layers").innerHTML = L.join("");
}

function renderNums() {
  const u = U(), b = band(u);
  $("#U").textContent = stage >= 2 ? u.toFixed(2) : "--";
  $("#Ubar").style.width = stage >= 2 ? (u * 100) + "%" : "0";
  $("#pD").textContent = stage >= 1 ? sc.pD.toFixed(2) : "--";
  $("#pE").textContent = stage >= 2 ? sc.pE.toFixed(2) : "--";
  $("#sv").textContent = stage >= 2 ? sc.s.toFixed(2) : "--";
  $("#band").innerHTML = stage >= 2 ? `<span class="pill ${b.c}">${b.k}</span>` : "--";
}

function render() { renderLife(); renderLayers(); renderNums(); drawChart(stage >= 4); }

const needDecision = () =>
  stage === 3 && sc.cyber && !action() && $("#avail").checked && band(U()).k !== "Monitor";

function showDecision() {
  const d = $("#decide");
  if (!needDecision()) { d.hidden = true; return; }
  const b = band(U());
  d.hidden = false;
  $("#dtitle").textContent = "Confirm the response";
  $("#dtext").textContent = (persona === "op" ? "The system recommends: " : "Recommended action: ") +
    (b.k === "Safe-stop" ? sc.safe : sc.iso) + " Any step that affects safety needs your confirmation.";
  const bt = $("#dbtns");
  bt.innerHTML = "";
  const mk = (t, k, cls) => {
    const x = el("button", "btn " + cls, t);
    x.onclick = () => { choice = k; d.hidden = true; advance(); };
    bt.appendChild(x);
  };
  mk("Approve recommended", "safe", "go");
  mk("Isolate segment only", "iso", "alt");
  mk("Hold and monitor", "hold", "alt");
}

function advance() {
  if (stage >= 6) {
    setState("Cycle complete. Resilience index " + $("#ri").textContent + " against " + $("#ci").textContent + " for prevent-detect-isolate only.");
    $("#step").disabled = true;
    return;
  }
  if (needDecision()) { showDecision(); setState("Waiting for the operator."); return; }
  stage++;
  if (stage === 3 && !sc.cyber) choice = "hold";
  render();
  const msgs = ["Event reaches the plant.", "Twin and detector flag the deviation.",
    "Explanation generated for " + (persona === "op" ? "the operator" : "the analyst") + ".",
    "Choosing the response.", "Adapting the plant to the response.", "Recovering to normal operation.", "Lessons logged for next time."];
  setState(msgs[stage]);
  if (stage === 3) {
    if (!$("#avail").checked && band(U()).k === "Safe-stop") {
      setState("No operator at the station. The engine took the safe transition automatically.");
      render();
    } else if (needDecision()) {
      showDecision();
      setState("Waiting for the operator.");
      $("#step").disabled = true;
      clearTimeout(timer);
      return;
    }
  }
  $("#step").disabled = stage >= 6;
  if (auto && stage < 6) { clearTimeout(timer); timer = setTimeout(advance, 1100); }
}

function reset() {
  clearTimeout(timer);
  stage = -1; choice = null; auto = false;
  $("#decide").hidden = true;
  $("#step").disabled = true;
  setState("Idle. Choose an event and run it.");
  render();
}

$("#run").onclick = () => { reset(); auto = true; advance(); };
$("#step").onclick = () => { auto = false; advance(); };
$("#reset").onclick = reset;
["w1", "w2", "w3"].forEach((id) => ($("#" + id).oninput = () => {
  const [a, b, c] = W();
  $("#w1v").textContent = a.toFixed(2);
  $("#w2v").textContent = b.toFixed(2);
  $("#w3v").textContent = c.toFixed(2);
  render();
}));
$("#avail").onchange = render;
document.querySelectorAll("#persona button").forEach((b) => (b.onclick = () => {
  persona = b.dataset.p;
  document.querySelectorAll("#persona button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  render();
}));

const scn = $("#scn");
SC.forEach((s) => {
  const b = el("button", "", `${s.name}<small>${s.sub}</small>`);
  b.setAttribute("aria-pressed", s === sc);
  b.onclick = () => {
    sc = s;
    scn.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    reset();
  };
  scn.appendChild(b);
});
render();

/* ---------- coverage view ---------- */
(function coverage() {
  const h = $("#heat");
  let html = '<div class="c h"></div>' + STAGES.map((s) => `<div class="c h">${s}</div>`).join("");
  COV.forEach((r, i) => {
    html += `<div class="c r">${APPS[i]}</div>` + r.map((v, j) =>
      `<div class="c" tabindex="0" data-i="${i}" data-j="${j}" style="background:color-mix(in srgb,var(--info) ${v * 30}%,var(--panel2));color:${v >= 2 ? "#fff" : "var(--ink)"}">${v}</div>`).join("");
  });
  h.innerHTML = html;
  const lvl = ["not addressed", "partially addressed", "addressed with a mechanism", "addressed with a mechanism and evaluated"];
  const show = (e) => {
    const c = e.target.closest("[data-i]");
    if (!c) return;
    $("#cnote").textContent = `${APPS[+c.dataset.i]} - ${STAGES[+c.dataset.j]}: ${lvl[COV[+c.dataset.i][+c.dataset.j]]}.`;
  };
  ["mouseover", "click", "focusin"].forEach((ev) => h.addEventListener(ev, show));

  const m = stageMeans(COV, STAGES.length);
  const X = (i) => 40 + i * 74;
  let s = "";
  [0, 1, 2, 3].forEach((v) => { const y = 160 - v * 45; s += `<line x1="30" x2="555" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="6" y="${y + 3}">${v}</text>`; });
  m.forEach((v, i) => {
    const hgt = v * 45;
    s += `<rect x="${X(i)}" y="${160 - hgt}" width="52" height="${hgt}" fill="${i === 1 ? "var(--accent)" : "var(--info)"}"/><text x="${X(i) + 10}" y="${154 - hgt}">${v.toFixed(2)}</text><text x="${X(i) + 4}" y="178">${STAGES[i]}</text>`;
  });
  $("#stagechart").innerHTML = s;
})();

/* ---------- threats ---------- */
$("#thr").innerHTML = THR.map((r) => `<tr>${r.map((c, i) => `<td${i ? "" : ' style="font-weight:600"'}>${c}</td>`).join("")}</tr>`).join("");
(function consequences() {
  let h = '<div class="c h"></div>' + CONS.map((c) => `<div class="c h">${c}</div>`).join("");
  CM.forEach((r, i) => {
    h += `<div class="c r">${THR[i][0]}</div>` + r.map((v) =>
      `<div class="c" style="background:color-mix(in srgb,var(--crit) ${v * 30}%,var(--panel2));color:${v >= 2 ? "#fff" : "var(--ink)"}">${v}</div>`).join("");
  });
  const c = $("#cons");
  c.style.gridTemplateColumns = "minmax(150px,1.6fr) repeat(5,minmax(52px,1fr))";
  c.innerHTML = h;
})();

/* ---------- gaps and personas ---------- */
$("#gaps").innerHTML = GAPS.map((g) =>
  `<div class="gap" title="${g[2]}"><span>${g[0]}</span><div class="bar"><i style="width:${g[1] / 3 * 100}%"></i></div><span class="mono">${g[1].toFixed(1)}</span></div><div style="color:var(--muted);font-size:12px;margin:-4px 0 8px">${g[2]}</div>`).join("");
$("#pers").innerHTML =
  '<div class="row" style="font-size:12px;margin-bottom:6px"><span><b style="color:var(--accent)">&#9632;</b> Ravi Kumar, cobot operator</span><span><b style="color:var(--info)">&#9632;</b> Meena Bose, OT analyst</span></div>' +
  PERS.map((p) => `<div style="margin:10px 0"><div style="font-size:13px">${p[0]}</div><div class="bar"><i style="width:${p[1] / 3 * 100}%"></i></div><div class="bar"><i style="width:${p[2] / 3 * 100}%;background:var(--info)"></i></div></div>`).join("");
