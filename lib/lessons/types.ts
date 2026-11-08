export type Metric = { label: string; value: string };
export type Point = { x: number; y: number; label?: string; group?: "train" | "validation" | "query" };
export type Scene =
  | { kind: "products"; rows: number[][]; weights: number[]; outputs: (number | null)[]; activeRow: number; activeTerm: number; terms: string[]; bias?: number; activation?: string; total: number | null; output: number | null }
  | { kind: "population"; spam: number; spamMatches: number; otherMatches: number; filtered: boolean; stage: number }
  | { kind: "partitions"; records: { id: number; source: number; group: string }[]; stage: number; overlaps: number[] }
  | { kind: "plot"; points: Point[]; curve: Point[]; reference?: Point[]; xLabel: string; yLabel: string; xMax: number; yMin: number; yMax: number; visibleValidation: boolean; activePoint: number; modelLabel: string }
  | { kind: "decision"; x: number; weight: number; bias: number; z: number; probability: number; threshold: number; stage: number }
  | { kind: "confusion"; tp: number; fp: number; fn: number; tn: number; processed: number; total: number; threshold: number; active: { actual: boolean; score: number; predicted: boolean } | null }
  | { kind: "chain"; nodes: { label: string; value: number }[]; weights: number[]; gradients: (number | null)[]; active: number; backward: boolean; updated: boolean }
  | { kind: "vectors"; query: number[]; queryLabel: string; candidates: { label: string; vector: number[]; score: number | null }[]; revealed: number; active: number }
  | { kind: "tokens"; text: string; tokens: string[]; ids: number[]; pair: string | null; showIds: boolean }
  | { kind: "attention"; query: number[]; keys: number[][]; values: number[][]; scores: number[]; weights: number[]; allowed: boolean[]; stage: number; active: number; output: number[] }
  | { kind: "pipeline"; stages: string[]; active: number; heading: string; values: { label: string; value: string }[]; result: string; detail: string; context?: { label: string; value: string }[]; residuals?: boolean };
export type Frame = { title: string; caption: string; calculation: string; metrics: Metric[]; scene: Scene };
export type Scenario = { id: string; label: string; description: string };
export type Experiment = { id: string; title: string; scenarios: Scenario[]; build: (scenario: string) => Frame[] };
export type PreparedExperiment = { id: string; title: string; scenarios: (Scenario & { frames: Frame[] })[] };
export type Question = { prompt: string; options: string[]; correct: number; answer: string[] };
export type LessonContent = {
  slug: string;
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
