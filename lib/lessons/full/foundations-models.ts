import type { Experiment, Frame, Scene } from "../types";
const n = (value: number) =>
  !Number.isFinite(value)
    ? "∞"
    : Math.abs(value) < 0.00005
      ? "0"
      : Number.isInteger(value)
        ? String(value)
        : value.toFixed(4);
const entry = (
  title: string,
  caption: string,
  calculation: string,
  values: [string, string | number][],
  scene: Scene,
): Frame => ({
  title,
  caption,
  calculation,
  metrics: values.map(([label, value]) => ({
    label,
    value: typeof value === "number" ? n(value) : value,
  })),
  scene,
});
const audit = (
  heading: string,
  columns: string[],
  rows: string[][],
  activeRow = -1,
  context: { label: string; value: string }[] = [],
  flaggedRows: number[] = [],
): Scene => ({
  kind: "audit",
  heading,
  columns,
  rows,
  activeRow,
  context,
  flaggedRows,
});

export function taxonomyTrace(scenario: string) {
  const learned = scenario !== "rules" && scenario !== "search";
  const deep = scenario === "deep" || scenario === "generator";
  const generative = scenario === "generator";
  const ai = scenario !== "rules";
  const score =
    scenario === "classifier"
      ? 1 / (1 + Math.exp(-(2 * 2 - 3)))
      : scenario === "deep"
        ? Math.max(0, 0.5 * 2 - 1 + 0.5)
        : null;
  const system =
    scenario === "rules"
      ? "A fixed cart calculator"
      : scenario === "search"
        ? "A chess move searcher"
        : scenario === "classifier"
          ? "A trained linear spam classifier"
          : scenario === "deep"
            ? "A multilayer fraud classifier"
            : "A neural next-token sampler";
  const outcome =
    scenario === "rules"
      ? "2 apples × $2 + 1 loaf × $3 = $7"
      : scenario === "search"
        ? "Minimax chooses move A: min(3, 5) = 3 beats min(1, 9) = 1"
        : scenario === "classifier"
          ? `sigmoid(2 × 2 − 3) = ${n(score!)}; flag at threshold 0.5`
          : scenario === "deep"
            ? `h₁ = ReLU(0.5×2 − 1 + 0.5) = 0.5; h₂ = ReLU(2×0.5 − 0.2) = 0.8; p = sigmoid(2×0.8 − 1) = ${n(1 / (1 + Math.exp(-0.6)))}`
            : "A supplied random draw 0.7 selects “blue” from red:0.6, blue:0.4";
  const properties = [ai, learned, deep, generative];
  return properties.map((_, stage) =>
    entry(
      [
        "Ask what the system does",
        "Check how its rule was obtained",
        "Inspect the architecture",
        "Check the output task",
      ][stage],
      [
        `${system}. ${outcome}. The task and mechanism determine which categories apply.`,
        learned
          ? "Its parameters came from examples. That makes it machine learning; it need not update its weights during use."
          : "This example uses a supplied rule or search procedure, without fitting parameters from examples. AI can include search without ML.",
        deep
          ? "The declared architecture has multiple learned neural layers. The little arithmetic is illustrative, not a claim that one displayed unit forms a deep network."
          : "The system is not a multilayer neural model. Being ML does not automatically make it deep learning.",
        generative
          ? "This model samples a continuation. Its generative task overlaps with ML and deep learning."
          : "It calculates, searches, or predicts a score rather than sampling new content. A deep classifier need not be generative.",
      ][stage],
      outcome,
      [
        ["Learned", learned ? "Yes" : "No"],
        ["Deep", stage >= 2 ? (deep ? "Yes" : "No") : "—"],
        ["Generative", stage >= 3 ? (generative ? "Yes" : "No") : "—"],
      ],
      audit(
        system,
        ["Category", "Evidence", "Applies?"],
        [
          [
            "AI",
            scenario === "rules"
              ? "Explicit arithmetic only"
              : "Search, prediction, or generation",
            ai ? "Yes" : "No",
          ],
          [
            "Machine learning",
            learned ? "Parameters fitted from data" : "No learned parameters",
            stage >= 1 ? (learned ? "Yes" : "No") : "—",
          ],
          [
            "Deep learning",
            deep
              ? "Multiple learned neural layers"
              : "Not a deep neural architecture",
            stage >= 2 ? (deep ? "Yes" : "No") : "—",
          ],
          [
            "Generative",
            generative
              ? "Samples a continuation"
              : "Returns an action, value, or class",
            stage >= 3 ? (generative ? "Yes" : "No") : "—",
          ],
        ],
        stage,
        [{ label: "Concrete operation", value: outcome }],
      ),
    ),
  );
}
const taxonomy: Experiment = {
  id: "l01",
  title: "Separate the task, learning method, and architecture.",
  scenarios: [
    {
      id: "rules",
      label: "Calculator",
      description: "Apply a fixed pricing rule. No learning is required.",
    },
    {
      id: "search",
      label: "Chess search",
      description:
        "Choose a move by a tiny minimax tree, without training a model.",
    },
    {
      id: "classifier",
      label: "Linear classifier",
      description: "Use weights learned from examples to produce a spam score.",
    },
    {
      id: "deep",
      label: "Deep classifier",
      description:
        "A declared multilayer neural classifier predicts a score, without generating content.",
    },
    {
      id: "generator",
      label: "Neural generator",
      description:
        "Sample a next-token outcome from a declared neural model’s distribution.",
    },
  ],
  build: taxonomyTrace,
};

