# AI/ML reference coverage

The current branch has **16 supplementary introductory lessons** plus **24 canonical reference lessons, L01–L24**. The full 190-entry curriculum remains incomplete: **166 reference entries still need implementation**.

Source: `Compute-Atlas-Mega-Curriculum.md`, edition 1.0 (24 October 2026), Volume 8, lines 17581–22348. A heading inventory finds **190 distinct lesson entries: L01–L90 (90 core) and AP001–AP100 (100 applied)**. Support appendices also contain labs, templates, and further material. The document is a reference for coverage, not an instruction to reproduce its exact structure.

These are different-sized learning units. Several published lessons touch parts of more than one reference entry, and many reference entries need multiple smaller teaching bites. The canonical publication gate tracks reference IDs separately. Starter-path coverage does not increase its completion count.

## Coverage by area

| Area | Published coverage | Significant work still needed |
| --- | --- | --- |
| Foundations (L01–L08) | Category distinctions, lifecycle/checkpoints, tensor indexing and matrix shapes, derivatives/chain rule, Bayes, expectation/variance/entropy/CE/KL, learning setups, provenance/group/time/preprocessing leakage | Later entries extend these mechanisms to larger systems and applied workflows. |
| Classical machine learning (L09–L14) | Numeric versus categorical targets, regularized polynomial fitting, cross-validation, threshold costs/calibration, neighbors, trees/ensembles/boosting, margins, naive Bayes, k-means/DBSCAN/PCA, anomaly scores, shift/causality/conformal intervals | Advanced evaluation and production workflows remain in the applied entries. The SVM is a finite subgradient demonstration; trees are deliberately shallow. |
| Neural networks (L15–L18) | Nonlinear XOR MLP, forward/backward/simultaneous updates with bias, two-coordinate optimizer traces, sampled gradients/batches/epochs, schedules, clipping, initialization, quantization/softmax stability, dropout, geometric retrieval and contrastive query learning | Real training-scale diagnostics, advanced normalization and representation workflows continue in later core/applied entries. Toy objectives and arithmetic conventions are explicit. |
| Sequences and language models (L19–L24) | RNN/LSTM/GRU and state-space recurrences, full self/cross/multihead attention matrices, causal masking, pre-norm residual/MLP/RoPE block, trained synthetic BPE and chat serialization, six-token generation/teacher forcing, encoder/decoder architecture patterns | L25 onward: pretraining, context engineering, decoding controls, post-training, preference learning, LoRA/QLoRA, distillation, KV caches, quantization, batching, efficient attention, MoE. |
| Retrieval and agents | A deterministic keyword lookup, a typed multiplication call, evidence/abstention and one bounded workflow | Sparse/dense/hybrid retrieval, chunking, reranking, retrieval/generation evaluation, permissions, structured outputs, harness state, durable retries, memory, planning, human oversight, multi-agent coordination |
| Vision, speech and generative models | No dedicated lessons | Convolution/CNNs, detection/segmentation, visual transfer/ViTs, audio and speech, multimodal alignment, autoencoders/VAEs/GANs, diffusion/flow matching |
| Reinforcement learning and broader AI | No dedicated lessons | Bandits, MDPs/POMDPs, Bellman equations, TD/Q-learning, policy gradients/actor-critic, exploration, offline/model-based RL, imitation, search/planning, probabilistic graphical models, graph learning |
| Robotics | No dedicated lessons | Perception/estimation/planning/control, kinematics, dynamics, localization/SLAM, trajectories/contact, robot learning and sim-to-real |
| Applied AI lifecycle | Introductory split/evaluation concepts and a small retrieval/tool workflow | Dataset contracts/labeling, missingness, feature engineering/pipelines, point-in-time correctness, model selection/adaptation, product applications, evaluation datasets/statistics, security/privacy, release gates, deployment, monitoring, cost and recovery |

## Supplementary starter lesson → reference bridges

These are conceptual connections, not claims that an entire reference lesson is implemented.

| Published lesson | Closest reference entries |
| --- | --- |
| How machines learn | L02, L04, L16 |
| Vectors & matrices | L03 |
| Probability & uncertainty | L05; uncertainty coverage is limited |
| Training, validation & test data | L07, L08, AP018 |
| Linear regression | L09 |
| Classification | L09, L11 |
| Overfitting & generalization | L10 |
| Precision, recall & evaluation | L11; does not cover the full L47 evaluation scope |
| Neurons & activation functions | L15 |
| How backpropagation works | L04, L16 |
| Embeddings & similarity | L18 |
| Momentum & adaptive optimizers | Part of L16/L17; broader numerical-stability coverage remains |
| Tokenization | Part of L22; chat templates remain |
| Queries, keys & attention | L20 |
| The transformer architecture | Part of L21; positional methods and wider architecture coverage remain |
| Retrieval & tool use | Introductory bridge to L39–L46, AP055, AP061–AP065; not a complete RAG or agent implementation |

## Expansion direction

Keep the 16 lessons as an introductory route and use a broader AI/ML roadmap to make the remaining coverage visible. Group it into navigable tracks with prerequisites, rather than presenting 190 flat links on a phone. Publish availability honestly; combine overlapping reference entries only when their learning objectives are actually addressed.

Foundations, classical ML, neural training, and sequence/language architecture now have dedicated canonical lessons L01–L24. Next implement L25–L34, then continue through every remaining core and applied entry. Language-model training/inference, retrieval/agents, vision/audio/generative models, RL/robotics, and applied production workflows can then branch from those prerequisites. Applied data/evaluation/security lessons should also appear alongside the mechanisms they qualify, rather than being deferred entirely to an advanced final chapter.
