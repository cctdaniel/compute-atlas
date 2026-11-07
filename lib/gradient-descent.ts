/** One weight, one training example, fixed zero bias. No rounded values feed the trace. */
export const example = { x: 2, target: 4, initialWeight: 1, updates: 12 };
export type TrainingState = { step: number; weight: number; prediction: number; error: number; loss: number; gradient: number };

export function train(rate: number): TrainingState[] {
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.6) throw new RangeError("Learning rate must be between 0 and 0.6.");
  let weight = example.initialWeight;
  return Array.from({ length: example.updates + 1 }, (_, step) => {
    const prediction = weight * example.x;
    const error = prediction - example.target;
    const state = { step, weight, prediction, error, loss: 0.5 * error ** 2, gradient: error * example.x };
    weight -= rate * state.gradient;
    return state;
  });
}

export function format(value: number) {
  if (Math.abs(value) > 9999) return value.toExponential(2);
  if (Math.abs(value) < 0.0005) return "0.000";
  return value.toFixed(3);
}