export function lifecycleTrace(scenario: string) {
  const target = scenario === "retrain" ? 6 : 4,
    query = scenario === "new-input" ? 5 : 3;
  const weights = [1];
  for (let i = 0; i < 2; i++)
    weights.push(weights.at(-1)! - 0.1 * ((2 * weights.at(-1)! - target) * 2));
  const locked = weights[2];
  return Array.from({ length: 7 }, (_, stage) => {
    const w = weights[Math.min(stage, 2)],
      prediction = locked * query;
    const captions = [
      "Declare total = w × quantity. Keep one training receipt, a separate validation receipt, and a final test receipt. All follow the supplied toy price.",
      `Training uses x = 2, y = ${target}. The first gradient update changes w from 1 to ${n(weights[1])}.`,
      `A second training update reaches w = ${n(locked)}. The learning rate 0.1 was configured, not learned.`,
      `Validation uses x = 1, target ${target / 2}. Its prediction is ${n(locked)}. This result can guide later choices, but does not itself update w.`,
      `Freeze a checkpoint with w = ${n(locked)}. Inference reads this value. Saving the architecture alone would not preserve the learned state.`,
      `With choices locked, the held-out test receipt x = 3 has target ${target * 1.5}. Predict ${n(locked * 3)}. One tiny test cannot establish real performance.`,
      `Inference on quantity ${query} returns ${n(prediction)}, while checkpoint w stays ${n(locked)}. A changed input is not retraining.`,
    ];
    return entry(
      [
        "Assign data roles",
        "Train: update 1",
        "Train: update 2",
        "Validate the choice",
        "Save the checkpoint",
        "Evaluate the locked model",
        "Run inference",
      ][stage],
      captions[stage],
      stage === 1 || stage === 2
        ? `w′ = ${n(weights[stage - 1])} − 0.1 × (${n(2 * weights[stage - 1])} − ${target}) × 2 = ${n(w)}`
        : stage === 6
          ? `prediction = ${n(locked)} × ${query} = ${n(prediction)}; weights unchanged`
          : "fit → validate → lock → test → use",
      [
        ["Weight", stage >= 4 ? locked : w],
        ["Frozen", stage >= 4 ? "Yes" : "No"],
        ["Inference", stage === 6 ? prediction : "—"],
      ],
      audit(
        "One model state moves from training to inference",
        ["Role", "Quantity", "Target", "Prediction"],
        [
          ["Training", "2", String(target), n(2 * w)],
          ["Validation", "1", n(target / 2), stage >= 3 ? n(locked) : "—"],
          ["Test", "3", n(target * 1.5), stage >= 5 ? n(3 * locked) : "—"],
          [
            "New input",
            String(query),
            "Unknown",
            stage === 6 ? n(prediction) : "—",
          ],
        ],
        stage < 3
          ? 0
          : stage === 3
            ? 1
            : stage === 5
              ? 2
              : stage === 6
                ? 3
                : -1,
        [
          { label: "Architecture", value: "total = w × quantity; no bias" },
          { label: "Hyperparameter", value: "learning rate α = 0.1" },
          {
            label: "Checkpoint",
            value: stage >= 4 ? `w = ${n(locked)}; frozen` : "Not frozen",
          },
        ],
      ),
    );
  });
}
const lifecycle: Experiment = {
  id: "l02",
  title: "Train a weight, then use the frozen checkpoint.",
  scenarios: [
    {
      id: "default",
      label: "Train, then infer",
      description: "Train on 2 items costing $4, then predict for 3 items.",
    },
    {
      id: "new-input",
      label: "Change inference input",
      description:
        "Use 5 items at inference. The saved weight must stay unchanged.",
    },
    {
      id: "retrain",
      label: "Change training target",
      description:
        "Train on a $6 receipt instead. This changes the saved parameter.",
    },
  ],
  build: lifecycleTrace,
};

