# AI/ML starter-path audit

Scope: the 15 remaining lessons in the application’s short starter roadmap, following the merged gradient-descent lesson. This is a subset of the 190-entry AI/ML reference curriculum; see `ai-ml-reference-coverage.md`. The four-chapter path now contains 16 readable lessons. Algorithms, systems, networks, databases, and security retain honest planned-subject pages.

## Teaching contract

Each additional lesson has a specific outcome, named prerequisites, one continuous example, seven sequential reading sections, a prediction with reasoned feedback, a computed interactive experiment, visible optional mathematics with a forward skip, a transfer question, three takeaways, primary references, and previous/next navigation. There are no explanation-depth tabs.

The authored content is in `lib/lessons/`. The model produces semantic frames independently of playback. Server rendering prepares only the requested lesson's content and scenarios. The renderer maps typed states to mechanism-specific diagrams instead of using a generic animated illustration.

| Concept | What the learner can inspect |
| --- | --- |
| Vectors/matrices | Each quantity–price product, row sum, and completed cart |
| Probability | 100-message population, clue matches, changed denominator, posterior |
| Data splits | Source identity, partition roles, a duplicate crossing into test |
| Regression | Candidate line, observed points, residuals, mean squared error |
| Classification | Linear score, sigmoid result, cutoff, final decision |
| Overfitting | Training points, held-out points, candidate curves, both errors |
| Evaluation | All eight decisions, four confusion counts, precision/recall/accuracy |
| Neurons | Input–weight terms, bias, pre-activation, ReLU or identity output |
| Backpropagation | Forward values, backward derivatives, simultaneous parameter update |
| Embeddings | Query and candidate directions, cosine scores, zero-norm failure |
| Optimizers | GD/momentum/Adam trajectories, update arithmetic, optimizer memory |
| Tokenization | Ranked merges on aligned characters, final pieces and vocabulary IDs |
| Attention | Query/key scores, allowed-source softmax, value contributions, running output |
| Transformers | Supplied inputs, causal attention, both residual paths, normalization, FFN |
| Retrieval/tools | Policy corpus, routing, typed calculation, evidence, response, abstention |

The probability prior scenario keeps within-class clue rates fixed (75% of spam and 5% of ordinary mail). The transformer is explicitly a three-coordinate, single-head, post-norm teaching block with identity Q/K/V projections. The retrieval example is deterministic keyword lookup and typed multiplication, not a live language model. These constraints are stated in the lessons. Display rounding never feeds back into calculations.

## Interface contract

- Self-hosted Source Serif 4 prose, Lora headings, DM Sans controls; existing reading measure and compact scrolling header retained.
- Continuous reading; contents links close after selection on mobile. Optional mathematics leads forward to the challenge.
- One live experiment per lesson, reached from an underlined introduction link. Removed the repeated static starting-state illustration, which looked interactive without responding to input.
- Native labeled scenario selector; paused initial state; back, next, play/pause/replay, reset, and a jumpable exact trace.
- Scenario changes stop playback and return to frame zero. Reset restores the original scenario. Reduced-motion mode uses a slower, discrete cadence.
- Caption, metric, calculation, and diagram reserves cover supported scenarios and frames at the actual responsive width. Reserves are hidden from assistive technology and inert.
- Cart and confusion layouts adapt when text needs more room. Labels live outside plots; vector point identifiers map to a separate list. No hidden overflow is used to disguise a content failure.
- Browser storage remembers each lesson's step, scenario, and reading section independently. Legacy gradient-descent progress remains compatible. The overview resumes the last unfinished lesson while its featured first-lesson link retains its own destination.
- All 16 lessons participate in search, bookmarks, completion, and the learning path's “To learn” filter.

## Verification

`npm run preflight` runs lint, 21 numerical tests, and a production build. Numerical coverage includes all 47 new scenarios and 290 semantic frames, hand-calculated cart/Bayes/MSE/confusion examples, finite-difference gradient checks, optimizer bias correction, token reconstruction, stable softmax, causal masking, residual addition, normalization, evidence selection, and unsupported-query abstention.

`tests/browser/` contains 66 browser tests. The suite runs in installed Chrome and Playwright WebKit. For every new player it traverses every scenario and every frame at 320px/light, 390px/dark, 320px/200% text, 768px/light, and 1440px/dark; compares component geometry; checks page/control overflow; and records mobile screenshots. Every new lesson also receives quiz/transfer checks and automated WCAG A/AA semantic and contrast scans in both themes. The suite retains the original navigation, theme, search, reading-flow, gradient-descent geometry, large-text, and focus regressions.

The audit found and corrected narrow-table label crowding, recap grid min-content overflow on a long technical word, a skip-path label extending beyond its rail, incorrect list semantics around decorative skip paths, and low transient contrast while theme colors interpolated, and a vector annotation too near its endpoint. The vector annotation now has a leader, and the zero query is a point rather than an arrow. Theme colors now switch together. Tests account for Next.js retaining inactive routes and for asynchronous browser scrolling.

Limits: browser tests and automated accessibility scans are evidence for covered states, not a claim that every possible device is perfect. Physical iPhone Safari, VoiceOver, and cross-device sync were not tested; progress remains local to this browser. No external AI service, backend, or account is required.
