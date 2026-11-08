import type { Experiment, Frame, Scene } from "../types";
const fmt = (v: number | null) =>
  v === null
    ? "Undefined"
    : Math.abs(v) < 0.00005
      ? "0"
      : Number.isInteger(v)
        ? String(v)
        : v.toFixed(4);
const frame = (
  title: string,
  caption: string,
  calculation: string,
  metrics: [string, number | string | null][],
  scene: Scene,
): Frame => ({
  title,
  caption,
  calculation,
  metrics: metrics.map(([label, value]) => ({
    label,
    value: typeof value === "string" ? value : fmt(value),
  })),
  scene,
});
const table = (
  heading: string,
  columns: string[],
  rows: string[][],
  activeRow = -1,
  context: { label: string; value: string }[] = [],
): Scene => ({
  kind: "audit",
  heading,
  columns,
  rows,
  activeRow,
  context,
  flaggedRows: [],
});
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export function supervisedTrace(scenario: string) {
  const classification = scenario.startsWith("class"),
    threshold = scenario === "class-strict" ? 0.8 : 0.5;
  const w = scenario === "reg-low" ? 1 : scenario === "reg-high" ? 3 : 2,
    b = 1;
  const samples = [1, 2, 3, 4].map((x) => ({ x, y: 2 * x + 1 }));
  return Array.from({ length: 6 }, (_, step) => {
    if (classification) {
      const x = 2,
        z = 2 * x - 3,
        p = sigmoid(z);
      return frame(
        [
          "Define a binary target",
          "Compute a linear score",
          "Convert to a probability",
          "Choose a decision threshold",
          "Compare score with threshold",
          "Separate prediction from action",
        ][step],
        [
          "The target is whether a delivery arrives late. A fitted model uses a supplied lateness feature x = 2. Its weight 2 and bias −3 are declared, not fitted in this view.",
          `z = 2×2 − 3 = ${z}. A raw linear score is not constrained to [0,1].`,
          `sigmoid(${z}) = ${fmt(p)}. This is the model’s probability estimate, not a promise about each delivery.`,
          `The operational threshold is ${threshold}. It can reflect the relative cost of missing a late delivery and raising a false alarm.`,
          p >= threshold
            ? "The model estimate meets the threshold: issue a late-delivery flag."
            : "The same probability does not meet this stricter threshold: do not issue a flag.",
          "Changing the threshold changes the action, while the input, weights, score, and estimated probability stay fixed.",
        ][step],
        step >= 2
          ? `p = 1/(1+exp(−1)) = ${fmt(p)}; flag if p ≥ ${threshold}`
          : "z = wx+b = 2×2−3 = 1",
        [
          ["Score", step >= 1 ? z : "—"],
          ["Probability", step >= 2 ? p : "—"],
          ["Action", step >= 4 ? (p >= threshold ? "Flag" : "Pass") : "—"],
        ],
        {
          kind: "decision",
          x,
          weight: 2,
          bias: -3,
          z,
          probability: p,
          threshold,
          stage:
            step === 0 ? 0 : step === 1 ? 1 : step === 2 || step === 3 ? 2 : 3,
          xLabel: "Lateness feature x",
          scoreLabel: "2x − 3",
          positiveLabel: "Flag as late",
          negativeLabel: "No late-delivery flag",
        },
      );
    }
    const count = Math.min(4, Math.max(0, step)),
      loss =
        samples.reduce((sum, p) => sum + (w * p.x + b - p.y) ** 2, 0) /
        samples.length;
    return frame(
      [
        "Define a numeric target",
        "Predict the first duration",
        "Calculate another residual",
        "Keep the same rule for each row",
        "Average every squared residual",
        "Compare the fitted line",
      ][step],
      [
        "Regression predicts a number: delivery duration in minutes. Four invented observations follow y = 2x+1, where x is the number of stops.",
        ...samples.map(
          (p) =>
            `At x = ${p.x}, prediction ${w}×${p.x}+1 = ${w * p.x + b}; residual = prediction − actual = ${w * p.x + b - p.y}.`,
        ),
        `Mean squared error is ${fmt(loss)}. This is a training-data score, not evidence about future deliveries.`,
      ][step],
      `MSE = Σ(${w}x+1−y)²/4 = ${fmt(loss)}`,
      [
        ["Slope", w],
        ["Intercept", b],
        ["MSE", step >= 4 ? loss : "—"],
      ],
      {
        kind: "plot",
        points: samples.map((p) => ({ ...p, group: "train" })),
        curve: Array.from({ length: 41 }, (_, i) => ({
          x: i / 10,
          y: (w * i) / 10 + b,
        })),
        xLabel: "Stops x",
        yLabel: "Duration (minutes)",
        xMax: 4,
        yMin: 0,
        yMax: 14,
        visibleValidation: false,
        activePoint: count ? count - 1 : -1,
        modelLabel: `ŷ = ${w}x + 1`,
      },
    );
  });
}
const supervised: Experiment = {
  id: "l09",
  title: "A number, a probability, and an action are different outputs.",
  scenarios: [
    {
      id: "reg-low",
      label: "Regression: slope 1",
      description: "Underpredict four delivery durations using ŷ = x+1.",
    },
    {
      id: "reg-fit",
      label: "Regression: slope 2",
      description: "Match the four supplied observations using ŷ = 2x+1.",
    },
    {
      id: "reg-high",
      label: "Regression: slope 3",
      description: "Overpredict the same observations using ŷ = 3x+1.",
    },
    {
      id: "class-normal",
      label: "Classification: threshold 0.5",
      description:
        "Apply a fixed logistic model to a lateness feature, then decide whether to flag.",
    },
    {
      id: "class-strict",
      label: "Classification: threshold 0.8",
      description:
        "Keep the logistic score unchanged and raise only the action threshold.",
    },
  ],
  build: supervisedTrace,
};

