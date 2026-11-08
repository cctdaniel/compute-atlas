import test from "node:test";
import assert from "node:assert/strict";
import {
  cacheBytes,
  cacheAttention,
  cacheTrace,
  quantizeWeights,
  memoryPlan,
  memoryTrace,
  parallelTrace,
  queueSimulation,
  onlineAttention,
  onlineTrace,
  speculativeMass,
  speculativeTrace,
  routeExperts,
  expertTrace,
  inferenceExperiments,
} from "../lib/lessons/full/inference-models.ts";
import {
  bm25,
  cosine,
  reciprocalRanks,
  retrievalResult,
  searchDocuments,
  chunkWords,
  policySource,
  ragResult,
  retrievalExperiments,
} from "../lib/lessons/full/retrieval-models.ts";
const close = (a, b, t = 1e-9) =>
  assert.ok(Math.abs(a - b) < t, `${a} != ${b}`);
const vectorClose = (a, b) => {
  assert.equal(a.length, b.length);
  a.forEach((v, i) => close(v, b[i]));
};

test("full-prefix cache reuse preserves outputs while recomputation revisits old work", () => {
  const cached = cacheTrace("cached"),
    recomputed = cacheTrace("recompute");
  for (let i = 1; i < cached.length; i++)
    vectorClose(cached[i].scene.output, recomputed[i].scene.output);
  assert.equal(cached.at(-1).scene.projected, 6);
  assert.equal(recomputed.at(-1).scene.projected, 18);
  assert.equal(cached.at(-1).scene.pairs, 21);
  assert.equal(recomputed.at(-1).scene.pairs, 52);
  assert.equal(cached.at(-1).scene.bytes, 96);
  assert.equal(recomputed.at(-1).scene.bytes, 0);
  const window = cacheTrace("window").at(-1).scene;
  assert.equal(window.bytes, 48);
  assert.notDeepEqual(window.output, cached.at(-1).scene.output);
  assert.equal(window.tokens.filter((t) => t.state === "Evicted").length, 3);
  close(cacheBytes(2, 2, 6, 1, 2, 2), 192);
  close(cacheTrace("two-heads").at(-1).scene.bytes, 192);
});
test("cache projections and current attention use actual input values with no future influence", () => {
  const inputs = [
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    value = cacheAttention(inputs, [0, 1, 2]);
  assert.deepEqual(value.keys, inputs);
  assert.deepEqual(value.values, [
    [1, 0],
    [0.5, 1],
    [1.5, 1],
  ]);
  const e = Math.exp(1 / Math.sqrt(2)),
    den = 2 * e + e * e;
  vectorClose(value.weights, [e / den, e / den, (e * e) / den]);
  close(value.output[0], (1.5 * (e + e * e)) / den);
  close(value.output[1], (e + e * e) / den);
});
test("memory accounting includes cache, workspace, training state and decimal bytes", () => {
  const sum = (x) => x.reduce((s, v) => s + v.bytes, 0);
  assert.equal(sum(memoryPlan()), 3_000_000);
  assert.equal(sum(memoryPlan(16, 4)), 4_200_000);
  assert.equal(sum(memoryPlan(8, 4)), 3_200_000);
  assert.equal(sum(memoryPlan(4, 4)), 2_700_000);
  assert.equal(sum(memoryPlan(16, 1, true)), 15_600_000);
  assert.equal(memoryTrace("batch-four").at(-1).scene.used, 4_200_000);
  assert.equal(memoryTrace("fp16")[0].scene.used, 0);
});
test("uniform quantization exposes its codes and a changed dot product", () => {
  const four = quantizeWeights(4);
  close(four.scale, 2.4 / 7);
  assert.deepEqual(
    four.rows.map((r) => r.code),
    [0, -2, 3, 7],
  );
  vectorClose(
    four.rows.map((r) => r.restored),
    [0, -4.8 / 7, 7.2 / 7, 2.4],
  );
  close(four.fullOutput, -0.31);
  close(four.quantOutput, -0.5142857142857142);
  assert.ok(
    Math.abs(quantizeWeights(8).quantOutput - four.fullOutput) <
      Math.abs(four.quantOutput - four.fullOutput),
  );
});
test("two-device parallel decompositions store and assemble distinct mathematical objects", () => {
  const data = parallelTrace("data-parallel").at(-1).scene,
    tensor = parallelTrace("tensor-parallel").at(-1).scene,
    pipeline = parallelTrace("pipeline").at(-1).scene;
  assert.deepEqual(data.output, [
    [5, 11],
    [4, 10],
  ]);
  assert.deepEqual(tensor.output, [[5, 11]]);
  assert.deepEqual(pipeline.output, [[6, -2]]);
  assert.deepEqual(
    data.devices.map((d) => d.stored),
    [4, 4],
  );
  assert.deepEqual(
    tensor.devices.map((d) => d.stored),
    [2, 2],
  );
  assert.equal(parallelTrace("pipeline")[1].scene.devices[1].done, false);
});
test("queue scheduling increases throughput while request A takes longer under declared batch cost", () => {
  const serial = queueSimulation("serial").at(-1),
    staticBatch = queueSimulation("static").at(-1),
    continuous = queueSimulation("continuous").at(-1);
  close(serial.time, 8);
  close(staticBatch.time, 7.5);
  close(continuous.time, 5);
  close(serial.throughput, 1);
  close(continuous.throughput, 1.6);
  close(serial.requests[0].finish, 4);
  close(continuous.requests[0].finish, 5);
  close(continuous.requests[2].first, 2.5);
  close(staticBatch.requests[2].first, 6.25);
  assert.ok(
    continuous.requests.every(
      (r) => r.generated === r.length && r.status === "Done",
    ),
  );
});
test("cache pages have unique owners, bounded occupancy, and are reclaimed at completion", () => {
  for (const state of queueSimulation("continuous")) {
    const assigned = state.requests.flatMap((r) => r.pages);
    assert.equal(new Set(assigned).size, assigned.length);
    for (const request of state.requests) {
      assert.ok(
        request.pages.every((id) => state.pages[id].owner === request.id),
      );
      if (request.status === "Running")
        assert.equal(
          request.pages.length,
          Math.ceil((2 + request.generated) / 2),
        );
    }
    for (const page of state.pages) assert.ok(page.used >= 0 && page.used <= 2);
  }
  assert.ok(
    queueSimulation("continuous")
      .at(-1)
      .pages.every((p) => p.owner === null && p.used === 0),
  );
});
test("online stable softmax agrees with direct normalization, tiles and additive-score shifts", () => {
  const states = onlineAttention([1000, 1001, 999], [2, 4, 8]);
  close(states[0].maximum, 1000);
  close(states[0].output, 2);
  close(states[1].denominator, 1 + Math.exp(-1));
  close(states[1].numerator, 4 + 2 * Math.exp(-1));
  const expected =
    (2 * Math.exp(-1) + 4 + 8 * Math.exp(-2)) /
    (Math.exp(-1) + 1 + Math.exp(-2));
  close(states.at(-1).output, expected);
  close(onlineTrace("tile-two").at(-1).scene.output, expected);
  close(onlineTrace("shifted").at(-1).scene.output, expected);
});
test("speculative accepted and residual masses recover the target including a zero-rejection boundary", () => {
  const result = speculativeMass([0.6, 0.4], [0.2, 0.8]);
  vectorClose(result.acceptance, [1, 0.5]);
  vectorClose(result.accepted, [0.2, 0.4]);
  close(result.rejection, 0.4);
  vectorClose(result.residual, [1, 0]);
  vectorClose(result.result, [0.6, 0.4]);
  const matched = speculativeMass([0.6, 0.4], [0.6, 0.4]);
  assert.equal(matched.rejection, 0);
  vectorClose(matched.residual, [0, 0]);
  vectorClose(matched.result, [0.6, 0.4]);
  const zero = speculativeMass([0.6, 0.4], [0, 1]);
  vectorClose(zero.result, [0.6, 0.4]);
  assert.equal(speculativeTrace("speculate")[3].scene.output, 0);
  assert.equal(speculativeTrace("accept")[3].scene.output, 1);
  vectorClose(speculativeTrace("naive").at(-1).scene.result, [0.2, 0.8]);
});
test("expert gates, capacities, fallback and weighted outputs use declared numerical subnetworks", () => {
  const balanced = routeExperts();
  assert.deepEqual(balanced.at(-1).loads, [2, 2, 2, 2]);
  assert.deepEqual(balanced[0].routes, [0]);
  assert.deepEqual(balanced[0].output, [2, 0]);
  const skew = routeExperts(true);
  assert.equal(skew.filter((t) => t.status === "Dropped").length, 6);
  assert.deepEqual(skew.at(-1).loads, [2, 0, 0, 0]);
  const fallback = routeExperts(true, 1, 2, true);
  assert.deepEqual(fallback.at(-1).loads, [2, 2, 2, 2]);
  assert.ok(fallback.some((t) => t.status === "Rerouted"));
  assert.ok(fallback.every((t) => t.routes.length === 1));
  const two = routeExperts(false, 2, 4);
  for (const state of two) {
    close(
      state.weights.reduce((s, v) => s + v, 0),
      state.routes.length ? 1 : 0,
    );
    assert.ok(state.loads.every((load) => load <= 4));
  }
  close(two[0].output[0], (2 * Math.exp(2)) / (Math.exp(2) + 1));
  close(two[0].output[1], 2 / (Math.exp(2) + 1));
  assert.equal(expertTrace("skew").at(-1).scene.active, 8);
});
test("BM25 calculates the declared positive-idf formula, and cosine handles supplied geometry", () => {
  const values = bm25("cat", ["cat cat", "dog"]),
    idf = Math.log(2),
    expected = (idf * 2 * 2.2) / (2 + 1.2 * (0.25 + (0.75 * 2) / 1.5));
  close(values[0], expected);
  assert.equal(values[1], 0);
  close(cosine([1, 0], [3, 4]), 0.6);
  close(cosine([1, 0], [0, 0]), 0);
  const fusion = reciprocalRanks([
    ["a", "b"],
    ["b", "c"],
  ]);
  close(fusion.a, 1 / 61);
  close(fusion.b, 1 / 62 + 1 / 61);
  close(fusion.c, 1 / 62);
});
test("exact codes, paraphrases, fusion, shortlists and candidate omissions have different outcomes", () => {
  assert.equal(searchDocuments.length, 8);
  assert.deepEqual(retrievalResult("code-lexical").lexicalRanking, ["D1"]);
  assert.equal(retrievalResult("code-dense").ranking[0], "D2");
  assert.equal(retrievalResult("code-hybrid").ranking[0], "D1");
  assert.equal(retrievalResult("paraphrase-lexical").ranking[0], "D4");
  assert.equal(retrievalResult("paraphrase-dense").ranking[0], "D3");
  assert.equal(retrievalResult("paraphrase-hybrid").ranking[0], "D4");
  assert.equal(retrievalResult("rerank").ranking[0], "D3");
  assert.ok(!retrievalResult("restricted").ranking.includes("D3"));
});
test("chunk windows preserve exact word ranges and reject invalid overlap", () => {
  const words = policySource.split(" "),
    chunks = chunkWords(policySource, 10, 2);
  assert.equal(words.length, 18);
  assert.deepEqual(
    chunks.map((c) => [c.start, c.end]),
    [
      [0, 10],
      [8, 18],
    ],
  );
  assert.equal(
    chunks[0].text,
    "Policy v2 unopened items can be returned within 30 days",
  );
  assert.throws(() => chunkWords(policySource, 4, 4), RangeError);
  assert.ok(
    chunkWords(policySource, 4, 2).some(
      (c) => c.text === "returned within 30 days",
    ),
  );
});
test("RAG checks only retrieved spans and exposes missing or unsupported answers", () => {
  const normal = ragResult("normal");
  assert.deepEqual(
    normal.claims.map((c) => c.supported),
    [true, true, false],
  );
  assert.equal(normal.claims[2].emitted, false);
  assert.ok(normal.answer.includes("[C1]"));
  assert.ok(!normal.answer.includes("shipping"));
  assert.deepEqual(
    ragResult("small").claims.map((c) => c.supported),
    [false, false, false],
  );
  assert.equal(ragResult("overlap").claims[0].supported, true);
  assert.equal(ragResult("one").claims[1].supported, false);
  assert.equal(ragResult("missing").chunks.length, 0);
  assert.ok(ragResult("missing").answer.startsWith("Insufficient"));
  assert.equal(ragResult("unsupported").claims[2].emitted, true);
  assert.ok(ragResult("unsupported").answer.includes("[unsupported]"));
});
test("all six new published experiments have three metrics and finite computed scenario traces", () => {
  const experiments = [...inferenceExperiments, ...retrievalExperiments];
  assert.equal(experiments.length, 6);
  for (const experiment of experiments)
    for (const scenario of experiment.scenarios) {
      const frames = experiment.build(scenario.id);
      assert.ok(frames.length >= 3);
      for (const frame of frames) {
        assert.equal(frame.metrics.length, 3);
        assert.ok(frame.title && frame.caption && frame.calculation);
        assert.ok(!JSON.stringify(frame).includes("NaN"));
      }
    }
});
