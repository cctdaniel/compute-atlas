import test from "node:test";
import assert from "node:assert/strict";
import { dot, softmax, layerNorm } from "../lib/lessons/full/lesson-kit.ts";
import {
  recurrentStates,
  sequenceTrace,
  attentionRows,
  attentionMatrixTrace,
  rotatePair,
  decoderBlock,
  bpeBase,
  bpeTraining,
  encodeBPE,
  decodeBPE,
  teacherForcedRows,
  generateToy,
  toyVocabulary,
  architectureTrace,
} from "../lib/lessons/full/sequence-models.ts";
const close = (a, b, t = 1e-9) =>
  assert.ok(Math.abs(a - b) < t, `${a} differs from ${b}`);
const vectorClose = (a, b) => {
  assert.equal(a.length, b.length);
  a.forEach((v, i) => close(v, b[i]));
};

test("recurrences consume only their prefix and compute the declared scalar state", () => {
  const linear = recurrentStates("state-space", [1, -1, -1, -1]);
  vectorClose(
    linear.map((s) => s.h),
    [0, 0.2, -0.04, -0.232, -0.3856],
  );
  close(
    linear.at(-1).h - recurrentStates("state-space", [-1, -1, -1, -1]).at(-1).h,
    0.2048,
  );
  const rnn = recurrentStates("rnn", [1, -1, -1, -1]);
  close(rnn[1].h, Math.tanh(1));
  close(rnn[2].h, Math.tanh(0.5 * Math.tanh(1) - 1));
  const other = recurrentStates("rnn", [1, -1, 1, 1]);
  assert.deepEqual(rnn.slice(0, 3), other.slice(0, 3));
  const stored = sequenceTrace("store").at(-1).scene;
  assert.deepEqual(stored.store, [1, -1, -1, -1]);
  assert.equal(stored.recall, 1);
  assert.equal(sequenceTrace("rnn").at(-1).scene.recall, -1);
});

test("LSTM and GRU gates follow their stated conventions", () => {
  const lstm = recurrentStates("lstm", [1])[1];
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  close(lstm.c, sigmoid(-0.5) * Math.tanh(1));
  close(lstm.h, sigmoid(1) * Math.tanh(lstm.c));
  assert.ok(
    lstm.gates.slice(0, 3).every((gate) => gate.value > 0 && gate.value < 1),
  );
  const gru = recurrentStates("gru", [1])[1];
  close(gru.h, sigmoid(-1) * Math.tanh(1));
  const selective = recurrentStates("selective", [1, -1]);
  close(selective[1].h, 0.1);
  close(selective[2].h, -0.78);
});

test("attention computes query-by-key rows, masks future values and projects head outputs", () => {
  const q = [
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    v = [
      [2, 0],
      [0, 2],
      [1, 1],
    ],
    causal = attentionRows(q, q, v, true);
  assert.deepEqual(causal.rawScores, [
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 2],
  ]);
  assert.deepEqual(causal.weights[0], [1, 0, 0]);
  vectorClose(causal.outputs[0], [2, 0]);
  close(causal.weights[1][0], 1 / (1 + Math.exp(1 / Math.sqrt(2))));
  close(causal.weights[1][2], 0);
  causal.weights.forEach((row) =>
    close(
      row.reduce((a, b) => a + b, 0),
      1,
    ),
  );
  const changed = attentionRows(
    q,
    q,
    [
      [2, 0],
      [0, 2],
      [100, 100],
    ],
    true,
  );
  vectorClose(changed.outputs[0], causal.outputs[0]);
  vectorClose(changed.outputs[1], causal.outputs[1]);
  assert.notDeepEqual(changed.outputs[2], causal.outputs[2]);
  const cross = attentionMatrixTrace("cross").at(-1).scene;
  assert.equal(cross.weights.length, 2);
  assert.ok(cross.weights.every((row) => row.length === 3));
  vectorClose(
    attentionMatrixTrace("multihead").at(-1).scene.outputs[1],
    [1, 1],
  );
  assert.throws(() => softmax([1, 2], [false, false]), RangeError);
  vectorClose(softmax([1000, 1001]), softmax([0, 1]));
});

test("pre-norm residuals and the declared MLP preserve actual values and shapes", () => {
  const b = decoderBlock();
  assert.equal(b.hidden[0].length, 4);
  assert.equal(b.output[0].length, 3);
  b.input.forEach((row, i) =>
    row.forEach((x, j) => close(b.residual1[i][j], x + b.attn.outputs[i][j])),
  );
  b.residual1.forEach((row, i) =>
    row.forEach((x, j) => close(b.output[i][j], x + b.projected[i][j])),
  );
  vectorClose(b.attn.outputs[0], b.norm1[0]);
  vectorClose(
    layerNorm([1, 0, 0]),
    [2 / 3, -1 / 3, -1 / 3].map((v) => v / Math.sqrt(2 / 9 + 1e-5)),
  );
  const disabled = decoderBlock(true, false, false);
  disabled.output.forEach((row, i) => vectorClose(row, disabled.projected[i]));
});

