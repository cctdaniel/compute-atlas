import type { Experiment, Frame, Metric, Point, PreparedExperiment, Scene } from "./types";

export const number = (value: number) => Math.abs(value) < 0.0005 ? "0.000" : Math.abs(value) >= 10000 ? value.toExponential(2) : value.toFixed(3);
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const metrics = (...entries: [string, number | string][]): Metric[] => entries.map(([label, value]) => ({ label, value: typeof value === "number" ? number(value) : value }));
const frame = (title: string, caption: string, calculation: string, entries: Metric[], scene: Scene): Frame => ({ title, caption, calculation, metrics: entries, scene });
export const dot = (a: number[], b: number[]) => {
  if (a.length !== b.length) throw new RangeError("Vectors must have matching dimensions.");
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
};
export const softmax = (scores: number[], allowed = scores.map(() => true)) => {
  if (scores.length !== allowed.length || !allowed.some(Boolean)) throw new RangeError("Attention needs at least one allowed key.");
  const maximum = Math.max(...scores.filter((_, index) => allowed[index]));
  const exp = scores.map((score, index) => allowed[index] ? Math.exp(score - maximum) : 0);
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((value) => value / sum);
};
export const cosine = (a: number[], b: number[]) => {
  const denominator = Math.sqrt(dot(a, a) * dot(b, b));
  return denominator ? dot(a, b) / denominator : null;
};
export const layerNorm = (values: number[]) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return values.map((value) => (value - mean) / Math.sqrt(variance + 1e-5));
};
const sampleCurve = (fn: (x: number) => number, maximum = 4): Point[] => Array.from({ length: 81 }, (_, index) => ({ x: index / 80 * maximum, y: fn(index / 80 * maximum) }));

const vectors: Experiment = {
  id: "vectors-and-matrices", title: "Price both carts, one product at a time.",
  scenarios: [
    { id: "original", label: "Two carts", description: "Apples cost $2 and bread costs $3. Each row describes one cart." },
    { id: "more-bread", label: "More bread", description: "Add a second loaf to the first cart. The operation stays the same." },
    { id: "price-change", label: "Bread costs $4", description: "Keep the quantities and change one unit price." },
  ],
  build(scenario) {
    const rows = [[2, scenario === "more-bread" ? 2 : 1], [1, 3]];
    const weights = [2, scenario === "price-change" ? 4 : 3];
    return Array.from({ length: 7 }, (_, step) => {
      const row = Math.min(1, Math.floor(Math.max(0, step - 1) / 3));
      const phase = step === 0 ? 0 : (step - 1) % 3 + 1;
      const product = rows[row].map((value, index) => value * weights[index]);
      const outputs = rows.map((values, index) => step >= (index + 1) * 3 ? dot(values, weights) : null);
      const sum = phase === 0 ? 0 : product.slice(0, Math.min(phase, 2)).reduce((a, b) => a + b, 0);
      return frame(step === 0 ? "Read quantities and prices" : phase === 3 ? `Finish cart ${row + 1}` : `Multiply coordinate ${phase}`,
        step === 0 ? "A vector keeps related numbers in a fixed order: apples, then loaves of bread. Each matrix row is another cart." : phase === 3 ? `Add this row’s products. Cart ${row + 1} costs $${sum}. Reuse the same price vector for the next row.` : `${rows[row][phase - 1]} ${phase === 1 ? "apples" : "loaves"} × $${weights[phase - 1]} contributes $${product[phase - 1]}. Matching coordinates must refer to the same item.`,
        step === 0 ? "cart × prices = total" : phase === 3 ? `${product.join(" + ")} = ${sum}` : `${rows[row][phase - 1]} × ${weights[phase - 1]} = ${product[phase - 1]}`,
        metrics(["Cart", String(row + 1)], ["Running total", sum], ["Completed", `${outputs.filter((x) => x !== null).length} / 2`]),
        { kind: "products", rows, weights, outputs, activeRow: row, activeTerm: phase === 1 || phase === 2 ? phase - 1 : -1, terms: ["Apples", "Bread"], total: step ? sum : null, output: outputs[row] });
    });
  },
};

const probability: Experiment = {
  id: "probability", title: "Keep only the emails that match the evidence.",
  scenarios: [
    { id: "original", label: "Original inbox", description: "Among 100 messages, 20 are spam. The word “offer” appears in 15 spam messages and 4 legitimate messages." },
    { id: "false-matches", label: "More false matches", description: "The word still matches 15 spam messages, but now matches 16 legitimate messages." },
    { id: "more-spam", label: "More spam", description: "40 messages are spam. Keep the same clue rates: it matches 75% of spam (30) and 5% of ordinary mail (3)." },
  ],
  build(scenario) {
    const spam = scenario === "more-spam" ? 40 : 20;
    const spamMatches = scenario === "more-spam" ? 30 : 15;
    const otherMatches = scenario === "more-spam" ? 3 : scenario === "false-matches" ? 16 : 4;
    const matches = spamMatches + otherMatches;
    const captions = [
      `Before reading the word, ${spam} out of 100 messages are spam. This is the prior probability.`,
      `The evidence matches ${spamMatches} spam messages and ${otherMatches} legitimate messages. A match is not the same as being spam.`,
      `Condition on the evidence: keep only the ${matches} matching messages. The other messages no longer belong in this denominator.`,
      `${spamMatches} of the ${matches} matching messages are spam. The conditional probability is ${percent(spamMatches / matches)}.`,
    ];
    return captions.map((caption, stage) => frame(["Start with the whole inbox", "Mark the evidence", "Change the denominator", "Calculate the posterior"][stage], caption,
      stage < 2 ? `P(spam) = ${spam} / 100` : `P(spam | offer) = ${spamMatches} / (${spamMatches} + ${otherMatches})`,
      metrics(["Prior", percent(spam / 100)], ["Matches", String(matches)], ["Posterior", stage === 3 ? percent(spamMatches / matches) : "—"]),
      { kind: "population", spam, spamMatches, otherMatches, filtered: stage >= 2, stage }));
  },
};

