import { test } from "node:test";
import assert from "node:assert/strict";
import { SC, STAGES, COV, APPS, CM, THR, CONS, GAPS, PERS } from "../js/data.js";
import { normaliseWeights, urgency, band, chosenAction, curve, mean, stageMeans } from "../js/model.js";

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test("weights are normalised to sum to 1", () => {
  const w = normaliseWeights(40, 30, 30);
  near(w[0] + w[1] + w[2], 1);
  near(w[0], 0.4);
  near(normaliseWeights(2, 2, 6).reduce((x, y) => x + y, 0), 1);
});

test("all-zero weights do not divide by zero", () => {
  assert.deepEqual(normaliseWeights(0, 0, 0), [0, 0, 0]);
});

test("urgency follows U = w1*pD + w2*(1-pE) + w3*s", () => {
  const fdi = SC.find((s) => s.id === "fdi");
  near(urgency(fdi, [0.4, 0.3, 0.3]), 0.4 * 0.78 + 0.3 * 0.45 + 0.3 * 0.9);
});

test("urgency stays within [0, 1] for every scenario at default weights", () => {
  for (const sc of SC) {
    const u = urgency(sc, [0.4, 0.3, 0.3]);
    assert.ok(u >= 0 && u <= 1, `${sc.id}: ${u}`);
  }
});

test("band thresholds", () => {
  assert.equal(band(0.65).k, "Safe-stop");
  assert.equal(band(0.649).k, "Isolate");
  assert.equal(band(0.45).k, "Isolate");
  assert.equal(band(0.449).k, "Monitor");
  assert.equal(band(0).k, "Monitor");
});

test("operator choice wins; no operator + Safe-stop forces safe transition", () => {
  assert.equal(chosenAction({ choice: "iso", operatorAvailable: false, bandKey: "Safe-stop" }), "iso");
  assert.equal(chosenAction({ choice: null, operatorAvailable: false, bandKey: "Safe-stop" }), "safe");
  assert.equal(chosenAction({ choice: null, operatorAvailable: false, bandKey: "Isolate" }), null);
  assert.equal(chosenAction({ choice: null, operatorAvailable: true, bandKey: "Safe-stop" }), null);
});

test("curves have 41 points in [0, 1] and start at full output", () => {
  for (const sc of SC) {
    for (const action of ["safe", "iso", "hold", null]) {
      const { res, conv } = curve(sc, { bandKey: "Isolate", action });
      assert.equal(res.length, 41);
      assert.equal(conv.length, 41);
      assert.equal(res[0], 1);
      assert.equal(conv[0], 1);
      for (const v of [...res, ...conv]) assert.ok(v >= 0 && v <= 1, `${sc.id}/${action}: ${v}`);
    }
  }
});

test("a resilient response beats prevent-detect-isolate for every cyber event", () => {
  for (const sc of SC.filter((s) => s.cyber)) {
    for (const action of ["safe", "iso"]) {
      const { res, conv } = curve(sc, { bandKey: "Safe-stop", action });
      assert.ok(mean(res) > mean(conv), `${sc.id}/${action}`);
    }
  }
});

test("a benign fault never drops plant output below 0.85", () => {
  const fault = SC.find((s) => !s.cyber);
  const { res } = curve(fault, { bandKey: "Monitor", action: "hold" });
  assert.ok(Math.min(...res) >= 0.85);
});

test("scenario data is complete and probabilities are valid", () => {
  const fields = ["id", "name", "sub", "twin", "op", "an", "prevent", "safe", "iso", "recover", "learn"];
  const ids = new Set();
  for (const sc of SC) {
    for (const f of fields) assert.ok(typeof sc[f] === "string" && sc[f].length > 0, `${sc.id}.${f}`);
    for (const f of ["pD", "pE", "s"]) assert.ok(sc[f] >= 0 && sc[f] <= 1, `${sc.id}.${f}`);
    assert.equal(typeof sc.cyber, "boolean");
    assert.ok(!ids.has(sc.id), `duplicate id ${sc.id}`);
    ids.add(sc.id);
  }
  assert.equal(SC.filter((s) => !s.cyber).length, 1, "exactly one benign control scenario");
});

test("coverage matrix is APPS x STAGES with scores 0-3", () => {
  assert.equal(COV.length, APPS.length);
  for (const row of COV) {
    assert.equal(row.length, STAGES.length);
    for (const v of row) assert.ok(Number.isInteger(v) && v >= 0 && v <= 3);
  }
});

test("detection is the best-covered lifecycle stage", () => {
  const m = stageMeans(COV, STAGES.length);
  const max = Math.max(...m);
  assert.equal(m.indexOf(max), STAGES.indexOf("Detect"));
});

test("consequence matrix matches the threat table", () => {
  assert.equal(CM.length, THR.length);
  for (const row of CM) {
    assert.equal(row.length, CONS.length);
    for (const v of row) assert.ok(v >= 0 && v <= 3);
  }
  for (const t of THR) assert.equal(t.length, 4);
});

test("gap and persona scores are within 0-3", () => {
  for (const g of GAPS) assert.ok(g[1] >= 0 && g[1] <= 3);
  for (const p of PERS) for (const v of p.slice(1)) assert.ok(v >= 0 && v <= 3);
});
