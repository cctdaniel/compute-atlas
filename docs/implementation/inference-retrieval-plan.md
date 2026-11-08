# Efficient inference and retrieval: L35–L40

Continue the full 190-entry goal. Six new entries extend the 34 published canonical lessons. Each needs the existing continuous article, prediction, real semantic player, optional exact rules, transfer challenge, sources and progress. No duplicate inert preview.

| ID | Learner operation | Small example and variations | Boundary |
| --- | --- | --- | --- |
| L35 | Reuse old K/V projections and attend to the permitted prefix; count cache bytes | Six supplied 2D token states, three-token prefill, cached/full-recompute/sliding-window decode, KV-head and batch counts | Cache is runtime derived state, not weights or permanent application memory; work counts are not latency measurements |
| L36 | Pack a byte budget, quantize and dequantize a weight vector, inspect three parallel decompositions | Declared million-parameter model, 16/8/4-bit storage, batches, training state, two-device data/tensor/pipeline mappings | Raw packed bytes exclude overhead; toy uniform quantizer is not FP16/BF16/NF4; no inferred wall-clock speed |
| L37 | Schedule queued sequences, allocate cache pages, compute attention online, correct speculative sampling | Four queued requests; static/continuous batches; two-value online softmax; target p=[.6,.4], draft q=[.2,.8] | Separate bottlenecks; exact distribution mass proof rather than blind draft acceptance; throughput/latency units illustrative |
| L38 | Gate token vectors into sparse experts with explicit capacity rules | Four linear/ReLU experts, eight vectors, top-1/top-2, balanced/skewed/overflow/reroute | Numeric experts are not named professions; per-token active entries differ from all weights or batch union; rerouting is a stated toy policy |
| L39 | Compute lexical/dense scores, fuse ranks and inspect reranking shortlist | Eight supplied documents, exact code and paraphrase queries, BM25/cosine/RRF, deterministic joint-term checker, restricted ANN candidates | Dense vectors are supplied fixtures, joint checker is not a neural cross-encoder; relevance is separate from score |
| L40 | Chunk a short policy, retrieve overlapping evidence, assemble context, verify claim support | Explicit word positions, changed size/overlap/top-k, missing source, unsupported claim, grounding abstention | No live generated answers or learned retriever; exact phrase support is a narrow fixture rule and cannot certify arbitrary entailment |

Before publication: independent arithmetic/finite-state tests; all scenarios and steps at 320/390/768/1440px and 200% text; both themes and accessibility; stable workbench geometry, menu/logo/search/progress regressions; hosted Vercel smoke checks on exact commit. The strict audit must still report the remaining entries honestly.