const splits: Experiment = {
  id: "data-and-splits", title: "Separate learning from checking.",
  scenarios: [
    { id: "clean", label: "Clean split", description: "Twelve distinct source records are assigned to training, validation, and test sets." },
    { id: "leak", label: "Duplicate source", description: "The last test row is a copy of training record 2. Different row numbers do not make it new evidence." },
  ],
  build(scenario) {
    const records = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, source: scenario === "leak" && index === 11 ? 2 : index + 1, group: index < 8 ? "Training" : index < 10 ? "Validation" : "Test" }));
    const training = new Set(records.filter((row) => row.group === "Training").map((row) => row.source));
    const overlaps = records.filter((row) => row.group !== "Training" && training.has(row.source)).map((row) => row.id);
    const captions = ["Set aside the roles before fitting or tuning anything. The split is part of the experimental design.", "Use the 8 training records to fit model parameters and learned preprocessing, such as a mean used for normalization.", "Use 2 validation records to choose settings. They guide choices, so they are no longer an unbiased final check.", "Lock those choices, then evaluate once on the 2 test records. Repeatedly tuning to the test set would reuse the answer key.", overlaps.length ? "The source-ID audit finds a test copy of training record 2. The test set contains something the learner already saw." : "The source-ID audit finds no overlap. This checks membership, not whether the data represent future users well."];
    return captions.map((caption, stage) => frame(["Assign distinct roles", "Fit on training data", "Choose on validation data", "Check on held-out test data", "Audit source overlap"][stage], caption,
      stage === 4 ? `training source IDs ∩ held-out source IDs = ${overlaps.length ? "{2}" : "∅"}` : "12 records = 8 training + 2 validation + 2 test",
      metrics(["Training", "8"], ["Validation / test", "2 / 2"], ["Leaked sources", stage === 4 ? String(overlaps.length) : "—"]),
      { kind: "partitions", records, stage, overlaps: stage === 4 ? overlaps : [] }));
  },
};

const regression: Experiment = {
  id: "linear-regression", title: "Move the line and inspect its errors.",
  scenarios: [
    { id: "low", label: "Slope 1", description: "A $1 fixed fee plus $1 per kilogram underestimates these deliveries." },
    { id: "fit", label: "Slope 2", description: "A $1 fixed fee plus $2 per kilogram matches all three example receipts." },
    { id: "high", label: "Slope 3", description: "A $1 fixed fee plus $3 per kilogram makes the line too steep." },
    { id: "no-bias", label: "No fixed fee", description: "The per-kilogram price is $2, but the model omits the $1 fixed fee." },
  ],
  build(scenario) {
    const weight = scenario === "low" ? 1 : scenario === "high" ? 3 : 2;
    const bias = scenario === "no-bias" ? 0 : 1;
    const points = [1, 2, 3].map((x) => ({ x, y: 2 * x + 1, label: `${x} kg`, group: "train" as const }));
    const errors = points.map((p) => weight * p.x + bias - p.y);
    return Array.from({ length: 5 }, (_, step) => {
      const count = Math.min(step, 3);
      const sum = errors.slice(0, count).reduce((total, error) => total + error ** 2, 0);
      const active = Math.max(0, count - 1);
      return frame(step === 0 ? "Choose a line" : step === 4 ? "Average the squared errors" : `Predict receipt ${step}`,
        step === 0 ? `The model is cost = ${weight} × kilograms + ${bias}. The dots are known receipts, not predictions.` : step === 4 ? `The squared errors add to ${sum}. Divide by 3 examples: mean squared error is ${number(sum / 3)}.` : `At ${points[active].x} kg, predict ${weight * points[active].x + bias}. The receipt says ${points[active].y}. Error ${errors[active]}, squared error ${errors[active] ** 2}.`,
        step === 4 ? `MSE = ${sum} / 3 = ${number(sum / 3)}` : `prediction = ${weight} × x + ${bias}`,
        metrics(["Slope", weight], ["Fixed fee", bias], ["MSE", step === 4 ? number(sum / 3) : "—"]),
        { kind: "plot", points, curve: sampleCurve((x) => weight * x + bias), xLabel: "Weight (kg)", yLabel: "Cost ($)", xMax: 4, yMin: 0, yMax: 14, visibleValidation: false, activePoint: step > 0 && step < 4 ? active : -1, modelLabel: `ŷ = ${weight}x + ${bias}` });
    });
  },
};

