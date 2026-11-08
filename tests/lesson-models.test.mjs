import test from "node:test";
import assert from "node:assert/strict";
import { experiments, prepareExperiment, dot, softmax, cosine, layerNorm, interpolate, optimizerTrace, bpeTrace, vocabulary, attend, transformerTrace, retrieve } from "../lib/lessons/models.ts";

const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);
const frames = (id, scenario) => experiments[id].build(scenario || experiments[id].scenarios[0].id);
const last = (id, scenario) => frames(id, scenario).at(-1);

test("all published concepts produce complete finite, serializable semantic traces", () => {
  assert.equal(Object.keys(experiments).filter((id) => !/^l\d+$/.test(id)).length, 15);
  for (const id of Object.keys(experiments)) {
    const experiment = prepareExperiment(id);
    assert.ok(experiment.scenarios.length >= 2);
    for (const scenario of experiment.scenarios) {
      assert.ok(scenario.frames.length >= 3);
      for (const frame of scenario.frames) {
        assert.ok(frame.title && frame.caption && frame.calculation);
        assert.equal(frame.metrics.length, 3);
        assert.ok(frame.metrics.every((m) => m.label && m.value && !/NaN|Infinity/.test(m.value)));
        const numericValues = [];
        const visit = (value) => { if (typeof value === "number") numericValues.push(value); else if (value && typeof value === "object") Object.values(value).forEach(visit); };
        visit(frame.scene);
        assert.ok(numericValues.every(Number.isFinite), id);
        assert.doesNotThrow(() => JSON.stringify(frame));
      }
    }
  }
});

test("matrix rows preserve coordinate meaning and respond to quantity and price changes", () => {
  assert.deepEqual(last("vectors-and-matrices").scene.outputs, [7, 11]);
  assert.deepEqual(last("vectors-and-matrices", "more-bread").scene.outputs, [10, 11]);
  assert.deepEqual(last("vectors-and-matrices", "price-change").scene.outputs, [8, 14]);
  assert.throws(() => dot([1], [1, 2]), RangeError);
});

test("Bayes counts use evidence matches as the denominator", () => {
  const result = last("probability");
  close(result.scene.spamMatches / (result.scene.spamMatches + result.scene.otherMatches), 15 / 19);
  assert.equal(result.metrics[2].value, "78.9%");
  assert.equal(last("probability", "false-matches").metrics[2].value, "48.4%");
  assert.equal(last("probability", "more-spam").metrics[2].value, "90.9%");
});

test("a new test row number does not hide a duplicate training source", () => {
  assert.deepEqual(last("data-and-splits", "clean").scene.overlaps, []);
  const leaked = last("data-and-splits", "leak").scene;
  assert.deepEqual(leaked.overlaps, [12]);
  assert.equal(leaked.records[11].source, leaked.records[1].source);
});

test("regression errors include the fixed fee and average all squared residuals", () => {
  assert.equal(last("linear-regression", "low").metrics[2].value, "4.667");
  assert.equal(last("linear-regression", "fit").metrics[2].value, "0.000");
  assert.equal(last("linear-regression", "high").metrics[2].value, "4.667");
  assert.equal(last("linear-regression", "no-bias").metrics[2].value, "1.000");
});

test("changing only the threshold preserves the logistic model score", () => {
  const normal = last("classification", "two").scene, strict = last("classification", "strict").scene;
  close(normal.probability, 1 / (1 + Math.exp(-1)));
  assert.equal(normal.probability, strict.probability);
  assert.ok(normal.probability >= normal.threshold && strict.probability < strict.threshold);
});

test("interpolation fits training observations but misses the held-out trend", () => {
  const points = [1, 2, 1, 2].map((y, x) => ({ x, y }));
  points.forEach((p) => close(interpolate(points, p.x), p.y));
  const error = [.5, 1.5, 2.5].reduce((sum, x) => sum + (interpolate(points, x) - (1.2 + .2 * x)) ** 2, 0) / 3;
  close(error, 0.32666666666666666);
  assert.equal(last("overfitting", "cubic").metrics[0].value, "0.000");
  assert.equal(last("overfitting", "line").metrics[1].value, "0.000");
});

test("confusion counts and denominators change with threshold, not labels", () => {
  for (const [scenario, expected] of [["balanced", [2, 2, 1, 3]], ["strict", [1, 0, 2, 5]], ["lenient", [3, 2, 0, 3]]]) {
    const { tp, fp, fn, tn } = last("evaluation", scenario).scene;
    assert.deepEqual([tp, fp, fn, tn], expected);
    assert.equal(tp + fn, 3); assert.equal(fp + tn, 5);
  }
  assert.deepEqual(frames("evaluation")[0].metrics.map((m) => m.value), ["—", "—", "—"]);
});

test("ReLU clips a negative pre-activation while identity preserves it", () => {
  close(last("neurons", "positive").scene.output, .5);
  close(last("neurons", "suppressed").scene.total, -.5);
  close(last("neurons", "suppressed").scene.output, 0);
  close(last("neurons", "identity").scene.output, -.5);
});

