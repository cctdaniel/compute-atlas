import type { LessonContent } from "../types";
export const sequenceLessons: LessonContent[] = [
  {
    slug: "l19",
    sourceId: "L19",
    deck: "Feed a short Red/Blue sequence through explicit recurrences and compare the resulting state with an indexed token store.",
    objective:
      "Trace recurrent state, LSTM/GRU gates, and fixed versus input-dependent state updates without mistaking a summary for an automatically recoverable transcript.",
    prerequisites: ["l15", "l16", "l17", "l18"],
    problem: {
      heading: "Where does the earlier part of a sequence go?",
      paragraphs: [
        "Read **Red, Blue, Blue, Blue**, representing Red as +1 and Blue as −1. After each symbol, a model carries a state into the next update. We will ask a simple readout to recall the first symbol.",
        "Our first model has one scalar: **hₜ=tanh(0.5hₜ₋₁+xₜ)**, starting at 0. The rule combines the previous state with the new input, then applies a nonlinearity. It does not keep a separate addressable record for each token.",
        "All parameters and readouts are supplied for inspection, not trained to solve recall. Comparing their behavior teaches state updates; it does not establish what every trained recurrent model can remember.",
      ],
    },
    intuition: {
      heading: "A recurrence repeatedly transforms a working state.",
      paragraphs: [
        "An **RNN**, recurrent neural network, updates a hidden state from its previous state and the next input. The state can encode earlier information, but how well a task can recover that information depends on the learned update, state size, precision, and readout.",
        "**LSTMs** maintain a cell state and use input, forget, and output gates. **GRUs** use gates to blend prior state and a candidate. Gates are numerical functions that control information flow, not perfect switches that automatically preserve the right fact.",
        "A **state-space model** can use an update such as hₜ=ahₜ₋₁+bxₜ. Selective variants make parts of the evolution input-dependent. The experiment changes a scalar coefficient according to the next symbol to expose that idea; it is not a full implementation of Mamba.",
      ],
      limit:
        "A one-dimensional toy state and sign readout are intentionally restrictive. Failure to recall the first symbol here is not a proof that an RNN, LSTM, GRU, or state-space architecture cannot learn a suitable memory.",
    },
    walkthrough: {
      heading: "Watch the same history enter different update rules.",
      intro:
        "First trace the RNN, then compare a simpler linear filter whose contributions are easy to calculate.",
      steps: [
        {
          title: "Read the first Red",
          calculation: "h₁=tanh(0.5×0+1)≈0.7616",
          why: "The first input changes the state from zero. That state is the information carried forward.",
        },
        {
          title: "Read the next Blue",
          calculation: "h₂=tanh(0.5×0.7616−1)≈−0.5506",
          why: "The new symbol and old state both contribute. A negative state does not mean the earlier Red never occurred.",
        },
        {
          title: "Inspect a linear state filter",
          calculation: "hₜ=0.8hₜ₋₁+0.2xₜ: 0 → 0.2 → −0.04 → −0.232 → −0.3856",
          why: "The first symbol’s contribution is repeatedly multiplied by 0.8. Later inputs also affect the same scalar.",
        },
        {
          title: "Compare explicit indexing",
          calculation: "Stored prefix=[Red,Blue,Blue,Blue]; prefix[0]=Red",
          why: "An addressable store retains separate entries in this example. That is a different memory contract from a single scalar summary.",
        },
      ],
    },
    prediction: {
      prompt:
        "The final sign of our supplied RNN state is negative after Red, Blue, Blue, Blue. Does that prove a recurrent architecture cannot learn first-symbol recall?",
      options: [
        "Yes; all recurrent states forget the same way",
        "No; this result depends on the supplied update and readout",
        "Yes; only storing every token can solve any sequence task",
      ],
      correct: 1,
      answer: [
        "No. **The supplied parameters and sign readout** define this outcome. A model trained for recall, with an appropriate state and readout, can behave differently.",
        "Always separate a particular experiment from an architecture-wide impossibility claim. State capacity, precision, task, and training all matter.",
      ],
    },
    experimentIntro:
      "Compare RNN, LSTM, GRU, linear, and input-dependent state updates. Lengthen the history or change its first symbol. Inspect an explicit token store as a contrasting information-access mechanism.",
    math: {
      heading: "Write the state and gate conventions explicitly.",
      intro: [
        "The LSTM and GRU scenarios calculate their gates from supplied affine functions and sigmoid. No gate value is secretly fitted during playback.",
      ],
      rules: [
        { label: "RNN fixture", formula: "hₜ=tanh(0.5hₜ₋₁+xₜ)" },
        {
          label: "LSTM cell",
          formula:
            "f=σ(1.4+0.2h); i=σ(−1+0.5x); o=σ(1); g=tanh(x+0.2h); c′=fc+ig; h′=o tanh(c′)",
        },
        {
          label: "Our GRU-style convention",
          formula: "r=σ(0.5x); z=σ(−1+0.2h); n=tanh(x+0.5rh); h′=(1−z)h+zn",
        },
        { label: "Linear state-space fixture", formula: "hₜ=0.8hₜ₋₁+0.2xₜ" },
        {
          label: "Input-dependent fixture",
          formula: "aₜ=0.9 for Red, 0.2 for Blue; hₜ=aₜhₜ₋₁+(1−aₜ)xₜ",
        },
      ],
      paragraphs: [
        "Our GRU-style z weights the new candidate. Some library and paper conventions instead use z for the old-state share; compare equations before copying parameters or interpreting a gate.",
        "For the linear filter, changing only the first input from +1 to −1 changes the final state after four symbols by 0.4×0.8³=0.2048. Both final signs are negative, so this particular readout cannot distinguish the two recall targets.",
        "An explicit store grows with retained history. State-based methods use other memory and computation tradeoffs, while attention-based systems also have context and cache limits. Linear asymptotic work alone does not guarantee better speed or quality on every hardware workload.",
      ],
      limit:
        "The selective scalar fixture omits the structured parameterization, discretization, learned projections, and optimized algorithms of real selective state-space systems.",
    },
    transfer: {
      prompt:
        "A system retains a fixed-size learned state, while another retains the last 100 token entries. Can either automatically promise exact recall of every earlier token for an arbitrarily long stream?",
      answer: [
        "No. The fixed state needs a suitable representation and readout, and finite capacity and precision impose limits. The explicit store also has a **100-token retention boundary**.",
        "Define the required history and retrieval contract, then evaluate the actual task. Neither a state size nor a context-window length by itself proves reliable recall.",
      ],
    },
    takeaways: [
      "A recurrence carries information through an evolving state.",
      "Gates and input-dependent coefficients change how that state is updated.",
      "A toy recall result is not a universal architectural limit.",
    ],
    sources: [
      {
        title: "Dive into Deep Learning · LSTM",
        url: "https://d2l.ai/chapter_recurrent-modern/lstm.html",
      },
      { title: "Gu & Dao · Mamba", url: "https://arxiv.org/abs/2312.00752" },
    ],
  },
  {
    slug: "l20",
    sourceId: "L20",
    deck: "Compute a full query-by-key attention matrix, normalize each row, and follow the value mixtures under different masks.",
    objective:
      "Calculate scaled dot-product attention, distinguish self and cross attention, and trace causal masking and multiple projected heads.",
    prerequisites: ["l03", "l05", "l06", "l18", "l19"],
    problem: {
      heading: "How can each token choose a different mixture of information?",
      paragraphs: [
        "Use three keys **K₁=[1,0], K₂=[0,1], K₃=[1,1]** and values **V₁=[2,0], V₂=[0,2], V₃=[1,1]**. A query compares itself with keys; the resulting weights mix values.",
        "For self-attention we supply three queries matching those key coordinates. There are **three query rows and three key columns**. Each query needs its own probability distribution over the keys it may read.",
        "A causal mask prevents a query from reading future positions. Cross-attention instead uses queries from one sequence and keys/values from another. The same numerical mechanism supports both information-access patterns.",
      ],
    },
    intuition: {
      heading: "Keys select contributions; values carry the mixed information.",
      paragraphs: [
        "A **query** describes what a position is looking for in the learned representation. A **key** supplies a compatibility vector. A **value** supplies the coordinates that will be blended. These roles can come from different learned projections of the same token.",
        "Compute each query–key dot product, divide by the square root of key width, apply the mask, then use **softmax separately for each row**. Each row’s allowed weights sum to 1. A blocked key receives zero share.",
        "The output is a weighted sum of value vectors. **Multiple heads** use different projections, giving several mixtures that are typically concatenated and projected. This is a computation over representations, not a direct test of which statement is true.",
      ],
      limit:
        "Q, K, V, and projections are supplied here. We are tracing attention arithmetic, not fitting attention weights from examples or reproducing a complete transformer.",
    },
    walkthrough: {
      heading: "Trace the first causal query, then remove its mask.",
      intro:
        "Use query Q₁=[1,0], key width dₖ=2, and the three keys and values above.",
      steps: [
        {
          title: "Compute unscaled scores",
          calculation: "Q₁·K=[1,0,1]",
          why: "One query compares with every key, producing one row of three scores.",
        },
        {
          title: "Scale and mask",
          calculation: "Scaled row=[1/√2,0,1/√2]; causal row permits only K₁",
          why: "At the first position, keys 2 and 3 are future positions. Their values must not contribute.",
        },
        {
          title: "Normalize the permitted row",
          calculation: "Causal weights=[1,0,0]; output=1[2,0]=[2,0]",
          why: "The only permitted key gets the entire share. A future value change cannot affect this output.",
        },
        {
          title: "Allow all three keys",
          calculation:
            "Unmasked weights≈[0.4011,0.1978,0.4011]; output≈[1.2033,0.7967]",
          why: "Removing the mask changes the denominator and value mixture, even though the query, keys, and original values are unchanged.",
        },
      ],
    },
    prediction: {
      prompt:
        "An attention row has weights [0.25,0.75] and values [2,0] and [0,4]. What output does it produce?",
      options: ["[2,4]", "[0.5,3]", "[0.25,0.75]"],
      correct: 1,
      answer: [
        "The output is **0.25[2,0]+0.75[0,4]=[0.5,3]**. The weights scale whole value vectors, coordinate by coordinate.",
        "Attention weights are not the output coordinates themselves. Their number follows the key count; output width follows the value width.",
      ],
    },
    experimentIntro:
      "Inspect every query row under causal and unmasked attention. Change a future value and check which outputs can change. Compare a 2×3 cross-attention matrix and a second projected head.",
    math: {
      heading: "Keep query, key, value, and vocabulary shapes separate.",
      intro: [
        "With n_q queries, n_k keys, key width dₖ, and value width dᵥ, each operation has a specific shape.",
      ],
      rules: [
        {
          label: "Score matrix",
          formula: "S=QKᵀ/√dₖ; [n_q,dₖ] @ [dₖ,n_k] → [n_q,n_k]",
        },
        {
          label: "Row normalization",
          formula: "Aᵢⱼ=exp(Sᵢⱼ)/Σ_allowed j exp(Sᵢⱼ); blocked cells get zero",
        },
        {
          label: "Value mixture",
          formula: "O=AV; [n_q,n_k] @ [n_k,dᵥ] → [n_q,dᵥ]",
        },
        {
          label: "Causal permission",
          formula: "query i may read key j only when j≤i",
        },
        {
          label: "Our two-head output",
          formula:
            "concat(head₁,head₂) @ W_O; W_O averages matching coordinates",
        },
      ],
      paragraphs: [
        "Our second head swaps the query coordinates with a declared linear projection. For the second causal query, the two head outputs exchange their coordinates; the supplied output projection averages them to [1,1]. Real models normally learn these projections.",
        "The first causal output remains [2,0] even when V₃ becomes [100,100]. Later rows that can read V₃ do change. A mask restricts information flow per row, not by removing the future token from every calculation.",
        "A fully blocked row has no valid softmax denominator and must be handled explicitly. The model helper rejects that input. Display tables round to two decimals; all mixtures use the full computed weights.",
      ],
      limit:
        "Attention weights need not be faithful causal explanations of a model’s answer. They describe one mixing operation among many, and they do not give a probability that a source is correct.",
    },
    transfer: {
      prompt:
        "A cross-attention layer has 5 decoder queries, 20 source keys, and value width 8. What are the attention-weight and output shapes?",
      answer: [
        "The weights have shape **[5,20]**: one distribution over 20 source positions for each decoder query. The output has shape **[5,8]**.",
        "Neither dimension is the vocabulary size. Vocabulary logits require another projection, introduced in the language-modeling lesson.",
      ],
    },
    takeaways: [
      "Attention normalizes one key distribution per query row.",
      "Masks control which values can contribute to each output.",
      "Attention shapes follow queries, keys, and values—not vocabulary labels.",
    ],
    sources: [
      {
        title: "Vaswani et al. · Attention Is All You Need",
        url: "https://arxiv.org/abs/1706.03762",
      },
      {
        title: "Dive into Deep Learning · Attention scoring",
        url: "https://d2l.ai/chapter_attention-mechanisms-and-transformers/attention-scoring-functions.html",
      },
    ],
  },
  {
    slug: "l21",
    sourceId: "L21",
    deck: "Follow actual vectors through a pre-normalized decoder block, including rotary Q/K pairs, residual additions, and a positionwise MLP.",
    objective:
      "Trace block shapes and residual values, explain per-token normalization, and test a controlled example of positional information.",
    prerequisites: ["l15", "l16", "l17", "l18", "l19", "l20"],
    problem: {
      heading: "What surrounds the attention operation inside a transformer?",
      paragraphs: [
        "Our block receives three token vectors: **[1,0,0], [0,1,0], [0,0,1]**. We will follow one token through normalization, causal attention, residual addition, another normalization, and a **3→4→3** MLP.",
        "The output still has three coordinates per token. Internal operations can use other widths, but residual additions need matching shapes. The block has no vocabulary head and does not generate a word by itself.",
        "We use a **pre-normalized** design: normalize before each main pathway. Transformer families differ; this is one fully declared example rather than a universal blueprint.",
      ],
    },
    intuition: {
      heading:
        "Mix across positions, transform within a position, and retain a direct path.",
      paragraphs: [
        "**Attention** mixes information across permitted positions. The **positionwise MLP** applies the same learned transformation separately to each position’s representation. These are different kinds of computation.",
        "A **residual connection** adds a pathway’s input to its output. It offers a direct route for information and gradient flow, while the main pathway learns a change. It does not mean the added vector is automatically small or harmless.",
        "**Normalization** rescales coordinates within each token in our example. **RoPE**, rotary position embedding, rotates query/key coordinate pairs by position-dependent angles before attention scoring. It changes position-sensitive comparisons; it is not an index appended as ordinary text.",
      ],
      limit:
        "The projections are supplied, the attention head is tiny, and only one Q/K pair is rotated. Real blocks have larger widths and many variants. This is not a complete language model or the exact architecture of every named model.",
    },
    walkthrough: {
      heading: "Track dimensions as carefully as values.",
      intro:
        "Begin with the first token x=[1,0,0], where a causal query can read only itself.",
      steps: [
        {
          title: "Normalize before attention",
          calculation:
            "mean(x)=1/3; variance=2/9; LN(x)≈[1.4142,−0.7071,−0.7071]",
          why: "Subtract the per-token mean and divide by √(variance+10⁻⁵). This step does not mix tokens.",
        },
        {
          title: "Compute causal attention",
          calculation: "First-query weights=[1,0,0]; attention output=LN(x)",
          why: "Only its own value is permitted. Later tokens have larger permitted prefixes.",
        },
        {
          title: "Add the first residual",
          calculation: "r=x+attention(x)≈[2.4142,−0.7071,−0.7071]",
          why: "The direct input and attention output have the same width, so coordinate-wise addition is defined.",
        },
        {
          title: "Apply the MLP pathway",
          calculation: "LN(r) @ W₁: 3→4; ReLU; @ W₂: 4→3",
          why: "Expansion permits a different nonlinear feature transformation while returning to the width needed for the next addition.",
        },
        {
          title: "Add the second residual",
          calculation: "output=r+MLP(LN(r))",
          why: "The second pathway modifies the representation after attention. Its output is still a vector, not a chosen vocabulary token.",
        },
      ],
    },
    prediction: {
      prompt:
        "An MLP expands a token vector from width 3 to width 4. Can you directly add that four-value hidden vector to the original three-value residual?",
      options: [
        "Yes; residual additions ignore shape",
        "No; project back to a compatible width first",
        "Yes; discard a coordinate without changing the model",
      ],
      correct: 1,
      answer: [
        "No. **The addition needs compatible shapes.** Our MLP projects the hidden width 4 back to model width 3 before adding the residual.",
        "Silently dropping a coordinate would change the declared computation. Shape contracts are part of the architecture.",
      ],
    },
    experimentIntro:
      "Follow the first or last token through all eight operations. Toggle RoPE, swap the earlier input contents, and disable residual routes. Compare the exact vectors rather than only the block names.",
    math: {
      heading:
        "Position mechanisms and causal masks convey different structure.",
      intro: [
        "Let x denote all token rows. Our attention uses the first two coordinates of LN(x) as Q/K, the full three-coordinate LN(x) as V, and a causal mask.",
      ],
      rules: [
        {
          label: "Pre-normalized attention pathway",
          formula: "r=x+Attention(RoPE(Q),RoPE(K),V; causal mask)",
        },
        { label: "Pre-normalized MLP pathway", formula: "y=r+ReLU(LN(r)W₁)W₂" },
        {
          label: "Our MLP weights",
          formula:
            "W₁=[[1,0,0,1],[0,1,0,−1],[0,0,1,0.5]]; W₂=[[0.5,0,0],[0,0.5,0],[0,0,0.5],[0.25,0.25,0]]",
        },
        {
          label: "One rotary pair",
          formula: "Rθ[a,b]=[a cosθ−b sinθ, a sinθ+b cosθ]; θ=0.7×position",
        },
        { label: "Relative rotary relation", formula: "(Rθq)·(Rφk)=q·R(φ−θ)k" },
      ],
      paragraphs: [
        "In the controlled no-RoPE, one-block, final-position experiment, swapping the first two input contents preserves the preceding content set and the final query. Its attention mixture is unchanged. With RoPE, those contents occupy different rotation angles and the result changes.",
        "This does not imply that a causal transformer without an explicit position transform has no order information at all. The causal mask itself imposes structure, and multiple layers and boundaries can introduce further asymmetries. The claim here is only about the declared controlled computation.",
        "RoPE is a later positional technique, not part of the original transformer paper. Pre-norm and post-norm blocks also differ. When implementing a model, follow its actual configuration, tensor shapes, normalization, and parameter conventions.",
      ],
      limit:
        "This block omits training, multiple attention heads, dropout, a complete tokenizer, and a vocabulary projection. Its vector outputs cannot be interpreted as generated words or calibrated probabilities.",
    },
    transfer: {
      prompt:
        "A diagram labels a box “transformer”. Is that enough to know whether normalization comes before or after each residual pathway, or which positional method is used?",
      answer: [
        "No. **The architecture needs its actual conventions.** Pre-norm, post-norm, positional methods, widths, activations, and projections can differ.",
        "Trace the model’s equations and shapes. A shared family name does not make differently ordered operations interchangeable.",
      ],
    },
    takeaways: [
      "Attention mixes positions; an MLP transforms each position’s features.",
      "Residual additions require compatible vectors and an explicit operation order.",
      "RoPE and masks convey distinct structure within a declared architecture.",
    ],
    sources: [
      {
        title: "Su et al. · Rotary position embeddings",
        url: "https://arxiv.org/abs/2104.09864",
      },
      {
        title: "Vaswani et al. · Transformer architecture",
        url: "https://arxiv.org/abs/1706.03762",
      },
    ],
  },
  {
    slug: "l22",
    sourceId: "L22",
    deck: "Train four BPE merges on a tiny weighted corpus, encode unfamiliar text, and add explicit message-role boundaries.",
    objective:
      "Trace pair counting and merge application, interpret vocabulary-local token IDs, and distinguish message serialization from literal text that resembles a role marker.",
    prerequisites: ["l07", "l18"],
    problem: {
      heading:
        "How does a piece of text become the exact IDs a model receives?",
      paragraphs: [
        "Our corpus contains **low twice, lower twice, and newer once**. Begin with printable ASCII characters and an explicit **<end>** word-boundary symbol. We will learn four recurring adjacent-pair merges.",
        "Then encode the user body **lower**, map its pieces to this vocabulary’s IDs, and wrap it in a tiny declared chat serialization. Each stage has a separate job: split text, identify vocabulary entries, and mark message structure.",
        "This is a synthetic character-based BPE exercise. It does not claim to match a production tokenizer, support every language, or implement byte-level fallback.",
      ],
    },
    intuition: {
      heading: "A token is a vocabulary entry, not necessarily a word.",
      paragraphs: [
        "**BPE**, byte-pair encoding, repeatedly counts adjacent symbol pairs and merges a selected frequent pair. Counts are recomputed after each merge because the current segmentation has changed. Our corpus frequencies weight those counts.",
        "Encoding applies the learned merge rules to a new input. Familiar pieces may combine, while remaining characters keep their base IDs. Token boundaries and IDs depend on the tokenizer’s exact vocabulary, rules, alphabet, normalization, and special-token conventions.",
        "A **chat template** serializes structured message roles and boundaries. The same body under a user role and a system role can produce different input IDs. A model trained for one template need not interpret an arbitrary replacement template in the intended way.",
      ],
      limit:
        "The base alphabet here is printable ASCII only. Unsupported characters are rejected explicitly. Real tokenizers may use bytes, Unicode normalization, unknown tokens, or other fallback policies, which must be identified rather than assumed.",
    },
    walkthrough: {
      heading: "Learn the pieces before adding message roles.",
      intro:
        "Keep corpus counts fixed at low:2, lower:2, newer:1. Ties use a declared code-point lexicographic rule.",
      steps: [
        {
          title: "Count weighted adjacent pairs",
          calculation: "Count(l,o)=4; Count(o,w)=4; Count(e,r)=3",
          why: "The two low and two lower occurrences each contribute to l–o and o–w. Every lower/newer occurrence contributes e–r.",
        },
        {
          title: "Apply the first two merges",
          calculation: "l+o→lo; lo+w→low",
          why: "Replace non-overlapping occurrences, then recount. The second merge operates on the new symbol lo, not the original character pairs.",
        },
        {
          title: "Learn the ending piece",
          calculation: "e+r→er; er+<end>→er<end>",
          why: "Boundary symbols can become part of a learned token. They express a convention of this tokenizer.",
        },
        {
          title: "Encode lower",
          calculation: "lower → [low,er<end>] → IDs [101,103]",
          why: "These IDs are indexes into the declared vocabulary. They have no universal meaning outside it.",
        },
        {
          title: "Serialize the structured message",
          calculation:
            "[<user>, body IDs, <end_turn>, <assistant>] = [96,101,103,99,98]",
          why: "Role and turn markers come from the structured serializer. They are separate from ordinary body characters.",
        },
      ],
    },
    prediction: {
      prompt:
        "Another tokenizer also returns token ID 101. Must it refer to the piece low?",
      options: [
        "Yes; token IDs are universal",
        "No; IDs depend on that vocabulary",
        "Yes; every tokenizer starts with ASCII",
      ],
      correct: 1,
      answer: [
        "No. **IDs are vocabulary-local indexes.** Another vocabulary can assign a different piece to 101 or have no such entry.",
        "Tokenizer identity, special-token rules, and message template are part of a model’s input contract. Sharing a numeric ID does not establish shared meaning.",
      ],
    },
    experimentIntro:
      "Train the merges, then encode lower, lowest, or Lower. Change the corpus and compare learned pieces. Change the structured role or put role-looking text inside the user body, then inspect the actual serialized IDs.",
    math: {
      heading: "Make tokenization and serialization reproducible.",
      intro: [
        "The base IDs 0–94 represent printable ASCII code points 32–126. IDs 95–99 are <end>, <user>, <system>, <assistant>, and <end_turn>. Newly learned pieces are appended in merge order.",
      ],
      rules: [
        {
          label: "Weighted pair count",
          formula:
            "count(a,b)=Σ_words corpus_count(word)×adjacent_occurrences(a,b)",
        },
        {
          label: "Merge selection",
          formula:
            "choose maximum count; tie by code-point lexicographic order of the pair",
        },
        {
          label: "Encoding",
          formula:
            "start with printable characters + <end>; apply learned merges in order",
        },
        {
          label: "Decoding our body",
          formula:
            "join vocabulary pieces; remove only the final <end> boundary",
        },
        {
          label: "Chat serialization",
          formula:
            "trusted role ID + encoded body IDs + turn-end ID + assistant-prompt ID",
        },
      ],
      paragraphs: [
        "For lowest, the s and t characters remain available as base entries even though they were absent from the training words. For Lower, uppercase L is distinct from lowercase l. Those behaviors follow our declared alphabet and case-sensitive rules.",
        "Literal <system> inside the body is encoded as printable characters in this serializer. It is not converted into a trusted system-role ID. That demonstrates a boundary contract; it does not prove that a language model will resist every instruction embedded in user content.",
        "Word counts are not reliable token counts across models or languages. Before estimating context length or cost, use the actual tokenizer and template that the model expects.",
      ],
      limit:
        "The example is not a universal chat standard. Production templates can include additional turn, tool, multimodal, and generation markers, and their handling of special-looking content must be checked against the actual implementation.",
    },
    transfer: {
      prompt:
        "You keep a model’s weights but replace its tokenizer vocabulary and chat markers with unrelated ones. Is preserving the visible text enough to preserve model behavior?",
      answer: [
        "No. **The model receives IDs and learned boundary conventions**, not just the visible rendering. Changing those contracts changes the input the weights are applied to.",
        "Use a compatible tokenizer and template, or an intentionally trained adaptation. Verify the full serialized input rather than relying on the text looking similar.",
      ],
    },
    takeaways: [
      "BPE learns recurring pieces through weighted pair counts and ordered merges.",
      "Token IDs only make sense within an identified vocabulary.",
      "Structured message roles and ordinary body text need an explicit serialization contract.",
    ],
    sources: [
      {
        title: "Hugging Face · BPE tokenization",
        url: "https://huggingface.co/learn/llm-course/chapter6/5",
      },
      {
        title: "Hugging Face · Chat templates",
        url: "https://huggingface.co/docs/transformers/chat_templating",
      },
    ],
  },
  {
    slug: "l23",
    sourceId: "L23",
    deck: "Use a six-token toy decoder to separate sequential generation from parallel scoring of known causal training targets.",
    objective:
      "Factor an autoregressive sequence probability, distinguish logits from probabilities, and trace token selection, stopping, and teacher-forced training.",
    prerequisites: ["l06", "l20", "l21", "l22"],
    problem: {
      heading: "How does one next-token distribution become a sequence?",
      paragraphs: [
        "Our entire vocabulary is **<bos>, I, like, tea, coffee, <eos>**. A supplied toy decoder maps the last context token to six logits, then softmax produces a next-token distribution.",
        "Starting from <bos>, greedy selection produces **I**, then **like**, then **tea**, then <eos>. Each selected token becomes context for the following operation. The decoder does not choose the entire sentence in one selection.",
        "This tiny model uses only the most recent token. It is intentionally more limited than a transformer that can contextualize a much longer prefix. The experiment traces generation and scoring, not a trained language model’s quality.",
      ],
    },
    intuition: {
      heading: "A generated token is needed before its next context can exist.",
      paragraphs: [
        "An **autoregressive** model factors a sequence into next-token conditional probabilities. **Logits** are unrestricted vocabulary scores; **softmax** normalizes them into a distribution. A selection rule then chooses one token, which is appended to the prefix.",
        "During **teacher-forced training**, the sequence is already known. Each position has a next-token target, and a causal information boundary prevents that prediction from reading its own future. Many position-wise losses can be computed together.",
        "Generation has a different dependency: the chosen next token is not known until selection occurs. The next iteration must use the actual chosen prefix, even if an alternative token had high probability.",
      ],
      limit:
        "Our decoder represents the last token as a one-hot vector and uses a supplied 6×6 logit table as its vocabulary projection. It does not implement transformer contextualization or fit its parameters during playback.",
    },
    walkthrough: {
      heading: "Trace the greedy continuation and its probability.",
      intro:
        "Use the supplied logit table and stable softmax. All numbers below describe this toy model.",
      steps: [
        {
          title: "Project context to vocabulary scores",
          calculation: "one_hot(<bos>) @ W_vocab → six logits",
          why: "The projection has one output score per vocabulary token. Its width differs from an attention row’s key count.",
        },
        {
          title: "Select the first token",
          calculation: "P(I|<bos>)≈0.9307; greedy selection chooses I",
          why: "The largest-probability token is one declared selection rule. Sampling can choose a different token from the same distribution.",
        },
        {
          title: "Append and repeat",
          calculation: "P(like|I)≈0.8918; P(tea|like)≈0.6533",
          why: "After appending each token, its context determines the next distribution in our last-token model.",
        },
        {
          title: "Stop and multiply conditionals",
          calculation:
            "P(I,like,tea,<eos>|<bos>)≈0.9307×0.8918×0.6533×0.9553≈0.5180",
          why: "The product scores the selected continuation under the model. It is not a probability that the sentence is true.",
        },
        {
          title: "Score known training targets",
          calculation: "mean loss=−mean(ln p_correct)≈0.1644",
          why: "Known targets can be scored at all causal positions together. This uses the true prefix during scoring, without running a generation loop to discover it.",
        },
      ],
    },
    prediction: {
      prompt:
        "Generation selects tokens sequentially. Does that mean causal training must also wait to discover each target token before scoring the next training position?",
      options: [
        "Yes; training and generation have identical dependencies",
        "No; the training sequence is known, but predictions must still respect the causal boundary",
        "No; training may freely read future targets as inputs",
      ],
      correct: 1,
      answer: [
        "No. **The training sequence is known**, so causal input–target pairs can be prepared and scored together. The prediction at position i still must not read its future target as context.",
        "Generation cannot use that shortcut because its future chosen tokens do not exist yet. Sequential generation and parallel target scoring are compatible.",
      ],
    },
    experimentIntro:
      "Generate greedily, use supplied sampling draws, change the prompt, or create a repeating preference with a token budget. Then score known tea/coffee training sequences and check that a changed later target leaves earlier predictions unchanged.",
    math: {
      heading: "Separate sequence likelihood, token selection, and training.",
      intro: [
        "For a fixed prompt, multiply only the probabilities of newly selected tokens when scoring its generated continuation. The prompt itself is treated as given in that conditional quantity.",
      ],
      rules: [
        {
          label: "Autoregressive factorization",
          formula: "P(t₁,…,tₙ)=∏ᵢP(tᵢ|t_<i)",
        },
        {
          label: "Vocabulary projection",
          formula:
            "context representation h @ W_vocab → one logit per vocabulary entry",
        },
        {
          label: "Stable token probabilities",
          formula: "pⱼ=exp(zⱼ−max(z))/Σₖexp(zₖ−max(z))",
        },
        {
          label: "Teacher-forced objective",
          formula: "L=−(1/N)Σᵢln P(correct next tokenᵢ | permitted prefixᵢ)",
        },
        {
          label: "Stopping rule",
          formula: "stop at <eos> or at the declared maximum-new-token budget",
        },
      ],
      paragraphs: [
        "The known sequence <bos> I like tea <eos> has four target losses, approximately 0.0718, 0.1145, 0.4258, and 0.0457. Their mean is about 0.1644. The experiment computes these values but does not run a backward or optimizer step.",
        "Changing tea to coffee changes the target scored after like. Earlier contexts and their predictions remain identical. In a transformer, the causal mask provides the analogous information restriction while allowing position-wise computation to be batched.",
        "Selecting the locally most likely token at each step does not guarantee the globally most likely full sequence. A finite token budget also matters when a model repeatedly prefers another continuation over its end token.",
      ],
      limit:
        "A next-token probability is a model distribution, not a truth, safety, or usefulness guarantee. The toy model’s first-order context restriction is a teaching simplification, not a limit of autoregressive modeling in general.",
    },
    transfer: {
      prompt:
        "You compare likelihoods of two continuations that begin from the same fixed prompt. Should you silently include a different prompt-likelihood factor for each one?",
      answer: [
        "No. Compare the declared **conditional continuation probabilities given the same prompt**. Multiplying in inconsistent prompt factors changes the quantity being compared.",
        "Also specify tokenization, stopping, and length conventions. Different questions—joint sequence probability, conditional probability, or average token loss—need different accounting.",
      ],
    },
    takeaways: [
      "Generation repeatedly projects, selects, appends, and checks a stopping rule.",
      "Causal training can score many known next-token targets together.",
      "Sequence likelihood is a product of model conditionals, not a truth score.",
    ],
    sources: [
      {
        title: "Hugging Face · Causal language modeling",
        url: "https://huggingface.co/docs/transformers/tasks/language_modeling",
      },
      {
        title: "Vaswani et al. · Causal decoder masking",
        url: "https://arxiv.org/abs/1706.03762",
      },
    ],
  },
  {
    slug: "l24",
    sourceId: "L24",
    deck: "Keep the sentence fixed while changing which information each position may read, then separate source encoding from output decoding.",
    objective:
      "Distinguish encoder-only, decoder-only, and encoder-decoder patterns through their masks, objectives, and source/target information flow.",
    prerequisites: ["l20", "l21", "l22", "l23"],
    problem: {
      heading: "What is a prediction allowed to read?",
      paragraphs: [
        "Use the three-token sentence **red book arrived**. A masked-token encoder receives **red <mask> arrived** and may use both sides to build the middle representation. Its original target book is withheld from the input.",
        "A causal decoder instead builds each representation from that position and earlier positions. An encoder-decoder can read a complete known source, then generate an output whose own future remains unavailable.",
        "These patterns support different training objectives and information paths. Their names do not by themselves determine every task a model can perform.",
      ],
    },
    intuition: {
      heading: "The source is already known; a future generated token is not.",
      paragraphs: [
        "An **encoder-only** pattern often uses bidirectional self-attention to build contextual input representations. A masked-language-model objective hides selected input content and trains a head to predict it. The representation and the trained output prediction are separate computations.",
        "A **decoder-only** causal pattern prevents later positions from influencing earlier predictions. It is naturally used for continuation, but it can also support classification, scoring, or other tasks with suitable training and interfaces.",
        "An **encoder-decoder** first builds source representations. Decoder self-attention remains causal over its output prefix, while **cross-attention** can read the known source memory. Hiding future output tokens does not require hiding later positions of an already supplied source.",
      ],
      limit:
        "The experiment computes tiny attention representations from supplied vectors. It does not have a trained vocabulary head, translate the sentence, or pretend that permission to read context determines a correct answer.",
    },
    walkthrough: {
      heading: "Trace three distinct information-access contracts.",
      intro: "Supply red=[1,0], book=[0,1], arrived=[1,1], and <mask>=[0,0].",
      steps: [
        {
          title: "Hide the encoder target",
          calculation:
            "Encoder input=[red,<mask>,arrived]; original target=book",
          why: "The target is used for later scoring, not placed back into the attention inputs.",
        },
        {
          title: "Allow bidirectional context",
          calculation:
            "Middle query may read input positions 1,2,3, including the mask placeholder",
          why: "Both left and right context can contribute. Seeing a placeholder is different from seeing the withheld word.",
        },
        {
          title: "Apply a causal decoder mask",
          calculation: "Allowed rows: [1,0,0], [1,1,0], [1,1,1]",
          why: "Each query sees its prefix and itself, while later positions receive no share.",
        },
        {
          title: "Separate source and output axes",
          calculation:
            "3 source tokens → 3 memory vectors; 2 decoder-prefix queries → 2×3 cross-attention weights",
          why: "Cross-attention has output-query-by-source-key shape. Its known source memory has a different availability boundary from future decoder outputs.",
        },
      ],
    },
    prediction: {
      prompt:
        "In an encoder-decoder system, the source sentence is fully supplied. Must a decoder query hide later source positions merely because its own output prefix is causal?",
      options: [
        "Yes; every attention mask must be triangular",
        "No; causal output masking and access to known source memory are different contracts",
        "No; it may also read future output targets",
      ],
      correct: 1,
      answer: [
        "No. **The source is known input.** Cross-attention can read its full encoded memory while decoder self-attention still hides future output tokens.",
        "Check which axes a mask describes. A source-key column is not the same object as a future decoder-output position.",
      ],
    },
    experimentIntro:
      "Switch between a masked-token encoder, a causal decoder, and an encoder-decoder. Inspect input placeholders, allowed cells, source-memory creation, decoder self-attention, and cross-attention outputs.",
    math: {
      heading:
        "A mask specifies access; an objective specifies what is learned.",
      intro: [
        "The same attention arithmetic can use different permitted-key sets. Architecture, input construction, training targets, and output heads together determine the model’s behavior.",
      ],
      rules: [
        {
          label: "Bidirectional input encoding",
          formula:
            "input query i may read all permitted input keys, including right context",
        },
        {
          label: "Masked-language objective",
          formula:
            "withhold selected token content; score its target using a trained prediction head",
        },
        {
          label: "Causal output decoding",
          formula: "decoder query i may read output-prefix key j only when j≤i",
        },
        {
          label: "Encoder-decoder cross-attention",
          formula:
            "Q from decoder; K,V from known encoded source; shape=[output queries,source keys]",
        },
        {
          label: "Representation versus prediction",
          formula:
            "context vector → task-specific output head → scores or predictions",
        },
      ],
      paragraphs: [
        "For the zero mask query, the toy encoder scores all supplied keys equally and mixes their value vectors. That yields a representation; no word is selected by the experiment. A trained masked-language head would be an additional model component.",
        "Historical examples include BERT-style bidirectional masked-language encoders and T5-style encoder-decoder training. They illustrate architectural families rather than mandatory components of every NLP application.",
        "A decoder-only model can classify through a suitable output convention or learned head. An encoder can produce useful embeddings or class scores without being a generative chatbot. Decide by actual masks, objectives, heads, and training rather than by a product label.",
      ],
      limit:
        "Real architectures can use other masks, positional methods, multimodal inputs, and training losses. The three patterns here are useful foundations, not an exhaustive catalog of all possible systems.",
    },
    transfer: {
      prompt:
        "A colleague says “this is an encoder, so its middle representation must already be the correct missing word.” Which step is missing from that claim?",
      answer: [
        "The claim omits a **trained output head and objective** connecting the representation to vocabulary predictions. Attention access alone does not supply a correct label.",
        "Inspect the input masking, target construction, output mapping, and evaluation. A vector with access to useful context is not the same as a validated prediction.",
      ],
    },
    takeaways: [
      "Bidirectional and causal masks permit different information paths.",
      "Known source memory and future output tokens have different availability.",
      "Representations, training objectives, and output heads must be distinguished.",
    ],
    sources: [
      {
        title: "Devlin et al. · BERT",
        url: "https://arxiv.org/abs/1810.04805",
      },
      { title: "Raffel et al. · T5", url: "https://arxiv.org/abs/1910.10683" },
    ],
  },
];