const classification: Experiment = {
  id: "classification", title: "Turn a score into a decision.",
  scenarios: [
    { id: "two", label: "Two flagged words", description: "Use x = 2, score z = 2x − 3, and threshold 0.50." },
    { id: "one", label: "One flagged word", description: "Change only the word count to x = 1." },
    { id: "strict", label: "Threshold 0.80", description: "Keep x = 2 and require a score of at least 0.80 to flag the message." },
  ],
  build(scenario) {
    const x = scenario === "one" ? 1 : 2;
    const threshold = scenario === "strict" ? 0.8 : 0.5;
    const z = 2 * x - 3;
    const probability = 1 / (1 + Math.exp(-z));
    const captions = [`The feature is a count of flagged words: ${x}. The illustrative weight 2 and bias −3 are already chosen.`, `Multiply by the weight and add the bias: z = 2 × ${x} − 3 = ${z}. This raw score can be any real number.`, `Apply sigmoid: 1 / (1 + exp(${number(-z)})) = ${number(probability)}. The result lies between 0 and 1.`, `Compare ${number(probability)} with threshold ${threshold.toFixed(2)}. ${probability >= threshold ? "Flag" : "Pass"} this message. Changing the threshold changes the decision, not the model score.`];
    return captions.map((caption, stage) => frame(["Read the feature", "Calculate the raw score", "Map it through sigmoid", "Apply the threshold"][stage], caption,
      stage < 2 ? `z = 2 × ${x} − 3 = ${z}` : stage === 2 ? `σ(${z}) = ${number(probability)}` : `${number(probability)} ${probability >= threshold ? "≥" : "<"} ${threshold.toFixed(2)}`,
      metrics(["Raw score", stage >= 1 ? number(z) : "—"], ["Model score", stage >= 2 ? percent(probability) : "—"], ["Decision", stage === 3 ? probability >= threshold ? "Flag" : "Pass" : "—"]),
      { kind: "decision", x, weight: 2, bias: -3, z, probability, threshold, stage }));
  },
};

export const interpolate = (points: Point[], x: number) => points.reduce((sum, point, index) => sum + point.y * points.reduce((product, other, j) => index === j ? product : product * (x - other.x) / (point.x - other.x), 1), 0);
const overfitting: Experiment = {
  id: "overfitting", title: "A perfect training fit can be the worse model.",
  scenarios: [
    { id: "line", label: "Straight line", description: "The fitted line is 1.2 + 0.2x. It smooths over the training noise." },
    { id: "cubic", label: "Cubic curve", description: "The degree-3 curve passes through all four training points exactly." },
    { id: "constant", label: "Constant model", description: "Always predict 1.5. This simpler model misses the upward trend." },
  ],
  build(scenario) {
    const training: Point[] = [1, 2, 1, 2].map((y, x) => ({ x, y, group: "train" }));
    const validation: Point[] = [0.5, 1.5, 2.5].map((x) => ({ x, y: 1.2 + 0.2 * x, group: "validation" }));
    const fn = scenario === "cubic" ? (x: number) => interpolate(training, x) : scenario === "constant" ? () => 1.5 : (x: number) => 1.2 + 0.2 * x;
    const mse = (points: Point[]) => points.reduce((sum, p) => sum + (fn(p.x) - p.y) ** 2, 0) / points.length;
    const trainError = mse(training), validationError = mse(validation);
    return Array.from({ length: 4 }, (_, stage) => frame(["Fit only the training points", "Measure training error", "Reveal new validation points", "Compare both errors"][stage],
      stage === 0 ? "The filled dots are four noisy training observations. The model has not used the hollow validation points." : stage === 1 ? `Training MSE is ${number(trainError)}. A smaller training error alone does not tell us how well the pattern carries over.` : stage === 2 ? "Now reveal three separate validation examples from this toy’s underlying trend, y = 1.2 + 0.2x." : `Training MSE ${number(trainError)}; validation MSE ${number(validationError)}. Use validation to compare model choices, then keep a separate final test set.`,
      `MSE = average of (prediction − observed value)²`,
      metrics(["Training MSE", stage >= 1 ? number(trainError) : "—"], ["Validation MSE", stage >= 3 ? number(validationError) : "—"], ["Degree", scenario === "cubic" ? "3" : scenario === "line" ? "1" : "0"]),
      { kind: "plot", points: [...training, ...validation], curve: sampleCurve(fn, 3), xLabel: "Input x", yLabel: "Value y", xMax: 3, yMin: 0, yMax: 3, visibleValidation: stage >= 2, activePoint: -1, modelLabel: scenario === "cubic" ? "Interpolating cubic" : scenario === "constant" ? "y = 1.5" : "y = 1.2 + 0.2x" }));
  },
};

export const evaluationRecords = [
  { actual: true, score: 0.9 }, { actual: true, score: 0.6 }, { actual: true, score: 0.4 },
  { actual: false, score: 0.8 }, { actual: false, score: 0.5 }, { actual: false, score: 0.3 }, { actual: false, score: 0.2 }, { actual: false, score: 0.1 },
];
const evaluation: Experiment = {
  id: "evaluation", title: "Count what each decision gets right and wrong.",
  scenarios: [
    { id: "balanced", label: "Threshold 0.50", description: "Flag any message whose model score is at least 0.50." },
    { id: "strict", label: "Threshold 0.85", description: "Flag fewer messages. Inspect the missed spam as well as the false alarms." },
    { id: "lenient", label: "Threshold 0.35", description: "Catch every spam message in this example, including more legitimate messages." },
  ],
  build(scenario) {
    const threshold = scenario === "strict" ? 0.85 : scenario === "lenient" ? 0.35 : 0.5;
    return Array.from({ length: 9 }, (_, processed) => {
      let tp = 0, fp = 0, fn = 0, tn = 0;
      evaluationRecords.slice(0, processed).forEach((record) => { const predicted = record.score >= threshold; if (record.actual) { if (predicted) tp++; else fn++; } else { if (predicted) fp++; else tn++; } });
      const last = processed ? evaluationRecords[processed - 1] : null;
      const active = last ? { ...last, predicted: last.score >= threshold } : null;
      return frame(processed ? `Count email ${processed}` : "Start with empty counts",
        active ? `Email ${processed} is ${active.actual ? "spam" : "legitimate"}; score ${active.score.toFixed(2)} ${active.predicted ? "meets" : "falls below"} threshold ${threshold.toFixed(2)}. Add one ${active.actual ? active.predicted ? "true positive" : "false negative" : active.predicted ? "false positive" : "true negative"}.` : "We know the true labels of eight held-out messages. Counts are empty until a decision is evaluated.",
        `precision = ${tp} / (${tp} + ${fp}); recall = ${tp} / (${tp} + ${fn})`,
        metrics(["Precision", tp + fp ? percent(tp / (tp + fp)) : "—"], ["Recall", tp + fn ? percent(tp / (tp + fn)) : "—"], ["Accuracy", processed ? percent((tp + tn) / processed) : "—"]),
        { kind: "confusion", tp, fp, fn, tn, processed, total: evaluationRecords.length, threshold, active });
    });
  },
};