export const tensorOffset = (shape: number[], indices: number[]) => {
  if (
    shape.length !== indices.length ||
    shape.some(
      (dimension, i) =>
        !Number.isInteger(dimension) ||
        dimension <= 0 ||
        !Number.isInteger(indices[i]) ||
        indices[i] < 0 ||
        indices[i] >= dimension,
    )
  )
    throw new RangeError("Every tensor index must lie inside its axis.");
  return indices.reduce(
    (offset, coordinate, i) => offset * shape[i] + coordinate,
    0,
  );
};
export function tensorTrace(scenario: string) {
  const shape = [4, 6, scenario === "narrow" ? 4 : 8],
    selected = [2, 4, scenario === "narrow" ? 3 : 6];
  const a =
    scenario === "narrow"
      ? [
          [1, 2],
          [4, 5],
        ]
      : [
          [1, 2, 3],
          [4, 5, 6],
        ];
  const b =
    scenario === "narrow" || scenario === "mismatch"
      ? [
          [1, 0, 2, 1],
          [0, 1, 1, 2],
        ]
      : [
          [1, 0, 2, 1],
          [0, 1, 1, 2],
          [1, 1, 0, 1],
        ];
  const compatible = a[0].length === b.length,
    output = compatible
      ? a.map((row) =>
          b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)),
        )
      : null;
  const offset = tensorOffset(shape, selected),
    count = shape.reduce((x, y) => x * y, 1);
  return Array.from({ length: 7 }, (_, stage) =>
    entry(
      [
        "Name the tensor axes",
        "Count batch–token slots",
        "Count every scalar",
        "Inspect one coordinate",
        "Check matrix dimensions",
        "Compute one output",
        "Assemble the output matrix",
      ][stage],
      [
        `A tensor with shape [${shape}] has 3 axes: batch, token position, and feature. Its rank is 3; its feature width is ${shape[2]}.`,
        `${shape[0]} batches × ${shape[1]} token positions = ${shape[0] * shape[1]} slots before counting features.`,
        `Multiply all axis sizes: ${shape.join(" × ")} = ${count} scalar values. Rank 3 does not mean only 3 values.`,
        `At index [${selected}], row-major offset is ${offset}. We filled this teaching tensor with its own offsets, so the selected value is ${offset}.`,
        compatible
          ? `A has shape [2,${a[0].length}], B has shape [${b.length},4]. Their inner sizes match, so the output shape is [2,4].`
          : `A’s inner size ${a[0].length} does not match B’s row count ${b.length}. This multiplication is undefined; do not truncate or invent a coordinate.`,
        compatible
          ? `Output [0,0] is a row–column dot product: ${a[0].map((v, i) => `${v}×${b[i][0]}`).join(" + ")} = ${output![0][0]}.`
          : "The shape check failed. No dot products are computed.",
        compatible
          ? `Compute every output cell using the same matching-coordinate rule. The result contains ${output!.length * output![0].length} numbers.`
          : "The shape error remains visible. A different operation or a correctly shaped input is needed.",
      ][stage],
      stage === 3
        ? `offset = ((${selected[0]} × ${shape[1]}) + ${selected[1]}) × ${shape[2]} + ${selected[2]} = ${offset}`
        : stage >= 4
          ? `[2,${a[0].length}] @ [${b.length},4] ${compatible ? "→ [2,4]" : "→ incompatible"}`
          : `values = ${shape.join(" × ")} = ${count}`,
      [
        ["Rank", 3],
        ["Values", stage >= 2 ? count : "—"],
        ["Product", stage >= 4 ? (compatible ? "2 × 4" : "Invalid") : "—"],
      ],
      { kind: "tensor", shape, selected, stage, offset, a, b, output },
    ),
  );
}
const tensors: Experiment = {
  id: "l03",
  title: "Keep axis meanings separate from axis sizes.",
  scenarios: [
    {
      id: "default",
      label: "Shape [4, 6, 8]",
      description:
        "Four sequences, six token positions, eight features per token. Inspect batch 2.",
    },
    {
      id: "narrow",
      label: "Fewer features",
      description:
        "Reduce feature width to 4. Count the new tensor and multiply a compatible pair.",
    },
    {
      id: "mismatch",
      label: "Incompatible matrices",
      description:
        "Keep the tensor, but supply a 2-row right matrix to a 3-column left matrix.",
    },
  ],
  build: tensorTrace,
};

