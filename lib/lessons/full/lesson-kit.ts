import type { Frame, Scene } from "../types";
export const numeric = (value: number | null): string => {
  if (value === null) return "—";
  if (Number.isNaN(value))
    throw new RangeError("A displayed calculation produced NaN.");
  if (!Number.isFinite(value)) return value < 0 ? "−∞" : "∞";
  if (Math.abs(value) < 0.00005) return "0";
  return Math.abs(value) >= 10000
    ? value.toExponential(2)
    : Number.isInteger(value)
      ? String(value)
      : value.toFixed(4);
};
export const dot = (a: number[], b: number[]) => {
  if (a.length !== b.length)
    throw new RangeError("Dot products need matching dimensions.");
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
};
export const softmax = (scores: number[], allowed = scores.map(() => true)) => {
  if (scores.length !== allowed.length || !allowed.some(Boolean))
    throw new RangeError("A softmax row needs at least one permitted key.");
  const max = Math.max(...scores.filter((_, i) => allowed[i])),
    exp = scores.map((score, i) => (allowed[i] ? Math.exp(score - max) : 0)),
    sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((v) => v / sum);
};
export const layerNorm = (values: number[], epsilon = 1e-5) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length,
    variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return values.map((v) => (v - mean) / Math.sqrt(variance + epsilon));
};
export const makeFrame = (
  title: string,
  caption: string,
  calculation: string,
  entries: [string, number | string | null][],
  scene: Scene,
): Frame => ({
  title,
  caption,
  calculation,
  metrics: entries.map(([label, value]) => ({
    label,
    value: typeof value === "string" ? value : numeric(value),
  })),
  scene,
});