const neurons: Experiment = {
  id: "neurons", title: "Build one neuron from two contributions.",
  scenarios: [
    { id: "positive", label: "Positive signal", description: "Inputs [2, 1], weights [0.5, −1], bias 0.5, and ReLU." },
    { id: "suppressed", label: "Suppressed input", description: "Change the first input to 0. ReLU will clamp the negative total to zero." },
    { id: "identity", label: "No activation", description: "Use the suppressed inputs but pass the total through unchanged." },
  ],
  build(scenario) {
    const inputs = [scenario === "positive" ? 2 : 0, 1], weights = [0.5, -1], bias = 0.5;
    const products = inputs.map((x, i) => x * weights[i]), z = dot(inputs, weights) + bias;
    const output = scenario === "identity" ? z : Math.max(0, z);
    return Array.from({ length: 5 }, (_, stage) => frame(["Read the inputs", "Weight the first input", "Weight the second input", "Add the bias", "Apply the activation"][stage],
      stage === 0 ? "A neuron starts as a weighted sum. Its inputs do not need to be binary switches." : stage < 3 ? `Input ${stage}: ${inputs[stage - 1]} × ${weights[stage - 1]} = ${products[stage - 1]}. A negative weight subtracts from the total.` : stage === 3 ? `Add the two contributions and bias: ${products.join(" + ")} + ${bias} = ${z}.` : scenario === "identity" ? `With no activation, output = ${z}. Stacking only affine operations still gives an affine function.` : `ReLU returns max(0, ${z}) = ${output}. This nonlinear step changes what a network can represent.`,
      stage < 3 ? "weighted contribution = input × weight" : stage === 3 ? `z = ${products.join(" + ")} + ${bias}` : scenario === "identity" ? `a = z = ${z}` : `a = max(0, ${z}) = ${output}`,
      metrics(["Weighted sum", stage >= 3 ? number(z) : "—"], ["Bias", bias], ["Output", stage === 4 ? number(output) : "—"]),
      { kind: "products", rows: [inputs], weights, outputs: [stage === 4 ? output : null], activeRow: 0, activeTerm: stage === 1 || stage === 2 ? stage - 1 : -1, terms: ["Input 1", "Input 2"], bias, activation: scenario === "identity" ? "Identity" : "ReLU", total: stage >= 3 ? z : null, output: stage === 4 ? output : null }));
  },
};

const backprop: Experiment = {
  id: "backpropagation", title: "Run forward, then carry derivatives backward.",
  scenarios: [
    { id: "original", label: "Target 4", description: "x = 2, both weights start at 1, target 4, and learning rate 0.10." },
    { id: "lower", label: "Target 1", description: "Keep the same network and lower the target. The gradient changes sign." },
    { id: "zero", label: "First weight 0", description: "The first layer starts at zero. Inspect which weight initially receives a zero gradient." },
  ],
  build(scenario) {
    const x = 2, target = scenario === "lower" ? 1 : 4;
    const w1 = scenario === "zero" ? 0 : 1, w2 = 1, hidden = w1 * x, prediction = w2 * hidden;
    const error = prediction - target, loss = 0.5 * error ** 2;
    const g2 = error * hidden, gh = error * w2, g1 = gh * x;
    const nextW1 = w1 - 0.1 * g1, nextW2 = w2 - 0.1 * g2;
    const nextPrediction = nextW2 * nextW1 * x, nextLoss = 0.5 * (nextPrediction - target) ** 2;
    const captions = ["The two-layer toy is h = w₁x, then prediction = w₂h. We omit biases and activations to isolate the chain rule.", `Forward: h = ${w1} × ${x} = ${hidden}. Store this value; the backward pass needs it.`, `Forward: prediction = ${w2} × ${hidden} = ${prediction}.`, `Loss = ½(${prediction} − ${target})² = ${loss}. The derivative with respect to the prediction is ${error}.`, `For w₂, multiply the upstream derivative by h: ${error} × ${hidden} = ${g2}.`, `For h, multiply by the old w₂: ${error} × ${w2} = ${gh}.`, `For w₁, continue through h = w₁x: ${gh} × ${x} = ${g1}.`, `After calculating both gradients, update together: w₁ = ${number(nextW1)}, w₂ = ${number(nextW2)}. The new loss is ${number(nextLoss)}.`];
    const calculations = ["x → h → prediction → loss", `h = ${w1} × ${x}`, `ŷ = ${w2} × ${hidden}`, `∂L/∂ŷ = ${prediction} − ${target}`, `∂L/∂w₂ = ${error} × ${hidden}`, `∂L/∂h = ${error} × ${w2}`, `∂L/∂w₁ = ${gh} × ${x}`, "w₁′ = w₁ − 0.1g₁; w₂′ = w₂ − 0.1g₂"];
    return captions.map((caption, stage) => frame(["Read the graph", "Compute the hidden value", "Compute the prediction", "Differentiate the loss", "Find the second weight’s gradient", "Pass the gradient to h", "Find the first weight’s gradient", "Update both weights"][stage], caption, calculations[stage],
      metrics(["First gradient", stage >= 6 ? number(g1) : "—"], ["Second gradient", stage >= 4 ? number(g2) : "—"], ["Loss", stage === 7 ? number(nextLoss) : stage >= 3 ? number(loss) : "—"]),
      { kind: "chain", nodes: [{ label: "Input x", value: x }, { label: "Hidden h", value: stage === 7 ? nextW1 * x : hidden }, { label: "Prediction", value: stage === 7 ? nextPrediction : prediction }, { label: "Loss", value: stage === 7 ? nextLoss : loss }], weights: stage === 7 ? [nextW1, nextW2] : [w1, w2], gradients: [stage >= 6 ? g1 : null, stage >= 4 ? g2 : null], active: stage < 4 ? Math.min(stage, 3) : stage === 4 ? 2 : stage === 5 ? 1 : 0, backward: stage >= 3 && stage < 7, updated: stage === 7 }));
  },
};

