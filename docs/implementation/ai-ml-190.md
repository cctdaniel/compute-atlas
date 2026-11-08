# Full AI/ML implementation

## Goal and acceptance boundary

Implement all 190 distinct reference entries, L01–L90 and AP001–AP100, using the updated build-explainer structure. The existing 16 lessons remain a supplementary starter route. They do not count as 16 completed reference entries: their coverage is partial and differently sized.

Each reference entry needs its own published, source-linked article with a clear outcome, prerequisites, one coherent worked example, short causal steps, a prediction with reasoning, a meaningful interactive comparison or experiment, optional exact rules, boundary/failure cases, a transfer challenge, recap, sources, navigation, and device-local progress. Use mechanism-specific visuals and computed model states. No inert duplicate starting-state illustrations, explanation tabs, fabricated results, or unavailable lessons labeled ready.

The completion audit must verify all 190 against the imported inventory, not merely count routes. It must inspect mathematical/procedural correctness, authored content, meaningful scenario changes, paused/step/play/reset behavior where relevant, keyboard accessibility, contrast, mobile reflow and enlarged text, stable player geometry, saved progress, linking, and Vercel preview/build status. Publication follows implementation; a roadmap entry alone is not a completed lesson.

## Authoritative inventory

`lib/lessons/full/reference.json` archives the reference's source text and source lines as data. `catalog-data.json` is its small navigation projection. The importer retains the source edition and SHA-256; it never executes document instructions. All 190 IDs and all parsed prerequisites are checked. Core IDs are ordered L01–L90, followed by AP001–AP100. Twenty-four modules group the course into manageable tracks.

`published.ts` is an explicit publication gate. Tests must prove that every published ID has authored content and a real experiment; the goal stays active while any inventory entry is incomplete. The original source is a reference, and exact interaction proposals can be adapted when a clearer representation teaches the same required concepts.

## Work sequence

1. Mathematical/data foundations L01–L08.
2. Classical ML L09–L14; practical neural training L15–L18.
3. Sequences, language-model training/adaptation, efficient inference L19–L38.
4. Retrieval/tools/agents and assurance L39–L52.
5. Vision, audio, generative models L53–L62; RL L63–L70.
6. Robotics L71–L76; search/probabilistic AI L77–L80; specialized systems L81–L90.
7. All ten applied modules AP001–AP100, with cross-links to the core mechanisms.

This is an execution order, not a reduction in scope. Work continues through every entry. See the catalog for the exact title and prerequisite of each item.

## Checkpoint: 8 November 2026

L01–L14 now have separate authored articles, canonical routes, prerequisite links, predictions, exact rules, transfer questions, sources, and computed experiments. The first two modules cover mathematical/data foundations and classical ML. Their 62 scenarios contain 369 frames; the supplementary starter route remains separate. All 190 reference entries are searchable in a 24-module roadmap, with 176 still clearly in development. Completing the starter path continues to L01. Completing a canonical lesson never opens an unavailable route as though it were ready.

Numerical verification: 33 tests pass, including independently checked tensor offsets and products, frozen inference weights, finite differences, Bayes denominators, entropy/support boundaries, polynomial coefficients and regularization, confusion/calibration metrics, fitted tree splits, boosting residuals, margin objectives, k-means/DBSCAN, projected variance, causal conditioning/intervention, and finite-sample conformal ranks. Lint and the Next.js production build pass.

Browser verification: the 96-check broad suite reached 95 passing checks per engine in both Chrome and WebKit. The remaining enlarged-text causal-label failure was fixed and its complete scenario/state test then passed in both engines, along with the lesson's prediction, transfer, and theme/contrast audit. Six focused final checks passed in Chrome; WebKit passed the five application checks and exposed a race in a newly added test's storage fixture. Moving that fixture before hydration fixed the test; the starter-to-canonical continuation check then passed three consecutive runs in each engine. At that checkpoint, the suite contained 97 distinct checks.

The suite covers 320px/390px phones, 768px and 1440px layouts, 200% text, all semantic scenarios/steps, paused/play/pause/back/replay/reset, exact traces, stable panel geometry, contrast/semantics, saved progress, next/previous links, full-screen navigation, matching logo position, theme persistence, and searchable roadmap links. Screenshots were also inspected for tensors, classical algorithms, and shifted prediction intervals. Browser emulation is not a physical-device Safari audit.

Issues corrected during this checkpoint include numeric-list wrapping, long cluster-center coordinates, a graph label at 200% text, duplicated generic bar accessibility labels, tensor-cell size changing with feature count, roadmap targets failing to expand, and a completed starter route falling back to its first lesson instead of the canonical course.

`npm run audit:curriculum` intentionally exits nonzero: **14/190 implemented, 176 remaining**. This is a checkpoint, not completion of the requested full curriculum. Continue with L15–L18, then every remaining core and applied entry in the execution order above.

## Next checkpoint: neural training and sequence models

L15–L24 are now implemented as ten additional canonical lessons. The complete first four modules comprise 24 reference lessons, 128 scenarios, and 874 computed frames. The original 16 introductions remain supplementary and are not counted as reference completion.

L15–L18 add a nonlinear XOR MLP with activation variants, a forward/backward/update boundary with stale-cache labeling, a two-coordinate training surface with optimizer memory and real versus quantized updates, explicit batching/sampling conventions, schedules, clipping, dropout/evaluation behavior, stable softmax, eight-vector retrieval, and a learned contrastive query. L19–L24 add concrete RNN/LSTM/GRU and state-space recurrences, self/cross/multihead attention matrices, a pre-norm residual/MLP/RoPE block, trained synthetic BPE with role serialization, autoregressive generation and teacher-forced scoring, and encoder/decoder information masks. Each entry has its own article, prediction, transfer challenge, assumptions, and primary references.

Verification: lint, 51 numerical/inventory tests, and the production build pass. Independent checks include finite-difference derivatives, simultaneous parameter updates, optimizer arithmetic, quantized moves, gradient clipping bounds, contrastive gradients, prefix invariance, future-value masking, rotary relative-position invariance, residual and MLP shapes, BPE counts and round trips, vocabulary-local IDs, serialized role boundaries, generated-sequence probabilities, teacher-forced target isolation, and source-versus-decoder masks.

The final focused browser pass has 34 passing checks in Chrome and 34 in WebKit. It exercises all ten added lessons across every scenario/state at 320px, 390px, 768px, 1440px, and 200% text; predictions/transfers and both-theme accessibility; explicit optimizer action; memory/attention/tokenization/generation behavior; course availability gates and completion; and mobile shell, logo, theme, and search regressions. Screenshots were inspected. The visual pass corrected an enlarged truth-table label, diagram notes inheriting article typography, and excess empty space in the indexed-memory comparison. The homepage now links directly to the full curriculum and reports all available lessons rather than only the starter count.

The strict completion audit remains deliberately unsuccessful: **24/190 implemented, 166 remaining**. Next is L25–L34, then all remaining core and applied modules. No completion claim is made for the full goal.