test("rotary pairs preserve common shifts while the controlled no-position view is permutation-invariant", () => {
  const q = [0.3, 0.7],
    k = [0.9, -0.2];
  close(
    dot(rotatePair(q, 0.4), rotatePair(k, 1.1)),
    dot(rotatePair(q, 1.1), rotatePair(k, 1.8)),
  );
  vectorClose(
    decoderBlock(false).output[2],
    decoderBlock(false, true).output[2],
  );
  assert.notDeepEqual(
    decoderBlock(true).output[2],
    decoderBlock(true, true).output[2],
  );
});

test("BPE counts weighted pairs, applies ordered merges and round-trips the declared alphabet", () => {
  const states = bpeTraining(),
    first = states[0];
  assert.equal(
    first.pairCounts.find((row) => row.pair.join("") === "lo").count,
    4,
  );
  assert.equal(
    first.pairCounts.find((row) => row.pair.join("") === "er").count,
    3,
  );
  const trained = states.at(-1);
  assert.deepEqual(trained.merges, [
    ["l", "o"],
    ["lo", "w"],
    ["e", "r"],
    ["er", "<end>"],
  ]);
  const lower = encodeBPE("lower", trained.merges, trained.vocabulary);
  assert.deepEqual(lower.tokens, ["low", "er<end>"]);
  assert.deepEqual(lower.ids, [101, 103]);
  for (const text of [
    "lower",
    "lowest",
    "Lower",
    "<system>lower",
    "a space",
    "<end>",
  ]) {
    const encoded = encodeBPE(text, trained.merges, trained.vocabulary);
    assert.equal(decodeBPE(encoded.ids, trained.vocabulary), text);
  }
  assert.throws(
    () => encodeBPE("café", trained.merges, trained.vocabulary),
    RangeError,
  );
  const literal = encodeBPE(
    "<system>lower",
    trained.merges,
    trained.vocabulary,
  );
  assert.ok(!literal.ids.includes(bpeBase.indexOf("<system>")));
  assert.notEqual(
    bpeTraining(true).at(-1).vocabulary[101],
    trained.vocabulary[101],
  );
});

test("autoregressive generation uses selected-prefix conditionals and explicit stopping", () => {
  const states = generateToy(["<bos>"]);
  assert.deepEqual(
    states.map((s) => toyVocabulary[s.selected]),
    ["I", "like", "tea", "<eos>"],
  );
  close(states[0].selectedProbability, 0.9306840566412553);
  close(states.at(-1).totalProbability, 0.5180092858120933);
  close(
    states.at(-1).totalProbability,
    states.reduce((product, s) => product * s.selectedProbability, 1),
  );
  const sampled = generateToy(["<bos>"], [0.4, 0.6, 0.9, 0.5, 0.2]);
  assert.ok(sampled.some((s) => toyVocabulary[s.selected] === "coffee"));
  const loop = generateToy(["<bos>"], null, true, 5);
  assert.equal(loop.length, 5);
  assert.equal(loop.at(-1).stop, "Token limit");
  assert.equal(states.at(-1).stop, "End token");
  assert.throws(() => generateToy(["unknown"]), RangeError);
});

test("teacher forcing scores known targets without leaking a changed later token into earlier predictions", () => {
  const tea = teacherForcedRows(["<bos>", "I", "like", "tea", "<eos>"]),
    coffee = teacherForcedRows(["<bos>", "I", "like", "coffee", "<eos>"]);
  assert.deepEqual(tea.slice(0, 2), coffee.slice(0, 2));
  assert.notEqual(tea[2].probability, coffee[2].probability);
  close(
    tea.reduce((sum, row) => sum + row.loss, 0) / tea.length,
    0.1644405276512889,
  );
  assert.deepEqual(tea[2].prefix, ["<bos>", "I", "like"]);
  assert.throws(() => teacherForcedRows(["I", "unknown"]), RangeError);
});

test("architecture masks distinguish withheld input, future output, and known source memory", () => {
  const encoder = architectureTrace("encoder").at(-1).scene,
    decoder = architectureTrace("decoder").at(-1).scene;
  assert.deepEqual(encoder.keys[1], [0, 0]);
  assert.ok(encoder.allowed.every((row) => row.every(Boolean)));
  assert.deepEqual(decoder.allowed, [
    [true, false, false],
    [true, true, false],
    [true, true, true],
  ]);
  const source = architectureTrace("encoder-decoder")[2].scene,
    self = architectureTrace("encoder-decoder")[3].scene,
    cross = architectureTrace("encoder-decoder")[4].scene;
  assert.ok(source.allowed.every((row) => row.every(Boolean)));
  assert.deepEqual(self.allowed, [
    [true, false],
    [true, true],
  ]);
  assert.equal(cross.weights.length, 2);
  assert.ok(cross.weights.every((row) => row.length === 3));
  assert.ok(cross.allowed.every((row) => row.every(Boolean)));
  assert.deepEqual(cross.keys, source.outputs);
});