const embeddings: Experiment = {
  id: "embeddings", title: "Compare directions, not just raw coordinates.",
  scenarios: [
    { id: "cat", label: "Cat query", description: "Compare query [1, 0] with three illustrative candidate vectors." },
    { id: "vehicle", label: "Vehicle query", description: "Turn the query to [0, 1]. The ranking should change." },
    { id: "scaled", label: "Scale the query", description: "Scale [1, 0] to [3, 0]. Cosine similarity should stay the same." },
    { id: "zero", label: "Zero vector", description: "The direction of [0, 0] is undefined, so cosine cannot rank these candidates." },
  ],
  build(scenario) {
    const query = scenario === "vehicle" ? [0, 1] : scenario === "scaled" ? [3, 0] : scenario === "zero" ? [0, 0] : [1, 0];
    const candidates = [{ label: "Kitten", vector: [0.8, 0.2] }, { label: "Dog", vector: [0.7, 0.3] }, { label: "Car", vector: [0, 1] }].map((candidate) => ({ ...candidate, score: cosine(query, candidate.vector) }));
    const ranked = [...candidates].sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
    return Array.from({ length: 5 }, (_, stage) => {
      const active = Math.min(2, Math.max(0, stage - 1)), candidate = candidates[active];
      return frame(stage === 0 ? "Read the vector directions" : stage === 4 ? "Rank the candidates" : `Compare with ${candidate.label.toLowerCase()}`,
        stage === 0 ? "These hand-chosen two-dimensional vectors illustrate a similarity calculation. They are not the output of a trained language model." : stage === 4 ? ranked[0].score === null ? "A zero query has zero norm. There is no valid cosine score or nearest-direction ranking." : `${ranked[0].label} has the largest cosine score, ${number(ranked[0].score)}. A ranking depends on both the representation and the chosen metric.` : candidate.score === null ? "The denominator contains a zero norm. Do not replace this undefined score with a made-up similarity." : `Dot product ${number(dot(query, candidate.vector))}, divided by the product of the two lengths, gives cosine ${number(candidate.score)}.`,
        "cosine(q, v) = (q · v) / (‖q‖ ‖v‖)",
        metrics(["Query length", Math.sqrt(dot(query, query))], ["Compared", `${Math.min(stage, 3)} / 3`], ["Best match", stage === 4 && ranked[0].score !== null ? ranked[0].label : "—"]),
        { kind: "vectors", query, queryLabel: scenario === "vehicle" ? "Vehicle" : "Cat", candidates, revealed: Math.min(stage, 3), active: stage > 0 && stage < 4 ? active : -1 });
    });
  },
};

export function optimizerTrace(algorithm: string, updates = 10) {
  let weight = 4, velocity = 0, m = 0, v = 0;
  const result = [{ step: 0, weight, loss: 0.5 * weight ** 2, gradient: weight, update: 0, memory: 0, secondMoment: 0 }];
  for (let step = 1; step <= updates; step++) {
    const gradient = weight;
    let update: number;
    if (algorithm === "momentum") { velocity = 0.8 * velocity + 0.1 * gradient; update = velocity; }
    else if (algorithm === "adam") { m = 0.9 * m + 0.1 * gradient; v = 0.999 * v + 0.001 * gradient ** 2; const mHat = m / (1 - 0.9 ** step), vHat = v / (1 - 0.999 ** step); update = 0.1 * mHat / (Math.sqrt(vHat) + 1e-8); }
    else update = 0.1 * gradient;
    weight -= update;
    result.push({ step, weight, loss: 0.5 * weight ** 2, gradient, update, memory: algorithm === "adam" ? m : velocity, secondMoment: v });
  }
  return result;
}
const optimizers: Experiment = {
  id: "optimizers", title: "Inspect what the optimizer remembers.",
  scenarios: [
    { id: "gd", label: "Gradient descent", description: "Use only the current gradient: update = 0.10 × gradient." },
    { id: "momentum", label: "Momentum", description: "Keep velocity: v = 0.80 × previous v + 0.10 × gradient." },
    { id: "adam", label: "Adam", description: "Keep moving averages of the gradient and its square, with bias correction. α = 0.10, β₁ = 0.90, β₂ = 0.999." },
  ],
  build(scenario) {
    const trace = optimizerTrace(scenario), baseline = optimizerTrace("gd");
    return trace.map((state) => frame(state.step ? `Update ${state.step}` : "Start at weight 4",
      state.step === 0 ? "Our entire objective is L(w) = ½w², so the gradient is w. This is an illustrative mechanism comparison, not a benchmark of tuned optimizers." : scenario === "momentum" ? `Gradient ${number(state.gradient)} combines with previous velocity. Subtract velocity ${number(state.update)} to reach w = ${number(state.weight)}.` : scenario === "adam" ? `Update the first and second moments, correct their initial zero bias, then divide the corrected first moment by the square root of the corrected second moment.` : `Use gradient ${number(state.gradient)}. Subtract 0.10 × gradient = ${number(state.update)}.`,
      state.step === 0 ? "L = ½w²; gradient = w; all optimizer memory starts at 0" : scenario === "adam" ? `m̂ = ${number(state.memory)} / (1 − 0.9^${state.step}) = ${number(state.memory / (1 - .9 ** state.step))}; ŝ = ${state.secondMoment.toFixed(6)} / (1 − 0.999^${state.step}) = ${number(state.secondMoment / (1 - .999 ** state.step))}; update = ${number(state.update)}` : scenario === "momentum" ? `v = 0.80 × ${number(trace[state.step - 1].update)} + 0.10 × ${number(state.gradient)} = ${number(state.update)}; w′ = ${number(state.weight)}` : `w′ = ${number(state.gradient)} − 0.10 × ${number(state.gradient)} = ${number(state.weight)}`,
      metrics(["Weight", state.weight], ["Loss", state.loss], [scenario === "adam" ? "First moment" : "Update", scenario === "adam" ? state.memory : state.update]),
      { kind: "plot", points: trace.slice(0, state.step + 1).map((s) => ({ x: s.step, y: s.loss, group: "train" })), curve: trace.slice(0, state.step + 1).map((s) => ({ x: s.step, y: s.loss })), reference: baseline.map((s) => ({ x: s.step, y: s.loss })), xLabel: "Updates", yLabel: "Loss", xMax: 10, yMin: 0, yMax: 9, visibleValidation: false, activePoint: state.step, modelLabel: scenario === "adam" ? "Adam" : scenario === "momentum" ? "Momentum" : "Gradient descent" }));
  },
};