export function solveLinear(a: number[][], b: number[]) {
  const m = a.map((row, i) => [...row, b[i]]),
    size = b.length;
  for (let col = 0; col < size; col++) {
    let pivot = col;
    for (let i = col + 1; i < size; i++)
      if (Math.abs(m[i][col]) > Math.abs(m[pivot][col])) pivot = i;
    if (Math.abs(m[pivot][col]) < 1e-12)
      throw new RangeError("The fitting system is singular.");
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const divisor = m[col][col];
    for (let j = col; j <= size; j++) m[col][j] /= divisor;
    for (let i = 0; i < size; i++)
      if (i !== col) {
        const factor = m[i][col];
        for (let j = col; j <= size; j++) m[i][j] -= factor * m[col][j];
      }
  }
  return m.map((row) => row[size]);
}
export function fitPolynomial(
  xs: number[],
  ys: number[],
  degree: number,
  lambda = 0,
) {
  const powers = xs.map((x) =>
    Array.from({ length: degree + 1 }, (_, i) => x ** i),
  );
  const a = Array.from({ length: degree + 1 }, (_, i) =>
    Array.from(
      { length: degree + 1 },
      (_, j) =>
        powers.reduce((sum, row) => sum + row[i] * row[j], 0) / xs.length +
        (i === j && i > 0 ? lambda : 0),
    ),
  );
  return solveLinear(
    a,
    Array.from(
      { length: degree + 1 },
      (_, i) =>
        powers.reduce((sum, row, k) => sum + row[i] * ys[k], 0) / xs.length,
    ),
  );
}
export const polynomial = (coefficients: number[], x: number) =>
  coefficients.reduce((sum, c, i) => sum + c * x ** i, 0);
export function generalizationTrace(scenario: string) {
  const xs = [-1, -0.3, 0.3, 1],
    noise =
      scenario === "seed-two" ? [-0.4, 0.4, -0.4, 0.4] : [0.4, -0.4, 0.4, -0.4],
    ys = xs.map((x, i) => 2 + x + noise[i]);
  const degree = scenario === "constant" ? 0 : scenario === "linear" ? 1 : 3,
    lambda = scenario === "regularized" ? 0.1 : 0,
    coefficients = fitPolynomial(xs, ys, degree, lambda);
  const val = [-0.8, 0, 0.8],
    predict = (x: number) => polynomial(coefficients, x),
    trainMSE = xs.reduce((sum, x, i) => sum + (predict(x) - ys[i]) ** 2, 0) / 4,
    valMSE = val.reduce((sum, x) => sum + (predict(x) - (2 + x)) ** 2, 0) / 3;
  const cv = [0, 1].map((fold) => {
    const train = xs.flatMap((_, i) => (i % 2 !== fold ? [i] : [])),
      test = xs.flatMap((_, i) => (i % 2 === fold ? [i] : []));
    const c = fitPolynomial(
      train.map((i) => xs[i]),
      train.map((i) => ys[i]),
      1,
    );
    return (
      test.reduce((sum, i) => sum + (polynomial(c, xs[i]) - ys[i]) ** 2, 0) /
      test.length
    );
  });
  return Array.from({ length: 6 }, (_, step) =>
    frame(
      [
        "Keep the observations fixed",
        "Choose a hypothesis space",
        "Fit the training objective",
        "Measure training residuals",
        "Evaluate untouched validation points",
        "Use validation for model choice",
      ][step],
      [
        "Four noisy training observations come from the declared trend y = 2+x. Three separate validation observations use the trend without added noise.",
        `Degree ${degree} supplies ${degree + 1} coefficients. ${lambda ? "A penalty of 0.1 discourages large non-intercept coefficients." : "No weight penalty is used."}`,
        `Solve the polynomial least-squares system. Coefficients in increasing power order: [${coefficients.map(fmt).join(", ")}].`,
        `Training MSE = ${fmt(trainMSE)}. A cubic can interpolate these four observations even when their noise is not useful.`,
        `Validation MSE = ${fmt(valMSE)}. These points played no role in fitting the coefficients.`,
        `A separate two-fold illustration refits a line on each training fold: validation MSEs ${cv.map(fmt).join(" and ")}. Fold units here are independent synthetic observations; real groups and time boundaries must be respected.`,
      ][step],
      step === 5
        ? `2-fold estimate = (${cv.map(fmt).join(" + ")})/2 = ${fmt((cv[0] + cv[1]) / 2)}`
        : `minimize mean((f(x)−y)²) + ${lambda}×Σ(non-intercept coefficients²)`,
      [
        ["Degree", degree],
        ["Train MSE", step >= 3 ? trainMSE : "—"],
        ["Validation MSE", step >= 4 ? valMSE : "—"],
      ],
      {
        kind: "plot",
        points: [
          ...xs.map((x, i) => ({ x, y: ys[i], group: "train" as const })),
          ...val.map((x) => ({ x, y: 2 + x, group: "validation" as const })),
        ],
        curve: Array.from({ length: 101 }, (_, i) => ({
          x: -1 + i / 50,
          y: predict(-1 + i / 50),
        })),
        xLabel: "Input x",
        yLabel: "Target y",
        xMin: -1,
        xMax: 1,
        yMin: 0,
        yMax: 4,
        visibleValidation: step >= 4,
        activePoint: -1,
        modelLabel: `Degree ${degree} · λ = ${lambda}`,
      },
    ),
  );
}
const generalization: Experiment = {
  id: "l10",
  title: "A perfect training fit can miss the trend.",
  scenarios: [
    {
      id: "constant",
      label: "Underfit: constant",
      description: "Fit one constant to the four training observations.",
    },
    {
      id: "linear",
      label: "Fit a line",
      description: "Fit a degree-1 polynomial without a weight penalty.",
    },
    {
      id: "cubic",
      label: "Interpolate the noise",
      description:
        "Fit a degree-3 polynomial exactly through four training observations.",
    },
    {
      id: "regularized",
      label: "Penalize large coefficients",
      description:
        "Keep degree 3, but add a 0.1 squared-coefficient penalty; leave the intercept unpenalized.",
    },
    {
      id: "seed-two",
      label: "Reverse the fixed noise",
      description:
        "Keep the cubic and flip the fixed noise signs. This is another declared dataset, not a random animation.",
    },
  ],
  build: generalizationTrace,
};