export function derivativeTrace(scenario: string) {
  const w = scenario === "near" ? 2 : 0,
    epsilon = scenario === "large" ? 1 : 0.1;
  const loss = (x: number) => (x - 3) ** 2;
  const exact = 2 * (w - 3),
    forward = (loss(w + epsilon) - loss(w)) / epsilon,
    central = (loss(w + epsilon) - loss(w - epsilon)) / (2 * epsilon),
    next = w - 0.1 * exact;
  const curve = Array.from({ length: 101 }, (_, i) => ({
    x: -1 + i / 20,
    y: loss(-1 + i / 20),
  }));
  const tangent = curve
    .map(({ x }) => ({ x, y: loss(w) + exact * (x - w) }))
    .filter((p) => p.y >= 0 && p.y <= 18);
  return Array.from({ length: 7 }, (_, stage) =>
    entry(
      [
        "Evaluate the current function",
        "Nudge the parameter",
        "Estimate the forward slope",
        "Look on both sides",
        "Estimate the central slope",
        "Apply the chain rule",
        "Take a local downhill step",
      ][stage],
      [
        `At w = ${w}, L(w) = (w − 3)² = ${loss(w)}. The loss is a height; a derivative is a local rate of change.`,
        `Increase w by ${epsilon}. The loss becomes ${n(loss(w + epsilon))}, a change of ${n(loss(w + epsilon) - loss(w))}.`,
        `Divide loss change by parameter change: forward difference ${n(forward)}. This is an approximation over a finite interval.`,
        `At w − ε = ${n(w - epsilon)}, the loss is ${n(loss(w - epsilon))}. A central difference compares two sides of the same point.`,
        `Central difference ${n(central)} equals the exact derivative ${exact} for this quadratic. That exact equality is not a general property of finite differences.`,
        `Let u = w − 3. Then dL/du = 2u = ${exact}, du/dw = 1, so dL/dw = ${exact} × 1 = ${exact}.`,
        `Subtract α × gradient: ${w} − 0.1 × (${exact}) = ${n(next)}. Loss changes from ${loss(w)} to ${n(loss(next))}. A sufficiently large step could instead increase it.`,
      ][stage],
      stage === 2
        ? `(${n(loss(w + epsilon))} − ${loss(w)}) / ${epsilon} = ${n(forward)}`
        : stage === 4
          ? `(${n(loss(w + epsilon))} − ${n(loss(w - epsilon))}) / ${2 * epsilon} = ${n(central)}`
          : stage === 6
            ? `w′ = ${w} − 0.1 × (${exact}) = ${n(next)}`
            : `dL/dw = 2(w − 3) = ${exact}`,
      [
        ["Exact slope", stage >= 5 ? exact : "—"],
        ["Forward", stage >= 2 ? forward : "—"],
        ["Central", stage >= 4 ? central : "—"],
      ],
      {
        kind: "plot",
        points: [
          { x: w, y: loss(w), group: "train" },
          ...(stage >= 1 && stage < 6
            ? [
                {
                  x: w + epsilon,
                  y: loss(w + epsilon),
                  group: "train" as const,
                },
              ]
            : []),
          ...(stage >= 3 && stage < 6
            ? [
                {
                  x: w - epsilon,
                  y: loss(w - epsilon),
                  group: "train" as const,
                },
              ]
            : []),
          ...(stage === 6
            ? [{ x: next, y: loss(next), group: "train" as const }]
            : []),
        ],
        curve,
        reference: tangent,
        referenceLabel: "Local tangent",
        pointsLabel: "Parameter states",
        xLabel: "Parameter w",
        yLabel: "Loss",
        xMin: -1,
        xMax: 4,
        yMin: 0,
        yMax: 18,
        visibleValidation: false,
        activePoint:
          stage === 6 || stage === 1 || stage === 2
            ? 1
            : stage === 3 || stage === 4
              ? 2
              : 0,
        modelLabel: "L(w) = (w − 3)²",
      },
    ),
  );
}
const derivatives: Experiment = {
  id: "l04",
  title: "Compare a slope estimate with the exact derivative.",
  scenarios: [
    {
      id: "default",
      label: "w = 0, ε = 0.1",
      description:
        "Use a small finite difference at the start of the quadratic.",
    },
    {
      id: "near",
      label: "w = 2, ε = 0.1",
      description:
        "Move nearer the minimum. The exact slope changes from −6 to −2.",
    },
    {
      id: "large",
      label: "Larger difference",
      description:
        "Use ε = 1. The forward estimate is less local; the derivative rule is unchanged.",
    },
  ],
  build: derivativeTrace,
};