export const mergeRules: [string, string][] = [["l", "o"], ["lo", "w"], ["e", "r"], ["low", "er"], ["e", "s"], ["es", "t"]];
export const vocabulary = ["L", "l", "o", "w", "e", "r", "s", "t", "lo", "low", "er", "lower", "es", "est"];
export function bpeTrace(text: string) {
  const states = [{ tokens: [...text], pair: null as string | null }];
  for (let guard = 0; guard < text.length; guard++) {
    const tokens = states[states.length - 1].tokens;
    let bestRank = Infinity, location = -1;
    tokens.slice(0, -1).forEach((token, index) => { const rank = mergeRules.findIndex(([a, b]) => a === token && b === tokens[index + 1]); if (rank >= 0 && rank < bestRank) { bestRank = rank; location = index; } });
    if (location < 0) break;
    states.push({ tokens: [...tokens.slice(0, location), tokens[location] + tokens[location + 1], ...tokens.slice(location + 2)], pair: `${tokens[location]} + ${tokens[location + 1]}` });
  }
  return states;
}
const tokenization: Experiment = {
  id: "tokenization", title: "Merge pieces, then look up their IDs.",
  scenarios: [
    { id: "lower", label: "lower", description: "Encode a word using a tiny, supplied table of ranked character-pair merges." },
    { id: "lowest", label: "lowest", description: "A related word follows some of the same merges but ends as two tokens." },
    { id: "capital", label: "Lower", description: "Capital L is a different symbol. Case changes which pairs are eligible." },
  ],
  build(scenario) {
    const text = scenario === "lowest" ? "lowest" : scenario === "capital" ? "Lower" : "lower", states = bpeTrace(text);
    return [...states, states[states.length - 1]].map((state, index) => {
      const showIds = index === states.length, ids = state.tokens.map((token) => vocabulary.indexOf(token) + 1);
      return frame(index === 0 ? "Start from characters" : showIds ? "Look up token IDs" : `Merge ${state.pair}`,
        index === 0 ? "This toy character-BPE encoder starts with individual characters. Real tokenizers may begin from bytes and apply additional preprocessing." : showIds ? `The final pieces are ${state.tokens.join(" | ")}. Look up each in this toy vocabulary: IDs ${ids.join(", ")}. IDs are identifiers, not meanings or ordinal scores.` : `Among adjacent pairs, choose the applicable rule with the lowest rank. Merge ${state.pair}; do not merge merely because two letters form an English word.`,
        showIds ? `tokens → [${ids.join(", ")}]` : state.pair ? `ranked pair ${state.pair} → merged token` : `“${text}” → characters`,
        metrics(["Characters", String(text.length)], ["Pieces", String(state.tokens.length)], ["Final IDs", showIds ? String(ids.length) : "—"]),
        { kind: "tokens", text, tokens: state.tokens, ids, pair: state.pair, showIds });
    });
  },
};

