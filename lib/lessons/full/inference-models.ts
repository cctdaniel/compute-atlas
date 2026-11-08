import type { Experiment } from "../types";
import { makeFrame as f, numeric as n, dot, softmax } from "./lesson-kit.ts";
const option = (id: string, label: string, description: string) => ({
  id,
  label,
  description,
});
const vec = (v: number[]) => "[" + v.map(n).join(", ") + "]";
export function cacheBytes(
  layers: number,
  batch: number,
  tokens: number,
  heads: number,
  dimension: number,
  bytes: number,
) {
  return 2 * layers * batch * tokens * heads * dimension * bytes;
}
const cacheInputs = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
  [0.5, 1],
  [-1, 1],
];
export function cacheAttention(inputs: number[][], positions: number[]) {
  const query = inputs.at(-1)!,
    keys = positions.map((i) => [...inputs[i]]),
    values = positions.map((i) => [
      inputs[i][0] + 0.5 * inputs[i][1],
      inputs[i][1],
    ]),
    weights = softmax(keys.map((key) => dot(query, key) / Math.sqrt(2))),
    output = [0, 1].map((j) =>
      weights.reduce((sum, w, i) => sum + w * values[i][j], 0),
    );
  return { query, keys, values, weights, output };
}
export function cacheTrace(id: string) {
  const batch = id === "batch-two" ? 2 : 1,
    heads = id === "two-heads" ? 2 : 1,
    layers = 2;
  let projected = 0,
    pairs = 0;
  return [0, 3, 4, 5, 6].map((processed, stage) => {
    const retained = Array.from({ length: processed }, (_, i) => i).filter(
        (i) => id !== "window" || i >= processed - 3,
      ),
      result = processed
        ? cacheAttention(cacheInputs.slice(0, processed), retained)
        : null;
    if (processed) {
      projected += id === "recompute" ? processed : stage === 1 ? 3 : 1;
      pairs +=
        stage === 1
          ? 6
          : id === "recompute"
            ? (processed * (processed + 1)) / 2
            : retained.length;
    }
    const bytes = cacheBytes(
      layers,
      batch,
      id === "recompute" ? 0 : retained.length,
      heads,
      2,
      2,
    );
    return f(
      stage === 0
        ? "Start before prefill"
        : stage === 1
          ? "Prefill three prompt positions"
          : `Decode using position ${processed}`,
      stage === 0
        ? "The supplied token states are declared inputs; no token generation or training is simulated. Each layer/head stores one key and one value per retained position."
        : stage === 1
          ? "Project the three prompt states. The causal prefill visits 1+2+3=6 query–key pairs for one layer/head. The final prompt row supplies the displayed output."
          : `${id === "recompute" ? "Recompute the whole causal prefix, including old projections and query rows." : id === "window" ? "Append the new K/V and evict positions outside a three-position sliding window. This intentionally changes the attended context." : "Project only the newly supplied position and reuse earlier K/V."} The new query still attends over ${retained.length} permitted keys. Counts are illustrative operations for one layer/head, not time.`,
      result
        ? `q=${vec(result.query)}; attention output=${vec(result.output)}; retained cache=${bytes} bytes`
        : "Cache=0 bytes; weights fixed",
      [
        ["Tokens", processed],
        ["Projected", projected],
        ["Bytes", bytes],
      ],
      {
        kind: "kv-cache",
        tokens: cacheInputs.map((input, i) => ({
          position: i + 1,
          input,
          key: [...input],
          value: [input[0] + 0.5 * input[1], input[1]],
          state:
            i >= processed
              ? "Unread"
              : retained.includes(i)
                ? id === "recompute"
                  ? "Recomputed"
                  : "Cached"
                : "Evicted",
        })),
        query: result?.query ?? [],
        weights: result?.weights ?? [],
        output: result?.output ?? null,
        processed,
        projected,
        pairs,
        bytes,
        mode:
          id === "recompute"
            ? "Full-prefix recomputation"
            : id === "window"
              ? "Three-position window"
              : "Full-prefix KV reuse",
        layers,
        batch,
        heads,
      },
    );
  });
}
export function quantizeWeights(bits: number) {
  const weights = [0.12, -0.7, 1.05, 2.4],
    qmax = 2 ** (bits - 1) - 1,
    scale = 2.4 / qmax,
    rows = weights.map((weight) => {
      const code = Math.max(-qmax, Math.min(qmax, Math.round(weight / scale)));
      return { weight, code, restored: code * scale };
    });
  return {
    rows,
    scale,
    fullOutput: dot(weights, [2, 1, -1, 0.5]),
    quantOutput: dot(
      rows.map((row) => row.restored),
      [2, 1, -1, 0.5],
    ),
  };
}
export function memoryPlan(bits = 16, batch = 1, training = false) {
  return [
    { label: "Packed weights", bytes: (1_000_000 * bits) / 8 },
    { label: "Metadata", bytes: 100_000 },
    { label: "Workspace", bytes: 500_000 },
    {
      label: training ? "Activations" : "KV cache",
      bytes: training ? 1_000_000 : batch * 400_000,
    },
    { label: "Gradients", bytes: training ? 4_000_000 : 0 },
    { label: "Optimizer state", bytes: training ? 8_000_000 : 0 },
  ];
}
export function memoryTrace(id: string) {
  if (["data-parallel", "tensor-parallel", "pipeline"].includes(id))
    return parallelTrace(id);
  const bits = id === "int4" ? 4 : id === "int8" ? 8 : 16,
    batch = ["batch-four", "int4", "int8"].includes(id) ? 4 : 1,
    parts = memoryPlan(bits, batch, id === "training"),
    quant = quantizeWeights(bits === 4 ? 4 : 8);
  return Array.from({ length: 7 }, (_, added) => {
    const used = parts.slice(0, added).reduce((s, v) => s + v.bytes, 0);
    return f(
      added
        ? `Account for ${parts[added - 1].label.toLowerCase()}`
        : "Declare the memory budget",
      added
        ? `Add ${parts[added - 1].bytes.toLocaleString("en-US")} bytes. The accounted total is ${used.toLocaleString("en-US")} of 4,000,000 bytes: ${used <= 4_000_000 ? "fits within the declared budget" : "exceeds the declared budget"}. Zero-valued categories are explicit, not silently forgotten.`
        : "A supplied million-parameter model uses packed weights plus separately declared runtime categories. These byte counts are a teaching budget, not a measurement of a real model or device.",
      `Used=${used} bytes; remaining=${4_000_000 - used} bytes`,
      [
        ["Bits", bits],
        ["Batch", batch],
        ["MB", used / 1_000_000],
      ],
      {
        kind: "device-memory",
        parts,
        added,
        budget: 4_000_000,
        bits,
        batch,
        used,
        quantization: quant.rows,
        scale: quant.scale,
        fullOutput: quant.fullOutput,
        quantOutput: quant.quantOutput,
        formats: [
          { label: "FP32", exponent: 8, fraction: 23 },
          { label: "FP16", exponent: 5, fraction: 10 },
          { label: "BF16", exponent: 8, fraction: 7 },
        ],
      },
    );
  });
}
export function parallelTrace(method: string) {
  return [0, 1, 2].map((stage) => {
    const data = method === "data-parallel",
      tensor = method === "tensor-parallel";
    const devices = data
      ? [
          {
            name: "Device 1",
            stored: 4,
            task: "Full W × request [1,2]",
            result: [5, 11],
            done: stage >= 1,
          },
          {
            name: "Device 2",
            stored: 4,
            task: "Full W × request [2,1]",
            result: [4, 10],
            done: stage >= 1,
          },
        ]
      : tensor
        ? [
            {
              name: "Device 1",
              stored: 2,
              task: "W row 1 × input [1,2]",
              result: [5],
              done: stage >= 1,
            },
            {
              name: "Device 2",
              stored: 2,
              task: "W row 2 × input [1,2]",
              result: [11],
              done: stage >= 1,
            },
          ]
        : [
            {
              name: "Stage / device 1",
              stored: 4,
              task: "W₁=2I; produce h=[2,4]",
              result: [2, 4],
              done: stage >= 1,
            },
            {
              name: "Stage / device 2",
              stored: 4,
              task: "W₂ rows [1,1] and [1,−1]; consume h",
              result: [6, -2],
              done: stage >= 2,
            },
          ];
    const communication = data
      ? "Training replicas would need gradient synchronization; this inference example has independent outputs."
      : tensor
        ? "Gather the two output coordinates. Other tensor partitions may require reductions instead."
        : "Send hidden vector [2,4] from stage 1 to stage 2.";
    return f(
      stage === 0
        ? "Choose what to split"
        : stage === 1
          ? "Run the first available operations"
          : "Assemble the declared outputs",
      data
        ? "Data parallelism replicates W=[[1,2],[3,4]] across devices and gives each a different request. It does not split this layer’s weight storage."
        : tensor
          ? "Tensor parallelism partitions the rows of one matrix operation. Each device stores two entries and produces one output coordinate."
          : "Pipeline parallelism splits two successive layers. Device 2 cannot produce its result before device 1 sends the hidden vector. Microbatching can fill pipelines but is not simulated here.",
      data
        ? "W[1,2]=[5,11]; W[2,1]=[4,10]"
        : tensor
          ? "[5] concatenated with [11] = [5,11]"
          : "[1,2] → 2I → [2,4] → W₂ → [6,−2]",
      [
        ["Devices", 2],
        ["Stored", devices.reduce((s, d) => s + d.stored, 0)],
        ["Stage", stage],
      ],
      {
        kind: "parallel-work",
        method,
        devices,
        input: data
          ? [
              [1, 2],
              [2, 1],
            ]
          : [[1, 2]],
        output:
          stage === 2
            ? data
              ? [
                  [5, 11],
                  [4, 10],
                ]
              : tensor
                ? [[5, 11]]
                : [[6, -2]]
            : [],
        stage,
        communication,
      },
    );
  });
}
export function queueSimulation(mode: string) {
  const capacity = mode === "serial" ? 1 : 2,
    cycle = capacity === 1 ? 1 : 1.25,
    jobs = [
      { id: "A", arrival: 0, length: 4 },
      { id: "B", arrival: 0, length: 1 },
      { id: "C", arrival: 1, length: 2 },
      { id: "D", arrival: 2, length: 1 },
    ].map((v) => ({
      ...v,
      generated: 0,
      status: "Queued",
      first: null as number | null,
      finish: null as number | null,
      pages: [] as number[],
    }));
  const pages = Array.from({ length: 12 }, (_, id) => ({
    id,
    owner: null as string | null,
    used: 0,
  }));
  let time = 0;
  const snapshot = () => ({
    time,
    requests: jobs.map((v) => ({ ...v, pages: [...v.pages] })),
    capacity,
    cycle,
    mode,
    pages: pages.map((p) => ({ ...p })),
    completed: jobs.filter((v) => v.status === "Done").length,
    throughput: time ? jobs.reduce((s, v) => s + v.generated, 0) / time : 0,
  });
  const frames = [snapshot()];
  for (
    let tick = 0;
    tick < 20 && jobs.some((v) => v.status !== "Done");
    tick++
  ) {
    const running = jobs.filter((v) => v.status === "Running"),
      admit =
        mode === "static" ? running.length === 0 : running.length < capacity;
    if (admit)
      for (const job of jobs
        .filter((v) => v.status === "Queued" && v.arrival <= time)
        .slice(0, capacity - running.length))
        job.status = "Running";
    const active = jobs.filter((v) => v.status === "Running");
    if (!active.length) {
      time = Math.min(
        ...jobs.filter((v) => v.status === "Queued").map((v) => v.arrival),
      );
      frames.push(snapshot());
      continue;
    }
    time += cycle;
    for (const job of active) {
      job.generated++;
      if (job.first === null) job.first = time;
      if (job.generated === job.length) {
        job.status = "Done";
        job.finish = time;
      }
    }
    for (const page of pages)
      if (
        page.owner &&
        jobs.find((j) => j.id === page.owner)!.status === "Done"
      ) {
        page.owner = null;
        page.used = 0;
      }
    for (const job of jobs) {
      if (job.status !== "Running") {
        job.pages = [];
        continue;
      }
      const entries = 2 + job.generated,
        needed = Math.ceil(entries / 2);
      while (job.pages.length < needed) {
        const free = pages.find((p) => p.owner === null);
        if (!free) throw Error("Declared page pool exhausted");
        free.owner = job.id;
        job.pages.push(free.id);
      }
      job.pages.forEach((id, i) => {
        pages[id].used = Math.min(2, entries - i * 2);
      });
    }
    frames.push(snapshot());
  }
  return frames;
}
export function queueTrace(id: string) {
  const mode =
    id === "serial" ? "serial" : id === "static" ? "static" : "continuous";
  return queueSimulation(mode).map((state, step) =>
    f(
      step ? `Scheduler tick ${step}` : "Four requests enter the schedule",
      step
        ? `Time ${n(state.time)}. ${
            state.requests
              .filter((v) => v.status === "Running")
              .map((v) => v.id)
              .join(", ") || "No request"
          } remains running after this tick. ${mode === "static" ? "A static batch waits for every member before admitting the next batch." : "Free slots can admit arrived queued requests at the next tick."} Finished requests release cache pages.`
        : "A and B arrive at 0; C at 1; D at 2. Lengths are 4,1,2,1 tokens. Serial ticks cost 1 time unit; two-slot ticks cost 1.25. These costs are declared fixtures, not GPU benchmarks.",
      `Produced=${state.requests.reduce((s, v) => s + v.generated, 0)} tokens; time=${n(state.time)}; throughput=${n(state.throughput)}`,
      [
        ["Time", state.time],
        ["Done", state.completed],
        ["Tok / unit", state.throughput],
      ],
      { kind: "serving-queue", ...state },
    ),
  );
}
export function onlineAttention(scores: number[], values: number[]) {
  let maximum = -Infinity,
    denominator = 0,
    numerator = 0;
  const states = [];
  for (let i = 0; i < scores.length; i++) {
    const next = Math.max(maximum, scores[i]),
      rescale = Number.isFinite(maximum) ? Math.exp(maximum - next) : 0,
      weight = Math.exp(scores[i] - next);
    denominator = denominator * rescale + weight;
    numerator = numerator * rescale + weight * values[i];
    maximum = next;
    states.push({
      maximum,
      denominator,
      numerator,
      output: numerator / denominator,
    });
  }
  return states;
}
export function onlineTrace(id: string) {
  const scores = id === "shifted" ? [0, 1, -1] : [1000, 1001, 999],
    values = [2, 4, 8],
    states = onlineAttention(scores, values),
    direct = dot(softmax(scores), values),
    tile = id === "tile-two" ? 2 : 1;
  return [
    0,
    ...Array.from({ length: Math.ceil(scores.length / tile) }, (_, i) =>
      Math.min(scores.length, (i + 1) * tile),
    ),
  ].map((seen) => {
    const state = seen
      ? states[seen - 1]
      : { maximum: null, denominator: 0, numerator: 0, output: null };
    return f(
      seen
        ? `Consume ${seen} key/value pairs`
        : "Keep a small running softmax state",
      seen
        ? `Rescale the previous denominator and weighted sum when a larger maximum arrives. After ${seen} pairs, the running output is ${n(state.output)}. No full score matrix is stored in this row example.`
        : "The scores [1000,1001,999] would overflow a naive exponential. Process score/value pairs with a running maximum, denominator, and weighted sum. This illustrates online exact softmax, not a complete GPU FlashAttention kernel.",
      `m=${state.maximum === null ? "unset" : n(state.maximum)}; l=${n(state.denominator)}; o=${n(state.numerator)}; output=${n(state.output)}`,
      [
        ["Seen", seen],
        ["Output", state.output],
        ["Full row", direct],
      ],
      {
        kind: "online-attention",
        scores,
        values,
        seen,
        ...state,
        direct,
        tile,
      },
    );
  });
}
export function speculativeMass(target: number[], draft: number[]) {
  const acceptance = target.map((p, i) =>
      draft[i] ? Math.min(1, p / draft[i]) : 1,
    ),
    accepted = target.map((p, i) => Math.min(p, draft[i])),
    missing = target.map((p, i) => Math.max(0, p - draft[i])),
    rejection = missing.reduce((s, v) => s + v, 0),
    residual = missing.map((v) => (rejection ? v / rejection : 0)),
    result = accepted.map((v, i) => v + rejection * residual[i]);
  return { acceptance, accepted, residual, result, rejection };
}
export function speculativeTrace(id: string) {
  const target = [0.6, 0.4],
    draft =
      id === "matched"
        ? [0.6, 0.4]
        : id === "draft-a"
          ? [0.9, 0.1]
          : [0.2, 0.8],
    mass = speculativeMass(target, draft),
    proposal = id === "draft-a" ? 0 : 1,
    uniform = id === "accept" ? 0.2 : 0.8,
    acceptedProposal = uniform < mass.acceptance[proposal],
    replacement = mass.residual.indexOf(Math.max(...mass.residual)),
    naive = id === "naive",
    output = naive || acceptedProposal ? proposal : replacement;
  return [0, 1, 2, 3, 4].map((phase) =>
    f(
      [
        "Compare target and draft",
        "Inspect one draft proposal",
        "Check its acceptance ratio",
        "Keep or replace the token",
        "Account for the full output distribution",
      ][phase],
      phase === 0
        ? "Target probabilities and draft probabilities are explicitly supplied for the same prefix. The target distribution is what the corrected algorithm must preserve."
        : phase === 1
          ? `The inspected proposal is token ${proposal === 0 ? "A" : "B"}. This is one possible draft draw, not a complete outcome distribution.`
          : phase === 2
            ? `Acceptance is min(1,p/q)=${n(mass.acceptance[proposal])}; supplied uniform draw=${uniform}. ${naive ? "Naive mode skips the correction." : acceptedProposal ? "Keep this draft token." : "Reject and draw from normalized positive (p−q). The residual here has only one possible token."}`
            : phase === 3
              ? `This inspected run outputs ${output === 0 ? "A" : "B"}. A single run does not establish the marginal distribution.`
              : `Accepted mass plus replacement mass gives ${vec(naive ? draft : mass.result)}. ${naive ? "Blindly accepting draft tokens preserves q, which differs from target p." : "The corrected mass equals the target p under these declared distributions."}`,
      phase === 4
        ? `P(output)=${vec(naive ? draft : mass.result)}`
        : `Proposal=${proposal === 0 ? "A" : "B"}; uniform=${uniform}; accept=${n(mass.acceptance[proposal])}`,
      [
        ["Phase", phase],
        ["Accept p", mass.acceptance[proposal]],
        ["Output", phase >= 3 ? (output === 0 ? "A" : "B") : "—"],
      ],
      {
        kind: "speculative-sample",
        target,
        draft,
        ...mass,
        result: naive ? draft : mass.result,
        proposal,
        uniform,
        acceptedProposal,
        output,
        phase,
        naive,
      },
    ),
  );
}
export function servingTrace(id: string) {
  return ["online", "shifted", "tile-two"].includes(id)
    ? onlineTrace(id)
    : ["speculate", "accept", "matched", "draft-a", "naive"].includes(id)
      ? speculativeTrace(id)
      : queueTrace(id);
}
const expertMatrices = [
  [
    [1, 0],
    [0, 1],
  ],
  [
    [0, 1],
    [1, 0],
  ],
  [
    [-1, 0],
    [0, 1],
  ],
  [
    [1, 0],
    [0, -1],
  ],
];
export function routeExperts(
  skew = false,
  topK = 1,
  capacity = 2,
  reroute = false,
) {
  const inputs = skew
      ? Array.from({ length: 8 }, (_, i) => [2 + i * 0.1, 0.05 * i])
      : [
          [2, 0],
          [0, 2],
          [-2, 0],
          [0, -2],
          [1, 0.2],
          [0.2, 1],
          [-1, 0.2],
          [0.2, -1],
        ],
    loads = [0, 0, 0, 0];
  return inputs.map((input) => {
    const logits = [input[0], input[1], -input[0], -input[1]],
      probabilities = softmax(logits),
      rank = [0, 1, 2, 3].sort((a, b) => logits[b] - logits[a] || a - b),
      intended = rank.slice(0, topK),
      routes = (reroute ? rank : intended)
        .filter((i) => loads[i] < capacity)
        .slice(0, topK);
    routes.forEach((i) => loads[i]++);
    const sum = routes.reduce((s, i) => s + probabilities[i], 0),
      weights = probabilities.map((v, i) => (routes.includes(i) ? v / sum : 0)),
      output = [0, 1].map((j) =>
        routes.reduce(
          (s, i) =>
            s + weights[i] * Math.max(0, dot(expertMatrices[i][j], input)),
          0,
        ),
      );
    return {
      input,
      logits,
      weights,
      routes,
      output,
      status:
        routes.length === 0
          ? "Dropped"
          : routes.length < topK
            ? "Partial"
            : routes.some((i) => !intended.includes(i))
              ? "Rerouted"
              : "Processed",
      loads: [...loads],
    };
  });
}
export function expertTrace(id: string) {
  const topK = id === "top-two" ? 2 : 1,
    capacity = topK === 2 ? 4 : 2,
    reroute = id === "reroute",
    skew = id === "skew" || reroute,
    states = routeExperts(skew, topK, capacity, reroute);
  return Array.from({ length: 9 }, (_, processed) => {
    const state = processed ? states[processed - 1] : null,
      loads = state?.loads ?? [0, 0, 0, 0];
    return f(
      processed
        ? `Route token ${processed}`
        : "Four experts, sparse token routing",
      processed
        ? `Gate logits=${vec(state!.logits)}. ${state!.status === "Dropped" ? "All intended slots are full; this toy branch returns zero." : `Use expert${state!.routes.length > 1 ? "s" : ""} ${state!.routes.map((i) => i + 1).join(", ")} with normalized retained gate weights ${vec(state!.weights)}.`} ${reroute ? "The declared fallback tries the next ranked nonfull expert; this changes the transformation." : "The declared policy drops overflow branches rather than secretly selecting another expert."}`
        : "Eight supplied vectors enter four 2×2 ReLU experts. The gate uses [x₁,x₂,−x₁,−x₂]. Experts are numerical subnetworks, not named subject specialists or separate agents.",
      state
        ? `Input=${vec(state.input)} → sparse branch=${vec(state.output)}`
        : "Expert entries=16; gate entries=8; total=24",
      [
        ["Routed", processed],
        ["Top k", topK],
        ["Max / token", 8 + 4 * topK],
      ],
      {
        kind: "expert-routing",
        experts: loads.map((load, i) => ({
          label: `Expert ${i + 1}`,
          load,
          capacity,
        })),
        tokens: states.map((s, i) => ({
          input: s.input,
          routes: i < processed ? s.routes : [],
          output: i < processed ? s.output : [],
          status: i < processed ? s.status : "Pending",
        })),
        processed,
        current: processed - 1,
        logits: state?.logits ?? [],
        weights: state?.weights ?? [],
        topK,
        total: 24,
        active: state ? 8 + 4 * state.routes.length : 0,
        policy: reroute ? "Next-ranked fallback" : "Drop overflowing branches",
      },
    );
  });
}
export const inferenceExperiments: Experiment[] = [
  {
    id: "l35",
    title: "Reuse the prefix; calculate the new query.",
    scenarios: [
      option(
        "cached",
        "Reuse full-prefix K/V",
        "Project the three prompt positions once, then only each new supplied token.",
      ),
      option(
        "recompute",
        "Recompute the full prefix",
        "Rebuild old projections and causal query rows at every step for comparison.",
      ),
      option(
        "window",
        "Keep only three positions",
        "Evict older cache entries and intentionally change the attended context.",
      ),
      option(
        "batch-two",
        "Two concurrent sequences",
        "The declared byte estimate doubles with batch size; displayed vectors describe one sequence.",
      ),
      option(
        "two-heads",
        "Two KV heads",
        "Double stored head copies in the estimate; inspect the same representative head.",
      ),
    ],
    build: cacheTrace,
  },
  {
    id: "l36",
    title: "Count every memory category.",
    scenarios: [
      option(
        "fp16",
        "16-bit weights, batch 1",
        "Packed weights plus declared metadata, cache and workspace.",
      ),
      option(
        "batch-four",
        "16-bit weights, batch 4",
        "Increasing cache demand exceeds the supplied four-megabyte budget.",
      ),
      option(
        "int8",
        "8-bit weights, batch 4",
        "Raw packed weight storage shrinks; other categories remain separately counted.",
      ),
      option(
        "int4",
        "4-bit weights, batch 4",
        "Inspect uniform integer quantization and its changed dot product.",
      ),
      option(
        "training",
        "Add training state",
        "Gradients, optimizer state and activations exceed this small declared budget.",
      ),
      option(
        "data-parallel",
        "Replicate across two devices",
        "Each device stores the full matrix and handles a different request.",
      ),
      option(
        "tensor-parallel",
        "Split one matrix operation",
        "Each device stores one row; gather the output coordinates.",
      ),
      option(
        "pipeline",
        "Split successive layers",
        "Send an intermediate vector between two layer stages.",
      ),
    ],
    build: memoryTrace,
  },
  {
    id: "l37",
    title: "Different bottlenecks need different mechanisms.",
    scenarios: [
      option(
        "serial",
        "One request at a time",
        "One generated token per one-unit serial tick.",
      ),
      option(
        "static",
        "Static batch of two",
        "A two-slot tick costs 1.25 units; batch membership waits for all members to finish.",
      ),
      option(
        "continuous",
        "Continuous batch of two",
        "Admit arrived requests into slots freed at tick boundaries; reclaim two-entry cache pages.",
      ),
      option(
        "online",
        "Online attention row",
        "Compute a stable softmax-weighted sum without materializing a full score matrix.",
      ),
      option(
        "tile-two",
        "Consume two pairs per tile",
        "The same running recurrence groups score/value pairs into two-entry tiles.",
      ),
      option(
        "shifted",
        "Shift all logits by −1000",
        "Softmax output is unchanged; compare the same value mixture.",
      ),
      option(
        "speculate",
        "Reject and correct a draft",
        "Target [0.6,0.4], draft [0.2,0.8], inspected B proposal and draw 0.8.",
      ),
      option(
        "accept",
        "Accept this draft token",
        "Change only the inspected acceptance draw to 0.2.",
      ),
      option(
        "matched",
        "Draft matches target",
        "Acceptance is one and residual sampling is never needed.",
      ),
      option(
        "draft-a",
        "Draft overweights A",
        "Inspect rejection and correction in the other direction.",
      ),
      option(
        "naive",
        "Blindly accept the draft",
        "The uncorrected output distribution remains q rather than target p.",
      ),
    ],
    build: servingTrace,
  },
  {
    id: "l38",
    title: "Route a token to a small part of the model.",
    scenarios: [
      option(
        "balanced",
        "Balanced top-1 routing",
        "Eight vectors use four experts with two slots each.",
      ),
      option(
        "skew",
        "Skewed traffic with dropping",
        "All vectors favor expert 1; only its first two fit.",
      ),
      option(
        "reroute",
        "Next-ranked capacity fallback",
        "Try other experts in gate order when the preferred expert is full, using this stated toy policy.",
      ),
      option(
        "top-two",
        "Top-2 weighted mixture",
        "Retain up to two experts, normalize their gate weights and combine their numeric outputs.",
      ),
    ],
    build: expertTrace,
  },
];
