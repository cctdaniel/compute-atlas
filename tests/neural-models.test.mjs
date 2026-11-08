import test from "node:test";
import assert from "node:assert/strict";
import {
  xorNetwork,
  gelu,
  affinePass,
  autodiffTrace,
  bowlLoss,
  trainingTrace,
  controlsTrace,
  embeddingCosine,
  contrastiveLoss,
  representationTrace,
} from "../lib/lessons/full/neural-models.ts";
const close = (a, b, tolerance = 1e-9) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
const end = (fn, scenario) => fn(scenario).at(-1);

test("the nonlinear XOR network solves all corners; affine variants do not", () => {
  const corners = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  corners.forEach((x) => assert.equal(xorNetwork(x).predicted, x[0] ^ x[1]));
  assert.ok(
    corners.some((x) => xorNetwork(x, "Identity").predicted !== (x[0] ^ x[1])),
  );
  assert.ok(
    corners.some(
      (x) => xorNetwork(x, "ReLU", true).predicted !== (x[0] ^ x[1]),
    ),
  );
  assert.deepEqual(xorNetwork([1, 1]).h, [2, 1]);
  close(xorNetwork([1, 1]).score, 0);
  close(gelu(0), 0);
  close(gelu(1), 0.841344746, 0.0002);
  close(gelu(2), 1.954499736, 0.0002);
});

test("backpropagation differentiates the old pass and the optimizer updates both parameters simultaneously", () => {
  const old = affinePass(2, 4, 1, 0),
    epsilon = 1e-5;
  close(
    old.gw,
    (affinePass(2, 4, 1 + epsilon, 0).loss -
      affinePass(2, 4, 1 - epsilon, 0).loss) /
      (2 * epsilon),
    1e-8,
  );
  close(
    old.gb,
    (affinePass(2, 4, 1, epsilon).loss - affinePass(2, 4, 1, -epsilon).loss) /
      (2 * epsilon),
    1e-8,
  );
  const trace = autodiffTrace("both");
  for (const frame of trace.slice(0, 7)) {
    close(frame.scene.weight, 1);
    close(frame.scene.bias, 0);
  }
  assert.equal(trace[6].nextAction, "Update");
  close(trace[6].scene.gw, -4);
  close(trace[6].scene.gb, -2);
  close(trace[7].scene.weight, 1.4);
  close(trace[7].scene.bias, 0.2);
  close(trace[7].scene.loss, 2);
  assert.equal(trace[7].metrics[2].label, "Cached loss");
  close(trace[8].scene.prediction, 3);
  close(trace[8].scene.loss, 0.5);
  close(end(autodiffTrace, "freeze-bias").scene.loss, 0.72);
  close(end(autodiffTrace, "large").scene.loss, 4.5);
  close(end(autodiffTrace, "optimum").scene.loss, 0);
});

test("inference does not acquire a training target, parameter gradient, or loss", () => {
  for (const frame of autodiffTrace("inference")) {
    assert.equal(frame.scene.target, null);
    assert.equal(frame.scene.loss, null);
    assert.equal(frame.scene.gw, null);
    assert.equal(frame.scene.gb, null);
    close(frame.scene.weight, 1);
    close(frame.scene.bias, 0);
    close(frame.scene.prediction, 2);
  }
});

test("quadratic training separates gradients, memory, rates and applied updates", () => {
  const plain = trainingTrace("gd"),
    momentum = trainingTrace("momentum"),
    adam = trainingTrace("adam");
  close(plain[0].loss, 13);
  assert.deepEqual(plain[1].point, [3.8, 0.5]);
  close(plain[1].loss, 8.47);
  assert.deepEqual(momentum[2].memory, [7, 13]);
  close(momentum[2].point[0], 3.45);
  close(momentum[2].point[1], -0.15);
  close(adam[1].point[0], 3.85, 1e-8);
  close(adam[1].point[1], 0.85, 1e-8);
  const divergent = trainingTrace("large");
  assert.deepEqual(divergent[1].point, [3, -1.5]);
  close(divergent[1].loss, 15.75);
  assert.ok(divergent.at(-1).loss > 3000);
  for (const state of trainingTrace("clipped").slice(1)) {
    assert.ok(Math.hypot(...state.usedGradient) <= 2 + 1e-12);
    assert.ok(Math.hypot(...state.update) <= 0.5 + 1e-12);
  }
  close(trainingTrace("schedule")[2].rate, 0.035);
  for (const method of [
    "gd",
    "momentum",
    "adam",
    "large",
    "clipped",
    "sampled",
    "rounded",
    "initialization",
  ])
    for (const state of trainingTrace(method))
      close(state.loss, bowlLoss(state.point));
});