const scored = [
  { score: 0.95, actual: true },
  { score: 0.8, actual: false },
  { score: 0.7, actual: true },
  { score: 0.6, actual: false },
  { score: 0.4, actual: true },
  { score: 0.2, actual: false },
  { score: 0.1, actual: false },
  { score: 0.05, actual: false },
];
export function confusionAt(threshold: number, examples = scored) {
  let tp = 0,
    fp = 0,
    fn = 0,
    tn = 0;
  examples.forEach(({ score, actual }) => {
    if (score >= threshold) {
      if (actual) tp++;
      else fp++;
    } else if (actual) fn++;
    else tn++;
  });
  return {
    tp,
    fp,
    fn,
    tn,
    precision: tp + fp ? tp / (tp + fp) : null,
    recall: tp + fn ? tp / (tp + fn) : null,
    f1: 2 * tp + fp + fn ? (2 * tp) / (2 * tp + fp + fn) : null,
    accuracy: examples.length ? (tp + tn) / examples.length : null,
  };
}
export function metricsTrace(scenario: string) {
  const threshold =
    scenario === "strict"
      ? 0.85
      : scenario === "lenient"
        ? 0.3
        : scenario === "none"
          ? 1.1
          : 0.5;
  const calibration = scenario === "calibration",
    counts = confusionAt(threshold);
  if (calibration) {
    const bins = [
      [0, 0.5],
      [0.5, 1.01],
    ].map(([low, high]) => {
      const rows = scored.filter((row) => row.score >= low && row.score < high);
      return {
        low,
        high,
        count: rows.length,
        mean: rows.reduce((sum, row) => sum + row.score, 0) / rows.length,
        frequency: rows.filter((row) => row.actual).length / rows.length,
      };
    });
    return Array.from({ length: 5 }, (_, step) =>
      frame(
        [
          "Keep scores and labels paired",
          "Group low-probability predictions",
          "Count outcomes in the low bin",
          "Compare the high-probability bin",
          "Interpret calibration cautiously",
        ][step],
        [
          "Calibration compares predicted probabilities with observed frequencies, not just with a classification threshold.",
          `The low bin has four records, mean score ${fmt(bins[0].mean)}.`,
          `One of the four low-bin records is positive: observed frequency ${fmt(bins[0].frequency)}.`,
          `The high bin has mean score ${fmt(bins[1].mean)}, while 2 of 4 outcomes are positive: observed frequency 0.5.`,
          "These tiny bins are noisy. Their difference diagnoses this fixture, not a population guarantee, and coarse bins can hide subgroup errors.",
        ][step],
        "bin gap = |mean predicted probability − observed positive fraction|",
        [
          ["Low mean", step >= 1 ? bins[0].mean : "—"],
          ["Low observed", step >= 2 ? bins[0].frequency : "—"],
          [
            "High gap",
            step >= 3 ? Math.abs(bins[1].mean - bins[1].frequency) : "—",
          ],
        ],
        table(
          "Calibration asks a frequency question",
          ["Probability bin", "Count", "Mean score", "Observed positive"],
          bins.map((bin, i) => [
            i ? "[0.5,1]" : "[0,0.5)",
            String(bin.count),
            step >= i + 1 ? fmt(bin.mean) : "—",
            step >= i + 2 ? fmt(bin.frequency) : "—",
          ]),
          step < 3 ? 0 : 1,
        ),
      ),
    );
  }
  return Array.from({ length: 10 }, (_, step) => {
    const processed = Math.min(step, 8),
      partial = confusionAt(threshold, scored.slice(0, processed)),
      complete = step >= 8;
    const item = processed ? scored[processed - 1] : null;
    return frame(
      step === 0
        ? "Choose an action threshold"
        : step === 9
          ? "Compare costs and threshold tradeoffs"
          : `Count record ${processed}`,
      step === 0
        ? `Use eight fixed scored examples with three positives and five negatives. Flag when score ≥ ${threshold}.`
        : step === 9
          ? `At this threshold, false alarms cost 1 each and misses cost 4 each: total cost ${counts.fp + 4 * counts.fn}. This chosen cost model need not fit another application.`
          : `Record ${processed}: score ${item!.score}, actual ${item!.actual ? "positive" : "negative"}, action ${item!.score >= threshold ? "flag" : "pass"}. Add it to exactly one confusion cell.`,
      complete
        ? `precision=TP/(TP+FP)=${fmt(counts.precision)}; recall=${fmt(counts.recall)}; F1=${fmt(counts.f1)}; accuracy=${fmt(counts.accuracy)}`
        : "Every record is TP, FP, FN, or TN; scores and labels stay fixed",
      [
        ["Precision", complete ? counts.precision : "—"],
        ["Recall", complete ? counts.recall : "—"],
        ["Cost", complete ? counts.fp + 4 * counts.fn : "—"],
      ],
      {
        kind: "confusion",
        ...partial,
        processed,
        total: 8,
        threshold,
        active: item ? { ...item, predicted: item.score >= threshold } : null,
      },
    );
  });
}
const metrics: Experiment = {
  id: "l11",
  title: "Thresholds change actions; calibration checks probabilities.",
  scenarios: [
    {
      id: "balanced",
      label: "Threshold 0.50",
      description:
        "Count all eight examples, then calculate precision, recall, F1, accuracy, and the declared cost.",
    },
    {
      id: "strict",
      label: "Threshold 0.85",
      description:
        "Flag only the highest score. Compare false alarms with missed positives.",
    },
    {
      id: "lenient",
      label: "Threshold 0.30",
      description:
        "Lower the threshold while preserving every label and probability score.",
    },
    {
      id: "none",
      label: "Predict no positives",
      description:
        "Use a threshold above every score. Precision has a zero denominator and is undefined.",
    },
    {
      id: "calibration",
      label: "Inspect probability bins",
      description:
        "Compare mean predicted probability with observed positive frequency in two fixed bins.",
    },
  ],
  build: metricsTrace,
};

export const classicalExperiments = [supervised, generalization, metrics];

const familyX = [0, 1, 2, 3, 4, 5],
  familyY = [0, 0, 1, 0, 1, 1];
