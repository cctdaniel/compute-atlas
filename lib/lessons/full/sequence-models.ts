import type { Experiment } from "../types";
import {
  numeric as n,
  dot,
  softmax,
  layerNorm,
  makeFrame as f,
} from "./lesson-kit.ts";
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export function recurrentStates(method: string, tokens: number[]) {
  let h = 0,
    c = 0;
  const states = [
    { h, c, previous: 0, gates: [] as { label: string; value: number }[] },
  ];
  for (const x of tokens) {
    const previous = h;
    let gates: { label: string; value: number }[] = [];
    if (method === "lstm") {
      const forget = sigmoid(1.4 + 0.2 * h),
        input = sigmoid(-1 + 0.5 * x),
        output = sigmoid(1),
        candidate = Math.tanh(x + 0.2 * h);
      c = forget * c + input * candidate;
      h = output * Math.tanh(c);
      gates = [
        { label: "Forget gate", value: forget },
        { label: "Input gate", value: input },
        { label: "Output gate", value: output },
        { label: "Candidate", value: candidate },
      ];
    } else if (method === "gru") {
      const reset = sigmoid(0.5 * x),
        update = sigmoid(-1 + 0.2 * h),
        candidate = Math.tanh(x + 0.5 * reset * h);
      h = (1 - update) * h + update * candidate;
      gates = [
        { label: "Reset gate", value: reset },
        { label: "New-candidate share z", value: update },
        { label: "Candidate", value: candidate },
      ];
    } else if (method === "state-space" || method === "selective") {
      const a = method === "selective" ? (x < 0 ? 0.2 : 0.9) : 0.8;
      h = a * h + (1 - a) * x;
      gates = [
        { label: "Previous-state coefficient a", value: a },
        { label: "Input coefficient 1−a", value: 1 - a },
      ];
    } else {
      h = Math.tanh(0.5 * h + x);
      gates = [
        { label: "Recurrent weight", value: 0.5 },
        { label: "Input x", value: x },
      ];
    }
    states.push({ h, c, previous, gates });
  }
  return states;
}
const recurrenceRules: Record<string, string> = {
  rnn: "hₜ=tanh(0.5hₜ₋₁+xₜ)",
  lstm: "cₜ=fₜcₜ₋₁+iₜgₜ; hₜ=oₜtanh(cₜ)",
  gru: "nₜ=tanh(xₜ+0.5rₜhₜ₋₁); hₜ=(1−zₜ)hₜ₋₁+zₜnₜ",
  "state-space": "hₜ=0.8hₜ₋₁+0.2xₜ",
  selective: "aₜ=0.2 for Blue, 0.9 for Red; hₜ=aₜhₜ₋₁+(1−aₜ)xₜ",
  store: "Store the permitted prefix; read its first indexed element",
};
export function sequenceTrace(scenario: string) {
  const method =
    scenario === "long"
      ? "rnn"
      : scenario === "flip-first"
        ? "state-space"
        : scenario;
  const tokens =
    scenario === "long"
      ? [1, ...Array(11).fill(-1)]
      : scenario === "flip-first"
        ? [-1, -1, -1, -1]
        : [1, -1, -1, -1];
  const states = recurrentStates(method, tokens);
  return states.map((state, step) => {
    const recall = step
      ? method === "store"
        ? tokens[0]
        : state.h === 0
          ? null
          : Math.sign(state.h)
      : null;
    return f(
      step ? `Read symbol ${step}` : "Start with empty state",
      step
        ? `Consume ${tokens[step - 1] === 1 ? "Red (+1)" : "Blue (−1)"}. ${method === "store" ? "Append to the retained prefix, then retrieve the first element by index." : `Apply the declared rule to previous h=${n(state.previous)}, obtaining h=${n(state.h)}.`} ${method === "store" ? "Exact lookup here is possible because this toy store retains every permitted token." : "A sign-of-state readout is only our deliberately simple recall rule; it is not an architectural impossibility result."}`
        : "The input sequence is declared, but the state update reads only the next permitted symbol. The first symbol is the recall target; supplied parameters are not trained for this task.",
      recurrenceRules[method],
      [
        ["Read", step],
        ["State", method === "store" ? step : state.h],
        ["Recall", recall === null ? "—" : recall === 1 ? "Red" : "Blue"],
      ],
      {
        kind: "recurrent",
        method,
        tokens,
        seen: step,
        previous: state.previous,
        state: state.h,
        cell: method === "lstm" ? state.c : null,
        gates: state.gates,
        store: method === "store" ? tokens.slice(0, step) : null,
        recall,
        rule: recurrenceRules[method],
      },
    );
  });
}
const sequences: Experiment = {
  id: "l19",
  title: "A recurrent state is not an indexed transcript.",
  scenarios: [
    {
      id: "rnn",
      label: "A scalar RNN",
      description:
        "Read Red, Blue, Blue, Blue using h=tanh(0.5h+x). Inspect state and a simple sign readout.",
    },
    {
      id: "long",
      label: "A longer RNN input",
      description:
        "Keep Red first, then supply eleven Blue symbols. The parameters and readout stay fixed.",
    },
    {
      id: "lstm",
      label: "An explicit LSTM cell",
      description:
        "Compute input, forget, and output gates, a cell state, and a hidden state with supplied parameters.",
    },
    {
      id: "gru",
      label: "An explicit GRU-style cell",
      description:
        "Compute reset and update gates. In this convention z weights the new candidate.",
    },
    {
      id: "state-space",
      label: "A linear state update",
      description: "Use h=0.8h_previous+0.2x on the same four inputs.",
    },
    {
      id: "flip-first",
      label: "Change the earliest symbol",
      description:
        "Use the linear state update, but change only the first Red to Blue.",
    },
    {
      id: "selective",
      label: "Input-dependent state coefficient",
      description:
        "Use a different previous-state coefficient for Red and Blue. This illustrates selection, not a full Mamba implementation.",
    },
    {
      id: "store",
      label: "A token-addressable store",
      description:
        "Retain the permitted prefix explicitly and read its first element by index.",
    },
  ],
  build: sequenceTrace,
};

