// Pure model functions: no DOM access, so they can be unit-tested in Node.

/** Normalise three raw slider values so they sum to 1. Falls back to 1 if all are 0. */
export function normaliseWeights(a, b, c) {
  const t = a + b + c || 1;
  return [a / t, b / t, c / t];
}

/** Response urgency U = w1*pD + w2*(1-pE) + w3*s */
export function urgency(sc, [w1, w2, w3]) {
  return w1 * sc.pD + w2 * (1 - sc.pE) + w3 * sc.s;
}

/** Map urgency to a response band. */
export function band(u) {
  return u >= 0.65 ? { k: "Safe-stop", c: "crit" }
       : u >= 0.45 ? { k: "Isolate", c: "warn" }
       : { k: "Monitor", c: "ok" };
}

/**
 * The action the plant actually takes.
 * An explicit operator choice wins. With no operator at the station,
 * a Safe-stop band triggers the safe transition automatically.
 */
export function chosenAction({ choice, operatorAvailable, bandKey }) {
  if (choice) return choice;
  if (!operatorAvailable && bandKey === "Safe-stop") return "safe";
  return null;
}

export const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

/**
 * Illustrative plant-output curves over t = 0..20 (step 0.5).
 * Returns { res, conv }: the resilient response and the
 * prevent-detect-isolate baseline. Values are in [0, 1].
 */
export function curve(sc, { bandKey, action }) {
  const s = sc.s, res = [], conv = [];
  const floor = sc.cyber ? 0.15 : 0.7;
  for (let t = 0; t <= 20; t += 0.5) {
    conv.push(t < 3 ? 1 : t < 14 ? floor : Math.min(1, floor + (t - 14) * 0.14));
    let v = 1;
    if (t >= 3) {
      if (!sc.cyber) {
        v = t < 5 ? 1 - 0.1 * (t - 3) / 2 : Math.min(1, 0.9 + (t - 5) * 0.02);
      } else if (action === "safe") {
        const dip = 1 - (0.3 + 0.4 * s);
        v = t < 5 ? 1 - (1 - dip) * (t - 3) / 2 : Math.min(0.97, dip + (t - 5) * (0.16 - 0.06 * s));
      } else if (action === "iso") {
        const dip = 1 - (0.25 + 0.35 * s);
        v = t < 5 ? 1 - (1 - dip) * (t - 3) / 2 : Math.min(0.95, dip + (t - 5) * 0.1);
      } else if (action === "hold" || action === null) {
        if (bandKey === "Monitor") v = 0.92;
        else v = t < 6 ? 1 - 0.9 * (t - 3) / 3 : Math.min(0.9, 0.1 + (t - 12) * 0.08 * (t > 12));
      }
    }
    res.push(v);
  }
  return { res, conv };
}

/** Mean coverage per lifecycle stage across a COV matrix (rows = approaches). */
export function stageMeans(cov, nStages) {
  return Array.from({ length: nStages }, (_, j) => mean(cov.map((r) => r[j])));
}
