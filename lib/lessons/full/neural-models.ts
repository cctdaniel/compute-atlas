import type { Experiment, Frame, Scene } from "../types";
const show = (v: number | null) =>
  v === null
    ? "—"
    : !Number.isFinite(v)
      ? "∞"
      : Math.abs(v) < 0.00005
        ? "0"
        : Math.abs(v) >= 10000
          ? v.toExponential(2)
          : Number.isInteger(v)
            ? String(v)
            : v.toFixed(4);
const f = (
  title: string,
  caption: string,
  calculation: string,
  metrics: [string, string | number | null][],
  scene: Scene,
  nextAction?: string,
): Frame => ({
  title,
  caption,
  calculation,
  metrics: metrics.map(([label, value]) => ({
    label,
    value: typeof value === "string" ? value : show(value),
  })),
  scene,
  ...(nextAction ? { nextAction } : {}),
});
const dot = (a: number[], b: number[]) =>
  a.reduce((sum, v, i) => sum + v * b[i], 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
// Standard tanh approximation to GELU, rather than an unexplained lookup table.
export const gelu = (x: number) =>
  0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
export function xorNetwork(
  input: number[],
  activation = "ReLU",
  linear = false,
) {
  const s = input[0] + input[1],
    z = [s, s - 1];
  const phi =
    activation === "Identity"
      ? (v: number) => v
      : activation === "Sigmoid"
        ? sigmoid
        : activation === "GELU"
          ? gelu
          : (v: number) => Math.max(0, v);
  const h = z.map(phi),
    score = linear ? s - 0.5 : h[0] - 2 * h[1];
  return { z, h, score, predicted: Number(score >= 0.5) };
}
export function mlpTrace(scenario: string) {
  const input =
    scenario === "one" ? [1, 0] : scenario === "none" ? [0, 0] : [1, 1];
  const activation =
      scenario === "identity"
        ? "Identity"
        : scenario === "sigmoid"
          ? "Sigmoid"
          : scenario === "gelu"
            ? "GELU"
            : "ReLU",
    linear = scenario === "linear";
  const state = xorNetwork(input, activation, linear),
    cases = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ].map((x) => ({
      input: x,
      target: x[0] ^ x[1],
      ...xorNetwork(x, activation, linear),
    }));
  const correct = cases.filter((row) => row.predicted === row.target).length;
  return Array.from({ length: 6 }, (_, stage) =>
    f(
      [
        "Ask for exactly one active switch",
        "Compute two affine features",
        "Apply the chosen activation",
        "Combine the hidden values",
        "Convert the score to a class",
        "Check every XOR input",
      ][stage],
      [
        `XOR is 1 when exactly one switch is on. Our selected input is [${input.join(", ")}]. The supplied network weights are hand-built; this view does not train them.`,
        linear
          ? `The affine baseline uses score x₁+x₂−0.5=${show(state.score)}. It cannot separate both positive corners from both negative corners.`
          : `Both units read s=x₁+x₂=${input[0] + input[1]}. Their pre-activations are z₁=s and z₂=s−1: [${state.z.map(show).join(", ")}].`,
        linear
          ? "There is no hidden nonlinearity in this baseline. More purely affine layers would still give one affine function."
          : `Apply ${activation} separately: h=[${state.h.map(show).join(", ")}]. ${activation === "Identity" ? "Removing nonlinearities makes the composed network affine." : "The output weights remain the same when you change activation; they are not refitted."}`,
        `The ${linear ? "baseline" : "two-hidden-unit network"} returns score ${show(state.score)}. A raw score is not a probability.`,
        `At threshold 0.5, predict ${state.predicted}; XOR target is ${input[0] ^ input[1]}.`,
        `${correct} of the four binary inputs are correct. ${activation === "ReLU" && !linear ? "The two ReLU features construct a piecewise-linear rule that solves all four cases." : "Changing architecture or activation changes the function; these supplied weights need not work with every choice."}`,
      ][stage],
      linear
        ? "score=x₁+x₂−0.5"
        : `h₁=φ(s); h₂=φ(s−1); score=h₁−2h₂=${show(state.score)}`,
      [
        ["Score", stage >= 3 ? state.score : "—"],
        ["Class", stage >= 4 ? state.predicted : "—"],
        ["Correct", stage >= 5 ? `${correct}/4` : "—"],
      ],
      {
        kind: "mlp",
        input,
        activation,
        z: state.z,
        h: state.h,
        score: state.score,
        linear,
        stage,
        cases,
      },
    ),
  );
}
const mlp: Experiment = {
  id: "l15",
  title: "Two nonlinear features can separate XOR.",
  scenarios: [
    {
      id: "relu",
      label: "ReLU: both switches on",
      description:
        "Use two ReLU hidden units and the supplied output weights to compute XOR.",
    },
    {
      id: "one",
      label: "ReLU: one switch on",
      description:
        "Keep the weights fixed and change only the binary input to [1,0].",
    },
    {
      id: "none",
      label: "ReLU: neither switch on",
      description:
        "Inspect [0,0], then compare the complete four-row truth table.",
    },
    {
      id: "linear",
      label: "One affine baseline",
      description:
        "Remove the hidden features and test score=x₁+x₂−0.5 on all four cases.",
    },
    {
      id: "identity",
      label: "Remove the nonlinearities",
      description:
        "Keep both layers but replace activation with identity. The composition becomes affine.",
    },
    {
      id: "sigmoid",
      label: "Swap to sigmoid",
      description:
        "Apply a sigmoid in each hidden unit, without retraining the supplied weights.",
    },
    {
      id: "gelu",
      label: "Swap to GELU",
      description:
        "Use the standard tanh approximation to GELU and inspect the resulting scores.",
    },
  ],
  build: mlpTrace,
};

