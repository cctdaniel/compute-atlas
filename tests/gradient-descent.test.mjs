import test from "node:test";
import assert from "node:assert/strict";
import { train, example } from "../lib/gradient-descent.ts";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} should equal ${expected}`);

test("the published worked example matches the first two parameter updates", () => {
  const trace = train(0.1);
  close(trace[0].prediction, 2);
  close(trace[0].loss, 2);
  close(trace[0].gradient, -4);
  close(trace[1].weight, 1.4);
  close(trace[1].prediction, 2.8);
  close(trace[1].loss, 0.72);
  close(trace[2].weight, 1.64);
  close(trace[2].loss, 0.2592);
});

test("one-leap preset reaches and retains the analytical optimum", () => {
  assert.ok(train(0.25).slice(1).every((state) => state.weight === 2 && state.loss === 0));
});

test("the stability boundary oscillates while an excessive rate diverges", () => {
  assert.deepEqual(train(0.5).slice(0, 4).map((state) => state.weight), [1, 3, 1, 3]);
  assert.ok(train(0.5).every((state) => state.loss === 2));
  const divergent = train(0.6);
  close(divergent[1].loss, 3.92);
  assert.ok(divergent.slice(1).every((state, index) => state.loss > divergent[index].loss));
});

test("ordinary training reduces loss without reusing rounded display values", () => {
  const trace = train(0.1);
  assert.equal(trace.length, example.updates + 1);
  trace.forEach((state, index) => {
    const expectedWeight = 2 - 0.6 ** index;
    close(state.weight, expectedWeight);
    close(state.loss, 2 * 0.36 ** index);
  });
});

test("zero rate stays stationary and invalid rates fail explicitly", () => {
  assert.ok(train(0).every((state) => state.weight === 1 && state.loss === 2));
  for (const rate of [NaN, Infinity, -0.1, 0.61]) assert.throws(() => train(rate), RangeError);
});