export function attentionRows(
  queries: number[][],
  keys: number[][],
  values: number[][],
  causal = false,
) {
  const rawScores = queries.map((q) => keys.map((k) => dot(q, k))),
    scores = rawScores.map((row, i) =>
      row.map((score) => score / Math.sqrt(queries[i].length)),
    ),
    allowed = queries.map((_, i) => keys.map((_, j) => !causal || j <= i)),
    weights = scores.map((row, i) => softmax(row, allowed[i])),
    outputs = weights.map((row) =>
      values[0].map((_, dim) =>
        row.reduce((sum, a, j) => sum + a * values[j][dim], 0),
      ),
    );
  return { rawScores, scores, allowed, weights, outputs };
}
export function attentionMatrixTrace(scenario: string) {
  const cross = scenario === "cross",
    multi = scenario === "multihead",
    causal = scenario !== "full" && !cross;
  const q = cross
      ? [
          [1, 1],
          [1, 0],
        ]
      : [
          [1, 0],
          [0, 1],
          [1, 1],
        ],
    k = [
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    v = [[2, 0], [0, 2], scenario === "future-value" ? [100, 100] : [1, 1]];
  const main = attentionRows(q, k, v, causal),
    q2 = q.map(([a, b]) => [b, a]),
    second = attentionRows(q2, k, v, causal);
  const projected = main.outputs.map((row, i) =>
    row.map((value, j) => (value + second.outputs[i][j]) / 2),
  );
  return Array.from({ length: 9 }, (_, stage) => {
    const head2 = multi && stage === 7,
      data = head2 ? second : main,
      queries = head2 ? q2 : q,
      outputs = multi && stage === 8 ? projected : data.outputs;
    return f(
      [
        "Identify queries, keys, and values",
        "Compute every query–key dot product",
        "Scale scores by key width",
        "Apply the permitted-key mask",
        "Normalize each query row",
        "Mix values for the first query",
        "Mix the next query row",
        multi ? "Inspect a second projected head" : "Inspect all output rows",
        multi ? "Concatenate heads and project" : "Check the output shape",
      ][stage],
      [
        `${q.length} query vectors attend to ${k.length} key/value vectors, each of width 2. ${cross ? "Queries come from a different supplied sequence." : "Queries, keys, and values refer to the same three positions."}`,
        "Each query compares with every key. The score matrix has query-by-key shape, not vocabulary shape.",
        "Divide each dot product by √2. This keeps the declared scaled-dot-product computation explicit.",
        causal
          ? "For query i, disallow keys with index j>i. A disallowed cell receives zero probability after normalization."
          : "Every supplied key is allowed in this attention view.",
        "Apply stable softmax separately to each permitted row. Each row sums to 1; the entire matrix is not normalized as one distribution.",
        `The first output is [${data.outputs[0].map(n).join(", ")}], a weighted sum of value vectors.`,
        `The next output is [${data.outputs[1].map(n).join(", ")}]. A different query can mix the same values differently.`,
        multi
          ? "Head 2 swaps the two query coordinates using a declared linear projection. Inspect its different score rows and mixtures."
          : "All output rows use their own weights. A future value can affect later permitted queries without affecting an earlier masked query.",
        multi
          ? "Concatenate the two 2D outputs, then use a supplied 4×2 projection that averages matching coordinates. Multiple heads usually have learned projections."
          : `Output shape is [${q.length},2]. The weights distribute value contributions; they are not probabilities that statements are true.`,
      ][stage],
      stage === 8 && multi
        ? "concat [head1,head2] @ W_O; W_O averages matching coordinates"
        : "scores=QKᵀ/√2; weights=row_softmax(scores with mask); output=weights×V",
      [
        ["Queries", q.length],
        ["Keys", k.length],
        ["Output width", stage >= 5 ? 2 : "—"],
      ],
      {
        kind: "attention-matrix",
        phase: head2
          ? "Head 2: swapped query projection"
          : multi && stage === 8
            ? "Two heads: concatenation and output projection"
            : cross
              ? "Cross-attention"
              : "Self-attention",
        queries,
        keys: k,
        values: v,
        rawScores: data.rawScores,
        scores: data.scores,
        weights: data.weights,
        allowed: data.allowed,
        outputs,
        stage,
        activeRow: stage === 5 ? 0 : stage === 6 ? 1 : -1,
        queryNames: q.map((_, i) => `${cross ? "Q" : "Token "}${i + 1}`),
        keyNames: k.map((_, i) => `${cross ? "Source " : "Token "}${i + 1}`),
        outputLabel:
          multi && stage === 8 ? "Projected output" : "Weighted value output",
        note: causal
          ? "Future keys are excluded per query row."
          : "All keys are permitted.",
      },
    );
  });
}
const attention: Experiment = {
  id: "l20",
  title: "One probability distribution per query row.",
  scenarios: [
    {
      id: "causal",
      label: "Causal self-attention",
      description: "Inspect all three query rows with future keys excluded.",
    },
    {
      id: "full",
      label: "Unmasked self-attention",
      description:
        "Allow all three keys for every query, keeping Q, K and V unchanged.",
    },
    {
      id: "future-value",
      label: "Change a future value",
      description:
        "Keep the causal mask but replace the third value with [100,100]. The first query must remain unchanged.",
    },
    {
      id: "cross",
      label: "Cross-attention",
      description:
        "Two queries from another sequence attend to three source keys and values: a 2×3 weight matrix.",
    },
    {
      id: "multihead",
      label: "Two projected heads",
      description:
        "Use a second query projection, concatenate both head outputs, then apply a declared output projection.",
    },
  ],
  build: attentionMatrixTrace,
};

export const rotatePair = (v: number[], angle: number) => [
  v[0] * Math.cos(angle) - v[1] * Math.sin(angle),
  v[0] * Math.sin(angle) + v[1] * Math.cos(angle),
];
export function decoderBlock(
  positions = true,
  swapped = false,
  residuals = true,
) {
  const order = swapped ? [1, 0, 2] : [0, 1, 2],
    tokens = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    input = order.map((i) => tokens[i]),
    norm1 = input.map((row) => layerNorm(row));
  const q = norm1.map((row, i) =>
      positions ? rotatePair(row.slice(0, 2), 0.7 * i) : row.slice(0, 2),
    ),
    attn = attentionRows(q, q, norm1, true);
  const residual1 = input.map((row, i) =>
      row.map((v, j) => (residuals ? v : 0) + attn.outputs[i][j]),
    ),
    norm2 = residual1.map((row) => layerNorm(row));
  const hidden = norm2.map(([a, b, c]) =>
      [a, b, c, a - b + 0.5 * c].map((v) => Math.max(0, v)),
    ),
    projected = hidden.map(([a, b, c, d]) => [
      0.5 * a + 0.25 * d,
      0.5 * b + 0.25 * d,
      0.5 * c,
    ]);
  const output = residual1.map((row, i) =>
    row.map((v, j) => (residuals ? v : 0) + projected[i][j]),
  );
  return {
    input,
    order,
    norm1,
    q,
    attn,
    residual1,
    norm2,
    hidden,
    projected,
    output,
  };
}
export function blockTrace(scenario: string) {
  const positions =
      scenario !== "position-off" && scenario !== "position-off-swap",
    swapped = scenario.endsWith("swap"),
    residuals = scenario !== "no-residual",
    state = decoderBlock(positions, swapped, residuals),
    token = scenario === "first" ? 0 : 2;
  const nodes = [
    { label: "Input token", shape: "d_model=3", value: state.input[token] },
    {
      label: "Pre-normalization",
      shape: "3 values; ε=10⁻⁵",
      value: state.norm1[token],
    },
    {
      label: "Causal attention output",
      shape: "Q/K width 2; V width 3",
      value: state.attn.outputs[token],
    },
    {
      label: "First residual addition",
      shape: "3 + 3 → 3",
      value: state.residual1[token],
    },
    {
      label: "Second pre-normalization",
      shape: "3 values",
      value: state.norm2[token],
    },
    {
      label: "MLP hidden activation",
      shape: "3 @ [3,4] → 4; ReLU",
      value: state.hidden[token],
    },
    {
      label: "MLP output projection",
      shape: "4 @ [4,3] → 3",
      value: state.projected[token],
    },
    {
      label: "Second residual addition",
      shape: "3 + 3 → 3",
      value: state.output[token],
    },
  ];
  return nodes.map((node, stage) =>
    f(
      node.label,
      [
        `Read token position ${token}. The input order is [${state.order.join(", ")}]. This is one supplied pre-normalized decoder block, not a complete language model.`,
        "Normalize each token across its three coordinates. This operation does not mix information between positions.",
        `Use causal attention. ${positions ? "Rotate Q/K pairs by position angle 0.7×index before scoring." : "No rotary position transform is used in this controlled block."} Values have width 3.`,
        residuals
          ? "Add the attention pathway output to its input. This preserves a direct route for the representation."
          : "The residual route is deliberately disabled: only the attention pathway output remains.",
        "Normalize the first residual result before applying the positionwise MLP.",
        "Project from three coordinates to four, then apply ReLU independently to each hidden coordinate.",
        "Project the four hidden values back to the model width of three.",
        residuals
          ? "Add the MLP result to the first residual representation. The block returns three values per position."
          : "With residuals disabled, the block returns only the projected MLP output.",
      ][stage],
      `${node.label}: [${node.value.map(n).join(", ")}]`,
      [
        ["Position", token],
        ["Visible width", node.value.length],
        ["RoPE", positions ? "On" : "Off"],
      ],
      {
        kind: "decoder-block",
        token,
        positions,
        residuals,
        nodes,
        stage,
        inputTokens: state.input,
        order: state.order,
      },
    ),
  );
}
const block: Experiment = {
  id: "l21",
  title: "Follow one token through a pre-normalized decoder block.",
  scenarios: [
    {
      id: "rope",
      label: "Causal block with RoPE",
      description:
        "Inspect the final token using rotary Q/K pairs, two residual additions, and a 3→4→3 MLP.",
    },
    {
      id: "position-off",
      label: "Remove the rotary transform",
      description:
        "Keep the same block and causal mask, but use content-only Q/K scores.",
    },
    {
      id: "position-off-swap",
      label: "Swap earlier tokens, no RoPE",
      description:
        "Swap the first two input tokens. In this controlled one-block final-position view, content-only attention sees the same preceding set.",
    },
    {
      id: "rope-swap",
      label: "Swap earlier tokens with RoPE",
      description:
        "Keep the final token but exchange the earlier contents at their positions. Rotary scores now change.",
    },
    {
      id: "first",
      label: "Inspect the first token",
      description: "The first causal query can only attend to itself.",
    },
    {
      id: "no-residual",
      label: "Disable residual routes",
      description:
        "Keep the rotary and MLP computations, but remove both direct additions.",
    },
  ],
  build: blockTrace,
};
export const sequenceExperiments = [sequences, attention, block];

export const bpeBase = [
  ...Array.from({ length: 95 }, (_, i) => String.fromCharCode(i + 32)),
  "<end>",
  "<user>",
  "<system>",
  "<assistant>",
  "<end_turn>",
];
export function bpeTraining(alternative = false, rounds = 4) {
  let corpus = (
    alternative
      ? [
          { word: "new", count: 2 },
          { word: "newer", count: 2 },
          { word: "lower", count: 1 },
        ]
      : [
          { word: "low", count: 2 },
          { word: "lower", count: 2 },
          { word: "newer", count: 1 },
        ]
  ).map((row) => ({ ...row, tokens: [...row.word, "<end>"] }));
  const vocabulary = [...bpeBase],
    merges: string[][] = [];
  const states: {
    corpus: typeof corpus;
    merge: string[] | null;
    pairCounts: { pair: string[]; count: number }[];
    merges: string[][];
    vocabulary: string[];
  }[] = [];
  for (let round = 0; round <= rounds; round++) {
    const counts = new Map<string, number>();
    for (const row of corpus)
      for (let i = 0; i < row.tokens.length - 1; i++) {
        const key = JSON.stringify([row.tokens[i], row.tokens[i + 1]]);
        counts.set(key, (counts.get(key) || 0) + row.count);
      }
    const pairCounts = [...counts]
      .map(([key, count]) => ({ pair: JSON.parse(key) as string[], count }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          (JSON.stringify(a.pair) < JSON.stringify(b.pair) ? -1 : 1),
      );
    states.push({
      corpus: corpus.map((row) => ({ ...row, tokens: [...row.tokens] })),
      merge: round ? merges.at(-1)! : null,
      pairCounts,
      merges: merges.map((pair) => [...pair]),
      vocabulary: [...vocabulary],
    });
    if (round === rounds || !pairCounts.length) break;
    const pair = pairCounts[0].pair;
    merges.push(pair);
    vocabulary.push(pair.join(""));
    corpus = corpus.map((row) => ({
      ...row,
      tokens: applyPair(row.tokens, pair),
    }));
  }
  return states;
}
export function applyPair(tokens: string[], pair: string[]) {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === pair[0] && tokens[i + 1] === pair[1]) {
      out.push(pair.join(""));
      i++;
    } else out.push(tokens[i]);
  }
  return out;
}
export function encodeBPE(
  text: string,
  merges: string[][],
  vocabulary: string[],
) {
  if ([...text].some((char) => !bpeBase.includes(char)))
    throw new RangeError(
      "This teaching tokenizer supports printable ASCII only.",
    );
  let tokens = [...text, "<end>"];
  for (const pair of merges) tokens = applyPair(tokens, pair);
  return {
    tokens,
    ids: tokens.map((token) => {
      const id = vocabulary.indexOf(token);
      if (id < 0)
        throw new RangeError("An encoded token is absent from the vocabulary.");
      return id;
    }),
  };
}
export function decodeBPE(ids: number[], vocabulary: string[]) {
  const tokens = ids.map((id) => {
    if (!Number.isInteger(id) || !vocabulary[id])
      throw new RangeError("Unknown vocabulary ID.");
    return vocabulary[id];
  });
  const decoded = tokens.join("");
  return decoded.endsWith("<end>") ? decoded.slice(0, -5) : decoded;
}
export function tokenizerTrace(scenario: string) {
  const training = bpeTraining(scenario === "corpus"),
    query =
      scenario === "unfamiliar"
        ? "lowest"
        : scenario === "uppercase"
          ? "Lower"
          : scenario === "literal-role"
            ? "<system>lower"
            : "lower",
    role = scenario === "system-role" ? "system" : "user";
  return Array.from({ length: 7 }, (_, stage) => {
    const state = training[Math.min(stage, 4)],
      encoded = encodeBPE(query, state.merges, state.vocabulary),
      serialized = [
        state.vocabulary.indexOf(`<${role}>`),
        ...encoded.ids,
        state.vocabulary.indexOf("<end_turn>"),
        state.vocabulary.indexOf("<assistant>"),
      ];
    return f(
      stage === 0
        ? "Declare corpus, alphabet, and boundary"
        : stage <= 4
          ? `Learn merge ${stage}`
          : stage === 5
            ? "Encode the supplied text"
            : "Serialize the message boundary",
      stage === 0
        ? "The base vocabulary contains printable ASCII characters and five explicit boundary/role tokens. Corpus counts weight recurring adjacent pairs. This is a synthetic character-based BPE exercise, not a named production tokenizer."
        : stage <= 4
          ? `Merge the highest-count adjacent pair [${state.merge!.join(", ")}]. Replace non-overlapping occurrences. Counts are recomputed after each merge; ties use a declared lexicographic rule.`
          : stage === 5
            ? `Encode “${query}” by applying learned merge rules in training order. Unmerged printable characters retain their base IDs.`
            : `Place trusted role token <${role}> before the encoded body, then <end_turn> and <assistant>. Literal role-looking text inside the body is encoded as characters, not promoted to a trusted role.`,
      stage <= 4
        ? `Learned merges: ${state.merges.map((pair) => pair.join(" + ")).join(" ; ") || "none"}`
        : `body IDs=[${encoded.ids.join(", ")}]; message IDs=[${serialized.join(", ")}]`,
      [
        ["Merges", state.merges.length],
        ["Body tokens", stage >= 5 ? encoded.tokens.length : "—"],
        ["Role", stage >= 6 ? role : "—"],
      ],
      {
        kind: "tokenizer",
        corpus: state.corpus,
        merge: state.merge,
        pairCounts: state.pairCounts.slice(0, 4),
        query,
        encoded: stage >= 5 ? encoded.tokens : [],
        ids: stage >= 5 ? encoded.ids : [],
        serialized: stage >= 6 ? serialized : [],
        role,
        merges: state.merges,
        stage,
      },
    );
  });
}
const tokenizer: Experiment = {
  id: "l22",
  title: "Learn merges, encode a body, then add trusted message boundaries.",
  scenarios: [
    {
      id: "default",
      label: "Train and encode “lower”",
      description:
        "Train four BPE merges on a declared weighted corpus, then serialize a user message.",
    },
    {
      id: "unfamiliar",
      label: "Encode “lowest”",
      description:
        "Keep the learned merges. Unmerged s and t use printable-character fallback IDs.",
    },
    {
      id: "uppercase",
      label: "Preserve an uppercase L",
      description:
        "Encode “Lower” using the same case-sensitive vocabulary and merge rules.",
    },
    {
      id: "corpus",
      label: "Change the training corpus",
      description:
        "Favor new/newer instead of low/lower. Learn new merge rules and compare the resulting IDs.",
    },
    {
      id: "system-role",
      label: "Change the structured role",
      description:
        "Keep the body “lower” but serialize it as a system message, changing the role token ID.",
    },
    {
      id: "literal-role",
      label: "Role-looking body text",
      description:
        "Put <system> in the user’s text. It remains printable body characters in this teaching serializer.",
    },
  ],
  build: tokenizerTrace,
};

