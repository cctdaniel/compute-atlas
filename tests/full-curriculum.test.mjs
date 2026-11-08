import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  referenceLessons,
  referenceExperiments,
} from "../lib/lessons/full/registry.ts";
import { publishedReferenceIds } from "../lib/lessons/full/published.ts";
import {
  tensorOffset,
  bayesCounts,
  entropy,
  crossEntropy,
  divergence,
} from "../lib/lessons/full/foundations-models.ts";
const catalog = JSON.parse(
  readFileSync(
    new URL("../lib/lessons/full/catalog-data.json", import.meta.url),
  ),
);
const archive = JSON.parse(
  readFileSync(new URL("../lib/lessons/full/reference.json", import.meta.url)),
);
const close = (a, b) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${a} differs from ${b}`);
const experiment = (id) =>
  referenceExperiments.find((entry) => entry.id === id);
const trace = (id, scenario) =>
  experiment(id).build(scenario || experiment(id).scenarios[0].id);
const last = (id, scenario) => trace(id, scenario).at(-1);

test("the reference inventory contains all 90 core and 100 applied IDs with resolvable prerequisites", () => {
  const expected = [
    ...Array.from(
      { length: 90 },
      (_, i) => `L${String(i + 1).padStart(2, "0")}`,
    ),
    ...Array.from(
      { length: 100 },
      (_, i) => `AP${String(i + 1).padStart(3, "0")}`,
    ),
  ];
  assert.deepEqual(
    catalog.map((entry) => entry.id),
    expected,
  );
  assert.deepEqual(
    archive.entries.map((entry) => entry.id),
    expected,
  );
  assert.equal(new Set(catalog.map((entry) => entry.slug)).size, 190);
  assert.equal(new Set(catalog.map((entry) => entry.module)).size, 24);
  for (const entry of archive.entries) {
    assert.ok(
      entry.title && entry.sourceLine > 17500 && entry.sourceText.length > 100,
      entry.id,
    );
    assert.ok(
      entry.prerequisites.every((id) => expected.includes(id)),
      entry.id,
    );
    assert.ok(!entry.sourceText.includes("Unified visual brief"), entry.id);
  }
});

test("publication requires authored reading, a matched model, meaningful comparisons and a transfer question", () => {
  assert.equal(
    new Set(publishedReferenceIds).size,
    publishedReferenceIds.length,
  );
  assert.deepEqual(
    referenceLessons.map((entry) => entry.sourceId).sort(),
    [...publishedReferenceIds].sort(),
  );
  for (const id of publishedReferenceIds) {
    const lesson = referenceLessons.find((entry) => entry.sourceId === id);
    const model = experiment(lesson.slug);
    assert.ok(
      catalog.some((entry) => entry.id === id && entry.slug === lesson.slug),
    );
    assert.ok(
      lesson.problem.paragraphs.length >= 2 &&
        lesson.walkthrough.steps.length >= 3,
      id,
    );
    assert.ok(
      lesson.prediction.correct >= 0 &&
        lesson.prediction.correct < lesson.prediction.options.length,
      id,
    );
    assert.ok(
      lesson.transfer.answer.length &&
        lesson.math.rules.length &&
        lesson.sources.length,
      id,
    );
    assert.ok(
      lesson.sources.every((source) => source.url.startsWith("https://")),
      id,
    );
    assert.ok(
      lesson.prerequisites.every(
        (slug) =>
          catalog.some((entry) => entry.slug === slug) ||
          slug === "gradient-descent",
      ),
      id,
    );
    assert.ok(model.scenarios.length >= 2, id);
    assert.ok(
      new Set(
        model.scenarios.map((scenario) =>
          JSON.stringify(model.build(scenario.id).at(-1)),
        ),
      ).size >= 2,
      id,
    );
  }
});

test("frozen lifecycle weights are independent of the inference quantity", () => {
  close(Number(last("l02", "default").metrics[0].value), 1.64);
  close(Number(last("l02", "new-input").metrics[0].value), 1.64);
  close(Number(last("l02", "default").metrics[2].value), 4.92);
  close(Number(last("l02", "new-input").metrics[2].value), 8.2);
  close(Number(last("l02", "retrain").metrics[0].value), 2.28);
  for (const frame of trace("l02").slice(4))
    assert.equal(frame.metrics[1].value, "Yes");
});

test("tensor offsets enforce every bound and matrix products preserve full coordinate sums", () => {
  assert.equal(tensorOffset([4, 6, 8], [2, 4, 6]), 134);
  assert.equal(tensorOffset([4, 6, 4], [2, 4, 3]), 67);
  for (const indices of [
    [2, 4, 8],
    [4, 0, 0],
    [-1, 0, 0],
    [0, 0],
    [0, 0, 0.5],
  ])
    assert.throws(() => tensorOffset([4, 6, 8], indices), RangeError);
  assert.deepEqual(last("l03").scene.output, [
    [4, 5, 4, 8],
    [10, 11, 13, 20],
  ]);
  assert.deepEqual(last("l03", "narrow").scene.output, [
    [1, 2, 4, 5],
    [4, 5, 13, 14],
  ]);
  assert.equal(last("l03", "mismatch").scene.output, null);
});

test("finite differences, the exact derivative and the downhill update use the same function", () => {
  close(Number(last("l04").metrics[0].value), -6);
  close(Number(last("l04").metrics[1].value), -5.9);
  close(Number(last("l04").metrics[2].value), -6);
  close(Number(last("l04", "large").metrics[1].value), -5);
  const point = last("l04").scene.points.at(-1);
  close(point.x, 0.6);
  close(point.y, 5.76);
  const near = last("l04", "near").scene.points.at(-1);
  close(near.x, 2.2);
  close(near.y, 0.64);
  for (const frame of trace("l04", "large"))
    for (const point of frame.scene.points) {
      assert.ok(point.x >= frame.scene.xMin && point.x <= frame.scene.xMax);
      assert.ok(point.y >= frame.scene.yMin && point.y <= frame.scene.yMax);
    }
});

test("Bayes changes with priors and false alarms while sensitivity stays fixed", () => {
  const rare = bayesCounts(0.01, 0.9, 0.05);
  assert.deepEqual([rare.tp, rare.fp, rare.fn, rare.tn], [90, 495, 10, 9405]);
  close(rare.posterior, 2 / 13);
  close(bayesCounts(0.1, 0.9, 0.05).posterior, 2 / 3);
  close(bayesCounts(0.01, 0.9, 0.01).posterior, 10 / 21);
  assert.equal(bayesCounts(0, 0.9, 0).posterior, null);
});

test("entropy is permutation invariant while observed likelihood and cross-entropy depend on alignment", () => {
  const p = [0.6, 0.3, 0.1],
    correct = [0.8, 0.1, 0.1],
    wrong = [0.1, 0.8, 0.1];
  close(entropy(correct), entropy(wrong));
  close(entropy(p), 0.8979457248567797);
  close(crossEntropy(p, [1 / 3, 1 / 3, 1 / 3]), Math.log(3));
  close(divergence(p, p), 0);
  close(entropy([1, 0, 0]), 0);
  assert.ok(crossEntropy(p, correct) < crossEntropy(p, wrong));
  assert.equal(crossEntropy(p, [0, 0.5, 0.5]), Infinity);
  assert.equal(last("l06", "zero").metrics[1].value, "∞");
  close(Number(last("l06", "correct").metrics[1].value), 0.2231);
  close(Number(last("l06", "wrong").metrics[1].value), 2.3026);
});

test("target provenance changes by setup and group/time leakage is distinct from source duplication", () => {
  assert.equal(last("l07", "supervised").metrics[2].value, "write");
  assert.match(
    trace("l07", "supervised")[3].caption,
    /2.5 to read and 2 to write/,
  );
  assert.equal(last("l07", "self").metrics[2].value, "0.5 / 0.5");
  assert.equal(last("l07", "unsupervised").metrics[2].value, "Tie");
  for (const [scenario, failures, mean] of [
    ["clean", "0", "3"],
    ["row", "1", "6"],
    ["future", "1", "6"],
    ["global", "1", "7"],
    ["duplicate", "2", "3"],
  ]) {
    assert.equal(last("l08", scenario).metrics[2].value, failures, scenario);
    assert.equal(last("l08", scenario).metrics[0].value, mean, scenario);
  }
  assert.deepEqual(trace("l08", "row")[3].scene.flaggedRows, []);
  assert.ok(trace("l08", "row")[4].scene.flaggedRows.length > 0);
});

test("regression, classification, polynomial fits and threshold metrics preserve their distinct targets", async () => {
  const { fitPolynomial, polynomial, confusionAt } = await import(
    "../lib/lessons/full/classical-models.ts"
  );
  close(Number(last("l09", "reg-low").metrics[2].value), 7.5);
  close(Number(last("l09", "reg-fit").metrics[2].value), 0);
  close(Number(last("l09", "class-normal").metrics[1].value), 0.7311);
  assert.equal(last("l09", "class-normal").metrics[2].value, "Flag");
  assert.equal(last("l09", "class-strict").metrics[2].value, "Pass");
  const xs = [-1, -0.3, 0.3, 1],
    ys = [1.4, 1.3, 2.7, 2.6];
  const cubic = fitPolynomial(xs, ys, 3);
  close(cubic[0], 2);
  close(cubic[1], 2.5047619047619047);
  close(cubic[3], -1.9047619047619047);
  xs.forEach((x, i) => close(polynomial(cubic, x), ys[i]));
  assert.ok(
    Number(last("l10", "cubic").metrics[1].value) <
      Number(last("l10", "linear").metrics[1].value),
  );
  assert.ok(
    Number(last("l10", "cubic").metrics[2].value) >
      Number(last("l10", "linear").metrics[2].value),
  );
  const penalized = fitPolynomial(xs, ys, 3, 0.1);
  assert.ok(
    penalized.slice(1).reduce((sum, c) => sum + c * c, 0) <
      cubic.slice(1).reduce((sum, c) => sum + c * c, 0),
  );
  const counts = confusionAt(0.5);
  assert.deepEqual([counts.tp, counts.fp, counts.fn, counts.tn], [2, 2, 1, 3]);
  close(counts.precision, 0.5);
  close(counts.recall, 2 / 3);
  close(counts.f1, 4 / 7);
  close(counts.accuracy, 0.625);
  assert.equal(confusionAt(1.1).precision, null);
  close(confusionAt(1.1).recall, 0);
  assert.equal(last("l11", "balanced").metrics[2].value, "6");
  assert.equal(last("l11", "strict").metrics[2].value, "8");
  const bins = last("l11", "calibration").scene.rows;
  close(Number(bins[0][2]), 0.1875);
  close(Number(bins[0][3]), 0.25);
  close(Number(bins[1][2]), 0.7625);
  close(Number(bins[1][3]), 0.5);
});

test("classical methods expose fitted branches, bootstrap variation, residual correction and margin objectives", async () => {
  const { fitStump, boostingTrace, svmTrace } = await import(
    "../lib/lessons/full/classical-models.ts"
  );
  assert.equal(last("l12", "knn-one").metrics[2].value, "1");
  assert.equal(last("l12", "knn-three").metrics[2].value, "0");
  const stump = fitStump([0, 1, 2, 3, 4, 5], [0, 0, 1, 0, 1, 1]);
  close(stump.cut, 1.5);
  close(stump.left, 0);
  close(stump.right, 0.75);
  close(stump.error, 0.125);
  close(Number(last("l12", "forest").metrics[1].value), 0.5833);
  const boost = boostingTrace();
  close(boost[0].error, 0.25);
  assert.ok(boost.every((state, i) => !i || state.error < boost[i - 1].error));
  assert.ok(boost[1].predictions.some((p) => p !== 0.5));
  const svm = svmTrace();
  close(svm[0].objective, 1);
  assert.ok(svm.at(-1).objective < svm[0].objective);
  assert.ok(Math.abs(svm.at(-1).w - 7 / 15) < 0.003);
  close(Number(last("l12", "naive-bayes").metrics[1].value), 0.16);
  close(Number(last("l12", "naive-bayes").metrics[2].value), 0.5);
});

test("k-means alternates assignments and means, density flags unsupported points, PCA measures the actual projection", async () => {
  const { kMeansRounds, densityGroups } = await import(
    "../lib/lessons/full/classical-models.ts"
  );
  const points = [
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
  const states = kMeansRounds(points, [
    [-3, 0],
    [3, 0],
  ]);
  assert.deepEqual(states[1].centers, [
    [-3, 0],
    [3, 0],
  ]);
  assert.deepEqual(states[2].centers, [
    [-2.5, 0],
    [2.5, 0],
  ]);
  assert.deepEqual(states.at(-1).groups, [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
  assert.equal(
    kMeansRounds(points, [
      [-3, 0],
      [-3, 0],
    ])[2].empty,
    1,
  );
  assert.deepEqual(
    densityGroups([...points, [8, 0]]),
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, -1],
  );
  close(Number(last("l13", "kmeans").metrics[1].value), 11);
  close(Number(last("l13", "pca-horizontal").metrics[1].value), 6.5);
  close(Number(last("l13", "pca-diagonal").metrics[1].value), 3.5833);
  close(Number(last("l13", "pca-vertical").metrics[1].value), 0.6667);
});

test("conditioning and intervention use different weather mixtures; interval calibration never learns from evaluation targets", async () => {
  const { causalCounts, conformalRadius } = await import(
    "../lib/lessons/full/classical-models.ts"
  );
  close(causalCounts(false).rate, 0.74);
  close(causalCounts(true).rate, 0.5);
  assert.equal(last("l14", "observational").metrics[1].value, "74%");
  assert.equal(last("l14", "intervention").metrics[1].value, "50%");
  assert.deepEqual(
    conformalRadius([0.8, 0.1, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.6], 0.2),
    { rank: 8, radius: 0.6 },
  );
  assert.equal(conformalRadius([0.1, 0.2], 0.01).radius, Infinity);
  assert.equal(
    last("l14", "coverage").metrics[1].value,
    last("l14", "shift").metrics[1].value,
  );
  assert.equal(last("l14", "coverage").metrics[2].value, "5/5");
  assert.equal(last("l14", "shift").metrics[2].value, "1/5");
});