export function attend(query: number[], keys: number[][], values: number[][], allowed = keys.map(() => true)) {
  if (keys.length !== values.length || !keys.length) throw new RangeError("Keys and values must have matching rows.");
  const scores = keys.map((key) => dot(query, key) / Math.sqrt(query.length));
  const weights = softmax(scores, allowed);
  const output = values[0].map((_, coordinate) => values.reduce((sum, value, index) => sum + weights[index] * value[coordinate], 0));
  return { scores, weights, output };
}
const attention: Experiment = {
  id: "attention", title: "Mix values using the query’s match scores.",
  scenarios: [
    { id: "first", label: "First coordinate", description: "Query [1, 0] compares with three supplied 2D keys. These vectors are illustrative, not trained." },
    { id: "second", label: "Second coordinate", description: "Change only the query to [0, 1]. Inspect the new mixture of the same values." },
    { id: "causal", label: "Causal mask", description: "The query is at position 2. Exclude the future key/value at position 3 before normalizing." },
  ],
  build(scenario) {
    const query = scenario === "second" ? [0, 1] : [1, 0], keys = [[1, 0], [0, 1], [1, 1]], values = [[2, 0], [0, 2], [1, 1]], allowed = [true, true, scenario !== "causal"];
    const { scores, weights, output } = attend(query, keys, values, allowed);
    return Array.from({ length: 8 }, (_, stage) => {
      const active = stage >= 1 && stage <= 3 ? stage - 1 : stage >= 5 ? stage - 5 : -1;
      return frame(stage === 0 ? "Read queries, keys, and values" : stage < 4 ? `Score key ${stage}` : stage === 4 ? "Normalize allowed scores" : `Add value ${active + 1}’s contribution`,
        stage === 0 ? "Queries and keys determine matching scores. Values are the information being mixed. A key and its value have the same row position." : stage < 4 ? !allowed[active] ? "This key is in the future. Mask it out before softmax; its weight will be exactly zero." : `Dot product ${number(dot(query, keys[active]))}, divided by √2, gives scaled score ${number(scores[active])}.` : stage === 4 ? `Apply softmax only to allowed scores. Weights [${weights.map(number).join(", ")}] add to 1.` : `Multiply value ${active + 1} by weight ${number(weights[active])}, then add it to the running output. ${!allowed[active] ? "The masked value contributes zero." : ""}`,
        stage < 4 ? "scoreᵢ = (q · kᵢ) / √2" : stage === 4 ? "aᵢ = exp(scoreᵢ) / Σ exp(allowed scores)" : `output = Σ aᵢvᵢ`,
        metrics(["Weight sum", stage >= 4 ? number(weights.reduce((a, b) => a + b, 0)) : "—"], ["Output 1", stage === 7 ? number(output[0]) : "—"], ["Output 2", stage === 7 ? number(output[1]) : "—"]),
        { kind: "attention", query, keys, values, scores, weights, allowed, stage, active, output: values[0].map((_, coordinate) => values.slice(0, Math.max(0, stage - 4)).reduce((sum, value, index) => sum + weights[index] * value[coordinate], 0)) });
    });
  },
};

export function transformerTrace(position = 2, residual = true) {
  const inputs = [[1, 0, 0], [0, 1, 0], [2, 1, 0]], input = inputs[position];
  const attention = attend(input, inputs, inputs, inputs.map((_, index) => index <= position));
  const add1 = attention.output.map((value, index) => value + (residual ? input[index] : 0));
  const normalized1 = layerNorm(add1), hidden = normalized1.map((value) => Math.max(0, value));
  const feedForward = hidden.map((value, index) => value * [0.5, 0.25, 0.1][index]);
  const add2 = feedForward.map((value, index) => value + (residual ? normalized1[index] : 0));
  const normalized2 = layerNorm(add2);
  return [input, attention.output, add1, normalized1, feedForward, add2, normalized2];
}
const transformers: Experiment = {
  id: "transformers", title: "Follow one token through a decoder block.",
  scenarios: [
    { id: "last", label: "Last token", description: "A three-coordinate, one-head, post-norm decoder block. Toy token vectors already include positional information." },
    { id: "middle", label: "Middle token", description: "Inspect position 2. Causal attention must ignore position 3." },
    { id: "no-residual", label: "Remove skips", description: "An ablation: omit both residual additions and observe a different output. This is not the standard block." },
  ],
  build(scenario) {
    const vectors = transformerTrace(scenario === "middle" ? 1 : 2, scenario !== "no-residual");
    const stages = ["Input", "Attention", "Add skip", "Normalize", "Feed-forward", "Add skip", "Normalize"];
    const normalization = (input: number[]) => {
      const mean = input.reduce((sum, value) => sum + value, 0) / input.length;
      const variance = input.reduce((sum, value) => sum + (value - mean) ** 2, 0) / input.length;
      return `Mean ${number(mean)}; variance ${number(variance)}. Subtract the mean from each coordinate, then divide by √(variance + 0.00001).`;
    };
    const captions = ["The token enters as a vector. We trace one small decoder block, not a complete language model or a generated sentence.", "Scaled dot-product attention mixes allowed token values. Q, K, and V projections are identity matrices in this toy.", scenario === "no-residual" ? "The ablation leaves only the attention result. Compare it with the standard skip connection." : "Add the original token vector to the attention result. The skip path carries information around the sublayer.", normalization(vectors[2]), "Apply ReLU coordinatewise, then a diagonal output map [0.5, 0.25, 0.1]. Real feed-forward layers usually use a larger hidden dimension.", scenario === "no-residual" ? "The second skip is omitted too. The ablated pipeline is a comparison, not a recommended architecture." : "Add the feed-forward output to its input. Each sublayer transforms a copy while the skip preserves a direct path.", `${normalization(vectors[5])} The resulting vector is not a word.`];
    return vectors.map((vector, active) => frame(stages[active], captions[active], active === 3 || active === 6 ? "LN(z) = (z − mean(z)) / √(variance(z) + 10⁻⁵)" : active === 4 ? "FFN(z) = diag(0.5, 0.25, 0.1) ReLU(z)" : active === 2 || active === 5 ? scenario === "no-residual" ? "skip disabled: use only the sublayer output" : "skip output = sublayer input + sublayer output" : "single-head causal attention → token vector",
      metrics(["Coordinate 1", vector[0]], ["Coordinate 2", vector[1]], ["Coordinate 3", vector[2]]),
      { kind: "pipeline", stages, active, heading: stages[active], residuals: scenario !== "no-residual", context: [{ label: "A", value: "[1, 0, 0]" }, { label: "B", value: "[0, 1, 0]" }, { label: "C", value: "[2, 1, 0]" }], values: vector.map((value, index) => ({ label: `Coordinate ${index + 1}`, value: number(value) })), result: `[${vector.map(number).join(", ")}]`, detail: active === 6 ? "Output vector, before any vocabulary readout" : "The current token vector" }));
  },
};

