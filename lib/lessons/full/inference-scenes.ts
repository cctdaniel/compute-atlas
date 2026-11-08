export type InferenceScene =
  | {
      kind: "kv-cache";
      tokens: {
        position: number;
        input: number[];
        key: number[];
        value: number[];
        state: string;
      }[];
      query: number[];
      weights: number[];
      output: number[] | null;
      processed: number;
      projected: number;
      pairs: number;
      bytes: number;
      mode: string;
      layers: number;
      batch: number;
      heads: number;
    }
  | {
      kind: "device-memory";
      parts: { label: string; bytes: number }[];
      added: number;
      budget: number;
      bits: number;
      batch: number;
      used: number;
      quantization: { weight: number; code: number; restored: number }[];
      scale: number;
      fullOutput: number;
      quantOutput: number;
      formats: { label: string; exponent: number; fraction: number }[];
    }
  | {
      kind: "parallel-work";
      method: string;
      devices: {
        name: string;
        stored: number;
        task: string;
        result: number[];
        done: boolean;
      }[];
      input: number[][];
      output: number[][];
      stage: number;
      communication: string;
    }
  | {
      kind: "serving-queue";
      time: number;
      requests: {
        id: string;
        arrival: number;
        length: number;
        generated: number;
        status: string;
        first: number | null;
        finish: number | null;
        pages: number[];
      }[];
      capacity: number;
      cycle: number;
      mode: string;
      pages: { id: number; owner: string | null; used: number }[];
      throughput: number;
      completed: number;
    }
  | {
      kind: "online-attention";
      scores: number[];
      values: number[];
      seen: number;
      maximum: number | null;
      denominator: number;
      numerator: number;
      output: number | null;
      direct: number;
      tile: number;
    }
  | {
      kind: "speculative-sample";
      target: number[];
      draft: number[];
      acceptance: number[];
      accepted: number[];
      residual: number[];
      result: number[];
      proposal: number;
      uniform: number;
      acceptedProposal: boolean;
      output: number;
      phase: number;
      naive: boolean;
    }
  | {
      kind: "expert-routing";
      experts: { label: string; load: number; capacity: number }[];
      tokens: {
        input: number[];
        routes: number[];
        output: number[];
        status: string;
      }[];
      processed: number;
      current: number;
      logits: number[];
      weights: number[];
      topK: number;
      total: number;
      active: number;
      policy: string;
    }
  | {
      kind: "retrieval-ranking";
      query: string;
      queryVector: number[];
      documents: {
        id: string;
        text: string;
        vector: number[];
        lexical: number;
        dense: number;
        fusion: number;
        joint: number;
        included: boolean;
        relevant: boolean;
      }[];
      ranking: string[];
      shortlist: string[];
      phase: number;
      method: string;
    }
  | {
      kind: "rag-evidence";
      source: string;
      words: number;
      chunks: {
        id: string;
        start: number;
        end: number;
        text: string;
        score: number;
        selected: boolean;
      }[];
      phase: number;
      size: number;
      overlap: number;
      k: number;
      claims: {
        text: string;
        support: string[];
        supported: boolean;
        emitted: boolean;
      }[];
      answer: string;
      missing: boolean;
    };