export const toyVocabulary = ["<bos>", "I", "like", "tea", "coffee", "<eos>"];
export const languageLogits = (token: string, loop = false) =>
  token === "<bos>"
    ? [-4, 3, -2, -1, -1, -0.5]
    : token === "I"
      ? [-4, -3, 3, 0, 0, -1]
      : token === "like"
        ? [-4, -3, -2, 2, 1, 0]
        : token === "tea" || token === "coffee"
          ? loop
            ? [-4, -3, 3, 0, 0, -1]
            : [-4, -3, -2, -1, -1, 3]
          : [-4, -3, -2, 0, 0, 3];
export function teacherForcedRows(sequence: string[]) {
  if (
    sequence.length < 2 ||
    sequence.some((token) => !toyVocabulary.includes(token))
  )
    throw new RangeError("Training needs a known input–target token pair.");
  return sequence.slice(0, -1).map((token, i) => {
    const probabilities = softmax(languageLogits(token)),
      target = sequence[i + 1],
      probability = probabilities[toyVocabulary.indexOf(target)];
    return {
      prefix: sequence.slice(0, i + 1),
      target,
      probability,
      loss: -Math.log(probability),
    };
  });
}
export function generateToy(
  prompt: string[],
  draws: number[] | null = null,
  loop = false,
  maxNew = 5,
) {
  if (
    !prompt.length ||
    prompt.some((token) => !toyVocabulary.includes(token)) ||
    draws?.some((draw) => draw < 0 || draw >= 1)
  )
    throw new RangeError(
      "Generation needs known prompt tokens and draws in [0,1).",
    );
  const sequence = [...prompt],
    states: {
      sequence: string[];
      logits: number[];
      probabilities: number[];
      selected: number;
      selectedProbability: number;
      totalProbability: number;
      stop: string;
    }[] = [];
  let totalProbability = 1;
  for (let step = 0; step < maxNew; step++) {
    const logits = languageLogits(sequence.at(-1)!, loop),
      probabilities = softmax(logits);
    let selected = probabilities.indexOf(Math.max(...probabilities));
    if (draws) {
      const draw = draws[step % draws.length];
      let cumulative = 0;
      selected = probabilities.length - 1;
      for (let i = 0; i < probabilities.length; i++) {
        cumulative += probabilities[i];
        if (draw < cumulative) {
          selected = i;
          break;
        }
      }
    }
    totalProbability *= probabilities[selected];
    sequence.push(toyVocabulary[selected]);
    const stop =
      toyVocabulary[selected] === "<eos>"
        ? "End token"
        : step === maxNew - 1
          ? "Token limit"
          : "Continue";
    states.push({
      sequence: [...sequence],
      logits,
      probabilities,
      selected,
      selectedProbability: probabilities[selected],
      totalProbability,
      stop,
    });
    if (stop !== "Continue") break;
  }
  return states;
}
export function languageTrace(scenario: string) {
  if (scenario.startsWith("training")) {
    const sequence = [
        "<bos>",
        "I",
        "like",
        scenario === "training-coffee" ? "coffee" : "tea",
        "<eos>",
      ],
      rows = teacherForcedRows(sequence),
      mean = rows.reduce((sum, row) => sum + row.loss, 0) / rows.length;
    return Array.from({ length: 6 }, (_, stage) =>
      f(
        [
          "Read the known training sequence",
          "Construct causal input–target pairs",
          "Project each permitted context",
          "Score every correct next token",
          "Average the token losses",
          "Contrast training with generation",
        ][stage],
        [
          "During teacher-forced training, the whole sequence is available as data. Each prediction must still use only its permitted prefix.",
          "At position i, the target is the next token. Targets can be prepared from the known sequence without making them visible to the prediction at that position.",
          "Our supplied toy decoder represents only the most recent input token as a one-hot vector, then projects it to vocabulary logits. It does not model the whole prefix.",
          `Correct-target probabilities are [${rows.map((row) => n(row.probability)).join(", ")}]. These position-wise calculations can be performed together with the causal information boundary.`,
          `Mean negative log probability is ${n(mean)}. This computes a training objective; the experiment does not run parameter fitting.`,
          "Training can score known targets at many positions in parallel. Generation must choose a next token before that token becomes available as context for the next choice.",
        ][stage],
        "sequence probability=∏ p(correct next token | permitted prefix); mean loss=−mean(ln p)",
        [
          ["Positions", rows.length],
          ["Mean loss", stage >= 4 ? mean : "—"],
          ["Targets", "Known"],
        ],
        {
          kind: "language-model",
          mode: "train",
          sequence,
          logits: [],
          probabilities: [],
          vocabulary: toyVocabulary,
          selected: null,
          stage,
          rows,
          stop: "Known sequence",
          totalProbability: rows.reduce(
            (product, row) => product * row.probability,
            1,
          ),
        },
      ),
    );
  }
  const prompt = scenario === "prompt" ? ["I", "like"] : ["<bos>"],
    sample = scenario === "sample",
    states = generateToy(
      prompt,
      sample ? [0.4, 0.6, 0.9, 0.5, 0.2] : null,
      scenario === "loop",
    ),
    frames = [];
  for (let index = 0; index < states.length; index++)
    for (let phase = 0; phase < 3; phase++) {
      const state = states[index],
        before = state.sequence.slice(0, -1),
        sequence = phase < 2 ? before : state.sequence,
        stage = phase;
      frames.push(
        f(
          phase === 0
            ? `Build context for token ${index + 1}`
            : phase === 1
              ? "Project to vocabulary logits and probabilities"
              : "Append the selected token",
          phase === 0
            ? `The current prefix is [${before.join(", ")}]. In this toy model only its last token determines the one-hot context representation.`
            : phase === 1
              ? "Multiply that one-hot context by the supplied context-to-vocabulary matrix, then apply stable softmax. There is one score per vocabulary token."
              : `Choose “${toyVocabulary[state.selected]}” ${sample ? "using the supplied reproducible random draw" : "by the largest probability"}, append it, and ${state.stop === "Continue" ? "repeat with the enlarged prefix" : `stop: ${state.stop.toLowerCase()}`}.`,
          phase === 2
            ? `conditional generated-sequence probability = ${n(state.totalProbability)}`
            : "one-hot(last context token) @ supplied W_vocab → six logits → softmax",
          [
            ["Generated", phase < 2 ? index : index + 1],
            ["Chosen share", phase === 2 ? state.selectedProbability : "—"],
            [
              "Sequence prob",
              phase === 2
                ? state.totalProbability
                : index
                  ? states[index - 1].totalProbability
                  : 1,
            ],
          ],
          {
            kind: "language-model",
            mode: "generate",
            sequence,
            logits: state.logits,
            probabilities: state.probabilities,
            vocabulary: toyVocabulary,
            selected: phase === 2 ? state.selected : null,
            stage,
            rows: [],
            stop: phase === 2 ? state.stop : "Not selected yet",
            totalProbability:
              phase === 2
                ? state.totalProbability
                : index
                  ? states[index - 1].totalProbability
                  : 1,
          },
        ),
      );
    }
  return frames;
}
const language: Experiment = {
  id: "l23",
  title: "Choose a token, append it, and compute the next distribution.",
  scenarios: [
    {
      id: "greedy",
      label: "Generate greedily",
      description:
        "Use a six-token toy vocabulary and the highest-probability next token at each step.",
    },
    {
      id: "sample",
      label: "Use supplied sampling draws",
      description:
        "Keep the distributions fixed, but sample using declared draws [0.4,0.6,0.9,0.5,0.2].",
    },
    {
      id: "prompt",
      label: "Start from “I like”",
      description:
        "Condition on an existing prompt. The displayed sequence probability covers only newly selected tokens.",
    },
    {
      id: "loop",
      label: "A repeating preference",
      description:
        "Change the supplied tea/coffee transition logits so generation repeats until its five-token budget.",
    },
    {
      id: "training-tea",
      label: "Score known training targets",
      description:
        "Prepare causal next-token targets for <bos> I like tea <eos> and compute their losses together.",
    },
    {
      id: "training-coffee",
      label: "Change a later target",
      description:
        "Replace tea with coffee in the known training sequence. Earlier next-token predictions must remain unchanged.",
    },
  ],
  build: languageTrace,
};

