export type AdaptationScene =
  | {
      kind: "scaling-budget";
      rows: {
        n: number;
        d: number;
        modelTerm: number;
        dataTerm: number;
        loss: number;
        lifetime: number;
      }[];
      active: number;
      requests: number;
      coefficient: number;
    }
  | {
      kind: "prompt-contract";
      prompt: string;
      source: string;
      response: string;
      checks: {
        label: string;
        passed: boolean | null;
        detail: string;
      }[];
      revealed: number;
    }
  | {
      kind: "context-budget";
      capacity: number;
      items: {
        label: string;
        units: number;
        text: string;
        kept: boolean;
        processed: boolean;
      }[];
      used: number;
      facts: {
        label: string;
        available: boolean;
      }[];
      checked: boolean;
    }
  | {
      kind: "decode-choice";
      labels: string[];
      probabilities: number[];
      filtered: number[];
      counts: number[];
      draw: number | null;
      selected: number | null;
      phase: number;
      branches: {
        label: string;
        probability: number;
        retained: boolean;
      }[];
    }
  | {
      kind: "candidate-verifier";
      candidates: {
        answer: number;
        checked: boolean;
        passed: boolean | null;
      }[];
      generated: number;
      selected: number | null;
      used: number;
      budget: number;
      method: string;
    }
  | {
      kind: "sft-mask";
      rows: {
        token: string;
        alternative: string;
        feature: number;
        probability: number;
        included: boolean;
      }[];
      weight: number;
      gradient: number | null;
      loss: number;
      stage: number;
      updated: boolean;
    }
  | {
      kind: "reward-policy";
      candidates: {
        text: string;
        correct: boolean;
        feature: number;
        reward: number;
        reference: number;
        policy: number;
      }[];
      weight: number;
      pairProbability: number;
      beta: number;
      stage: number;
      featureName: string;
    }
  | {
      kind: "preference-update";
      weight: number;
      reference: number;
      preferred: number;
      margin: number;
      loss: number;
      gradient: number;
      probability: number;
      stage: number;
      checks: {
        label: string;
        result: string;
      }[];
    }
  | {
      kind: "lora-adapter";
      base: number[][];
      a: number[][];
      b: number[][];
      delta: number[][];
      input: number[];
      output: number[];
      target: number[];
      gradA: number[][];
      gradB: number[][];
      stage: number;
      scale: number;
      rank: number;
      quantized: boolean;
      updated: boolean;
    }
  | {
      kind: "distillation";
      weight: number;
      teacher: number;
      target: number;
      probability: number;
      heldOut: number;
      heldTarget: number;
      oldLoss: number;
      newLoss: number;
      gradient: number;
      stage: number;
      phase: string;
      history: {
        step: number;
        p: number;
        target: number;
      }[];
    };