export function affinePass(x: number, target: number, w: number, b: number) {
  const product = w * x,
    prediction = product + b,
    error = prediction - target;
  return {
    product,
    prediction,
    error,
    loss: 0.5 * error * error,
    gw: error * x,
    gb: error,
  };
}
export function autodiffTrace(scenario: string) {
  const x = 2,
    target = 4,
    initialW = scenario === "optimum" ? 2 : 1,
    initialB = 0,
    rate = scenario === "large" ? 0.5 : 0.1,
    inference = scenario === "inference";
  const old = affinePass(x, target, initialW, initialB);
  if (inference)
    return Array.from({ length: 5 }, (_, stage) =>
      f(
        [
          "Load the checkpoint",
          "Multiply input by weight",
          "Add the bias",
          "Return the prediction",
          "Keep the checkpoint unchanged",
        ][stage],
        [
          "Inference loads w=1, b=0 and a new input x=2. It has no training target or loss in this path.",
          "The multiplication gives 1×2=2.",
          "Adding bias 0 preserves prediction 2.",
          "Return the predicted value. No gradient computation is requested.",
          "The same checkpoint can process another input. A normal inference call does not automatically learn from it.",
        ][stage],
        "prediction = w×x+b = 1×2+0 = 2",
        [
          ["Weight", 1],
          ["Bias", 0],
          ["Prediction", stage >= 2 ? 2 : "—"],
        ],
        {
          kind: "autodiff",
          x,
          target: null,
          weight: initialW,
          bias: 0,
          product: 2,
          prediction: 2,
          error: null,
          loss: null,
          gw: null,
          gb: null,
          stage,
          phase: "inference",
        },
      ),
    );
  const newW = initialW - rate * old.gw,
    newB = scenario === "freeze-bias" ? 0 : initialB - rate * old.gb,
    next = affinePass(x, target, newW, newB);
  return Array.from({ length: 9 }, (_, stage) => {
    const updated = stage >= 7,
      state = stage >= 8 ? next : old;
    return f(
      [
        "Read input and target",
        "Multiply with the old weight",
        "Add the old bias",
        "Measure the prediction error",
        "Calculate half squared error",
        "Send sensitivity back to the prediction",
        "Compute parameter gradients",
        "Apply the optimizer update",
        "Recompute with the new parameters",
      ][stage],
      [
        `Start x=2, target=4, w=${initialW}, b=0. The forward pass computes values using this checkpoint.`,
        `The product is ${initialW}×2=${old.product}. The weight has not changed.`,
        `Prediction=${old.product}+0=${old.prediction}. Bias is another adjustable parameter.`,
        `Error=prediction−target=${old.prediction}−4=${old.error}.`,
        `L=½×(${old.error})²=${old.loss}. The loss is a scalar to differentiate.`,
        `dL/dprediction=error=${old.error}. Backpropagation propagates sensitivities; it does not update parameters.`,
        `dL/dw=error×x=${old.gw}; dL/db=error×1=${old.gb}. Both gradients refer to the old forward pass.`,
        `Apply α=${rate} simultaneously: w=${show(newW)}, b=${show(newB)}. ${scenario === "freeze-bias" ? "This scenario deliberately freezes b, so its computed gradient is not applied." : "The update uses both old gradients, not a newly recomputed bias gradient."}`,
        `The new prediction is ${show(next.prediction)} and loss is ${show(next.loss)}. ${next.loss > old.loss ? "This larger step raised the loss. A correct gradient does not make every learning rate safe." : "Re-evaluating checks what the update actually achieved."}`,
      ][stage],
      stage === 6
        ? `∂L/∂w=${old.error}×2=${old.gw}; ∂L/∂b=${old.error}`
        : updated
          ? `w′=${initialW}−${rate}×(${old.gw}); b′=${scenario === "freeze-bias" ? "0 (frozen)" : `0−${rate}×(${old.gb})`}`
          : `prediction=${old.prediction}; L=½(${old.error})²=${old.loss}`,
      [
        ["Weight", updated ? newW : initialW],
        ["Bias", updated ? newB : 0],
        [stage === 7 ? "Cached loss" : "Loss", stage >= 4 ? state.loss : "—"],
      ],
      {
        kind: "autodiff",
        x,
        target,
        weight: updated ? newW : initialW,
        bias: updated ? newB : 0,
        product: state.product,
        prediction: state.prediction,
        error: stage >= 3 ? state.error : null,
        loss: stage >= 4 ? state.loss : null,
        gw: stage >= 6 ? old.gw : null,
        gb: stage >= 6 ? old.gb : null,
        stage,
        phase: updated ? "update" : stage >= 5 ? "backward" : "forward",
      },
      stage === 6 ? "Update" : undefined,
    );
  });
}
const autodiff: Experiment = {
  id: "l16",
  title: "Compute gradients first. Apply the update separately.",
  scenarios: [
    {
      id: "both",
      label: "Update weight and bias",
      description:
        "Use x=2, y=4, w=1, b=0 and learning rate 0.1. Apply both old gradients together.",
    },
    {
      id: "freeze-bias",
      label: "Freeze the bias",
      description:
        "Calculate both derivatives, but only apply the weight update.",
    },
    {
      id: "large",
      label: "A larger update",
      description:
        "Use learning rate 0.5. Correct derivatives can still produce an excessive step.",
    },
    {
      id: "optimum",
      label: "Start at zero error",
      description:
        "Start w=2, b=0. Zero loss produces zero parameter gradients.",
    },
    {
      id: "inference",
      label: "Inference only",
      description:
        "Run the checkpoint without a target, a backward pass, or a parameter update.",
    },
  ],
  build: autodiffTrace,
};