export function fitStump(xs: number[], ys: number[]) {
  const candidates = [...new Set(xs)]
    .sort((a, b) => a - b)
    .slice(1)
    .map((x, i) => (x + [...new Set(xs)].sort((a, b) => a - b)[i]) / 2);
  let best = { cut: 0, left: 0, right: 0, error: Infinity };
  for (const cut of candidates) {
    const left = ys.filter((_, i) => xs[i] <= cut),
      right = ys.filter((_, i) => xs[i] > cut);
    const a = left.reduce((sum, v) => sum + v, 0) / left.length,
      b = right.reduce((sum, v) => sum + v, 0) / right.length;
    const error =
      ys.reduce((sum, y, i) => sum + (y - (xs[i] <= cut ? a : b)) ** 2, 0) /
      ys.length;
    if (error < best.error - 1e-12) best = { cut, left: a, right: b, error };
  }
  return best;
}
const stumpValue = (stump: ReturnType<typeof fitStump>, x: number) =>
  x <= stump.cut ? stump.left : stump.right;
export function boostingTrace() {
  const base = familyY.reduce((sum, y) => sum + y, 0) / familyY.length,
    predictions = familyY.map(() => base),
    states = [
      {
        predictions: [...predictions],
        cut: null as number | null,
        query: base,
        error:
          predictions.reduce((sum, p, i) => sum + (p - familyY[i]) ** 2, 0) / 6,
      },
    ];
  let query = base;
  for (let round = 0; round < 3; round++) {
    const residual = familyY.map((y, i) => y - predictions[i]),
      stump = fitStump(familyX, residual);
    predictions.forEach(
      (_, i) => (predictions[i] += 0.5 * stumpValue(stump, familyX[i])),
    );
    query += 0.5 * stumpValue(stump, 2.2);
    states.push({
      predictions: [...predictions],
      cut: stump.cut,
      query,
      error:
        predictions.reduce((sum, p, i) => sum + (p - familyY[i]) ** 2, 0) / 6,
    });
  }
  return states;
}
export function svmTrace() {
  const rows = familyX.map((x, i) => ({
    x: (x - 2.5) / 2.5,
    y: 2 * familyY[i] - 1,
  }));
  let w = 0,
    b = 0;
  const states = [];
  for (let iteration = 0; iteration <= 100; iteration++) {
    if ([0, 1, 2, 10, 50, 100].includes(iteration))
      states.push({
        iteration,
        w,
        b,
        objective:
          0.5 * w * w +
          rows.reduce(
            (sum, row) => sum + Math.max(0, 1 - row.y * (w * row.x + b)),
            0,
          ) /
            6,
      });
    let dw = w,
      db = 0;
    for (const row of rows)
      if (row.y * (w * row.x + b) < 1) {
        dw -= (row.y * row.x) / 6;
        db -= row.y / 6;
      }
    w -= 0.05 * dw;
    b -= 0.05 * db;
  }
  return states;
}
export function familyTrace(scenario: string) {
  const query = 2.2,
    k = scenario === "knn-one" ? 1 : 3;
  const neighbors = familyX
    .map((x, i) => ({ x, y: familyY[i], distance: Math.abs(x - query) }))
    .sort((a, b) => a.distance - b.distance || a.x - b.x);
  if (scenario.startsWith("knn"))
    return Array.from({ length: 5 }, (_, step) => {
      const vote =
        neighbors.slice(0, k).reduce((sum, row) => sum + row.y, 0) / k;
      const displayed =
        step >= 2
          ? neighbors
          : familyX.map((x, i) => ({
              x,
              y: familyY[i],
              distance: Math.abs(x - query),
            }));
      return frame(
        [
          "Store labeled observations",
          "Measure distance to the query",
          "Sort the neighbors",
          "Take the chosen neighborhood",
          "Aggregate its labels",
        ][step],
        [
          "The six observations have x=[0,1,2,3,4,5] and y=[0,0,1,0,1,1]. Query x=2.2 has no supplied label.",
          "Use absolute one-dimensional distance |x−2.2|. Features on different scales would need a deliberately chosen distance rule.",
          "Order by distance; break any tie by smaller x for reproducibility.",
          `Choose k=${k}. ${neighbors
            .slice(0, k)
            .map((row) => `x=${row.x}, label=${row.y}`)
            .join("; ")}.`,
          `Positive fraction is ${fmt(vote)}; choose class ${vote >= 0.5 ? 1 : 0}. This fraction is not automatically a calibrated probability.`,
        ][step],
        `vote = sum(labels of ${k} nearest records)/${k} = ${fmt(vote)}`,
        [
          ["Neighbors k", k],
          ["Query", query],
          ["Prediction", step === 4 ? (vote >= 0.5 ? "1" : "0") : "—"],
        ],
        table(
          "k-nearest neighbors: inspect distance and labels",
          ["x", "Label", "Distance", "Used"],
          displayed.map((row, i) => [
            String(row.x),
            String(row.y),
            step >= 1 ? fmt(row.distance) : "—",
            step >= 3 && i < k ? "Yes" : "No",
          ]),
          step >= 3 ? 0 : -1,
          [
            { label: "Query", value: "x=2.2" },
            {
              label: "Distance rule",
              value: "Absolute distance; smaller x breaks a tie",
            },
          ],
        ),
      );
    });
  if (scenario === "boost") {
    const states = boostingTrace();
    return states.map((state, i) =>
      frame(
        i ? "Fit the next residual correction" : "Start with the mean target",
        i
          ? `Round ${i}: fit a squared-error stump to current residuals, then add half its prediction. The new training MSE is ${fmt(state.error)}.`
          : "The initial prediction is 0.5 for every record. This is squared-loss gradient boosting on 0/1 targets, not logistic boosting.",
        `f_${i}(x) = ${i ? "f_previous(x) + 0.5 × residual_stump(x)" : "mean(y) = 0.5"}`,
        [
          ["Round", i],
          ["Query score", state.query],
          ["Train MSE", state.error],
        ],
        table(
          "Boosting corrects the current ensemble",
          ["x", "Target", "Prediction", "Residual"],
          familyX.map((x, j) => [
            String(x),
            String(familyY[j]),
            fmt(state.predictions[j]),
            fmt(familyY[j] - state.predictions[j]),
          ]),
          -1,
          [
            { label: "Query score at x=2.2", value: fmt(state.query) },
            {
              label: "New stump cut",
              value: state.cut === null ? "Not fitted" : fmt(state.cut),
            },
          ],
        ),
      ),
    );
  }
  if (scenario === "svm")
    return svmTrace().map((state) =>
      frame(
        `Soft-margin update ${state.iteration}`,
        `Fit a linear decision score with a squared-weight penalty and hinge loss. Objective ${fmt(state.objective)}. This tiny subgradient run is an inspectable approximation, not a certified optimal SVM.`,
        `objective = ½w² + mean(max(0,1−y(wx+b))); α=0.05`,
        [
          ["Update", state.iteration],
          ["Weight", state.w],
          ["Objective", state.objective],
        ],
        table(
          "A margin score is not a probability",
          ["x normalized", "Label ±1", "Signed margin", "Hinge loss"],
          familyX.map((x, i) => {
            const z = (x - 2.5) / 2.5,
              margin = (2 * familyY[i] - 1) * (state.w * z + state.b);
            return [
              fmt(z),
              String(2 * familyY[i] - 1),
              fmt(margin),
              fmt(Math.max(0, 1 - margin)),
            ];
          }),
          -1,
          [
            {
              label: "Query score",
              value: fmt(state.w * ((query - 2.5) / 2.5) + state.b),
            },
            { label: "Bias", value: fmt(state.b) },
          ],
        ),
      ),
    );
  if (scenario === "naive-bayes") {
    const feature = [query >= 2, query >= 4],
      likelihood = [0, 1].map((c) =>
        [0, 1].map((f) => {
          const group = familyX.filter((_, i) => familyY[i] === c);
          return (
            (group.filter((x) => (f === 0 ? x >= 2 : x >= 4)).length + 1) /
            (group.length + 2)
          );
        }),
      );
    const joint = likelihood.map(
        (ps) =>
          0.5 *
          ps.reduce((product, p, i) => product * (feature[i] ? p : 1 - p), 1),
      ),
      posterior = joint[1] / (joint[0] + joint[1]);
    return Array.from({ length: 5 }, (_, step) =>
      frame(
        [
          "Make two binary features",
          "Count class priors",
          "Estimate feature likelihoods",
          "Multiply conditional factors",
          "Normalize the class weights",
        ][step],
        [
          "Feature A means x≥2; B means x≥4. At query 2.2, A is true and B is false.",
          "Both classes have three examples, so each class prior is 1/2.",
          "Use Laplace smoothing: add one success and one failure per feature within each class.",
          "Naive Bayes multiplies feature likelihoods conditional on class. These derived features are dependent, so that simplifying assumption is visibly imperfect.",
          `The two unnormalized class weights both equal 0.16. Normalize to P(class 1 | A,not B)=${fmt(posterior)} under the fitted naive model.`,
        ][step],
        `class weight = P(class) × P(A|class) × P(not B|class)`,
        [
          ["Prior class 1", 0.5],
          ["Class-1 weight", step >= 3 ? joint[1] : "—"],
          ["Posterior", step >= 4 ? posterior : "—"],
        ],
        table(
          "Bernoulli naive Bayes: trace the feature counts",
          ["x", "Class", "A: x≥2", "B: x≥4"],
          familyX.map((x, i) => [
            String(x),
            String(familyY[i]),
            String(Number(x >= 2)),
            String(Number(x >= 4)),
          ]),
          -1,
          [
            {
              label: "Smoothed likelihoods: P(A), P(B)",
              value:
                step >= 2
                  ? likelihood
                      .map((ps, c) => `class ${c}: [${ps.map(fmt)}]`)
                      .join("; ")
                  : "Not estimated yet",
            },
            {
              label: "Query class weights",
              value:
                step >= 3
                  ? joint.map((p, c) => `class ${c}: ${fmt(p)}`).join("; ")
                  : "Not multiplied yet",
            },
          ],
        ),
      ),
    );
  }
  const bags =
      scenario === "forest"
        ? [
            [0, 1, 2, 3, 4, 5],
            [0, 0, 1, 2, 3, 4],
            [1, 2, 3, 4, 5, 5],
          ]
        : [[0, 1, 2, 3, 4, 5]],
    trees = bags.map((bag) =>
      fitStump(
        bag.map((i) => familyX[i]),
        bag.map((i) => familyY[i]),
      ),
    ),
    score =
      trees.reduce((sum, tree) => sum + stumpValue(tree, query), 0) /
      trees.length;
  return Array.from({ length: 5 }, (_, step) =>
    frame(
      [
        "Choose the training rows",
        "Search candidate feature cuts",
        "Fit each leaf value",
        "Route the query through a branch",
        "Aggregate the prediction",
      ][step],
      [
        scenario === "forest"
          ? "Fit three one-split trees using three explicitly supplied bootstrap samples. With one input feature there is no feature-subsampling variation."
          : "Fit one decision stump to the six original examples.",
        "Try midpoints between distinct x values. Choose the split minimizing squared error; for binary labels this gives the same split ordering as weighted Gini impurity.",
        "Each leaf returns its own sample positive fraction. Equal-error candidate cuts use the smaller cut.",
        `Query 2.2 follows each tree’s ≤ or > comparison. Leaf outputs are ${trees.map((tree) => fmt(stumpValue(tree, query))).join(", ")}.`,
        `Mean leaf output is ${fmt(score)}; at threshold 0.5 choose class ${score >= 0.5 ? 1 : 0}. Ensemble agreement alone does not establish calibration.`,
      ][step],
      "tree output = mean label in routed leaf; ensemble output = mean(tree outputs)",
      [
        ["Trees", trees.length],
        ["Query score", step >= 3 ? score : "—"],
        ["Prediction", step >= 4 ? (score >= 0.5 ? "1" : "0") : "—"],
      ],
      table(
        "Small trees: inspect each training input",
        ["x", "Target", "Branches by tree", "Mean leaf output"],
        familyX.map((x, i) => [
          String(x),
          String(familyY[i]),
          step >= 1
            ? trees.map((tree) => (x <= tree.cut ? "L" : "R")).join(" / ")
            : "—",
          step >= 2
            ? fmt(
                trees.reduce((sum, tree) => sum + stumpValue(tree, x), 0) /
                  trees.length,
              )
            : "—",
        ]),
        -1,
        [
          {
            label: "Tree cut / left value / right value",
            value:
              step >= 1
                ? trees
                    .map(
                      (tree) =>
                        `[${fmt(tree.cut)}, ${fmt(tree.left)}, ${fmt(tree.right)}]`,
                    )
                    .join("; ")
                : "Not fitted yet",
          },
          {
            label: "Bootstrap source indices (zero-based)",
            value: bags.map((bag) => `[${bag}]`).join("; "),
          },
        ],
      ),
    ),
  );
}
const families: Experiment = {
  id: "l12",
  title: "Different algorithms use the same labels differently.",
  scenarios: [
    {
      id: "knn-one",
      label: "Nearest neighbor: k=1",
      description:
        "Store six observations and classify query 2.2 using only its closest example.",
    },
    {
      id: "knn-three",
      label: "Nearest neighbors: k=3",
      description:
        "Keep the same query and include three neighbors. The local majority changes.",
    },
    {
      id: "tree",
      label: "Decision stump",
      description: "Fit one split and inspect its branch and leaf fractions.",
    },
    {
      id: "forest",
      label: "Bootstrap tree ensemble",
      description:
        "Fit three tiny trees on explicitly supplied resamples, then average their leaf fractions.",
    },
    {
      id: "boost",
      label: "Residual boosting",
      description:
        "Fit three sequential correction stumps with squared loss and shrinkage 0.5.",
    },
    {
      id: "svm",
      label: "Soft-margin linear score",
      description:
        "Trace selected iterations of a deterministic hinge-loss subgradient run.",
    },
    {
      id: "naive-bayes",
      label: "Naive Bayes",
      description:
        "Fit smoothed binary feature likelihoods, then multiply class-conditional factors.",
    },
  ],
  build: familyTrace,
};
classicalExperiments.push(families);

