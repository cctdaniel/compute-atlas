# Sequence and language-model lesson plan

Keep the full 190-entry goal. This module implements L19–L24 rather than treating the starter attention/tokenization pages as complete coverage.

| ID | Learner operation | Small example | Changed condition | Boundary to teach |
| --- | --- | --- | --- | --- |
| L19 | Trace hidden/cell/gated state and compare explicit indexed storage | Red/Blue ±1 sequence; scalar supplied recurrences | Longer history, first-symbol change, RNN/LSTM/GRU/linear/selective update | These supplied parameters and readout are not a proof that recurrent architectures cannot learn recall; selective fixture is not full Mamba |
| L20 | Compute every query–key dot product, scale, mask, row softmax, and value mixture | Three 2D keys/values; three self queries or two cross queries | Masking, future value, another query projection/head | Weights are not truth probabilities or causal explanations; Q×K shape differs from vocabulary logits |
| L21 | Trace a pre-norm block with actual residual vectors and 3→4→3 MLP | Three supplied 3D tokens; two-coordinate RoPE pair | Position transform, earlier-token permutation, residual route | Controlled content-only final-position invariance does not mean a causal stack has no order information; no full LM is simulated |
| L22 | Count weighted BPE pairs, merge, encode printable characters, serialize trusted roles | low/lower/newer corpus; four merges | Corpus, unfamiliar or uppercase word, structured role, role-looking body text | This is synthetic ASCII BPE; IDs and special tokens require an agreed tokenizer/template contract |
| L23 | Factor generated-sequence probabilities and score known causal targets | Six-token last-token toy model | Prompt, supplied draws, loop/budget, later target | Toy decoder discards older context; training probabilities are computed without fitting; known targets are not future context |
| L24 | Inspect context permissions and source/decoder stages | red book arrived, hidden middle token, two-token decoder prefix | Bidirectional, causal, encoder-decoder cross attention | Representations alone are not correct vocabulary predictions; source memory and future decoder outputs have different availability |

Use one continuous article per entry with a prediction before the player, exact optional rules, a transfer task, and primary sources. No duplicate inert intro state. Renderer labels must reflow at 320px/200%, all scenarios must reserve geometry without clipping, and numerical assertions must be independent of display rounding.
