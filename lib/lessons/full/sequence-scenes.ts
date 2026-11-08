export type SequenceScene =
  | {
      kind: "recurrent";
      method: string;
      tokens: number[];
      seen: number;
      previous: number;
      state: number;
      cell: number | null;
      gates: { label: string; value: number }[];
      store: number[] | null;
      recall: number | null;
      rule: string;
    }
  | {
      kind: "attention-matrix";
      phase: string;
      queries: number[][];
      keys: number[][];
      values: number[][];
      rawScores: number[][];
      scores: number[][];
      weights: number[][];
      allowed: boolean[][];
      outputs: number[][];
      stage: number;
      activeRow: number;
      queryNames: string[];
      keyNames: string[];
      outputLabel: string;
      note: string;
    }
  | {
      kind: "decoder-block";
      token: number;
      positions: boolean;
      residuals: boolean;
      nodes: { label: string; shape: string; value: number[] }[];
      stage: number;
      inputTokens: number[][];
      order: number[];
    }
  | {
      kind: "tokenizer";
      corpus: { word: string; count: number; tokens: string[] }[];
      merge: string[] | null;
      pairCounts: { pair: string[]; count: number }[];
      query: string;
      encoded: string[];
      ids: number[];
      serialized: number[];
      role: string;
      merges: string[][];
      stage: number;
    }
  | {
      kind: "language-model";
      mode: "generate" | "train";
      sequence: string[];
      logits: number[];
      probabilities: number[];
      vocabulary: string[];
      selected: number | null;
      stage: number;
      rows: {
        prefix: string[];
        target: string;
        probability: number;
        loss: number;
      }[];
      stop: string;
      totalProbability: number;
    };