export const policyDocuments = [
  { id: "returns", title: "Returns policy", text: "Unopened books may be returned within 30 days with a receipt.", terms: ["unopened", "book", "return", "days", "receipt"], answer: "An unopened book can be returned within 30 days with a receipt. [Returns policy]" },
  { id: "delivery", title: "Delivery policy", text: "Standard delivery takes 3 to 5 days.", terms: ["standard", "delivery", "days", "arrive"], answer: "Standard delivery takes 3 to 5 days. [Delivery policy]" },
  { id: "faulty", title: "Faulty items", text: "Faulty items can be exchanged within 60 days.", terms: ["faulty", "item", "exchange", "days"], answer: "Faulty items can be exchanged within 60 days. [Faulty items]" },
];
const normalizedTerms: Record<string, string> = { books: "book", returned: "return", returns: "return", colors: "color" };
export const queryTerms = (query: string) => [...new Set(query.toLowerCase().match(/[a-z]+/g) || [])].filter((word) => !["how", "many", "may", "i", "an", "a", "the", "what", "is", "does", "when", "can", "of", "are"].includes(word)).map((word) => (normalizedTerms[word] || word));
export const retrieve = (query: string) => policyDocuments.map((document) => ({ ...document, score: queryTerms(query).filter((term) => document.terms.includes(term)).length })).sort((a, b) => b.score - a.score);
const retrieval: Experiment = {
  id: "retrieval-and-agents", title: "Ask for evidence or use a calculation tool.",
  scenarios: [
    { id: "returns", label: "Returns", description: "Ask: How many days may I return an unopened book? Search a tiny supplied policy corpus." },
    { id: "delivery", label: "Delivery", description: "Ask: When does standard delivery arrive? A different source should support the answer." },
    { id: "unknown", label: "No evidence", description: "Ask about gift-wrap colors. No supplied document supports a response." },
    { id: "calculator", label: "Calculator", description: "Ask: What is 17 × 24? Route to a typed multiplication function, not document search." },
  ],
  build(scenario) {
    const query = scenario === "delivery" ? "When does standard delivery arrive?" : scenario === "unknown" ? "What gift wrap colors are available?" : scenario === "calculator" ? "What is 17 × 24?" : "How many days may I return an unopened book?";
    const ranked = retrieve(query), selected = ranked[0].score > 0 ? ranked[0] : null, calculator = scenario === "calculator", result = calculator ? "408" : selected ? selected.text : "No supporting source found.";
    const answer = calculator ? "17 × 24 = 408. [multiply(17, 24)]" : selected ? selected.answer : "The supplied policies do not say which gift-wrap colors are available.";
    const stages = ["Question", "Choose tool", "Execute", "Read result", "Ground response", "Check and stop"];
    return stages.map((heading, active) => frame(heading,
      active === 0 ? "This is a deterministic local teaching workflow, not a live language model. The routing, tool arguments, results, and evidence are inspectable." : active === 1 ? calculator ? "Arithmetic goes to multiply(a, b). Its typed arguments are numbers; no arbitrary code is executed." : "A policy question goes to search(query). This toy ranks documents by normalized keyword overlap, not semantic embeddings." : active === 2 ? calculator ? "Multiply 17 by 24: 17 × (20 + 4) = 340 + 68 = 408." : `Document scores: ${ranked.map((d) => `${d.title} ${d.score}`).join(", ")}. Zero matches mean no retrieved support.` : active === 3 ? `Tool result: ${result}` : active === 4 ? selected || calculator ? "Construct the response from the tool result and attach its source. A citation must support the actual claim, not merely look relevant." : "Abstain from the unsupported claim. Retrieval cannot supply a fact that is absent from the corpus." : "Check the claim against the result, then stop. Real agent systems also need tool validation, permissions, budgets, and evaluation.",
      calculator ? "multiply({ a: 17, b: 24 }) → 408" : `search(query) → ranked sources → supported claim or abstention`,
      metrics(["Tool calls", active >= 2 ? "1" : "0"], ["Evidence", active >= 3 ? calculator || selected ? "Found" : "None" : "—"], ["Response", active >= 4 ? calculator || selected ? "Grounded" : "Abstain" : "—"]),
      { kind: "pipeline", stages, active, heading, context: policyDocuments.map((document) => ({ label: document.title, value: document.text })), values: [{ label: "Question", value: query }, { label: "Tool", value: active >= 1 ? calculator ? "multiply(17, 24)" : "search(policy corpus)" : "—" }, { label: "Tool result", value: active >= 3 ? result : "—" }], result: active >= 4 ? answer : "Response waits for the tool result.", detail: calculator ? "Calculation trace" : "Retrieved evidence and source" }));
  },
};

export const experiments: Record<string, Experiment> = Object.fromEntries([vectors, probability, splits, regression, classification, overfitting, evaluation, neurons, backprop, embeddings, optimizers, tokenization, attention, transformers, retrieval].map((experiment) => [experiment.id, experiment]));
export function prepareExperiment(id: string): PreparedExperiment {
  const experiment = experiments[id];
  if (!experiment) throw new RangeError(`Unknown experiment: ${id}`);
  return { id, title: experiment.title, scenarios: experiment.scenarios.map((scenario) => ({ ...scenario, frames: experiment.build(scenario.id) })) };
}