export type TrainingState = {
  point: number[];
  gradient: number[];
  usedGradient: number[];
  update: number[];
  appliedUpdate: number[];
  rate: number;
  loss: number;
  memory: number[];
  sample: number | null;
};
export const bowlLoss = (point: number[]) =>
  0.5 * (point[0] ** 2 + 10 * point[1] ** 2);
export function trainingTrace(method: string): TrainingState[] {
  let point = [4, method === "initialization" ? 4 : 1],
    memory = [0, 0],
    second = [0, 0];
  const draws = [0, 0, 1, 0, 1, 1, 0, 1];
  const states: TrainingState[] = [
    {
      point: [...point],
      gradient: [point[0], 10 * point[1]],
      usedGradient: [point[0], 10 * point[1]],
      update: [0, 0],
      appliedUpdate: [0, 0],
      rate: 0,
      loss: bowlLoss(point),
      memory: [...memory],
      sample: null,
    },
  ];
  for (let step = 1; step <= 8; step++) {
    const sample = method === "sampled" ? draws[step - 1] : null,
      noise = sample === null ? 0 : sample === 0 ? 1 : -1;
    const gradient = [point[0] - noise, 10 * point[1] + noise],
      length = norm(gradient),
      usedGradient = gradient.map((g) =>
        method === "clipped" && length > 2 ? (g * 2) / length : g,
      );
    const rate =
      method === "large" || method === "clipped"
        ? 0.25
        : method === "adam"
          ? 0.15
          : method === "schedule"
            ? 0.05 * 0.7 ** (step - 1)
            : 0.05;
    let update: number[];
    if (method === "momentum") {
      memory = memory.map((m, i) => 0.8 * m + usedGradient[i]);
      update = memory.map((v) => rate * v);
    } else if (method === "adam") {
      memory = memory.map((m, i) => 0.9 * m + 0.1 * usedGradient[i]);
      second = second.map((v, i) => 0.999 * v + 0.001 * usedGradient[i] ** 2);
      update = memory.map(
        (m, i) =>
          (rate * (m / (1 - 0.9 ** step))) /
          (Math.sqrt(second[i] / (1 - 0.999 ** step)) + 1e-8),
      );
    } else update = usedGradient.map((g) => rate * g);
    const before = [...point];
    point = point.map((p, i) => p - update[i]);
    if (method === "rounded") point = point.map((p) => Math.round(p * 10) / 10);
    states.push({
      point: [...point],
      gradient,
      usedGradient,
      update,
      appliedUpdate: before.map((p, i) => p - point[i]),
      rate,
      loss: bowlLoss(point),
      memory: [...memory],
      sample,
    });
  }
  return states;
}
export function controlsTrace(scenario: string) {
  if (scenario.startsWith("dropout")) {
    const h = [2, 4],
      mask = scenario === "dropout-b" ? [0, 1] : [1, 0],
      scaled = h.map((v, i) => (v * mask[i]) / 0.5),
      total = scaled.reduce((a, b) => a + b, 0);
    return Array.from({ length: 5 }, (_, stage) =>
      f(
        [
          "Read two hidden activations",
          "Apply the supplied training mask",
          "Scale retained activations",
          "Sum the training output",
          "Compare ordinary evaluation",
        ][stage],
        [
          "Hidden activations are [2,4], output weights are [1,1], and keep probability is 0.5. We supply a mask so this run is reproducible.",
          `Multiply activations by binary mask [${mask.join(", ")}]. This changes this training pass, not the saved parameter count.`,
          `Use inverted-dropout scaling: divide retained values by 0.5, giving [${scaled.join(", ")}].`,
          `The masked training output is ${total}. Another mask can produce a different output on the same input.`,
          "Ordinary evaluation disables dropout and returns 2+4=6. Averaging all four equally likely masks also gives (0+4+8+12)/4=6; one training mask need not equal that mean.",
        ][stage],
        `h_train = mask×h/0.5; training sum=${total}; evaluation sum=6`,
        [
          ["Keep", "50%"],
          ["Train sum", stage >= 3 ? total : "—"],
          ["Eval sum", stage >= 4 ? 6 : "—"],
        ],
        {
          kind: "dropout",
          activations: h,
          mask,
          scaled,
          trainingOutput: total,
          evaluationOutput: 6,
          keep: 0.5,
          stage,
        },
      ),
    );
  }
  if (scenario.startsWith("softmax")) {
    const base = scenario === "softmax-large" ? 1000 : 0,
      logits = [base, base + 1],
      exp = [Math.exp(-1), 1],
      sum = exp[0] + 1,
      p = exp.map((v) => v / sum);
    return Array.from({ length: 5 }, (_, stage) =>
      f(
        [
          "Inspect the logits",
          "Try exponentiating directly",
          "Subtract the row maximum",
          "Exponentiate the shifted scores",
          "Normalize finite values",
        ][stage],
        [
          `Use logits [${logits.join(", ")}]. A common offset should not change softmax probabilities.`,
          base
            ? "exp(1000) and exp(1001) overflow in JavaScript Number. Their naive ratio is not a meaningful probability."
            : "exp(0) and exp(1) are finite. This input does not expose overflow, but the same stable procedure works.",
          "Subtract the largest score. The shifted logits are [−1,0], preserving the same probability ratios.",
          `The shifted exponentials are [${show(exp[0])},1], summing to ${show(sum)}.`,
          `Normalize to [${p.map(show).join(", ")}]. Stable arithmetic avoids this overflow; it does not make all possible computations numerically safe.`,
        ][stage],
        "softmax(z) = exp(z−max(z)) / Σ exp(z−max(z))",
        [
          ["Max logit", base + 1],
          ["Shifted sum", stage >= 3 ? sum : "—"],
          ["Top share", stage >= 4 ? p[1] : "—"],
        ],
        {
          kind: "audit",
          heading: "Same score differences, finite exponentials",
          columns: ["Token", "Raw logit", "Shifted logit", "Probability"],
          rows: logits.map((logit, i) => [
            String(i + 1),
            String(logit),
            stage >= 2 ? String(i - 1) : "—",
            stage >= 4 ? show(p[i]) : "—",
          ]),
          activeRow: -1,
          flaggedRows: [],
          context: [
            {
              label: "Naive exponentials",
              value:
                stage >= 1
                  ? logits.map((v) => show(Math.exp(v))).join(", ")
                  : "Not evaluated",
            },
            {
              label: "Arithmetic",
              value: "JavaScript Number; not a simulation of float16 hardware",
            },
          ],
        },
      ),
    );
  }
  const states = trainingTrace(scenario);
  return states.map((state, step) =>
    f(
      step ? `Apply training update ${step}` : "Start from a declared point",
      step
        ? `Use gradient [${state.gradient.map(show).join(", ")}] from the previous point. ${scenario === "clipped" ? `Clip its norm to at most 2 before applying α=0.25.` : scenario === "sampled" ? `The supplied sample index is ${state.sample}; this is one sampled gradient, not a full dataset pass.` : scenario === "rounded" ? "Round the resulting parameters to one decimal place. This deliberately coarse arithmetic can stall useful small changes." : `Apply ${scenario === "momentum" ? "momentum with β=0.8" : scenario === "adam" ? "Adam with bias-corrected moments" : "the gradient step"} at learning rate ${show(state.rate)}.`} The resulting loss is ${show(state.loss)}.`
        : "Use L(u,v)=½(u²+10v²), with a steeper v direction. Most cases start at [4,1]; the initialization variation starts at [4,4]. Exact values remain available even if a point leaves the displayed plot.",
      `point=[${state.point.map(show).join(", ")}]; update=[${state.update.map(show).join(", ")}]; L=${show(state.loss)}`,
      [
        ["Step", step],
        ["Loss", state.loss],
        ["Move norm", norm(state.appliedUpdate)],
      ],
      {
        kind: "optimization",
        path: states.slice(0, step + 1).map((s) => s.point),
        gradient: state.gradient,
        usedGradient: state.usedGradient,
        update: state.update,
        appliedUpdate: state.appliedUpdate,
        rate: state.rate,
        loss: state.loss,
        step,
        memory: state.memory,
        sample: state.sample,
      },
    ),
  );
}
const controls: Experiment = {
  id: "l17",
  title: "Change the training rule, then inspect the actual move.",
  scenarios: [
    {
      id: "gd",
      label: "Full-gradient descent",
      description:
        "Use α=0.05 on the same two-coordinate quadratic for eight updates.",
    },
    {
      id: "momentum",
      label: "Momentum",
      description:
        "Use velocity v=0.8v+gradient and α=0.05. Inspect memory separately from the current gradient.",
    },
    {
      id: "adam",
      label: "Adam",
      description: "Use α=0.15, β₁=0.9, β₂=0.999, ε=10⁻⁸ and bias correction.",
    },
    {
      id: "large",
      label: "Excessive learning rate",
      description:
        "Raise plain-gradient α to 0.25. The steep coordinate oscillates and grows.",
    },
    {
      id: "clipped",
      label: "Clip the gradient",
      description:
        "Keep α=0.25 but cap gradient norm at 2. This bounds moves, not convergence.",
    },
    {
      id: "schedule",
      label: "Decay the learning rate",
      description: "Start α=0.05 and multiply by 0.7 after each update.",
    },
    {
      id: "sampled",
      label: "Sample one example",
      description:
        "Use a supplied sequence of sample indices from two component losses. Their average gradient is the full gradient.",
    },
    {
      id: "rounded",
      label: "Coarse decimal arithmetic",
      description:
        "Use α=0.05, then round parameters to one decimal. This is a teaching quantizer, not float16 emulation.",
    },
    {
      id: "initialization",
      label: "A different starting scale",
      description:
        "Start at [4,4] instead of [4,1], with the same objective and α=0.05.",
    },
    {
      id: "dropout-a",
      label: "Dropout: retain unit 1",
      description: "Use keep probability 0.5 and supplied training mask [1,0].",
    },
    {
      id: "dropout-b",
      label: "Dropout: retain unit 2",
      description:
        "Keep the activations fixed and change the supplied mask to [0,1].",
    },
    {
      id: "softmax-large",
      label: "Stable softmax: large logits",
      description:
        "Inspect overflow for [1000,1001], then subtract the maximum before exponentiating.",
    },
    {
      id: "softmax-small",
      label: "Stable softmax: small logits",
      description:
        "Use [0,1]. The stable probabilities match the large-offset case.",
    },
  ],
  build: controlsTrace,
};