test("backpropagation gradients agree with independent finite differences", () => {
  for (const [scenario, w1, target] of [["original", 1, 4], ["lower", 1, 1], ["zero", 0, 4]]) {
    const loss = (a, b) => .5 * (b * a * 2 - target) ** 2;
    const epsilon = 1e-5;
    const gradients = last("backpropagation", scenario).scene.gradients;
    close(gradients[0], (loss(w1 + epsilon, 1) - loss(w1 - epsilon, 1)) / (2 * epsilon), 1e-8);
    close(gradients[1], (loss(w1, 1 + epsilon) - loss(w1, 1 - epsilon)) / (2 * epsilon), 1e-8);
    const updated = last("backpropagation", scenario).scene;
    close(updated.nodes[3].value, loss(updated.weights[0], updated.weights[1]));
  }
  close(last("backpropagation").scene.nodes[2].value, 3.92);
  close(last("backpropagation").scene.nodes[3].value, .0032);
});

test("cosine is invariant to positive scaling and undefined for a zero vector", () => {
  close(cosine([1, 0], [.8, .2]), .8 / Math.sqrt(.68));
  close(cosine([1, 0], [.8, .2]), cosine([3, 0], [.8, .2]));
  assert.equal(cosine([0, 0], [1, 0]), null);
  assert.ok(last("embeddings", "zero").scene.candidates.every((c) => c.score === null));
});

test("optimizer memory and Adam bias correction match the published arithmetic", () => {
  close(optimizerTrace("gd")[2].weight, 3.24);
  close(optimizerTrace("momentum")[2].update, .68);
  close(optimizerTrace("momentum")[2].weight, 2.92);
  close(optimizerTrace("adam")[1].memory, .4);
  close(optimizerTrace("adam")[1].secondMoment, .016);
  close(optimizerTrace("adam")[1].weight, 3.9, 1e-8);
  for (const algorithm of ["gd", "momentum", "adam"]) optimizerTrace(algorithm).forEach((s) => close(s.loss, .5 * s.weight ** 2));
});

test("ranked merges preserve text and use the matching vocabulary IDs", () => {
  for (const [text, expected] of [["lower", ["lower"]], ["lowest", ["low", "est"]], ["Lower", ["L", "o", "w", "er"]]]) {
    const trace = bpeTrace(text);
    trace.forEach((state, index) => { assert.equal(state.tokens.join(""), text); if (index) assert.equal(state.tokens.length, trace[index - 1].tokens.length - 1); });
    assert.deepEqual(trace.at(-1).tokens, expected);
  }
  assert.equal(vocabulary.indexOf("lower") + 1, 12);
  assert.deepEqual(last("tokenization", "lowest").scene.ids, [10, 14]);
});

test("softmax is shift invariant and the causal mask excludes a future value", () => {
  const keys = [[1, 0], [0, 1], [1, 1]], values = [[2, 0], [0, 2], [1, 1]];
  const full = attend([1, 0], keys, values);
  close(full.weights.reduce((a, b) => a + b), 1);
  close(full.output[0], 1.2033362784035155, 1e-6);
  const masked = attend([1, 0], keys, values, [true, true, false]);
  assert.equal(masked.weights[2], 0);
  assert.deepEqual(masked.output, attend([1, 0], keys, [[2, 0], [0, 2], [1000, 1000]], [true, true, false]).output);
  softmax([1000, 1001]).forEach((v, i) => close(v, softmax([0, 1])[i]));
  assert.throws(() => softmax([1], [false]), RangeError);
});

test("transformer residuals and layer normalization preserve the specified computation", () => {
  const trace = transformerTrace();
  assert.equal(trace.length, 7);
  trace[2].forEach((v, i) => close(v, trace[0][i] + trace[1][i]));
  trace[5].forEach((v, i) => close(v, trace[3][i] + trace[4][i]));
  for (const values of [trace[3], trace[6], layerNorm([2, 4, 6])]) close(values.reduce((a, b) => a + b), 0);
  assert.deepEqual(transformerTrace(2, false)[2], transformerTrace(2, false)[1]);
  const middle = attend([0, 1, 0], [[1, 0, 0], [0, 1, 0], [999, 999, 999]], [[1, 0, 0], [0, 1, 0], [999, 999, 999]], [true, true, false]);
  assert.deepEqual(transformerTrace(1)[1], middle.output);
});

test("retrieval distinguishes sources, abstains without support, and computes tool results", () => {
  assert.equal(retrieve("return unopened books")[0].id, "returns");
  assert.equal(retrieve("standard delivery arrive")[0].id, "delivery");
  assert.ok(retrieve("gift wrap colors").every((d) => d.score === 0));
  assert.match(last("retrieval-and-agents", "returns").scene.result, /30 days with a receipt/);
  assert.match(last("retrieval-and-agents", "unknown").scene.result, /do not say/);
  assert.match(last("retrieval-and-agents", "calculator").scene.result, /408/);
});