const cloudPoints = [
  [-3, -1],
  [-3, 0],
  [-3, 1],
  [-2, -1],
  [-2, 0],
  [-2, 1],
  [2, -1],
  [2, 0],
  [2, 1],
  [3, -1],
  [3, 0],
  [3, 1],
];
const distanceSquared = (a: number[], b: number[]) =>
  a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0);
export function kMeansRounds(
  points: number[][],
  initial: number[][],
  rounds = 2,
) {
  let centers = initial.map((c) => [...c]),
    groups = points.map(() => -2);
  const states = [
    {
      centers: centers.map((c) => [...c]),
      groups: [...groups],
      operation: "initial",
      empty: 0,
    },
  ];
  for (let round = 0; round < rounds; round++) {
    groups = points.map((p) =>
      distanceSquared(p, centers[0]) <= distanceSquared(p, centers[1]) ? 0 : 1,
    );
    states.push({
      centers: centers.map((c) => [...c]),
      groups: [...groups],
      operation: "assign",
      empty: 0,
    });
    let empty = 0;
    centers = centers.map((center, c) => {
      const members = points.filter((_, i) => groups[i] === c);
      if (!members.length) {
        empty++;
        return center;
      }
      return center.map(
        (_, axis) =>
          members.reduce((sum, p) => sum + p[axis], 0) / members.length,
      );
    });
    states.push({
      centers: centers.map((c) => [...c]),
      groups: [...groups],
      operation: "move",
      empty,
    });
  }
  return states;
}
export function densityGroups(
  points: number[][],
  epsilon = 1.1,
  minPoints = 3,
) {
  const labels = points.map(() => -2),
    neighbors = (i: number) =>
      points.flatMap((p, j) =>
        distanceSquared(points[i], p) <= epsilon ** 2 ? [j] : [],
      );
  let group = 0;
  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== -2) continue;
    const queue = neighbors(i);
    if (queue.length < minPoints) {
      labels[i] = -1;
      continue;
    }
    labels[i] = group;
    for (let head = 0; head < queue.length; head++) {
      const j = queue[head];
      if (labels[j] === -1) labels[j] = group;
      if (labels[j] !== -2) continue;
      labels[j] = group;
      const nearby = neighbors(j);
      if (nearby.length >= minPoints)
        for (const next of nearby) if (!queue.includes(next)) queue.push(next);
    }
    group++;
  }
  return labels;
}
export function structureTrace(scenario: string) {
  const pca = scenario.startsWith("pca"),
    density = scenario === "density";
  const rings = scenario === "rings",
    points = rings
      ? [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
          ...Array.from({ length: 8 }, (_, i) => [
            4 * Math.cos((i * Math.PI) / 4),
            4 * Math.sin((i * Math.PI) / 4),
          ]),
        ]
      : cloudPoints;
  if (pca) {
    const angle =
        scenario === "pca-vertical"
          ? Math.PI / 2
          : scenario === "pca-diagonal"
            ? Math.PI / 4
            : 0,
      unit = [Math.cos(angle), Math.sin(angle)],
      mean = [0, 0],
      total =
        points.reduce((sum, p) => sum + distanceSquared(p, mean), 0) /
        points.length,
      variance =
        points.reduce(
          (sum, p) => sum + (p[0] * unit[0] + p[1] * unit[1]) ** 2,
          0,
        ) / points.length;
    return Array.from({ length: 5 }, (_, step) =>
      frame(
        [
          "Center the measurements",
          "Choose a unit projection direction",
          "Project each point onto the line",
          "Measure retained variance",
          "Separate variance from task relevance",
        ][step],
        [
          "The twelve measurements have mean [0,0]. Centering removes their common offset before comparing directions.",
          `Use unit direction [${unit.map(fmt)}]. Projection is a signed dot product, not the original two-coordinate point.`,
          `For point [−3,−1], coordinate along the direction is ${fmt(-3 * unit[0] - unit[1])}. Other directions can map separated points to the same coordinate.`,
          `Projected variance ${fmt(variance)} out of total variance ${fmt(total)} retains ${fmt((variance / total) * 100)}%. The horizontal direction is the principal axis for this fixture.`,
          "PCA optimizes retained variance, not classification accuracy, causality, or semantic meaning. Discarded directions can still contain useful target information.",
        ][step],
        `projection = centered x · unit direction; retained fraction = ${fmt(variance)}/${fmt(total)}`,
        [
          ["Direction", `${Math.round((angle * 180) / Math.PI)}°`],
          ["Variance", step >= 3 ? variance : "—"],
          ["Retained", step >= 3 ? `${fmt((variance / total) * 100)}%` : "—"],
        ],
        {
          kind: "cloud",
          points: points.map((p) => ({ x: p[0], y: p[1], group: -2 })),
          centers: [],
          projection: step >= 1 ? unit : null,
          context: [
            { label: "Mean", value: "[0,0]" },
            { label: "Total variance", value: fmt(total) },
          ],
        },
      ),
    );
  }
  if (density) {
    const data = [...points, [8, 0]],
      labels = densityGroups(data);
    return Array.from({ length: 5 }, (_, step) =>
      frame(
        [
          "Add one distant observation",
          "Inspect local neighborhoods",
          "Expand density-connected groups",
          "Leave unsupported observations as noise",
          "Score novelty relative to the baseline",
        ][step],
        [
          "Keep the twelve baseline measurements and add [8,0]. The two dense groups are not declared human categories.",
          "With radius 1.1 and minimum neighborhood size 3, count the point itself. Baseline corner points have three neighbors, while [8,0] has only itself.",
          "Core points connect nearby core points. The two separated baseline regions form two density-connected groups.",
          "The distant point is not connected to either dense region and is marked noise under these chosen settings.",
          "Nearest fitted center is [2.5,0], distance 5.5. Under a separately declared distance threshold 1.5 it is also unusual. An anomaly score is evidence of rarity, not proof of fraud or an error.",
        ][step],
        "DBSCAN: expand neighborhoods from core points; anomaly score = min distance to baseline centers",
        [
          ["Radius", 1.1],
          ["Groups", step >= 2 ? 2 : "—"],
          ["Novel distance", step >= 4 ? 5.5 : "—"],
        ],
        {
          kind: "cloud",
          points: data.map((p, i) => ({
            x: p[0],
            y: p[1],
            group: step >= 2 ? labels[i] : -2,
          })),
          centers:
            step >= 4
              ? [
                  [-2.5, 0],
                  [2.5, 0],
                ]
              : [],
          projection: null,
          context: [
            { label: "Noise count", value: step >= 3 ? "1" : "Not audited" },
            { label: "Novel point", value: "[8,0]" },
          ],
        },
      ),
    );
  }
  const states = kMeansRounds(
    points,
    scenario === "same-center"
      ? [
          [-3, 0],
          [-3, 0],
        ]
      : [
          [-3, 0],
          [3, 0],
        ],
  );
  return states.map((state, step) => {
    const sse = points.reduce(
      (sum, p, i) =>
        sum +
        (state.groups[i] >= 0
          ? distanceSquared(p, state.centers[state.groups[i]])
          : 0),
      0,
    );
    return frame(
      step === 0
        ? "Choose initial centers"
        : state.operation === "assign"
          ? "Assign each point to its nearest center"
          : "Replace each center with its member mean",
      step === 0
        ? "Start paused with two supplied centers. K-means needs an initialization; it does not know the intended groups."
        : state.operation === "assign"
          ? "Compare squared distances to both centers. In a tie, choose group A. This changes membership while centers stay fixed."
          : state.empty
            ? "One group is empty. Our explicit empty-group policy retains its old center; do not divide by zero. The other center moves to its assigned mean."
            : rings
              ? "Each center moves to its group mean. The resulting nearest-center regions slice the rings; two centers cannot express an inner-ring versus outer-ring partition."
              : "Each center moves to the arithmetic mean of its assigned members. Assignment and center movement are separate operations.",
      `SSE = Σ ||point − assigned center||² = ${step ? fmt(sse) : "not assigned"}`,
      [
        ["Round", Math.ceil(step / 2)],
        ["SSE", step ? sse : "—"],
        ["Empty groups", state.empty],
      ],
      {
        kind: "cloud",
        points: points.map((p, i) => ({
          x: p[0],
          y: p[1],
          group: state.groups[i],
        })),
        centers: state.centers,
        projection: null,
        context: [
          { label: "Center A", value: `[${state.centers[0].map(fmt)}]` },
          { label: "Center B", value: `[${state.centers[1].map(fmt)}]` },
        ],
      },
    );
  });
}
const structure: Experiment = {
  id: "l13",
  title: "The geometry you optimize determines the structure you see.",
  scenarios: [
    {
      id: "kmeans",
      label: "K-means: separated starts",
      description: "Assign twelve points, move both means, then repeat once.",
    },
    {
      id: "same-center",
      label: "K-means: identical starts",
      description:
        "Expose a tie and an empty cluster; retain the empty center, then continue.",
    },
    {
      id: "rings",
      label: "K-means: nested rings",
      description:
        "Use a non-spherical arrangement. A nearest-center boundary cannot separate inner from outer rings.",
    },
    {
      id: "pca-horizontal",
      label: "PCA: horizontal direction",
      description:
        "Project the baseline points onto their direction of greatest variance.",
    },
    {
      id: "pca-diagonal",
      label: "PCA: rotate 45°",
      description:
        "Keep the points and rotate only the one-dimensional projection.",
    },
    {
      id: "pca-vertical",
      label: "PCA: vertical direction",
      description: "Measure how much variance survives along the other axis.",
    },
    {
      id: "density",
      label: "Density and anomaly",
      description:
        "Run DBSCAN on the baseline plus a distant point, then inspect a separate distance-based anomaly score.",
    },
  ],
  build: structureTrace,
};
classicalExperiments.push(structure);