test("sampled component gradients average to the full gradient, with explicit replacement draws", () => {
  const point = [2, 0.4];
  const gradient0 = [point[0] - 1, 10 * point[1] + 1],
    gradient1 = [point[0] + 1, 10 * point[1] - 1];
  close((gradient0[0] + gradient1[0]) / 2, point[0]);
  close((gradient0[1] + gradient1[1]) / 2, 10 * point[1]);
  const sampled = trainingTrace("sampled");
  assert.deepEqual(
    sampled.slice(1).map((s) => s.sample),
    [0, 0, 1, 0, 1, 1, 0, 1],
  );
  assert.deepEqual(sampled[1].gradient, [3, 11]);
  close(sampled[1].point[0], 3.85);
  close(sampled[1].point[1], 0.45);
  assert.ok(
    trainingTrace("rounded")
      .slice(1)
      .every((state) =>
        state.point.every((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-8),
      ),
  );
});

test("inverted dropout changes a training realization while ordinary evaluation and expected activation are preserved", () => {
  const a = end(controlsTrace, "dropout-a").scene,
    b = end(controlsTrace, "dropout-b").scene;
  assert.deepEqual(a.scaled, [4, 0]);
  assert.deepEqual(b.scaled, [0, 8]);
  close(a.trainingOutput, 4);
  close(b.trainingOutput, 8);
  close(a.evaluationOutput, 6);
  close(b.evaluationOutput, 6);
  close((0 + 4 + 8 + 12) / 4, 6);
  const large = end(controlsTrace, "softmax-large"),
    small = end(controlsTrace, "softmax-small");
  assert.equal(large.metrics[2].value, small.metrics[2].value);
  close(Number(large.metrics[2].value), 0.7311);
  assert.equal(large.scene.context[0].value, "∞, ∞");
});

test("cosine scaling invariance, distance rankings and the zero-vector boundary remain distinct", () => {
  close(embeddingCosine([1, 0], [0.8, 0.2]), 0.8 / Math.sqrt(0.68));
  close(
    embeddingCosine([3, 0], [0.8, 0.2]),
    embeddingCosine([1, 0], [0.8, 0.2]),
  );
  assert.equal(embeddingCosine([0, 0], [1, 0]), null);
  const cosine = end(representationTrace, "cosine").scene,
    scaled = end(representationTrace, "cosine-scaled").scene;
  cosine.items.forEach((item, i) =>
    item.score === null
      ? assert.equal(scaled.items[i].score, null)
      : close(item.score, scaled.items[i].score),
  );
  const euclid = end(representationTrace, "euclidean").scene,
    rescaled = end(representationTrace, "euclidean-scaled").scene;
  assert.equal(euclid.items[euclid.order[0]].label, "Cat");
  assert.equal(rescaled.items[rescaled.order[0]].label, "Scaled cat");
  assert.ok(
    end(representationTrace, "zero").scene.items.every(
      (item) => item.score === null,
    ),
  );
});

test("contrastive gradients agree with finite differences and a changed relation changes the learned direction", () => {
  const query = [0.2, -0.3],
    positive = [1, 0],
    negative = [0, 1],
    state = contrastiveLoss(query, positive, negative),
    epsilon = 1e-5;
  query.forEach((_, i) => {
    const plus = [...query],
      minus = [...query];
    plus[i] += epsilon;
    minus[i] -= epsilon;
    close(
      state.gradient[i],
      (contrastiveLoss(plus, positive, negative).loss -
        contrastiveLoss(minus, positive, negative).loss) /
        (2 * epsilon),
      1e-8,
    );
  });
  const cat = representationTrace("contrastive-cat"),
    apple = representationTrace("contrastive-apple");
  assert.deepEqual(cat[1].scene.query, [0.25, -0.25]);
  close(cat[1].scene.training.loss, Math.log(1 + Math.exp(-0.5)));
  for (let i = 1; i < cat.length; i++)
    assert.ok(cat[i].scene.training.loss < cat[i - 1].scene.training.loss);
  assert.ok(cat.at(-1).scene.query[0] > 0 && apple.at(-1).scene.query[0] < 0);
  assert.deepEqual(
    cat[0].scene.items.map((item) => item.vector),
    cat.at(-1).scene.items.map((item) => item.vector),
  );
});

test("coarse rounding can erase a nonzero proposed update", () => {
  const states = trainingTrace("rounded");
  const stalled = states.find(
    (state, i) =>
      i > 0 && states[i - 1].point[1] === 0.1 && state.point[1] === 0.1,
  );
  assert.ok(stalled);
  close(stalled.update[1], 0.05);
  close(stalled.appliedUpdate[1], 0);
});