export function bayesCounts(
  prevalence: number,
  sensitivity: number,
  falsePositiveRate: number,
  population = 10000,
) {
  const positive = population * prevalence,
    negative = population - positive;
  const tp = positive * sensitivity,
    fp = negative * falsePositiveRate;
  return {
    positive,
    negative,
    tp,
    fp,
    fn: positive - tp,
    tn: negative - fp,
    posterior: tp + fp ? tp / (tp + fp) : null,
  };
}
export function bayesTrace(scenario: string) {
  const prevalence = scenario === "common" ? 0.1 : 0.01,
    falsePositiveRate = scenario === "specific" ? 0.01 : 0.05;
  const counts = bayesCounts(prevalence, 0.9, falsePositiveRate);
  return Array.from({ length: 6 }, (_, stage) =>
    entry(
      [
        "Count the original population",
        "Flag compromised accounts",
        "Count false alarms",
        "Condition on the flag",
        "Calculate the posterior",
        "Compare the reverse condition",
      ][stage],
      [
        `Among 10,000 invented accounts, ${counts.positive} are compromised and ${counts.negative} are ordinary. This supplies the prior.`,
        `The detector flags 90% of compromised accounts: ${counts.positive} × 0.9 = ${counts.tp}.`,
        `It also flags ${falsePositiveRate * 100}% of ordinary accounts: ${counts.negative} × ${falsePositiveRate} = ${counts.fp}. The larger group can produce more flags.`,
        `A flagged account belongs to a smaller comparison group: ${counts.tp} + ${counts.fp} = ${counts.tp + counts.fp}. Unflagged accounts leave this denominator.`,
        `${counts.tp} of ${counts.tp + counts.fp} flagged accounts are compromised: ${(counts.posterior! * 100).toFixed(2)}%. A 90% detection rate is not the same question.`,
        `P(flag | compromised) is always 90% here. P(compromised | flag) is ${(counts.posterior! * 100).toFixed(2)}%, and changes with prevalence and false alarms.`,
      ][stage],
      stage < 3
        ? `prior = ${counts.positive} / 10000; sensitivity = 0.9; false-positive rate = ${falsePositiveRate}`
        : `P(compromised | flag) = ${counts.tp} / (${counts.tp} + ${counts.fp}) = ${n(counts.posterior!)}`,
      [
        ["Prior", `${prevalence * 100}%`],
        ["Flags", stage >= 3 ? String(counts.tp + counts.fp) : "—"],
        [
          "Posterior",
          stage >= 4 ? `${(counts.posterior! * 100).toFixed(2)}%` : "—",
        ],
      ],
      audit(
        "Counts retain the denominator",
        ["Actual group", "All", "Flagged", "Unflagged"],
        [
          [
            "Compromised",
            String(counts.positive),
            stage >= 1 ? String(counts.tp) : "—",
            stage >= 1 ? String(counts.fn) : "—",
          ],
          [
            "Ordinary",
            String(counts.negative),
            stage >= 2 ? String(counts.fp) : "—",
            stage >= 2 ? String(counts.tn) : "—",
          ],
          [
            "Total",
            "10000",
            stage >= 3 ? String(counts.tp + counts.fp) : "—",
            stage >= 3 ? String(counts.fn + counts.tn) : "—",
          ],
        ],
        stage < 3 ? Math.max(0, stage - 1) : 2,
        [
          {
            label: "Population",
            value:
              "Synthetic account-security exercise; no real detector performance is claimed",
          },
        ],
      ),
    ),
  );
}
const bayes: Experiment = {
  id: "l05",
  title: "A useful flag can still produce many false alarms.",
  scenarios: [
    {
      id: "rare",
      label: "1% compromised",
      description:
        "Sensitivity 90%, false-positive rate 5%, population 10,000.",
    },
    {
      id: "common",
      label: "10% compromised",
      description:
        "Change prevalence only. Keep both within-group detector rates fixed.",
    },
    {
      id: "specific",
      label: "Fewer false alarms",
      description:
        "Keep 1% prevalence and reduce the false-positive rate from 5% to 1%.",
    },
  ],
  build: bayesTrace,
};

export const entropy = (p: number[]) =>
  -p.reduce((sum, value) => sum + (value ? value * Math.log(value) : 0), 0);
export const crossEntropy = (p: number[], q: number[]) =>
  p.reduce(
    (sum, value, i) =>
      sum + (value === 0 ? 0 : q[i] === 0 ? Infinity : -value * Math.log(q[i])),
    0,
  );
export const divergence = (p: number[], q: number[]) =>
  crossEntropy(p, q) - entropy(p);
