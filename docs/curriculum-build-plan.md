# Complete the introductory AI/ML path

Scope: the remaining 15 concepts in the application’s short starter roadmap, not the complete 190-entry AI/ML reference. Keep the other five subjects as planned, expandable areas. PR #1 was merged at 8118bb10b05534dc985e9b8b0e9244acabd33978; implementation continues on codex/ai-ml-complete-curriculum.

Every lesson uses continuous reading, a single consistent worked example, a prediction before the experiment, one computed player, optional mathematics, a transfer question, a concise recap, references, and previous/next navigation. Players start paused. Changing a scenario resets the computation; reading navigation preserves it. All progress is per lesson.

| Lesson | Mechanism / smallest example | Meaningful scenario change | Visual |
| --- | --- | --- | --- |
| Vectors & matrices | Two carts × two unit prices | Change quantities or price | Highlighted matrix products and running sums |
| Probability | 100 emails, evidence appears in 15 spam and 4 legitimate messages | Change prevalence / false matches | Count grid and evidence filtering |
| Data splits | 12 records assigned 8/2/2 | Duplicate a source record across partitions | Dataset membership and leakage audit |
| Linear regression | Three parcel weights, cost = 2x + 1 | Change slope / remove fixed fee | Scatter plot, fitted line, residuals |
| Classification | Flagged-word count → score → sigmoid → threshold | Change count or threshold | Score/probability/decision pipeline |
| Overfitting | Four noisy training points and three clean validation points | Constant / line / interpolating cubic | Separate train/validation errors and fitted curve |
| Evaluation | Eight scored emails | Change threshold | Incremental confusion matrix |
| Neurons | Two inputs, two products, bias, ReLU | Suppress input / remove activation | Weighted terms, sum, activation |
| Backpropagation | Two scalar layers, one target | Change target / first weight | Forward/backward computation graph |
| Embeddings | Three candidate vectors and one query | Change query, magnitude, or zero norm | Vector geometry and cosine ranking |
| Optimizers | One quadratic with GD, momentum, Adam | Change optimizer | Computed trajectories and update memory |
| Tokenization | Ranked BPE merges in lower/lowest/Lower | Change word/case | Character-aligned merge spans and token IDs |
| Attention | Three 2D keys/values, one query | Change query or causal mask | Dot products, normalized weights, weighted values |
| Transformers | One three-coordinate decoder block | Change token / remove skip path | Attention, residual, normalization, FFN pipeline |
| Retrieval & tools | Small policy corpus and multiplication | Returns / delivery / missing evidence / calculator | Routing, typed tool input/result, grounded response |

Verification: numerical invariants and hand traces; every route, scenario, playback/step/reset, local persistence, bookmarks, quizzes, next links; narrow/desktop/200% text; stable geometry across states; Chrome and WebKit; accessibility scans; Vercel preview and production deployment checks.
