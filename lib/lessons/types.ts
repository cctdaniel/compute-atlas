import type { InferenceScene } from "./full/inference-scenes";
import type { AdaptationScene } from "./full/adaptation-scenes";
import type { SequenceScene } from "./full/sequence-scenes";
import type { NeuralScene } from "./full/neural-scenes";
export type Metric = { label: string; value: string };
export type Point = { x: number; y: number; label?: string; group?: "train" | "validation" | "query" };
export type Scene =
  | InferenceScene
  | AdaptationScene
  | NeuralScene
  | SequenceScene
  | { kind: "cloud"; points: { x: number; y: number; group: number }[]; centers: number[][]; projection: number[] | null; context: { label: string; value: string }[] }
  | { kind: "causal"; intervention: boolean; stage: number; rate: number; rows: { hot: boolean; high: boolean; n: number; swim: number }[] }
  | { kind: "audit"; heading: string; columns: string[]; rows: string[][]; activeRow: number; context: { label: string; value: string }[]; flaggedRows: number[] }
  | { kind: "tensor"; shape: number[]; selected: number[]; stage: number; offset: number; a: number[][]; b: number[][]; output: number[][] | null }
  | { kind: "distribution"; probabilities: number[]; target: number[]; outcomes: string[]; entries: { label: string; value: string }[]; active: number }
  | { kind: "products"; rows: number[][]; weights: number[]; outputs: (number | null)[]; activeRow: number; activeTerm: number; terms: string[]; bias?: number; activation?: string; total: number | null; output: number | null }
  | { kind: "population"; spam: number; spamMatches: number; otherMatches: number; filtered: boolean; stage: number }
  | { kind: "partitions"; records: { id: number; source: number; group: string }[]; stage: number; overlaps: number[] }
  | { kind: "plot"; points: Point[]; curve: Point[]; reference?: Point[]; xLabel: string; yLabel: string; xMin?: number; xMax: number; yMin: number; yMax: number; visibleValidation: boolean; activePoint: number; modelLabel: string; referenceLabel?: string; pointsLabel?: string }
  | { kind: "decision"; xLabel?: string; scoreLabel?: string; positiveLabel?: string; negativeLabel?: string; x: number; weight: number; bias: number; z: number; probability: number; threshold: number; stage: number }
  | { kind: "confusion"; tp: number; fp: number; fn: number; tn: number; processed: number; total: number; threshold: number; active: { actual: boolean; score: number; predicted: boolean } | null }
  | { kind: "chain"; nodes: { label: string; value: number }[]; weights: number[]; gradients: (number | null)[]; active: number; backward: boolean; updated: boolean }
  | { kind: "vectors"; query: number[]; queryLabel: string; candidates: { label: string; vector: number[]; score: number | null }[]; revealed: number; active: number }
  | { kind: "tokens"; text: string; tokens: string[]; ids: number[]; pair: string | null; showIds: boolean }
  | { kind: "attention"; query: number[]; keys: number[][]; values: number[][]; scores: number[]; weights: number[]; allowed: boolean[]; stage: number; active: number; output: number[] }
  | { kind: "pipeline"; stages: string[]; active: number; heading: string; values: { label: string; value: string }[]; result: string; detail: string; context?: { label: string; value: string }[]; residuals?: boolean };
export type Frame = { title: string; caption: string; calculation: string; metrics: Metric[]; scene: Scene; nextAction?: string };
export type Scenario = { id: string; label: string; description: string };
export type Experiment = { id: string; title: string; scenarios: Scenario[]; build: (scenario: string) => Frame[] };
export type PreparedExperiment = { id: string; title: string; scenarios: (Scenario & { frames: Frame[] })[] };
export type Question = { prompt: string; options: string[]; correct: number; answer: string[] };
export type LessonContent = {
  slug: string;
  sourceId?: string;
  deck: string;
  objective: string;
  prerequisites: string[];
  problem: { heading: string; paragraphs: string[] };
  intuition: { heading: string; paragraphs: string[]; limit: string };
  walkthrough: { heading: string; intro: string; steps: { title: string; calculation: string; why: string }[] };
  prediction: Question;
  experimentIntro: string;
  math: { heading: string; intro: string[]; rules: { label: string; formula: string }[]; paragraphs: string[]; limit: string };
  transfer: { prompt: string; answer: string[] };
  takeaways: string[];
  sources: { title: string; url: string }[];
};