export function distributionTrace(scenario: string) {
  const p = [0.6, 0.3, 0.1],
    q =
      scenario === "correct"
        ? [0.8, 0.1, 0.1]
        : scenario === "wrong"
          ? [0.1, 0.8, 0.1]
          : scenario === "zero"
            ? [0, 0.5, 0.5]
            : [1 / 3, 1 / 3, 1 / 3];
  const mean = q.reduce((sum, value, i) => sum + value * i, 0),
    variance = q.reduce((sum, value, i) => sum + value * (i - mean) ** 2, 0),
    h = entropy(q),
    observed = q[0] ? -Math.log(q[0]) : Infinity,
    ce = crossEntropy(p, q),
    kl = divergence(p, q);
  const values = [mean, variance, h, observed, ce, kl],
    labels = [
      "Expected days",
      "Variance",
      "Entropy H(q)",
      "Loss for 0 days",
      "Cross-entropy H(p,q)",
      "KL(p ∥ q)",
    ];
  return Array.from({ length: 7 }, (_, stage) =>
    entry(
      [
        "Read the two distributions",
        "Calculate an expectation",
        "Measure spread",
        "Measure uncertainty",
        "Score one observed outcome",
        "Score the full target distribution",
        "Separate fit from intrinsic uncertainty",
      ][stage],
      [
        "Outcomes are delays of 0, 1, or 2 days. The declared target distribution p is [0.6, 0.3, 0.1]; compare it with the selected predictor q.",
        `Weight each delay by q: expected delay is ${n(mean)} days. An expectation need not be one of the possible outcomes.`,
        `Average squared distance from the mean under q: variance ${n(variance)} days². Spread is a different quantity from expected delay.`,
        `Entropy H(q) = ${n(h)} nats. Natural logarithms set the units. A zero-probability bin contributes 0, by convention.`,
        q[0]
          ? `Suppose the observed delay is 0. Its loss is −ln(${n(q[0])}) = ${n(observed)}. A confident wrong prediction is expensive.`
          : "The actual delay is 0, but q gives it zero probability. Its negative log-likelihood is infinite; no epsilon is silently inserted.",
        `Average −ln q across the declared target distribution p: H(p,q) = ${n(ce)} nats. This is an expectation over outcomes, not the loss of one observed event.`,
        `H(p) = ${n(entropy(p))}. KL(p ∥ q) = H(p,q) − H(p) = ${n(kl)}. It is asymmetric and is not a distance metric.`,
      ][stage],
      stage === 1
        ? `E_q[X] = 0×${n(q[0])} + 1×${n(q[1])} + 2×${n(q[2])} = ${n(mean)}`
        : stage === 2
          ? `Var_q(X) = Σ qᵢ(i − ${n(mean)})² = ${n(variance)}`
          : stage === 4
            ? `−ln q(0) = ${n(observed)}`
            : stage === 6
              ? `${n(ce)} − ${n(entropy(p))} = ${n(kl)}`
              : "H(q) = −Σ qᵢ ln qᵢ; H(p,q) = −Σ pᵢ ln qᵢ",
      [
        ["Entropy", stage >= 3 ? n(h) : "—"],
        ["Observed loss", stage >= 4 ? n(observed) : "—"],
        ["KL", stage >= 6 ? n(kl) : "—"],
      ],
      {
        kind: "distribution",
        probabilities: q,
        target: p,
        outcomes: ["0 days", "1 day", "2 days"],
        entries: labels.map((label, i) => ({
          label,
          value: stage >= i + 1 ? n(values[i]) : "—",
        })),
        active: stage === 4 ? 0 : -1,
      },
    ),
  );
}
const distributions: Experiment = {
  id: "l06",
  title: "Distinguish uncertainty from being confidently wrong.",
  scenarios: [
    {
      id: "uniform",
      label: "Uniform predictor",
      description:
        "q = [1/3, 1/3, 1/3]. The observed outcome is a 0-day delay.",
    },
    {
      id: "correct",
      label: "Confident on 0 days",
      description:
        "q = [0.8, 0.1, 0.1]. Compare one observed loss with expected cross-entropy.",
    },
    {
      id: "wrong",
      label: "Confident on 1 day",
      description:
        "q = [0.1, 0.8, 0.1]. Same entropy, a different loss for the observed 0-day outcome.",
    },
    {
      id: "zero",
      label: "Zero probability",
      description:
        "q = [0, 0.5, 0.5]. The observed outcome has zero modeled probability.",
    },
  ],
  build: distributionTrace,
};