export function causalCounts(intervene = false) {
  const rows = [
    { hot: false, high: false, n: 90, swim: 18 },
    { hot: false, high: true, n: 10, swim: 2 },
    { hot: true, high: false, n: 10, swim: 8 },
    { hot: true, high: true, n: 90, swim: 72 },
  ];
  return {
    rows,
    rate: intervene
      ? 0.5
      : rows.filter((row) => row.high).reduce((sum, row) => sum + row.swim, 0) /
        rows.filter((row) => row.high).reduce((sum, row) => sum + row.n, 0),
  };
}
export function conformalRadius(residuals: number[], alpha: number) {
  const rank = Math.ceil((residuals.length + 1) * (1 - alpha));
  return {
    rank,
    radius:
      rank > residuals.length
        ? Infinity
        : [...residuals].sort((a, b) => a - b)[rank - 1],
  };
}
export function shiftTrace(scenario: string) {
  const intervention = scenario === "intervention",
    coverage = scenario === "coverage" || scenario === "shift";
  if (!coverage) {
    const result = causalCounts(intervention);
    return Array.from({ length: 5 }, (_, step) =>
      frame(
        [
          "Declare a common cause",
          "Generate sales and swimming from weather",
          "Choose observation or intervention",
          "Recompute the comparison population",
          "Compare association with a causal claim",
        ][step],
        [
          "A synthetic day is hot or cool with equal probability. Weather influences both ice-cream sales and swimming.",
          "Within cool days, 10% have high sales and 20% have swimming. Within hot days, both rates are 90% and 80% respectively. Sales and swimming are conditionally independent given weather.",
          intervention
            ? "Intervene to set sales high on every day. This cuts the weather-to-sales rule but leaves weather and the swimming rule unchanged."
            : "Observe only days with high sales. This selects a group containing 90 hot days and 10 cool days.",
          intervention
            ? "After the intervention, the population still contains equal hot and cool days. Swimming frequency is 0.5×0.8+0.5×0.2=0.5."
            : "In the selected high-sales group, 72+2=74 of 100 days have swimming. Observational frequency is 0.74.",
          intervention
            ? "Under these declared causal rules, setting sales does not change swimming: both high and low interventions give 0.5. This follows from the assumed model, not from correlation alone."
            : "High sales predicts swimming in this model, but selecting high-sales days does not simulate changing sales. Weather confounds that association.",
        ][step],
        intervention
          ? "P(swim | do(high sales)) = Σ_weather P(weather)P(swim | weather) = 0.5"
          : "P(swim | high sales) = (72+2)/(90+10) = 0.74",
        [
          ["Hot-day prior", "50%"],
          ["Swimming", step >= 3 ? `${result.rate * 100}%` : "—"],
          ["Operation", intervention ? "Set" : "Observe"],
        ],
        {
          kind: "causal",
          intervention,
          stage: step,
          rate: result.rate,
          rows: result.rows,
        },
      ),
    );
  }
  const residuals = [0.1, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.6, 0.8],
    calibration = conformalRadius(residuals, 0.2),
    errors = [-0.5, -0.2, 0, 0.3, 0.5].map(
      (error) => error + (scenario === "shift" ? 1 : 0),
    ),
    covered = errors.filter(
      (error) => Math.abs(error) <= calibration.radius,
    ).length;
  return Array.from({ length: 5 }, (_, step) =>
    frame(
      [
        "Freeze a predictor",
        "Calibrate on held-out residuals",
        "Choose the finite-sample quantile",
        "Evaluate a separate set of outcomes",
        "Check the assumptions behind coverage",
      ][step],
      [
        "The supplied predictor is f(x)=2x. It is frozen before calibration. Absolute calibration residuals are [0.1,0.2,0.25,0.3,0.4,0.45,0.5,0.6,0.8].",
        "Choose target miscoverage α=0.2. Calibration rows determine an interval radius; they do not refit the predictor.",
        `With n=9, use rank ceil((n+1)(1−α))=8. The eighth sorted residual is 0.6, giving intervals f(x)±0.6.`,
        `${covered} of 5 evaluation targets lie inside those intervals. ${scenario === "shift" ? "Add 1 to every evaluation residual to create a declared distribution shift." : "This fixed evaluation fixture has all five errors within the radius."}`,
        "Split-conformal coverage is a marginal repeated-sampling statement under suitable exchangeability. A fixed five-point result is not a proof of that theorem or a guarantee for each subgroup. Distribution shift can invalidate the assumptions.",
      ][step],
      `radius = sorted_calibration_errors[rank 8] = 0.6; observed coverage = ${covered}/5`,
      [
        ["Rank", step >= 2 ? calibration.rank : "—"],
        ["Radius", step >= 2 ? calibration.radius : "—"],
        ["Covered", step >= 3 ? `${covered}/5` : "—"],
      ],
      table(
        "Fixed intervals meet a changed evaluation distribution",
        ["x → prediction", "Actual", "Interval", "Covered"],
        errors.map((error, i) => {
          const prediction = 2 * (i + 1);
          return [
            `${i + 1} → ${prediction}`,
            step >= 3 ? fmt(prediction + error) : "—",
            step >= 2
              ? `[${fmt(prediction - 0.6)}, ${fmt(prediction + 0.6)}]`
              : "—",
            step >= 3 ? (Math.abs(error) <= 0.6 ? "Yes" : "No") : "—",
          ];
        }),
        -1,
        [
          {
            label: "Calibration",
            value: "Nine held-out absolute residuals; predictor frozen",
          },
          {
            label: "Evaluation shift",
            value:
              scenario === "shift"
                ? "+1 to each target residual"
                : "No added shift",
          },
        ],
      ),
    ),
  );
}
const shifts: Experiment = {
  id: "l14",
  title:
    "Observing, intervening, and predicting require different assumptions.",
  scenarios: [
    {
      id: "observational",
      label: "Observe high sales",
      description:
        "Filter a population in which weather is a common cause of sales and swimming.",
    },
    {
      id: "intervention",
      label: "Set sales high",
      description:
        "Cut the weather-to-sales mechanism while preserving the weather and swimming rules.",
    },
    {
      id: "coverage",
      label: "Calibrated interval fixture",
      description:
        "Use a held-out finite-sample residual quantile, then evaluate five fixed targets.",
    },
    {
      id: "shift",
      label: "Shift evaluation targets",
      description:
        "Keep predictor and radius frozen, but increase each evaluation residual by 1.",
    },
  ],
  build: shiftTrace,
};
classicalExperiments.push(shifts);