export function architectureTrace(scenario: string) {
  const encoder = scenario === "encoder",
    cross = scenario === "encoder-decoder",
    tokens = encoder
      ? ["red", "<mask>", "arrived"]
      : ["red", "book", "arrived"];
  const vectors = encoder
      ? [
          [1, 0],
          [0, 0],
          [1, 1],
        ]
      : [
          [1, 0],
          [0, 1],
          [1, 1],
        ],
    self = attentionRows(vectors, vectors, vectors, !encoder),
    source = attentionRows(
      [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      false,
    ),
    decoderInputs = [
      [1, 1],
      [1, 0],
    ],
    decoder = attentionRows(decoderInputs, decoderInputs, decoderInputs, true),
    crossRows = attentionRows(
      decoder.outputs,
      source.outputs,
      source.outputs,
      false,
    );
  return Array.from({ length: 7 }, (_, stage) => {
    const crossPhase = cross && stage >= 4,
      selfPhase = cross && stage === 3,
      data = crossPhase
        ? crossRows
        : selfPhase
          ? decoder
          : cross
            ? source
            : self,
      q = crossPhase
        ? decoder.outputs
        : selfPhase
          ? decoderInputs
          : cross
            ? [
                [1, 0],
                [0, 1],
                [1, 1],
              ]
            : vectors,
      keys = crossPhase ? source.outputs : q,
      values = keys,
      names = crossPhase || selfPhase ? ["<bos>", "the"] : tokens;
    return f(
      [
        "Specify inputs and the learning objective",
        "Draw the permitted information paths",
        "Compute source representations",
        cross
          ? "Run causal decoder self-attention"
          : "Normalize allowed attention scores",
        cross
          ? "Let decoder queries read source memory"
          : "Mix the permitted values",
        cross
          ? "Inspect cross-attention weights"
          : "Separate representation from a target prediction",
        "Choose an architecture for the task",
      ][stage],
      [
        cross
          ? "The full source is red book arrived; the decoder prefix is <bos> the. This toy calculation traces representations, not a trained translation."
          : encoder
            ? "The middle token is hidden as <mask>. Its original target is book, but that target is absent from the encoder inputs."
            : "At each input position, causal self-attention may read only that position and earlier positions.",
        encoder
          ? "Bidirectional attention permits both sides of the masked position. It sees <mask>, not the withheld target token."
          : cross
            ? "Encode all supplied source positions bidirectionally; source text is already known."
            : "The upper-triangular future cells are disallowed for a causal decoder.",
        cross
          ? "Compute three source-memory vectors using bidirectional attention. These are representations of known input text."
          : "The supplied two-dimensional vectors produce compatibility scores under the chosen mask.",
        cross
          ? "Before cross-attention, the two decoder-prefix positions use their own causal self-attention."
          : encoder
            ? "Each query normalizes over all permitted input positions."
            : "Each query normalizes over its prefix, giving future positions zero weight.",
        cross
          ? "Cross-attention queries come from the decoder; keys and values come from all three source-memory positions. This 2×3 mask is not the decoder’s 2×2 causal self-mask."
          : "The output is a weighted representation. A vocabulary projection and trained objective would still be needed to predict a word.",
        cross
          ? "Each decoder query mixes source-memory values. Causal restrictions still apply to the generated prefix, not to hiding already-known source tokens."
          : "A masked-language target or next-token target belongs to its training objective. Allowed context alone does not determine a correct answer.",
        "Encoder-only, decoder-only, and encoder-decoder are architectural patterns, not exclusive product labels. A causal model can also be used for classification with an appropriate head or prompting procedure.",
      ][stage],
      crossPhase
        ? "cross-attention: Q_decoder @ K_sourceᵀ → row softmax → source-value mixture"
        : encoder
          ? "masked input replaces the withheld token; bidirectional context does not include the hidden answer"
          : "causal mask permits key j only when j≤query i",
      [
        ["Query rows", q.length],
        ["Key rows", keys.length],
        [
          "Pattern",
          crossPhase
            ? "Cross"
            : selfPhase
              ? "Causal"
              : cross || encoder
                ? "Bi-dir"
                : "Causal",
        ],
      ],
      {
        kind: "attention-matrix",
        phase: crossPhase
          ? "Cross-attention to source"
          : selfPhase
            ? "Decoder causal self-attention"
            : cross
              ? "Bidirectional source encoder"
              : encoder
                ? "Masked-token encoder"
                : "Causal decoder",
        queries: q,
        keys,
        values,
        rawScores: data.rawScores,
        scores: data.scores,
        weights: data.weights,
        allowed: data.allowed,
        outputs: data.outputs,
        stage: Math.min(8, stage + 1),
        activeRow: encoder ? 1 : -1,
        queryNames: names,
        keyNames: crossPhase ? ["red", "book", "arrived"] : names,
        outputLabel: "Context representation",
        note: encoder
          ? "Target “book” is withheld from inputs. No trained word prediction is simulated."
          : cross
            ? "Source memory is known input; future decoder outputs remain unavailable."
            : "Permission to read is not a guarantee of correctness.",
      },
    );
  });
}
const architectures: Experiment = {
  id: "l24",
  title: "The mask says which information a prediction may use.",
  scenarios: [
    {
      id: "encoder",
      label: "Bidirectional masked-token encoder",
      description:
        "Replace book with <mask>. Both sides can inform the hidden position, without exposing its original target.",
    },
    {
      id: "decoder",
      label: "Causal decoder",
      description:
        "Keep the same three-token sentence and exclude later positions for each query.",
    },
    {
      id: "encoder-decoder",
      label: "Encode a source, then decode",
      description:
        "Build source memory, apply causal self-attention to a two-token decoder prefix, then inspect 2×3 cross-attention.",
    },
  ],
  build: architectureTrace,
};
sequenceExperiments.push(tokenizer, language, architectures);