export function learningObjectiveTrace(scenario: string) {
  const text = ["red book", "blue book", "red pen"],
    features = [
      [1, 0, 1, 0],
      [0, 1, 1, 0],
      [1, 0, 0, 1],
    ],
    labels = ["read", "read", "write"];
  const centroids = [
      [0.5, 0.5, 1, 0],
      [1, 0, 0, 1],
    ],
    query = [0, 1, 0, 1],
    distances = centroids.map((c) =>
      c.reduce((sum, v, i) => sum + (v - query[i]) ** 2, 0),
    );
  const supervised = scenario === "supervised",
    self = scenario === "self";
  return Array.from({ length: 5 }, (_, stage) =>
    entry(
      [
        "Reuse three documents",
        "Specify the target",
        "Construct the training view",
        "Apply the objective",
        "Inspect what can be concluded",
      ][stage],
      [
        "The same three documents can support different tasks. Changing the objective changes which information is an input and where the target comes from.",
        supervised
          ? "Human-provided labels say read, read, write. The target is external to the text."
          : self
            ? "Hide the last word and predict it from the first. The document itself supplies the target; self-supervised does not mean target-free."
            : "No task labels are supplied. We compute pairwise word-set similarity, not an externally named read/write class.",
        supervised
          ? "Represent words in order [red, blue, book, pen]. Average vectors within each labeled class to fit a tiny nearest-centroid classifier."
          : self
            ? "From context “red”, the corpus provides two targets: book once and pen once. Maximum-likelihood counts give each probability 1/2."
            : "Jaccard similarity is intersection size divided by union size. Documents 1/2 and 1/3 each share one of three distinct words: 1/3.",
        supervised
          ? `Query “blue pen” has squared distances ${distances[0]} to read and ${distances[1]} to write. Nearest centroid predicts write.`
          : self
            ? "A next-word predictor for “red” must represent ambiguity: P(book | red) = P(pen | red) = 0.5. No human category label is required."
            : "The tied similarities do not uniquely decide a semantic grouping. An unlabeled objective can reveal structure without supplying human meanings.",
        "Supervised, self-supervised, and unsupervised describe the learning setup. Semi-supervised mixes label availability; reinforcement learning instead uses reward feedback from behavior.",
      ][stage],
      supervised
        ? "read centroid = [0.5,0.5,1,0]; write centroid = [1,0,0,1]"
        : self
          ? "P(next | red) = counts(red → next) / 2"
          : "J(A,B) = |A ∩ B| / |A ∪ B|",
      [
        ["Documents", 3],
        ["Target source", supervised ? "Human" : self ? "Text" : "None"],
        [
          "Result",
          stage >= 3
            ? supervised
              ? "write"
              : self
                ? "0.5 / 0.5"
                : "Tie"
            : "—",
        ],
      ],
      audit(
        "One corpus, different information access",
        ["Document", "Input", "Target"],
        text.map((document, i) => [
          String(i + 1),
          self && stage >= 2 ? document.split(" ")[0] : document,
          stage >= 1
            ? supervised
              ? labels[i]
              : self
                ? document.split(" ")[1]
                : "Not supplied"
            : "—",
        ]),
        stage < 3 ? (stage === 0 ? -1 : 0) : -1,
        [
          {
            label: "Features [red, blue, book, pen]",
            value: features.map((row) => `[${row}]`).join("; "),
          },
          {
            label: "Objective",
            value: supervised
              ? "Predict an externally supplied class"
              : self
                ? "Predict the hidden word"
                : "Inspect unlabeled similarity",
          },
        ],
      ),
    ),
  );
}
const objectives: Experiment = {
  id: "l07",
  title: "Change the target, not the underlying documents.",
  scenarios: [
    {
      id: "supervised",
      label: "Supervised labels",
      description:
        "Fit a class centroid from human-supplied read/write labels, then classify “blue pen”.",
    },
    {
      id: "self",
      label: "Self-supervised target",
      description:
        "Hide the second word. Derive a next-word target from the text itself.",
    },
    {
      id: "unsupervised",
      label: "Unlabeled structure",
      description:
        "Compare word-set similarities without any task label or claim of learned semantic categories.",
    },
  ],
  build: learningObjectiveTrace,
};

