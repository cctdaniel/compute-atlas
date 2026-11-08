import type { LessonContent } from "../types";
export const inferenceLessons: LessonContent[] = [
  {
    slug: "l35",
    sourceId: "L35",
    deck: "Reuse earlier attention keys and values, then count the projections, interactions, and cache bytes that remain.",
    objective:
      "Trace prefill and decode, compare cached and recomputed attention outputs, and distinguish runtime cache from weights and application memory.",
    prerequisites: ["l20", "l21", "l22", "l23", "l28"],
    problem: {
      heading: "Why redo the old prefix for every new token?",
      paragraphs: [
        "A prompt contains **three positions**. A decoder later consumes a fourth, fifth, and sixth position. At each step, the newest query needs earlier attention keys and values. Must we project every old position again?",
        "A **KV cache** retains earlier keys and values so they can be reused. We will supply six tiny two-coordinate states, compare cached and full-prefix recomputation, and calculate their attention outputs. This fixture does not generate the token states or train any weights.",
      ],
    },
    intuition: {
      heading: "Keep reusable work; still calculate the new interaction.",
      paragraphs: [
        "**Prefill** processes the supplied prompt. **Decode** produces subsequent tokens in an autoregressive serving flow. The prompt’s final position can produce the next-token distribution; the next selected token is then consumed on a later step.",
        "Attention caching stores keys and values, typically per relevant layer. The new query still compares with permitted keys and mixes their values. A cache saves repeated work; it does not remove attention itself.",
        "**Time to first token**, TTFT, measures the delay before the first output arrives. **Inter-token latency** measures subsequent output pacing. Prompt length, queueing, execution, and serving implementation can affect these differently. Our operation counts are not latency measurements.",
      ],
      limit:
        "The displayed states feed one representative attention head directly. We omit a full transformer, output vocabulary, and actual numerical storage. Byte estimates use separately declared layer/head copies and two bytes per coordinate.",
    },
    walkthrough: {
      heading: "Compare the same six supplied positions.",
      intro:
        "For input [a,b], define K=[a,b], V=[a+0.5b,b], and current Q equal to the latest input. Use scaled dot-product attention.",
      steps: [
        {
          title: "Prefill the three-position prompt",
          calculation: "Project positions 1,2,3; causal pair visits=1+2+3=6",
          why: "The cache keeps the three resulting K/V pairs. The displayed mixture is the last prompt row.",
        },
        {
          title: "Consume position 4",
          calculation:
            "Cached path: one new projected position; newest query sees four keys",
          why: "Earlier K/V are reused. The query–key comparisons with the retained prefix still happen.",
        },
        {
          title: "Compare cumulative projection work",
          calculation: "Cached:3+1+1+1=6; full recomputation:3+4+5+6=18",
          why: "Both full-prefix paths use the same supplied inputs and attention rule, so their current-row outputs match despite different work.",
        },
        {
          title: "Count declared cache storage",
          calculation:
            "2×2 layers×1 sequence×6 positions×1 KV head×2 coordinates×2 bytes=96 bytes",
          why: "The first factor counts both keys and values. Queries and model weights are not included in this estimate.",
        },
      ],
    },
    prediction: {
      prompt:
        "If we evict positions older than the last three, must the output still equal attention over all six positions?",
      options: [
        "Yes; a cache is only a storage optimization",
        "No; eviction changes the available attention context",
        "Yes; old values become permanent model weights",
      ],
      correct: 1,
      answer: [
        "No. **A sliding window changes the permitted keys and values.** It can therefore change the mixture, even when the current query is unchanged.",
        "Exact full-prefix reuse preserves the declared computation. A retention policy that removes context is a different computation.",
      ],
    },
    experimentIntro:
      "Trace full-prefix reuse, full recomputation, a three-position window, two concurrent sequences, and two KV-head copies. Compare outputs and work separately from bytes.",
    math: {
      heading: "Which dimensions multiply the cache?",
      intro: [
        "For full-attention layers with the same declared dimensions, cache bytes scale with retained sequence length. Real layouts add other details.",
      ],
      rules: [
        {
          label: "Representative projections",
          formula: "K([a,b])=[a,b]; V([a,b])=[a+0.5b,b]; Q=xlatest",
        },
        {
          label: "Current attention row",
          formula: "weights=softmax(QKᵀ/√2); output=ΣᵢweightᵢVᵢ",
        },
        {
          label: "Simplified cache estimate",
          formula:
            "bytes=2×layers×batch×retainedTokens×KVheads×headDim×bytesPerValue",
        },
        { label: "This six-position cache", formula: "2×2×1×6×1×2×2=96 bytes" },
      ],
      paragraphs: [
        "Doubling batch size or the number of stored KV heads doubles this estimate. Query-head count need not equal KV-head count in grouped-query or multi-query attention, so substitute the stored KV-head count.",
        "The representative vectors are identical copies for the storage variants. That keeps the byte comparison isolated; it does not suggest that real heads or layers produce identical vectors.",
        "The full-recomputation baseline rebuilds all causal rows as well as projections. A more selective uncached implementation could recompute old K/V while calculating only the newest query row. State the baseline before claiming a work reduction.",
        "Weights are learned parameters. A KV cache is derived runtime state for a particular prefix. External application memory is separately stored information that may later be retrieved into a new request. These have different lifetimes and access rules.",
      ],
      limit:
        "Sliding windows, cache precision, allocation overhead, padding, sharding, and layer-specific designs change actual memory. Prefix reuse also requires compatible model, tokenization, positions, and other cache conditions.",
    },
    transfer: {
      prompt:
        "An application clears its KV cache but retains a customer record in a database. Has it erased the record or retrained the model?",
      answer: [
        "Neither. It has discarded **derived attention state**, while the external record and model weights are separate objects.",
        "A later request may retrieve the record and compute a new cache. Retention and deletion policies must identify which storage they govern.",
      ],
    },
    takeaways: [
      "Prefill processes the prompt; decode continues the sequence.",
      "KV reuse saves repeated projections while current attention work remains.",
      "Full-prefix caching and sliding-window retention have different semantics.",
      "Cache, weights, and external memory are distinct state.",
    ],
    sources: [
      {
        title: "Hugging Face Transformers — How caching works",
        url: "https://huggingface.co/docs/transformers/cache_explanation",
      },
      {
        title:
          "Kwon et al. — Efficient Memory Management for Large Language Model Serving with PagedAttention",
        url: "https://arxiv.org/abs/2309.06180",
      },
    ],
  },
  {
    slug: "l36",
    sourceId: "L36",
    deck: "Pack a declared device budget, inspect a quantized dot product, and split different kinds of work across two devices.",
    objective:
      "Separate raw weight bytes from runtime memory, distinguish numeric range from precision, and trace data, tensor, and pipeline parallelism.",
    prerequisites: ["l03", "l17", "l35"],
    problem: {
      heading: "If the weights fit, does the running model fit?",
      paragraphs: [
        "A supplied model has **one million parameters**. At 16 bits per entry, packed weights use 2,000,000 bytes. Our device budget is 4,000,000 bytes. That leaves room, but the weights are only the first category.",
        "Add 100,000 bytes of metadata, 500,000 of workspace, and 400,000 of cache per concurrent sequence. Batch 1 uses 3,000,000 bytes. Batch 4 uses 4,200,000 and exceeds this declared budget.",
      ],
    },
    intuition: {
      heading: "Count storage, arithmetic, and movement separately.",
      paragraphs: [
        "A **GPU** accelerates parallel numerical work. **FLOPs** count floating-point operations; memory bandwidth concerns moving bytes. A workload can be limited by arithmetic, memory movement, communication, or other overhead.",
        "**FP32, FP16, and BF16** are floating-point formats. Their exponent and fraction fields divide a bit budget differently. BF16 keeps a wider exponent range than FP16 but fewer fraction bits; equal total width does not imply equal precision.",
        "**Quantization** maps values into a lower-precision representation. Packed weights can shrink while metadata, cache, activations, or workspace remain. Lower byte counts alone do not establish a proportional wall-clock speedup.",
      ],
      limit:
        "All memory categories and device limits are declared teaching fixtures. The integer quantizer is symmetric uniform rounding, not FP16/BF16 arithmetic, NF4, or a benchmark of any current GPU.",
    },
    walkthrough: {
      heading: "Build the budget before choosing a decomposition.",
      intro: "Use decimal megabytes: one MB is 1,000,000 bytes here.",
      steps: [
        {
          title: "Account for raw weight entries",
          calculation: "1,000,000×16/8=2,000,000 bytes",
          why: "The bit-to-byte conversion counts packed entries before other runtime allocations.",
        },
        {
          title: "Add runtime state",
          calculation: "2.0+0.1+0.5+4×0.4=4.2 MB",
          why: "Four concurrent sequences make this 16-bit serving fixture exceed a 4 MB budget.",
        },
        {
          title: "Reduce packed weight width",
          calculation: "8-bit weights:1.0 MB; total=1.0+0.1+0.5+1.6=3.2 MB",
          why: "This changes one category. It does not imply that every allocation shrinks by half.",
        },
        {
          title: "Inspect the numerical cost",
          calculation:
            "4-bit symmetric scale=2.4/7; 0.12 → code 0 → restored 0",
          why: "Quantization changes representable values. Inspect the resulting dot product, not only the byte savings.",
        },
      ],
    },
    prediction: {
      prompt:
        "A 7-billion-parameter model uses four packed bits per weight. Does 3.5 GB describe its guaranteed complete runtime memory?",
      options: [
        "Yes; parameter bits account for every allocation",
        "No; that is raw packed weight storage before additional categories",
        "Yes; quantization removes the KV cache",
      ],
      correct: 1,
      answer: [
        "No. **7×10⁹×4/8=3.5×10⁹ bytes** counts only packed weights. Scales, metadata, runtime buffers, cache, and other state can add memory.",
        "Training also needs appropriate activations, gradients, and optimizer state. A fitting estimate should state which categories it includes.",
      ],
    },
    experimentIntro:
      "Pack the budget at different precisions and batches. Expand the numeric comparison, then switch to two-device data, tensor, and pipeline decompositions with exact small matrix results.",
    math: {
      heading: "Different parallel strategies split different objects.",
      intro: [
        "Use W=[[1,2],[3,4]] for the data and tensor examples. The pipeline example instead has two declared layers, so its output need not match the one-layer examples.",
      ],
      rules: [
        {
          label: "Packed weight estimate",
          formula: "bytes≈parameterCount×bitsPerEntry/8",
        },
        {
          label: "Uniform symmetric toy quantizer",
          formula:
            "qmax=2^(bits−1)−1; s=max|w|/qmax; q=clip(round(w/s)); restored=sq",
        },
        {
          label: "Data parallel inference",
          formula: "Device 1:W[1,2]=[5,11]; device 2:W[2,1]=[4,10]",
        },
        {
          label: "Row-split tensor parallel inference",
          formula:
            "Device 1:[1,2]·[1,2]=5; device 2:[3,4]·[1,2]=11; gather [5,11]",
        },
        {
          label: "Two-stage pipeline",
          formula: "[1,2] → W₁=2I → [2,4] → W₂=[[1,1],[1,−1]] → [6,−2]",
        },
      ],
      paragraphs: [
        "**Data parallelism** distributes examples while replicating model parameters. Training replicas typically synchronize gradients. **Tensor parallelism** partitions an operation or its parameters; communication depends on that partition. **Pipeline parallelism** places successive stages on different devices and passes intermediate state between them.",
        "For the numeric formats, FP32 has 1 sign, 8 exponent, and 23 fraction bits; FP16 has 1,5,10; BF16 has 1,8,7. This explains different range/precision tradeoffs without claiming all formats behave like a uniform integer quantizer.",
        "The toy 4-bit code range is −7 through +7, leaving one signed code unused. Each original weight, integer code, and restored weight is inspectable. The dot product uses [2,1,−1,0.5] for both original and restored vectors.",
        "The training-state scenario adds declared full-precision gradients and optimizer entries. Real mixed-precision recipes may keep master weights and other buffers; inspect the actual implementation before estimating capacity or speed.",
      ],
      limit:
        "This lesson computes bytes and small operations. It does not model hardware kernels, communication topology, synchronization cost, utilization, or full training memory.",
    },
    transfer: {
      prompt:
        "Two devices each hold the entire model and process different requests. Has the model’s per-device weight storage been halved?",
      answer: [
        "No. That is **replication for data-parallel work**. Each device still holds the full model in this setup.",
        "A parameter or tensor partition can reduce per-device storage, but introduces its own communication and execution constraints.",
      ],
    },
    takeaways: [
      "Raw weight bytes are one part of a runtime budget.",
      "Numeric width, range, precision, and speed are different properties.",
      "Quantization can change numerical outputs.",
      "Data, tensor, and pipeline parallelism divide different work.",
    ],
    sources: [
      {
        title: "NVIDIA — GPU Performance Background User’s Guide",
        url: "https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html",
      },
      {
        title: "NVIDIA — Train With Mixed Precision",
        url: "https://docs.nvidia.com/deeplearning/performance/mixed-precision-training/index.html",
      },
      {
        title: "Dettmers et al. — QLoRA",
        url: "https://arxiv.org/abs/2305.14314",
      },
    ],
  },
  {
    slug: "l37",
    sourceId: "L37",
    deck: "Compare a queue, cache pages, online attention, and corrected draft sampling without treating them as the same optimization.",
    objective:
      "Trace scheduling latency/throughput tradeoffs, paged state, exact online softmax, and a one-position speculative-sampling correction.",
    prerequisites: ["l20", "l35", "l36"],
    problem: {
      heading: "Which part of serving is actually expensive?",
      paragraphs: [
        "Four requests need **4,1,2,1 output tokens**. Two arrive immediately, another at time 1, and another at time 2. A server can run one sequence at a time or combine work into batches.",
        "Scheduling is one bottleneck. Cache allocation, attention memory traffic, and serial token choices create others. We will inspect each with a small independent mechanism, rather than assigning every speed improvement to one vague “faster model.”",
      ],
    },
    intuition: {
      heading: "Start with the queue, then move inside the computation.",
      paragraphs: [
        "**Static batching** keeps a group together until its members finish. **Continuous batching** can admit and retire sequences as slots become available. Throughput counts work per elapsed time; individual latency concerns a particular request. They can move in different directions.",
        "**PagedAttention** organizes sequence KV state in blocks. Logical sequence pages can map to different physical slots, and completed requests can release slots. Block size affects unused space; paging does not eliminate the underlying keys and values.",
        "**FlashAttention** uses memory-aware tiling to compute exact attention, up to floating-point differences, without materializing the usual full attention score matrix in high-bandwidth memory. The player illustrates its online-softmax arithmetic, not a complete GPU kernel.",
        "**Speculative decoding** proposes tokens with a cheaper draft and verifies/corrects using a target. Correct sampling can preserve the target distribution under its assumptions. Accepting every draft token cannot generally do that.",
      ],
      limit:
        "The scheduler’s times and token lengths are invented workload fixtures. The online row and one-position sampling proof expose arithmetic; neither constitutes a complete production serving implementation or measured speedup.",
    },
    walkthrough: {
      heading: "Follow four small mechanisms.",
      intro:
        "Each comparison isolates one changed rule. The player offers separate scenarios so you can trace them without simultaneous animation.",
      steps: [
        {
          title: "Schedule the same eight tokens",
          calculation: "Serial ticks=1 unit; two-slot ticks=1.25 units",
          why: "Serial finishes at 8. Static batches finish at 7.5. Continuous batching finishes at 5 under these stated costs and arrival rules.",
        },
        {
          title: "Compare one request’s latency",
          calculation:
            "Request A arrives at 0: serial finish=4; continuous finish=5",
          why: "Total throughput improves from 8/8 to 8/5, while this individual request takes longer.",
        },
        {
          title: "Accumulate attention without a full score row",
          calculation: "First score/value=(1000,2): m=1000, l=1, o=2; output=2",
          why: "When a larger score arrives, rescale the old denominator and numerator before adding its contribution. This avoids naive exponential overflow.",
        },
        {
          title: "Correct a draft distribution",
          calculation:
            "Target p=[0.6,0.4], draft q=[0.2,0.8]; acceptance=[1,0.5]",
          why: "Accepted mass is [0.2,0.4]. Rejection mass 0.4 is reassigned through residual [1,0], yielding target [0.6,0.4].",
        },
      ],
    },
    prediction: {
      prompt:
        "If a draft proposes B with probability 0.8 while the target assigns B probability 0.4, what happens if every draft token is accepted?",
      options: [
        "The output automatically matches the target",
        "The output keeps the draft’s 0.8 probability for B",
        "The target model’s weights change",
      ],
      correct: 1,
      answer: [
        "It **keeps the draft distribution**. In this example, B remains at 0.8 rather than the target 0.4.",
        "The acceptance/replacement rule corrects the marginal distribution. One inspected accepted or rejected proposal is not, by itself, evidence that the whole distribution is preserved.",
      ],
    },
    experimentIntro:
      "First compare serial, static, and continuous scheduling with retained cache pages. Then trace online attention and corrected versus naive speculative sampling. Every scenario starts paused and keeps an auditable exact trace.",
    math: {
      heading: "Write the rules at the bottleneck they address.",
      intro: [
        "In the queue, one tick generates one token for each running sequence. New members are admitted only at tick boundaries. All shown first/finish timestamps are absolute times; subtract arrival to get request delay.",
      ],
      rules: [
        {
          label: "Teaching throughput",
          formula: "generatedTokens / elapsedTime",
        },
        {
          label: "Cache paging",
          formula:
            "retainedEntries=2 prompt + generated; pages=ceil(retainedEntries/2)",
        },
        {
          label: "Running maximum update",
          formula: "m′=max(m,s); a=exp(m−m′); b=exp(s−m′)",
        },
        {
          label: "Online weighted sum",
          formula: "l′=al+b; o′=ao+bv; output=o′/l′",
        },
        {
          label: "Speculative acceptance",
          formula: "accept(token i)=min(1,pᵢ/qᵢ) when qᵢ>0",
        },
        {
          label: "Replacement distribution after rejection",
          formula: "rᵢ=max(0,pᵢ−qᵢ) / Σⱼmax(0,pⱼ−qⱼ)",
        },
      ],
      paragraphs: [
        "The scheduler displays retained pages after each tick. A finished request releases its pages; this view is not a peak-memory measurement during computation. The twelve-page pool is deliberately sufficient for the small workload.",
        "Online attention consumes scores [1000,1001,999] and values [2,4,8]. Subtracting 1000 from every score changes no softmax weights. Grouping two pairs into a tile also preserves the final row result here.",
        "Avoiding an N×N stored score matrix is different from avoiding N² dense query–key interactions. Memory access and arithmetic complexity are related but distinct costs.",
        "For speculative sampling, qᵢ×min(1,pᵢ/qᵢ)=min(pᵢ,qᵢ). Add the rejected mass distributed according to positive p−q and the final mass equals p. When p=q, rejection has zero probability, so no residual distribution is sampled.",
        "Real multi-token speculative implementations evaluate prefix-dependent target probabilities and stop or correct at rejection boundaries. The cost of drafting, acceptance rate, target verification, batch size and hardware determine whether there is a speed benefit.",
      ],
      limit:
        "The online row omits the complete FlashAttention tiling/backward algorithm. The two-entry page pool omits sharing and copy-on-write. The speculative example proves one-position probability mass, not a full multi-token speedup.",
    },
    transfer: {
      prompt:
        "A serving change doubles total tokens per second but makes one user wait longer for their first token. Are those observations contradictory?",
      answer: [
        "No. **Aggregate throughput and individual delay measure different outcomes.** Larger batches or queue policies can improve utilization while increasing some waits.",
        "Evaluate arrival-to-first-token, inter-token pacing, completion time, memory, and throughput on the workload that matters.",
      ],
    },
    takeaways: [
      "Batch scheduling can trade one request’s latency for aggregate throughput.",
      "Paging manages cache placement and reuse of freed blocks.",
      "Online attention preserves the defined mixture while changing memory use.",
      "Speculative sampling needs correction to preserve a different target distribution.",
    ],
    sources: [
      {
        title: "Dao et al. — FlashAttention",
        url: "https://arxiv.org/abs/2205.14135",
      },
      {
        title: "Kwon et al. — PagedAttention",
        url: "https://arxiv.org/abs/2309.06180",
      },
      {
        title:
          "Leviathan et al. — Fast Inference from Transformers via Speculative Decoding",
        url: "https://arxiv.org/abs/2211.17192",
      },
    ],
  },
  {
    slug: "l38",
    sourceId: "L38",
    deck: "Send token vectors through selected numerical experts, then expose capacity overflow and the difference between total and active weights.",
    objective:
      "Trace a gate, capacity policy and weighted expert outputs while distinguishing sparse internal layers from routing whole requests among models.",
    prerequisites: ["l15", "l21", "l36"],
    problem: {
      heading: "Does every token need every subnetwork?",
      paragraphs: [
        "Imagine a layer with **four small experts**, each a 2×2 matrix followed by ReLU. A gate assigns scores to each token vector and selects a subset of experts. This is sparse computation inside one supplied model.",
        "Eight vectors arrive. With two slots per expert, a balanced set fits. If every vector prefers expert 1, six overflow under our top-1 drop policy even though other experts have room. Routing and capacity are part of the mechanism.",
      ],
    },
    intuition: {
      heading: "An expert is a learned numerical function.",
      paragraphs: [
        "A **mixture of experts**, MoE, commonly replaces some dense MLP layers with routed subnetworks. The **gate** computes routing scores. Sparse top-k selection activates only a subset for each token.",
        "**Total parameters** count all stored experts plus shared components. **Active parameters** describe the components used for a particular computation. A batch may use many experts even if each token uses only one.",
        "Do not assume an expert corresponds to “math” or “law.” Its role emerges from training and architecture; our experts have explicit small matrices, with no subject names or semantic claims.",
        "Application-level **model routing** instead chooses a whole model for a request, perhaps using required capability, measured quality, cost or latency. A request routed to an image-capable model is a different unit of selection from a token routed to an internal MLP.",
      ],
      limit:
        "Gate weights and expert matrices are supplied for inspection, not trained. Capacity/drop/fallback behavior is the declared toy policy, not a claim that every MoE uses these rules.",
    },
    walkthrough: {
      heading: "Follow one vector through the gate and expert.",
      intro:
        "For x=[x₁,x₂], use gate logits [x₁,x₂,−x₁,−x₂]. Break equal scores by lower expert index.",
      steps: [
        {
          title: "Score the first vector",
          calculation: "x=[2,0] → gate logits=[2,0,−2,0]",
          why: "Expert 1 is the highest-scored branch for this vector.",
        },
        {
          title: "Run the selected numerical transformation",
          calculation: "Expert 1 uses I, so ReLU(I[2,0])=[2,0]",
          why: "Only the selected branch contributes under this top-1 rule.",
        },
        {
          title: "Count stored and active entries",
          calculation:
            "Gate=8 entries; experts=4×4=16; total=24; top-1 active=8+4=12",
          why: "All expert weights still exist even when a token uses only one expert.",
        },
        {
          title: "Apply the capacity contract",
          calculation:
            "Eight tokens prefer expert 1; capacity 2 → 2 processed, 6 dropped",
          why: "Unused slots elsewhere do not help under the drop rule. A fallback rule must explicitly select another transformation.",
        },
      ],
    },
    prediction: {
      prompt:
        "Expert 1 is full. If we reroute a token to expert 2, can we assume its numerical output is unchanged?",
      options: [
        "Yes; every expert computes the same function",
        "No; choosing a different expert can change the transformation",
        "Yes; routing is only a storage choice",
      ],
      correct: 1,
      answer: [
        "No. **Different experts can implement different functions.** Our expert 2 swaps the coordinates before ReLU, so rerouting can change the output.",
        "Load balancing, capacity, token dropping, and rerouting need explicit semantics. They are not merely decorative traffic diagrams.",
      ],
    },
    experimentIntro:
      "Compare balanced top-1 traffic, skewed traffic with dropped overflow, next-ranked fallback, and a top-2 weighted mixture. Inspect the actual gate weights and expert outputs.",
    math: {
      heading: "Separate a token’s selection from all stored capacity.",
      intro: [
        "Convert gate logits to softmax probabilities, keep the permitted expert subset, normalize the retained weights, and mix their outputs. Our overflow policy operates before this retained-weight normalization.",
      ],
      rules: [
        { label: "Gate logits", formula: "g(x)=[x₁,x₂,−x₁,−x₂]" },
        { label: "Expert branch", formula: "eᵢ(x)=ReLU(Wᵢx)" },
        {
          label: "Sparse mixture",
          formula: "output=Σᵢ∈S [softmax(g)ᵢ / Σⱼ∈Ssoftmax(g)ⱼ] eᵢ(x)",
        },
        {
          label: "Declared matrices",
          formula: "W₁=I; W₂=[[0,1],[1,0]]; W₃=diag(−1,1); W₄=diag(1,−1)",
        },
        {
          label: "Parameter entries",
          formula: "Stored=8+4×4=24; maximum top-k active=8+4k",
        },
      ],
      paragraphs: [
        "The drop scenario considers only the intended top-k experts and omits full branches. The fallback scenario tries the remaining experts in score order until its target count is filled. This is a declared capacity-aware rule; it need not match a production router.",
        "If no branch survives, our sparse branch returns [0,0]. A real transformer may also have a residual path carrying information around its MoE block; this fixture does not simulate that complete block.",
        "Top-2 selects up to two experts with capacity four each in the comparison. The maximum active count is 16 entries, but a dropped branch can make actual work smaller. Shared non-expert layers and other real model parameters would also count.",
        "Sparse activation can save some arithmetic while retaining substantial weight memory and communication. Expert placement and traffic imbalance matter. Total versus active parameter counts alone do not establish speed or quality.",
        "For application routing, first define the request requirement and evaluate candidate whole models on it. A capability rule, such as “needs image input,” differs from this learned token-vector gate, even if both use the word routing.",
      ],
      limit:
        "There is no training, expert parallel network traffic, stochastic gate, auxiliary balancing loss, or autonomous multi-agent debate in this fixture.",
    },
    transfer: {
      prompt:
        "A batch of four tokens uses experts 1,2,3,4 respectively. Does top-1 mean only one expert was used by the entire batch?",
      answer: [
        "No. **Each token uses one expert**, while the batch’s union contains all four.",
        "State the unit when discussing active parameters or sparse work: one token, one sequence, a batch, or the stored model.",
      ],
    },
    takeaways: [
      "MoE gates select numerical subnetworks inside a model.",
      "Stored weights and per-token active weights differ.",
      "Capacity and overflow policies can change results.",
      "Routing whole requests among models is a separate mechanism.",
    ],
    sources: [
      {
        title: "Fedus et al. — Switch Transformers",
        url: "https://arxiv.org/abs/2101.03961",
      },
    ],
  },
];
