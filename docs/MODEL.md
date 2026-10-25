# Model notes

Everything here is implemented in [`js/model.js`](../js/model.js). The values are illustrative and are not measurements of a real plant.

## Response urgency

```
U = w1 * pD + w2 * (1 - pE) + w3 * s
```

| Symbol | Meaning | Default weight |
|---|---|---|
| `pD` | Detection confidence from the twin and anomaly detector | `w1 = 0.40` |
| `1 - pE` | How unexplained the event is (low explanation confidence raises urgency) | `w2 = 0.30` |
| `s` | Severity of the physical consequence | `w3 = 0.30` |

Weights are set with sliders and normalised so they always sum to 1. If all three are zero, the weights are all zero rather than dividing by zero.

Bands: `U >= 0.65` Safe-stop, `0.45 <= U < 0.65` Isolate, otherwise Monitor.

## Who acts

- If the operator makes a choice (approve, isolate only, or hold), that choice is what the plant does.
- If **no operator is at the station** and the band is Safe-stop, the engine takes the safe transition automatically.
- In any other case with no choice, the plant is held and monitored.
- The decision prompt only appears for cyber events in the Isolate or Safe-stop bands. The benign bearing fault is always held and monitored.

## Plant-output curves

The right-hand chart plots normalised plant output over 20 time units, with the event at `t = 3`.

- **Prevent-detect-isolate (baseline):** output collapses to 0.15 (0.7 for a benign fault) and only starts climbing at `t = 14`.
- **Resilient response:** the dip depth depends on the action and on severity `s`.
  - *Safe-stop:* dip to `1 - (0.3 + 0.4 s)`, then recover at `0.16 - 0.06 s` per unit, capped at 0.97.
  - *Isolate:* dip to `1 - (0.25 + 0.35 s)`, then recover at 0.1 per unit, capped at 0.95.
  - *Hold at Monitor band:* a flat 0.92.
  - *Hold at a higher band:* the attack is allowed to bite, so output falls to about 0.1 and recovers late. This is how the model shows the cost of ignoring a recommendation.

The **resilience index** is the mean of each curve. It is a way to compare the two responses on the same scale, not a standard metric.

## Coverage scores

Scores in the Coverage view are the authors' qualitative reading of each source: 0 not addressed, 1 partial, 2 mechanism, 3 mechanism and evaluation.