export function dataAuditTrace(scenario: string) {
  const rows = [
    { id: 1, person: "A", day: 1, x: 2, source: "a1" },
    { id: 2, person: "A", day: 2, x: 4, source: "a2" },
    { id: 3, person: "B", day: 1, x: 6, source: "b1" },
    { id: 4, person: "B", day: 2, x: 8, source: "b2" },
    { id: 5, person: "C", day: 3, x: 10, source: "c1" },
    { id: 6, person: "C", day: 4, x: 12, source: "c2" },
  ];
  if (scenario === "duplicate") rows[5] = { ...rows[0], id: 6 };
  const role = (i: number) =>
    scenario === "row"
      ? [0, 2, 4].includes(i)
        ? "Train"
        : i === 1
          ? "Validate"
          : "Test"
      : scenario === "future"
        ? i < 5
          ? "Train"
          : "Test"
        : i < 2
          ? "Train"
          : i < 4
            ? "Validate"
            : "Test";
  const training = rows.filter((_, i) => role(i) === "Train"),
    fitRows = scenario === "global" ? rows : training,
    mean = fitRows.reduce((sum, row) => sum + row.x, 0) / fitRows.length;
  const sourceIds = new Set(training.map((r) => r.source)),
    people = new Set(training.map((r) => r.person));
  const duplicate = rows.flatMap((r, i) =>
    role(i) !== "Train" && sourceIds.has(r.source) ? [i] : [],
  );
  const scope = rows.flatMap((r, i) =>
    scenario === "future"
      ? role(i) === "Train" && r.day > 2
        ? [i]
        : []
      : role(i) !== "Train" && people.has(r.person)
        ? [i]
        : [],
  );
  const failed =
    Number(duplicate.length > 0) +
    Number(scope.length > 0) +
    Number(scenario === "global");
  return Array.from({ length: 6 }, (_, stage) =>
    entry(
      [
        "Define what must be new",
        "Fit preprocessing on allowed rows",
        "Apply the saved transform",
        "Audit original source identities",
        "Audit the deployment boundary",
        "Summarize the checks",
      ][stage],
      [
        scenario === "future"
          ? "We predict after day 2, so training must use only information available by that cutoff. A later training row violates this question."
          : "The evaluation question is performance on new customers. A customer must not appear in both training and held-out sets.",
        `Centering mean = ${fitRows.map((r) => r.x).join(" + ")} divided by ${fitRows.length} = ${n(mean)}. ${scenario === "global" ? "This improperly includes validation and test features." : "Only training features fit this preprocessing step."}`,
        `Subtract saved mean ${n(mean)} from every feature. Applying a transform to held-out data is allowed; fitting its statistics on held-out data is different.`,
        duplicate.length
          ? `Held-out row ${duplicate.map((i) => rows[i].id).join(", ")} reuses a training source. A changed row number does not make it independent.`
          : "No original source ID crosses from training into held-out data. That check alone is not enough.",
        scope.length
          ? scenario === "future"
            ? "A day-3 row entered training even though the prediction cutoff is day 2. Future information leaked across the time boundary."
            : "A customer appears in training and held-out data. Exact source IDs may differ while the intended new-customer test still fails."
          : "The declared customer/time separation check passes. This does not prove the sample represents future deployment.",
        `${failed} audit checks fail: source overlap, deployment boundary, and training-only preprocessing are separate checks. Clean membership is evidence about the split, not a performance guarantee.`,
      ][stage],
      stage === 1 || stage === 2
        ? `centered feature = x − mean(${scenario === "global" ? "all rows: leak" : "train"}) = x − ${n(mean)}`
        : "audit(source identity, customer/time boundary, preprocessing fit scope)",
      [
        ["Fit mean", stage >= 1 ? n(mean) : "—"],
        ["Fit rows", stage >= 1 ? String(fitRows.length) : "—"],
        ["Failed checks", stage === 5 ? String(failed) : "—"],
      ],
      audit(
        "Trace provenance and information boundaries",
        ["Row / source", "Customer / day", "Role", "x → centered"],
        rows.map((r, i) => [
          `${r.id} / ${r.source}`,
          `${r.person} / ${r.day}`,
          role(i),
          stage >= 2 ? `${r.x} → ${n(r.x - mean)}` : String(r.x),
        ]),
        -1,
        [
          {
            label: "Evaluation goal",
            value:
              scenario === "future"
                ? "Forecast from a day-2 information cutoff"
                : "Generalize to customers absent from training",
          },
          {
            label: "Preprocessing fit",
            value:
              scenario === "global"
                ? "Incorrectly uses all records"
                : "Training rows only",
          },
        ],
        stage >= 4
          ? [...new Set([...duplicate, ...scope])]
          : stage >= 3
            ? duplicate
            : [],
      ),
    ),
  );
}
const dataAudit: Experiment = {
  id: "l08",
  title: "A different row number is not a fresh example.",
  scenarios: [
    {
      id: "clean",
      label: "Customer split",
      description:
        "Customer A trains, B validates, and C tests. Fit the centering mean on A only.",
    },
    {
      id: "row",
      label: "Random row split",
      description:
        "Different rows share customers across training and held-out data.",
    },
    {
      id: "future",
      label: "Future information",
      description:
        "Forecast from day 2, but deliberately let a day-3 record enter training.",
    },
    {
      id: "global",
      label: "Global preprocessing",
      description:
        "Use the clean customer split, but wrongly fit the centering mean on all records.",
    },
    {
      id: "duplicate",
      label: "Copied source",
      description:
        "Replace test row 6 with a copy of training source a1, preserving its original customer and date.",
    },
  ],
  build: dataAuditTrace,
};

export const fullFoundationExperiments = [
  taxonomy,
  lifecycle,
  tensors,
  derivatives,
  bayes,
  distributions,
  objectives,
  dataAudit,
];