const embeddingItems = [
  { label: "Cat", vector: [1, 0] },
  { label: "Dog", vector: [0.8, 0.2] },
  { label: "Bus", vector: [-0.8, 0.1] },
  { label: "Train", vector: [-0.7, 0.2] },
  { label: "Apple", vector: [0, 1] },
  { label: "Pear", vector: [0.2, 0.8] },
  { label: "Zero", vector: [0, 0] },
  { label: "Scaled cat", vector: [3, 0] },
];
export const embeddingCosine = (a: number[], b: number[]) =>
  norm(a) * norm(b) ? dot(a, b) / (norm(a) * norm(b)) : null;
export function contrastiveLoss(
  query: number[],
  positive: number[],
  negative: number[],
) {
  const logits = [dot(query, positive), dot(query, negative)],
    maximum = Math.max(...logits),
    exp = logits.map((z) => Math.exp(z - maximum)),
    probabilities = exp.map((v) => v / (exp[0] + exp[1]));
  return {
    loss: -Math.log(probabilities[0]),
    probabilities,
    gradient: query.map(
      (_, i) =>
        (probabilities[0] - 1) * positive[i] + probabilities[1] * negative[i],
    ),
  };
}
export function representationTrace(scenario: string) {
  if (scenario.startsWith("contrastive")) {
    const positive =
        scenario === "contrastive-apple"
          ? embeddingItems[4]
          : embeddingItems[0],
      negative =
        scenario === "contrastive-apple"
          ? embeddingItems[0]
          : embeddingItems[4];
    let q = [0, 0];
    return Array.from({ length: 5 }, (_, step) => {
      if (step) {
        const old = contrastiveLoss(q, positive.vector, negative.vector);
        q = q.map((v, i) => v - 0.5 * old.gradient[i]);
      }
      const state = contrastiveLoss(q, positive.vector, negative.vector),
        items = embeddingItems.map((item) => ({
          ...item,
          score: dot(q, item.vector),
        }));
      return f(
        step
          ? `Learned query update ${step}`
          : "Declare one positive and one negative",
        `The matching key is ${positive.label}; the contrasting key is ${negative.label}. ${step ? `Use the old loss gradient to update the query vector to [${q.map(show).join(", ")}].` : "Start query [0,0]. Its two dot scores tie, so each receives probability 0.5."} The key vectors stay frozen. Only these two keys participate in this loss.`,
        `L=−ln softmax([q·positive,q·negative])₀=${show(state.loss)}; α=0.5`,
        [
          ["Update", step],
          ["Pair loss", state.loss],
          ["Match share", state.probabilities[0]],
        ],
        {
          kind: "embedding",
          query: [...q],
          items,
          order: items.map((_, i) => i),
          active: -1,
          metric: "Dot score",
          training: {
            positive: positive.label,
            negative: negative.label,
            loss: state.loss,
            probabilities: state.probabilities,
          },
        },
      );
    });
  }
  const query =
      scenario === "zero"
        ? [0, 0]
        : scenario === "euclidean-scaled" || scenario === "cosine-scaled"
          ? [3, 0]
          : [1, 0],
    distance = scenario.startsWith("euclidean");
  const scored = embeddingItems.map((item) => ({
    ...item,
    score: distance
      ? norm(item.vector.map((v, i) => v - query[i]))
      : embeddingCosine(query, item.vector),
  }));
  const ranked = scored
    .map((_, i) => i)
    .sort((a, b) =>
      scored[a].score === null
        ? scored[b].score === null
          ? a - b
          : 1
        : scored[b].score === null
          ? -1
          : (distance ? 1 : -1) * (scored[a].score! - scored[b].score!) ||
            a - b,
    );
  return Array.from({ length: 10 }, (_, step) => {
    const active = step >= 1 && step <= 8 ? step - 1 : -1,
      items = scored.map((item, i) => ({
        ...item,
        score: step >= 9 || i < step ? item.score : null,
      })),
      best = scored[ranked[0]];
    return f(
      step === 0
        ? "Read supplied vectors"
        : step === 9
          ? "Rank the computed scores"
          : `Compare candidate ${step}`,
      step === 0
        ? "Eight two-dimensional vectors are supplied for geometry practice. Their object names are illustrative; this is not a trained semantic embedding model."
        : step === 9
          ? query.every((v) => v === 0) && !distance
            ? "Cosine has no defined value for a zero query. There is no valid cosine ranking to interpret."
            : `${distance ? "Smaller distance" : "Larger cosine"} ranks first. Positive scaling preserves cosine direction but can change distances and retrieval order.`
          : `${scored[active].label} has vector [${scored[active].vector.join(", ")}]. ${distance ? "Euclidean distance" : "Cosine similarity"} is ${show(scored[active].score)}. ${scored[active].score === null ? "A zero vector makes the cosine denominator zero." : "This score follows the chosen metric, not a truth or relevance guarantee."}`,
      distance
        ? "distance=√Σ(queryᵢ−candidateᵢ)²"
        : "cosine=(query·candidate)/(||query||||candidate||), for nonzero vectors",
      [
        ["Query norm", norm(query)],
        ["Compared", Math.min(step, 8)],
        ["Best score", step >= 9 ? best.score : "—"],
      ],
      {
        kind: "embedding",
        query,
        items,
        order: step === 9 ? ranked : items.map((_, i) => i),
        active,
        metric: distance ? "Distance" : "Cosine",
        training: null,
      },
    );
  });
}
const representations: Experiment = {
  id: "l18",
  title: "A useful representation depends on its objective and metric.",
  scenarios: [
    {
      id: "cosine",
      label: "Compare cosine directions",
      description:
        "Use query [1,0] and eight supplied 2D vectors. Larger cosine ranks first.",
    },
    {
      id: "cosine-scaled",
      label: "Rescale the cosine query",
      description:
        "Change the query to [3,0]. Cosines stay unchanged for every nonzero candidate.",
    },
    {
      id: "euclidean",
      label: "Compare Euclidean distances",
      description:
        "Use query [1,0]. Smaller distance ranks first; vector lengths now matter.",
    },
    {
      id: "euclidean-scaled",
      label: "Rescale the distance query",
      description:
        "Use query [3,0]. The scaled-cat vector is now the exact match.",
    },
    {
      id: "zero",
      label: "Zero-vector boundary",
      description:
        "Use query [0,0]. Cosine is undefined; do not manufacture a similarity score.",
    },
    {
      id: "contrastive-cat",
      label: "Learn a cat preference",
      description:
        "Learn only the query vector using Cat as the positive and Apple as the negative, with dot-score cross-entropy.",
    },
    {
      id: "contrastive-apple",
      label: "Change the training relation",
      description:
        "Keep the keys fixed, swap the positive and negative, and trace the new query updates.",
    },
  ],
  build: representationTrace,
};
export const neuralExperiments = [mlp, autodiff, controls, representations];
