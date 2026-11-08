export type NeuralScene =
  | {
      kind: "mlp";
      input: number[];
      activation: string;
      z: number[];
      h: number[];
      score: number;
      linear: boolean;
      stage: number;
      cases: {
        input: number[];
        target: number;
        score: number;
        predicted: number;
      }[];
    }
  | {
      kind: "autodiff";
      x: number;
      target: number | null;
      weight: number;
      bias: number;
      product: number;
      prediction: number;
      error: number | null;
      loss: number | null;
      gw: number | null;
      gb: number | null;
      stage: number;
      phase: "forward" | "backward" | "update" | "inference";
    }
  | {
      kind: "optimization";
      path: number[][];
      gradient: number[];
      usedGradient: number[];
      update: number[];
      appliedUpdate: number[];
      rate: number;
      loss: number;
      step: number;
      memory: number[];
      sample: number | null;
    }
  | {
      kind: "dropout";
      activations: number[];
      mask: number[];
      scaled: number[];
      trainingOutput: number;
      evaluationOutput: number;
      keep: number;
      stage: number;
    }
  | {
      kind: "embedding";
      query: number[];
      items: { label: string; vector: number[]; score: number | null }[];
      order: number[];
      active: number;
      metric: "Cosine" | "Distance" | "Dot score";
      training: {
        positive: string;
        negative: string;
        loss: number;
        probabilities: number[];
      } | null;
    };
