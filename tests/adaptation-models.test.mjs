import test from "node:test";
import assert from "node:assert/strict";
import {
  scalingAllocation,
  scalingTrace,
  contractChecks,
  promptTrace,
  packContext,
  contextTrace,
  filteredDistribution,
  seededDraws,
  sampleIndex,
  beamCandidates,
  decodeTrace,
  verificationTrace,
  sftPass,
  sftTrace,
  rewardFit,
  rewardPolicy,
  dpoValue,
  dpoTrace,
  loraPass,
  loraTrace,
  adapterCounts,
  distillationTrace,
  adaptationExperiments,
} from "../lib/lessons/full/adaptation-models.ts";
const close = (a, b, t = 1e-9) =>
  assert.ok(Math.abs(a - b) < t, `${a} != ${b}`);
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const derivative = (fn, x) => (fn(x + 1e-5) - fn(x - 1e-5)) / 2e-5;
test("fixed-budget scaling separates loss terms and repeated inference cost", () => {
  const balanced = scalingAllocation(4),
    larger = scalingAllocation(8);
  assert.deepEqual(balanced, {
    n: 4,
    d: 4,
    modelTerm: 1,
    dataTerm: 1,
    loss: 3,
    lifetime: 16,
  });
  close(larger.loss, 3.5);
  close(scalingAllocation(4, 4, 20).lifetime, 96);
  close(scalingAllocation(8, 4, 20).lifetime, 176);
  assert.equal(
    scalingTrace("data-hungry").reduce(
      (best, f) =>
        f.scene.rows[f.scene.active].loss < best.loss
          ? f.scene.rows[f.scene.active]
          : best,
      { loss: Infinity },
    ).n,
    2,
  );
});
test("contract validation independently checks structure and source agreement", () => {
  assert.deepEqual(
    contractChecks('{"count":2,"total":4}').map((c) => c.passed),
    [true, true, true],
  );
  assert.deepEqual(
    contractChecks('{"count":2,"total":9}').map((c) => c.passed),
    [true, true, false],
  );
  assert.deepEqual(
    contractChecks('{"count":2,"total":4,"note":"done"}').map((c) => c.passed),
    [true, false, true],
  );
  assert.deepEqual(
    contractChecks("[]").map((c) => c.passed),
    [false, false, false],
  );
  assert.deepEqual(
    contractChecks('{"count":"2","total":4}').map((c) => c.passed),
    [true, false, false],
  );
  assert.equal(
    promptTrace("quoted")
      .at(-1)
      .scene.checks.every((c) => c.passed),
    true,
  );
});
test("context packing exposes overflow, missing information, freshness and output reserve", () => {
  const full = packContext("overflow");
  assert.equal(full.used, 18);
  assert.equal(full.items.at(-1).kept, false);
  const compact = packContext("summary");
  assert.equal(compact.used, 17);
  assert.ok(compact.facts.every((f) => f.available));
  assert.equal(packContext("lost-detail").facts[1].available, false);
  assert.equal(packContext("no-retrieval").facts[0].available, false);
  assert.equal(packContext("stale").facts[0].available, false);
  assert.equal(packContext("no-reserve").facts[2].available, false);
  assert.equal(contextTrace("summary")[0].scene.used, 0);
});
test("temperature, top-k, top-p and seeded choices use normalized numerical distributions", () => {
  const cold = filteredDistribution(),
    warm = filteredDistribution(2),
    topk = filteredDistribution(1, 2),
    topp = filteredDistribution(1, 3, 0.8);
  [0.6652409557748218, 0.24472847105479764, 0.09003057317038046].forEach(
    (p, i) => close(cold.probabilities[i], p),
  );
  close(warm.probabilities[0], 0.506480391055654);
  close(warm.probabilities[2], 0.1863237232258476);
  close(topk.filtered[0], 0.7310585786300049);
  assert.deepEqual(topk.filtered, topp.filtered);
  assert.equal(topk.filtered[2], 0);
  close(filteredDistribution(1, 3, 0.5).filtered[0], 1);
  assert.throws(() => filteredDistribution(0), RangeError);
  assert.deepEqual(seededDraws(7, 5), seededDraws(7, 5));
  assert.notDeepEqual(seededDraws(42, 5), seededDraws(7, 5));
  close(seededDraws(7, 1)[0], 0.23878083983436227);
  assert.equal(sampleIndex([0.6, 0.3, 0.1], 0.6), 1);
  assert.equal(sampleIndex([0.6, 0.3, 0.1], 0.95), 2);
  const scene = decodeTrace("normal").at(-1).scene;
  assert.equal(
    scene.counts.reduce((a, b) => a + b),
    5,
  );
  assert.deepEqual(decodeTrace("greedy").at(-1).scene.counts, [5, 0, 0]);
});
test("beam width can preserve a higher-probability complete path discarded by greedy", () => {
  assert.equal(beamCandidates(1)[0].label, "A1");
  close(beamCandidates(1)[0].probability, 0.36);
  assert.equal(beamCandidates(2)[0].label, "B1");
  close(beamCandidates(2)[0].probability, 0.396);
  close(
    beamCandidates(2).reduce((sum, b) => sum + b.probability, 0),
    1,
  );
});
test("verification selectors account for work and do not manufacture valid candidates", () => {
  const end = (id) => verificationTrace(id).at(-1).scene;
  assert.equal(end("single").used, 1);
  assert.equal(end("majority").used, 5);
  assert.equal(end("exact").used, 10);
  assert.equal(end("majority").candidates[end("majority").selected].answer, 9);
  assert.equal(end("exact").candidates[end("exact").selected].answer, 8);
  assert.equal(end("weak").candidates[end("weak").selected].answer, 9);
  assert.equal(end("correlated").selected, null);
  assert.ok(end("correlated").candidates.every((c) => c.passed === false));
});
test("response masks define the actual shared-parameter gradient, prompt-only leaves weights fixed", () => {
  const first = sftPass(0);
  close(first.loss, Math.log(2));
  close(first.gradient, -0.5);
  close(sftPass(0, false).gradient, 0.1);
  for (const mask of [true, false])
    close(
      sftPass(0.7, mask).gradient,
      derivative((x) => sftPass(x, mask).loss, 0.7),
      1e-8,
    );
  const updated = sftTrace("response")[1].scene;
  close(updated.weight, 0.5);
  close(updated.rows[3].probability, sigmoid(0.5));
  close(updated.loss, Math.log1p(Math.exp(-0.5)));
  assert.ok(sftTrace("prompt-only").every((f) => f.scene.weight === 0));
  assert.ok(sftTrace("verbose")[1].scene.weight < 0);
});
test("pairwise reward fitting and finite KL-regularized policy expose the rewarded proxy", () => {
  const weights = rewardFit();
  close(weights[0], 0);
  close(weights[1], 0.5);
  close(weights[2], 0.8775406687981454);
  const normal = rewardPolicy(weights.at(-1), 1),
    weak = rewardPolicy(weights.at(-1), 0.2),
    grounded = rewardPolicy(weights.at(-1), 1, true);
  close(
    normal.reduce((sum, c) => sum + c.policy, 0),
    1,
  );
  assert.ok(normal[2].policy > normal[0].policy);
  assert.ok(weak[2].policy > normal[2].policy);
  assert.ok(grounded[2].policy < 0.1);
  // Independent optimum condition: log(policy/reference) - reward/beta is constant.
  const residuals = normal.map(
    (c) => Math.log(c.policy / c.reference) - c.reward,
  );
  residuals.forEach((x) => close(x, residuals[0]));
});
test("DPO gradient follows the signed reference-relative log odds and preference labels", () => {
  close(dpoValue(0).loss, Math.log(2));
  close(dpoValue(0).gradient, -0.25);
  for (const sign of [-1, 1])
    close(
      dpoValue(0.4, sign, 0.7, 0.8).gradient,
      derivative((x) => dpoValue(x, sign, 0.7, 0.8).loss, 0.4),
      1e-8,
    );
  const normal = dpoTrace("normal");
  close(normal[1].scene.weight, 0.125);
  close(normal[1].scene.probability, 0.5312093733737563);
  assert.ok(dpoTrace("reverse")[1].scene.probability < 0.5);
  close(dpoTrace("biased-reference")[0].scene.margin, 0);
  close(dpoTrace("biased-reference")[0].scene.probability, 0.8);
});
test("LoRA forward pass and both adapter gradients agree with independent calculations", () => {
  const a = [[1, -1]],
    b = [[0.5], [-0.5]],
    value = loraPass(a, b);
  close(value.output[0], 3.1);
  close(value.output[1], 0.5);
  close(value.loss, 0.13);
  close(value.gradA[0][0], 0.6);
  close(value.gradA[0][1], 0.3);
  close(value.gradB[0][0], 0.1);
  close(value.gradB[1][0], -0.5);
  for (let j = 0; j < 2; j++)
    close(
      value.gradA[0][j],
      derivative(
        (x) => loraPass([[j === 0 ? x : 1, j === 1 ? x : -1]], b).loss,
        a[0][j],
      ),
      1e-8,
    );
  for (let i = 0; i < 2; i++)
    close(
      value.gradB[i][0],
      derivative(
        (x) => loraPass(a, [[i === 0 ? x : 0.5], [i === 1 ? x : -0.5]]).loss,
        b[i][0],
      ),
      1e-8,
    );
  const zero = loraPass(a, [[0], [0]]);
  assert.deepEqual(zero.gradA, [[0, 0]]);
  assert.ok(zero.gradB.some((row) => row[0] !== 0));
  assert.deepEqual(adapterCounts(100, 100, 4), { base: 10000, adapter: 800 });
  const trace = loraTrace("rank-one");
  assert.deepEqual(trace[0].scene.base, trace.at(-1).scene.base);
  assert.notDeepEqual(trace[0].scene.a, trace.at(-1).scene.a);
  assert.ok(loraPass(a, b, 1, true).loss !== value.loss);
});
test("distillation soft/hard targets, teacher error, held-out gap and forgetting are explicit", () => {
  const soft = distillationTrace("soft"),
    hard = distillationTrace("hard"),
    bad = distillationTrace("bad-teacher");
  close(soft[1].scene.weight, 0.3);
  close(soft[1].scene.probability, sigmoid(0.3));
  close(hard[1].scene.weight, 0.5);
  close(bad[1].scene.weight, -0.3);
  assert.ok(soft.at(-1).scene.heldOut > soft.at(-1).scene.probability);
  const forget = distillationTrace("forget"),
    replay = distillationTrace("replay");
  assert.ok(forget[8].scene.oldLoss > forget[4].scene.oldLoss);
  assert.ok(forget[8].scene.newLoss < forget[4].scene.newLoss);
  assert.ok(replay[8].scene.oldLoss < forget[8].scene.oldLoss);
  assert.equal(replay[5].scene.target, 0.5);
  assert.equal(forget[5].scene.target, 0.2);
});
test("all ten adaptation lessons produce computed finite traces for every declared scenario", () => {
  assert.equal(adaptationExperiments.length, 10);
  for (const experiment of adaptationExperiments)
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
