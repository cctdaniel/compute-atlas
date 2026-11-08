import type { LessonContent } from "../types";

export const fullFoundationLessons: LessonContent[] = [
  {
    slug: "l01",
    sourceId: "L01",
    deck: "Compare a calculator, a searcher, a learned classifier, and a generator. The categories overlap for specific reasons.",
    objective:
      "Distinguish a system’s task, whether it learns from data, and whether it uses a deep neural architecture.",
    prerequisites: [],
    problem: {
      heading: "Is every automated decision an AI model?",
      paragraphs: [
        "A checkout calculates **2 apples at $2 plus a $3 loaf: $7**. A spam model scores an email. A chess program searches possible moves. A language model samples a continuation. All are software, but they do not obtain their behavior in the same way.",
        "The useful questions are: **What task does it perform? Where did its rule come from? What architecture implements it? What kind of output does it produce?** A single system can have more than one label.",
      ],
    },
    intuition: {
      heading: "Use overlapping descriptions, not competing boxes.",
      paragraphs: [
        "**Artificial intelligence** includes techniques for perception, prediction, reasoning, search, planning, and action. It is a broad field with boundaries that depend on context. It includes methods that do not learn from examples.",
        "**Machine learning** fits useful behavior from data. **Deep learning** uses neural networks with multiple learned layers. Deep describes an architecture; it does not tell us whether the task generates content.",
        "**Generative AI** models or produces possible content such as a continuation, image, or audio sample. A neural fraud classifier can be deep learning while returning only a score. A larger product can combine arithmetic, search, learned prediction, and generation.",
      ],
      limit:
        "These categories describe supplied system designs. A familiar-looking output does not reveal how the system was built. The calculator is deliberately a plain arithmetic baseline, not a universal test for what counts as intelligence.",
    },
    walkthrough: {
      heading: "Classify the mechanism from evidence.",
      intro:
        "Compare four small operations. The player adds a fifth case: a multilayer classifier.",
      steps: [
        {
          title: "Start with a fixed rule",
          calculation: "2 × 2 + 1 × 3 = 7",
          why: "The price formula is supplied explicitly. There is no dataset fitting step, so this calculation does not require ML.",
        },
        {
          title: "Search without training",
          calculation: "Move A: min(3, 5) = 3; move B: min(1, 9) = 1; choose A",
          why: "In this two-level minimax tree, the opponent chooses the worse leaf for us. Searching the declared game tree is an AI technique even without learned parameters.",
        },
        {
          title: "Apply a learned predictor",
          calculation: "z = 2 × flagged-word count − 3; sigmoid(1) ≈ 0.731",
          why: "The weights are declared to have been fitted previously. Using them is inference; this demonstration does not train them or establish real spam accuracy.",
        },
        {
          title: "Sample from a distribution",
          calculation:
            "P(red) = 0.6; P(blue) = 0.4; draw 0.7 falls in blue’s interval",
          why: "A neural generator supplies these probabilities, then a sampler selects a continuation. The supplied draw makes this tiny example reproducible.",
        },
      ],
    },
    prediction: {
      prompt:
        "A fraud detector uses several learned neural layers and returns a fraud probability. Must it be generative?",
      options: [
        "Yes, because it is deep",
        "No; its task can be classification",
        "No, so it cannot be machine learning",
      ],
      correct: 1,
      answer: [
        "Its task can be **classification**. Learned layers make it neural ML, while its output task need not generate new content.",
        "Architecture and task are separate descriptions. A product may use this classifier alongside a different generative component.",
      ],
    },
    experimentIntro:
      "Compare each supplied system. Step through the evidence for AI, ML, deep learning, and generation instead of guessing from a product name.",
    math: {
      heading: "The implementation determines the label.",
      intro: [
        "A fixed function, a fitted function, and a sampler can all appear inside the same application. The distinction is where the rule comes from and how it is used.",
      ],
      rules: [
        {
          label: "Fixed computation",
          formula: "output = supplied_rule(input)",
        },
        {
          label: "Training and inference",
          formula: "θ = fit(data); prediction = fθ(input)",
        },
        {
          label: "Multilayer computation",
          formula:
            "h₁ = activation(W₁x+b₁); h₂ = activation(W₂h₁+b₂); output = f(W₃h₂+b₃)",
        },
        {
          label: "Generative sampling",
          formula: "output ~ pθ(possible content | context)",
        },
      ],
      paragraphs: [
        "A model’s parameters are often written θ. A model may use an explicit probability distribution without a neural network, and search can use a learned scoring function. The terms are not mutually exclusive.",
        "Changing an input during inference does not establish that learning occurred. Some systems update online, but that is an additional training mechanism that must actually be present.",
      ],
      limit:
        "The examples teach distinctions, not a test of human-level intelligence. The sampler uses supplied probabilities, and the neural architectures are declared teaching systems rather than production models.",
    },
    transfer: {
      prompt:
        "A shopping assistant asks a language model to explain a total, but a fixed calculator computes the price. Which component should determine the arithmetic?",
      answer: [
        "The **calculator** implements the declared pricing rule and should determine the total. A generator can explain or format that result without replacing the computation.",
        "Describe the complete system as a combination of components. Calling the whole product ‘AI’ does not mean every operation inside it is learned or generated.",
      ],
    },
    takeaways: [
      "Ask about task, learning procedure, and architecture separately.",
      "AI includes search and planning as well as learned models.",
      "A deep neural classifier need not be generative.",
    ],
    sources: [
      {
        title: "Google · What is machine learning?",
        url: "https://developers.google.com/machine-learning/intro-to-ml/what-is-ml",
      },
      {
        title: "Stanford CS221 · AI principles and techniques",
        url: "https://stanford-cs221.github.io/autumn2025/",
      },
    ],
  },
  {
    slug: "l02",
    sourceId: "L02",
    deck: "Follow one learned number from a training receipt into a frozen checkpoint and a new prediction.",
    objective:
      "Separate fitting, choosing, final evaluation, and inference; explain what a checkpoint preserves.",
    prerequisites: ["l01"],
    problem: {
      heading: "When does a model’s behavior actually change?",
      paragraphs: [
        "A receipt says **2 items cost $4**. Our architecture is the rule **total = w × quantity**, with one adjustable parameter `w`. It starts at 1.",
        "Training changes that parameter using known answers. Later, inference reads the saved parameter to handle a new quantity. A model can receive a new input without changing its weights.",
        "We’ll use one training receipt, one validation receipt, and one test receipt from a perfectly linear, invented price system. This small lifecycle exposes the roles; it is much too small to estimate real performance.",
      ],
    },
    intuition: {
      heading: "Keep learning and using distinct.",
      paragraphs: [
        "A **parameter** is a learned value. A **hyperparameter** configures the procedure: our learning rate is 0.1. The **architecture** says which operations exist. A **checkpoint** saves the learned state needed to resume or use the model.",
        "A **loss** measures a prediction penalty. The training **objective** is what the procedure optimizes, possibly combining losses and regularization. Validation guides choices; test evaluates the locked choice; inference uses it.",
        "In a real product, deployment also includes preprocessing, input contracts, access controls, monitoring, and recovery. Monitoring may justify a later training cycle; it does not mean every inference automatically retrains the model.",
      ],
      limit:
        "This deterministic example fixes the architecture and learning rate. We show validation’s role without searching hyperparameters, and deployment is represented by a frozen model state rather than a live service.",
    },
    walkthrough: {
      heading: "Train twice, then freeze.",
      intro:
        "Use half-squared loss L = ½(wx − y)², a fixed bias of zero, and learning rate 0.1.",
      steps: [
        {
          title: "Make the first training update",
          calculation:
            "gradient = (1 × 2 − 4) × 2 = −4; w′ = 1 − 0.1(−4) = 1.4",
          why: "Only the training receipt supplies this parameter update.",
        },
        {
          title: "Update once more",
          calculation: "gradient = (1.4 × 2 − 4) × 2 = −2.4; w′ = 1.64",
          why: "Repeated updates use the new parameter. The configured learning rate remains 0.1.",
        },
        {
          title: "Validate and lock",
          calculation:
            "Validation x = 1: prediction = 1.64; target = 2; save w = 1.64",
          why: "A validation result can inform choices, but evaluating it does not itself change the parameter. Freeze choices before using the final test.",
        },
        {
          title: "Test, then infer",
          calculation:
            "Test x = 3: 1.64 × 3 = 4.92; new input x = 5: 1.64 × 5 = 8.2",
          why: "Both calls read the same checkpoint. The test has a known answer; a new deployment input may not have one yet.",
        },
      ],
    },
    prediction: {
      prompt:
        "A frozen model receives a new quantity of 5 instead of 3. Does that input change alone update w?",
      options: [
        "Yes, every new input trains it",
        "No, inference reads the same saved parameter",
        "Only if the input is longer",
      ],
      correct: 1,
      answer: [
        "**No.** The prediction changes because the input changes, while `w` remains 1.64.",
        "A separate update procedure could train on new labeled data. Context, external memory, and model parameters are different stores of information.",
      ],
    },
    experimentIntro:
      "Trace training, validation, checkpointing, test, and inference. Change only the inference quantity, then separately change the training target.",
    math: {
      heading: "Name every state in the lifecycle.",
      intro: [
        "Let θ be the parameters, h the hyperparameters, and D the data. A saved artifact may need preprocessing and metadata as well as weights.",
      ],
      rules: [
        { label: "Fit", formula: "θ = train(D_train, h)" },
        {
          label: "Choose",
          formula: "h* = choose(candidate validation results)",
        },
        {
          label: "Final evaluation",
          formula: "test result = evaluate(locked model, D_test)",
        },
        {
          label: "Inference",
          formula: "prediction = fθ(new input); θ is unchanged by this call",
        },
      ],
      paragraphs: [
        "A checkpoint records a model state. Exact training resumption can additionally require optimizer state, random-number state, training position, and a compatible data pipeline.",
        "Repeatedly tuning to a test result lets test information influence the choice. That turns the final check into another selection loop and can make its score optimistic.",
      ],
      limit:
        "A good test result does not prove a service is useful, secure, or reliable. Labels may arrive late after deployment, and distribution changes require fresh evidence.",
    },
    transfer: {
      prompt:
        "You save the formula total = w × quantity but forget the learned value of w. Can you reproduce the trained model’s predictions?",
      answer: [
        "No. The architecture tells you what to compute but does not supply the learned state. You also need the saved parameter, here **w = 1.64**.",
        "For a larger system, preserve compatible preprocessing and input conventions too. The same weights applied to differently represented inputs can produce different behavior.",
      ],
    },
    takeaways: [
      "Training changes parameters; inference uses them.",
      "Architecture, hyperparameters, and checkpoint state describe different parts of a model.",
      "Validation, final test, and deployed monitoring serve distinct decisions.",
    ],
    sources: [
      {
        title: "Google · Managing ML projects",
        url: "https://developers.google.com/machine-learning/managing-ml-projects",
      },
      {
        title: "scikit-learn · Leakage and evaluation practices",
        url: "https://scikit-learn.org/stable/common_pitfalls.html",
      },
    ],
  },
  {
    slug: "l03",
    sourceId: "L03",
    deck: "Inspect a batch–token–feature tensor, then check which matrix dimensions are allowed to meet.",
    objective:
      "Count tensor values, locate one indexed scalar, and calculate a compatible matrix product without losing axis meanings.",
    prerequisites: ["l02"],
    problem: {
      heading: "Does a three-axis tensor contain three numbers?",
      paragraphs: [
        "Suppose a batch contains **4 sequences**, each with **6 token positions**, each position represented by **8 features**. Its shape is **[4, 6, 8]**. It contains 4 × 6 × 8 = **192 numbers**.",
        "A **scalar** is one number; a **vector** is an ordered one-axis array; a **matrix** has two axes. A **tensor** extends this array notation to more axes. An array’s shape states the size of each axis.",
        "The word ‘dimension’ is ambiguous. Here, the tensor has **rank 3**, while each token vector has **width 8**. Always say which quantity you mean.",
      ],
    },
    intuition: {
      heading: "Give every axis a name.",
      paragraphs: [
        "Think of an address with three coordinates: sequence number, token position, feature position. Using zero-based indices, [2, 4, 6] selects one scalar inside the batch.",
        "For matrix multiplication, the left row and right column need matching lengths. A [2,3] matrix multiplied by [3,4] produces a [2,4] matrix. Each output is one row–column dot product.",
        "Matching sizes is necessary, but matching meanings matters too. Swapping feature order can silently change a model even when the shapes still fit.",
      ],
      limit:
        "The player uses a declared row-major layout filled with index offsets. Real arrays may use strides, views, padding, sparse formats, or another memory order. Tensor shape alone does not specify physical layout.",
    },
    walkthrough: {
      heading: "From an address to a matrix output.",
      intro:
        "Keep the tensor’s axis meanings separate from the matrix example’s row and column meanings.",
      steps: [
        {
          title: "Count all coordinates",
          calculation: "4 × 6 = 24 token slots; 24 × 8 = 192 scalar values",
          why: "Counting axes and counting values answer different questions.",
        },
        {
          title: "Locate [2,4,6]",
          calculation: "offset = (2 × 6 + 4) × 8 + 6 = 134",
          why: "In this row-major fixture, the last coordinate varies fastest. Filling with offsets makes the selected value easy to verify.",
        },
        {
          title: "Check a product",
          calculation: "[2,3] @ [3,4] → [2,4]",
          why: "The inner sizes 3 and 3 match. The remaining row and column sizes determine eight output cells.",
        },
        {
          title: "Calculate its first cell",
          calculation: "[1,2,3] · [1,0,1] = 1 + 0 + 3 = 4",
          why: "The first left row meets the first right column. Repeat the dot product for each output coordinate.",
        },
      ],
    },
    prediction: {
      prompt:
        "Can a [2,3] matrix multiply a [2,4] matrix using ordinary matrix multiplication?",
      options: [
        "Yes; both have two rows",
        "No; the inner sizes 3 and 2 differ",
        "Yes; drop the extra coordinate",
      ],
      correct: 1,
      answer: [
        "The inner sizes **3 and 2 differ**, so this product is undefined.",
        "A reshape or transpose changes the operation and may change meaning. Never discard a coordinate just to make a shape check pass.",
      ],
    },
    experimentIntro:
      "Count the tensor, inspect a scalar, and trace the matrix product. Reduce feature width, then try an incompatible matrix pair.",
    math: {
      heading: "Shape rules are contracts.",
      intro: [
        "For shape [B,T,F], B is batch size, T token count, and F feature width. Indices b, t, and f are zero-based and must stay inside their axes.",
      ],
      rules: [
        { label: "Scalar count", formula: "values = B × T × F" },
        {
          label: "Our contiguous row-major fixture",
          formula: "offset(b,t,f) = (bT + t)F + f",
        },
        {
          label: "Matrix product",
          formula: "Cᵢⱼ = Σₖ AᵢₖBₖⱼ; [m,n] @ [n,p] → [m,p]",
        },
        {
          label: "Full example output",
          formula:
            "[[1,2,3],[4,5,6]] @ [[1,0,2,1],[0,1,1,2],[1,1,0,1]] = [[4,5,4,8],[10,11,13,20]]",
        },
      ],
      paragraphs: [
        "A transpose swaps axes; a reshape reorganizes an array subject to its element count and layout rules. Neither operation automatically preserves the semantic meaning of an axis.",
        "Batched multiplication and broadcasting add more shape conventions. They must be defined by the operation and library rather than inferred from this two-matrix example.",
      ],
      limit:
        "Coordinates of an embedding are not automatically named human concepts. This fixture assigns clear axis roles for teaching; learned representations can use distributed features.",
    },
    transfer: {
      prompt:
        "Change [4,6,8] to [4,6,4]. What changes, and what stays the same?",
      answer: [
        "The tensor still has **3 axes**, but now contains **96 values**. Each token has four features instead of eight.",
        "An old index with feature coordinate 6 is now invalid. A matching model layer must also expect the new feature width.",
      ],
    },
    takeaways: [
      "Rank counts axes; shape gives their sizes; their product counts values.",
      "Axis names and feature order are part of the data contract.",
      "Matrix multiplication needs matching inner sizes and produces the outer shape.",
    ],
    sources: [
      {
        title: "Dive into Deep Learning · Data manipulation",
        url: "https://d2l.ai/chapter_preliminaries/ndarray.html",
      },
      {
        title: "Stanford CS229 · Matrix products",
        url: "https://cs229.stanford.edu/section/cs229-linalg.pdf",
      },
    ],
  },
  {
    slug: "l04",
    sourceId: "L04",
    deck: "Compare function height, a finite-difference estimate, and an exact local slope on the same curve.",
    objective:
      "Distinguish loss from its derivative, apply the chain rule, and extend one sensitivity to a gradient vector.",
    prerequisites: ["l03"],
    problem: {
      heading: "How can a local slope tell us which way to move?",
      paragraphs: [
        "Use the function **L(w) = (w − 3)²**. At w = 0 its value is 9. Moving right a little reduces the value; moving left increases it.",
        "The **derivative** measures the local rate of change. It is **−6** at w = 0. The loss 9 and the derivative −6 describe different properties: a height and a sensitivity.",
        "We’ll estimate the slope from nearby values, compare it with the exact derivative, and then trace the same derivative through two composed functions.",
      ],
    },
    intuition: {
      heading: "Divide the change in output by the change in input.",
      paragraphs: [
        "A finite difference uses two nearby function values. Move w from 0 to 0.1: loss changes from 9 to 8.41. The average slope across that interval is (8.41 − 9) / 0.1 = **−5.9**.",
        "The exact derivative describes an infinitesimal change at a point. For this quadratic, it is **2(w − 3)**. A finite interval and a local tangent need not give identical slopes.",
        "The **chain rule** follows how changes travel through composed operations. Let u = w − 3, then L = u². Multiply dL/du by du/dw to get dL/dw.",
      ],
      limit:
        "A derivative is local evidence. It does not guarantee that a large step improves the objective, and a zero derivative need not identify a minimum for a general function.",
    },
    walkthrough: {
      heading: "Estimate, differentiate, then update.",
      intro: "Start at w = 0 and use ε = 0.1 for the numerical comparison.",
      steps: [
        {
          title: "Calculate a forward difference",
          calculation: "[(0.1 − 3)² − (0 − 3)²] / 0.1 = −5.9",
          why: "The estimate averages change between w and w + ε.",
        },
        {
          title: "Compare both sides",
          calculation: "[(0.1 − 3)² − (−0.1 − 3)²] / 0.2 = −6",
          why: "The central difference equals the exact slope for this quadratic. That special equality is not a general numerical guarantee.",
        },
        {
          title: "Apply the chain rule",
          calculation: "u = −3; dL/du = 2u = −6; du/dw = 1; dL/dw = −6 × 1",
          why: "Each local operation contributes its sensitivity to the composed function.",
        },
        {
          title: "Take a small opposite step",
          calculation: "w′ = 0 − 0.1 × (−6) = 0.6; L(0.6) = 5.76",
          why: "Subtracting a negative gradient moves right and lowers this loss from 9 to 5.76.",
        },
      ],
    },
    prediction: {
      prompt:
        "At w = 3, the quadratic reaches its minimum. What is its derivative there?",
      options: ["0", "3", "9"],
      correct: 0,
      answer: [
        "**2(3 − 3) = 0**. The tangent is flat at this minimum.",
        "A general stationary point can also be a maximum or saddle. This conclusion about the minimum uses the particular bowl-shaped function.",
      ],
    },
    experimentIntro:
      "Change the current point or finite-difference interval. Inspect which slope estimates change and which exact derivative rule stays the same.",
    math: {
      heading: "Collect sensitivities into a gradient.",
      intro: [
        "A partial derivative varies one input while holding the others fixed. A gradient collects these partial derivatives in the same coordinate order as the parameter vector.",
      ],
      rules: [
        {
          label: "Derivative",
          formula: "L′(w) = lim(ε→0) [L(w+ε) − L(w)] / ε",
        },
        { label: "Chain rule", formula: "dL/dw = (dL/du)(du/dw)" },
        {
          label: "Two-parameter example",
          formula: "J(a,b) = (a−3)² + 4b²; ∇J = [2(a−3), 8b]",
        },
        {
          label: "One vector update",
          formula: "At [a,b]=[0,1]: ∇J=[−6,8]; [a,b]′=[0.6,0.2]; J: 13 → 5.92",
        },
      ],
      paragraphs: [
        "The two-coordinate update uses the old gradient for both coordinates. Its calculation is 0.6 = 0 − 0.1(−6) and 0.2 = 1 − 0.1(8). The new loss is 2.4² + 4(0.2²) = 5.92.",
        "Very tiny finite differences can suffer cancellation and rounding. Very large intervals stop being local. Automatic differentiation instead applies derivative rules to the recorded computation.",
      ],
      limit:
        "The player plots one parameter to keep the geometry visible. High-dimensional objectives can have curvature and stationary points that do not resemble this single quadratic.",
    },
    transfer: {
      prompt:
        "For J(a,b), one partial derivative is negative and the other is positive. Should gradient descent move both coordinates in the same direction?",
      answer: [
        "No. Subtracting [−6,8] raises a and lowers b. A gradient’s coordinate order matters just like an input vector’s order.",
        "The directions are local. Step size and curvature still determine whether the combined move improves the objective.",
      ],
    },
    takeaways: [
      "Function value and derivative measure height and local sensitivity.",
      "The chain rule multiplies sensitivities through composed operations.",
      "A gradient contains one partial derivative per parameter coordinate.",
    ],
    sources: [
      {
        title: "Dive into Deep Learning · Calculus",
        url: "https://d2l.ai/chapter_preliminaries/calculus.html",
      },
    ],
  },
  {
    slug: "l05",
    sourceId: "L05",
    deck: "Count true flags and false alarms in a population of 10,000 invented accounts.",
    objective:
      "Use Bayes’ rule and population counts to distinguish a detector’s sensitivity from the probability that a flagged case is truly positive.",
    prerequisites: ["l03"],
    problem: {
      heading: "Why isn’t a 90% detection rate a 90% trustworthy flag?",
      paragraphs: [
        "Imagine **10,000 synthetic accounts**, of which **1% are compromised**. A detector flags **90% of compromised accounts**, but also flags **5% of ordinary accounts**.",
        "If an account is flagged, what is the probability it is compromised? We need to count both kinds of flags. The two groups have very different sizes.",
        "These are invented numbers for a probability exercise. They do not describe a real security product or justify action on a real account.",
      ],
    },
    intuition: {
      heading: "Conditioning changes the comparison group.",
      paragraphs: [
        "The **prior** probability of compromise is 100/10,000 = 1%. After a flag, we compare only flagged accounts. That conditional probability is the **posterior** after this evidence.",
        "There are 100 compromised accounts, producing 90 true flags. The 9,900 ordinary accounts produce 495 false flags. So the flagged group has 585 accounts, only 90 of which are compromised.",
        "The resulting fraction is **90/585 ≈ 15.38%**. A detector can catch most compromised accounts while most flags are false alarms when compromise is rare.",
      ],
      limit:
        "Using these proportions for future accounts assumes the prior and within-group flag rates transfer. Estimated probabilities can be uncertain, change over time, or differ between populations.",
    },
    walkthrough: {
      heading: "Keep every denominator visible.",
      intro: "Let C mean compromised and F mean flagged.",
      steps: [
        {
          title: "Apply the prior",
          calculation: "10,000 × 0.01 = 100 compromised; 9,900 ordinary",
          why: "The base rate determines how many accounts start in each group.",
        },
        {
          title: "Count true flags",
          calculation: "100 × 0.90 = 90",
          why: "Sensitivity is P(F | C): the fraction of compromised accounts that get flagged.",
        },
        {
          title: "Count false flags",
          calculation: "9,900 × 0.05 = 495",
          why: "The ordinary group is much larger, so a small false-positive rate can produce many flags.",
        },
        {
          title: "Condition on the evidence",
          calculation: "P(C | F) = 90 / (90 + 495) ≈ 0.1538",
          why: "The new denominator includes all flags, not all compromised accounts or the full population.",
        },
      ],
    },
    prediction: {
      prompt:
        "Keep sensitivity and false-positive rate fixed, but raise compromise prevalence from 1% to 10%. What happens to the fraction of flags that are true?",
      options: [
        "It stays at 15.38%",
        "It rises to about 66.67%",
        "It becomes the sensitivity, 90%",
      ],
      correct: 1,
      answer: [
        "Now 1,000 compromised accounts produce 900 true flags. The 9,000 ordinary accounts produce 450 false flags. **900/1,350 ≈ 66.67%**.",
        "Both within-group detector rates stayed fixed. The posterior changed because the population’s prior changed.",
      ],
    },
    experimentIntro:
      "Step through the counts. Change prevalence alone, then reduce the false-positive rate while keeping the original 1% prevalence.",
    math: {
      heading: "Bayes’ rule repeats the counting in proportions.",
      intro: [
        "Write π for the prior P(C), s for sensitivity P(F|C), and f for the false-positive rate P(F|not C).",
      ],
      rules: [
        { label: "Evidence probability", formula: "P(F) = sπ + f(1−π)" },
        { label: "Bayes’ rule", formula: "P(C|F) = sπ / [sπ + f(1−π)]" },
        {
          label: "Substitute the original rates",
          formula:
            "0.90×0.01 / [0.90×0.01 + 0.05×0.99] = 0.009/0.0585 ≈ 0.1538",
        },
        {
          label: "Reverse condition",
          formula: "P(F|C) = 0.90; generally P(C|F) ≠ P(F|C)",
        },
      ],
      paragraphs: [
        "A probability distribution assigns nonnegative probabilities summing to 1 over its outcomes. Conditioning restricts the comparison group and renormalizes its probabilities.",
        "If P(F) is zero, this discrete division rule cannot define P(C|F). A label such as ‘positive’ or ‘flagged’ does not itself tell us which denominator to use.",
      ],
      limit:
        "Bayes’ rule is not a substitute for measuring rates on suitable data. Multiple clues may be dependent; multiplying them as if independent adds a separate assumption.",
    },
    transfer: {
      prompt:
        "Keep 1% prevalence and 90% sensitivity, but reduce the false-positive rate to 1%. Is every flag now correct?",
      answer: [
        "No. There are 90 true flags and 99 false flags, so **90/189 ≈ 47.62%** of flags are true.",
        "The improvement is substantial, but the base rate still matters. A probability is evidence under stated assumptions, not certainty.",
      ],
    },
    takeaways: [
      "A conditional probability uses a specified comparison group.",
      "Sensitivity and the truth fraction among flags reverse the condition.",
      "The prior and false-positive rate both shape the posterior.",
    ],
    sources: [
      {
        title: "Stanford CS229 · Conditional probability",
        url: "https://cs229.stanford.edu/section/cs229-prob.pdf",
      },
    ],
  },
  {
    slug: "l06",
    sourceId: "L06",
    deck: "Use a three-outcome delivery delay to separate average, spread, uncertainty, and prediction error.",
    objective:
      "Calculate expectation, variance, entropy, cross-entropy, and KL divergence while keeping their distributions and units explicit.",
    prerequisites: ["l05"],
    problem: {
      heading: "Can a confident forecast still be a bad forecast?",
      paragraphs: [
        "An invented delivery process has delays of **0, 1, or 2 days**, with declared probabilities **p = [0.6, 0.3, 0.1]**. A predictor reports another distribution, `q`.",
        "A uniform q is uncertain. A q of [0.8,0.1,0.1] is more concentrated on zero delay. A q of [0.1,0.8,0.1] is equally concentrated, but is much worse if zero delay is what actually occurs.",
        "We need different quantities for the average delay, the spread of delays, the uncertainty of a distribution, and how well a prediction matches what happens.",
      ],
    },
    intuition: {
      heading: "First name the question, then choose the quantity.",
      paragraphs: [
        "**Expectation** is a probability-weighted average. Under p, the mean delay is 0×0.6 + 1×0.3 + 2×0.1 = **0.5 days**. **Variance** averages squared deviations from that mean: **0.45 days²**.",
        "**Entropy** measures a distribution’s uncertainty. It does not know which outcome will occur. The two concentrated predictors above have the same entropy because they have the same probability values in a different order.",
        "**Negative log-likelihood** scores a particular observed outcome. **Cross-entropy** averages such scores under a specified target distribution. **KL divergence** separates the target’s own entropy from the extra expected loss of using q.",
      ],
      limit:
        "The target distribution p is known only because this is a declared synthetic process. In practice it must be estimated or represented by observed samples, and uncertainty about that estimate matters too.",
    },
    walkthrough: {
      heading:
        "Score a prediction without confusing its certainty with its quality.",
      intro:
        "Use natural logarithms, so entropy and log losses are measured in nats.",
      steps: [
        {
          title: "Calculate a weighted average",
          calculation: "E_p[X] = 0×0.6 + 1×0.3 + 2×0.1 = 0.5 days",
          why: "The expectation need not be a possible single delivery delay.",
        },
        {
          title: "Calculate spread",
          calculation:
            "Var_p(X) = 0.6(0−0.5)² + 0.3(1−0.5)² + 0.1(2−0.5)² = 0.45",
          why: "Squaring avoids cancellation of positive and negative deviations and gives squared-day units.",
        },
        {
          title: "Score the observed 0-day delay",
          calculation: "q(0)=0.8 → −ln(0.8)≈0.2231; q(0)=0.1 → −ln(0.1)≈2.3026",
          why: "The confident wrong predictor pays a much larger loss for this event.",
        },
        {
          title: "Average over the target",
          calculation:
            "Uniform q: H(p,q)=ln(3)≈1.0986; H(p)≈0.8979; KL(p∥q)≈0.2007",
          why: "Expected mismatch and the target’s intrinsic uncertainty are different parts of the score.",
        },
      ],
    },
    prediction: {
      prompt:
        "Two predictors are q₁=[0.8,0.1,0.1] and q₂=[0.1,0.8,0.1]. The observed delay is zero. Which statement is correct?",
      options: [
        "Their entropies match, but q₁ has lower observed loss",
        "Their observed losses match",
        "Lower entropy always means better predictions",
      ],
      correct: 0,
      answer: [
        "The probability lists are permutations, so **entropy matches**. But q₁ assigns 0.8 to the event that occurred, while q₂ assigns 0.1.",
        "Their losses are about 0.2231 and 2.3026 nats. Certainty alone does not establish correctness.",
      ],
    },
    experimentIntro:
      "Compare uniform, confident-correct, confident-wrong, and zero-probability predictions. Trace all six quantities without silently clipping probabilities.",
    math: {
      heading: "Keep p, q, and one observation distinct.",
      intro: [
        "p describes the target process, q the predictor, and x the outcome that occurred. Every probability distribution must be nonnegative and sum to 1.",
      ],
      rules: [
        {
          label: "Expectation and variance",
          formula: "E[X]=Σᵢpᵢxᵢ; Var(X)=Σᵢpᵢ(xᵢ−E[X])²",
        },
        { label: "Entropy", formula: "H(p)=−Σᵢpᵢ ln pᵢ, with 0 ln 0 = 0" },
        {
          label: "Observed loss and expected cross-entropy",
          formula: "loss(x)=−ln q(x); H(p,q)=−Σᵢpᵢ ln qᵢ",
        },
        {
          label: "KL divergence",
          formula: "KL(p∥q)=Σᵢpᵢ ln(pᵢ/qᵢ)=H(p,q)−H(p)",
        },
      ],
      paragraphs: [
        "If pᵢ is positive while qᵢ is zero, the expected log loss and KL are infinite. The player displays ∞ rather than inserting an unexplained small constant. Terms with pᵢ=0 contribute zero to these sums.",
        "KL is nonnegative for valid distributions with the usual support conventions, but it is generally asymmetric and does not satisfy the properties of a distance metric. Reversing p and q changes the question.",
      ],
      limit:
        "The player’s ‘observed loss’ uses outcome zero, while its cross-entropy uses all of p. A one-hot target makes these coincide, but our non-one-hot p deliberately keeps the distinction visible.",
    },
    transfer: {
      prompt:
        "A predictor assigns zero probability to a delivery delay that then happens. Is its negative log-likelihood merely a large finite number?",
      answer: [
        "Under the exact stated model it is **infinite**, because −ln(0)=∞.",
        "A practical implementation may smooth, constrain, or clip probabilities. That changes the calculation and must be specified; it should not be hidden in a teaching trace.",
      ],
    },
    takeaways: [
      "Expectation, variance, and entropy answer different questions.",
      "Observed loss scores one event; cross-entropy averages under a target distribution.",
      "KL compares distributions and requires explicit support and logarithm conventions.",
    ],
    sources: [
      {
        title: "Dive into Deep Learning · Information theory",
        url: "https://d2l.ai/chapter_appendix-mathematics-for-deep-learning/information-theory.html",
      },
      {
        title: "Dive into Deep Learning · Probability and statistics",
        url: "https://d2l.ai/chapter_preliminaries/probability.html",
      },
    ],
  },
  {
    slug: "l07",
    sourceId: "L07",
    deck: "Reuse three documents while changing who supplies the target and what the system is asked to learn.",
    objective:
      "Distinguish features, labels, supervised, unsupervised, self-supervised, semi-supervised, and reward-based setups through their information access.",
    prerequisites: ["l01", "l02", "l03"],
    problem: {
      heading: "Can the same text support more than one learning task?",
      paragraphs: [
        "Our entire corpus is **red book, blue book, red pen**. Human labels say **read, read, write**. The words and those labels are different kinds of information.",
        "We can predict the human category, hide a word and predict it, or inspect unlabeled similarities. The raw documents stay the same, but the training view and objective change.",
        "A **feature** is an input measurement or representation. A **label** is a target. The objective specifies how we judge the model’s output relative to that target or another learning signal.",
      ],
    },
    intuition: {
      heading: "Ask where the teaching signal comes from.",
      paragraphs: [
        "**Supervised learning** uses supplied input–target pairs. Our read/write labels were provided separately from the text. **Self-supervised learning** constructs targets from the data: hide the final word and predict it from the first.",
        "**Unsupervised learning** seeks structure without supplied task labels. The experiment computes word-set similarities to inspect such structure; it does not pretend that a similarity measure has discovered human categories.",
        "**Semi-supervised learning** combines labeled and unlabeled data in a learning procedure. **Reinforcement learning** uses rewards associated with behavior and its consequences. Those signals differ from simply revealing a correct class for each independent record.",
      ],
      limit:
        "This is a task-construction comparison. The supervised case fits a tiny nearest-centroid model; the other cases expose target construction and similarity counts rather than training a language model or a clustering system.",
    },
    walkthrough: {
      heading: "Turn one corpus into three different views.",
      intro: "Use word-count feature order [red, blue, book, pen].",
      steps: [
        {
          title: "Represent the inputs",
          calculation:
            "red book → [1,0,1,0]; blue book → [0,1,1,0]; red pen → [1,0,0,1]",
          why: "An explicit feature order makes the numerical representation inspectable.",
        },
        {
          title: "Fit supervised class centroids",
          calculation: "read → [0.5,0.5,1,0]; write → [1,0,0,1]",
          why: "Average vectors within each human-labeled class. These means are fitted from the supplied labels and features.",
        },
        {
          title: "Construct a self-supervised target",
          calculation:
            "red → book once; red → pen once; each next-word probability = 1/2",
          why: "The text provides the hidden word. A target exists even though no human added a category label.",
        },
        {
          title: "Inspect unlabeled similarity",
          calculation: "J(red book, blue book)=1/3; J(red book, red pen)=1/3",
          why: "Jaccard similarity counts shared words relative to their union. The tie does not specify which human grouping is meaningful.",
        },
      ],
    },
    prediction: {
      prompt:
        "You hide the second word in each document and train a predictor for that word. Are you learning without a target?",
      options: [
        "Yes, because no person labeled it",
        "No; the original text supplies the target",
        "Yes, so no loss can be computed",
      ],
      correct: 1,
      answer: [
        "The original text supplies the **target**. That makes this a self-supervised target-construction setup.",
        "A loss can compare the predicted word probabilities with the hidden word. The absence of a human-added class label does not remove the objective.",
      ],
    },
    experimentIntro:
      "Switch the objective while keeping the corpus fixed. Inspect the targets, fitted class means, ambiguous next-word counts, and tied unlabeled similarities.",
    math: {
      heading: "Specify what the procedure may access.",
      intro: [
        "The input x, target y, representation φ(x), and loss must refer to the same task. Different tasks can use the same underlying records.",
      ],
      rules: [
        {
          label: "Supervised objective",
          formula: "minimize average loss(fθ(φ(xᵢ)), yᵢ), with supplied yᵢ",
        },
        {
          label: "Nearest-centroid prediction",
          formula: "choose class c minimizing ‖φ(x)−mean_c‖²",
        },
        {
          label: "Self-supervised view",
          formula: "input = visible part of record; target = withheld part",
        },
        {
          label: "Our unlabeled similarity",
          formula: "J(A,B)=|A∩B|/|A∪B|; no task label is supplied",
        },
      ],
      paragraphs: [
        "For query blue pen, φ(x)=[0,1,0,1]. Its squared distance to read is 0.25+0.25+1+1=2.5; its distance to write is 1+1+0+0=2. The fitted toy classifier predicts write.",
        "This one result does not establish a good classifier. Feature choice, target definition, data quality, and evaluation on new records all remain part of the task.",
      ],
      limit:
        "These broad setup labels can overlap in real training pipelines. They do not identify a particular architecture, guarantee useful representations, or explain an entire reinforcement-learning algorithm.",
    },
    transfer: {
      prompt:
        "A navigation policy receives a reward after reaching or failing to reach a destination. Is that necessarily a supervised label telling it the correct action at every step?",
      answer: [
        "No. A delayed reward can evaluate consequences without revealing the correct action at each step. That creates a credit-assignment problem studied in reinforcement learning.",
        "The distinction is the available feedback. A dataset could also include expert action labels, giving a different imitation or supervised training setup.",
      ],
    },
    takeaways: [
      "Features are inputs; targets and objectives define the learning task.",
      "Self-supervised targets come from the data itself.",
      "Unlabeled structure and reward feedback do not automatically supply human category labels.",
    ],
    sources: [
      {
        title: "Google · Types of machine learning",
        url: "https://developers.google.com/machine-learning/intro-to-ml/what-is-ml",
      },
    ],
  },
  {
    slug: "l08",
    sourceId: "L08",
    deck: "Audit source identities, customer groups, time boundaries, and preprocessing using six small records.",
    objective:
      "Explain why disjoint row numbers are insufficient and calculate preprocessing without using held-out information.",
    prerequisites: ["l07"],
    problem: {
      heading: "What makes a held-out example genuinely new?",
      paragraphs: [
        "Six usage records belong to customers **A, B, and C**. Customer A has feature values **2 and 4**, B has **6 and 8**, and C has **10 and 12**. Every record also carries its original source ID and collection day.",
        "Suppose the evaluation question is performance on **new customers**. Training on A, validating on B, and testing on C keeps those identities separate. A random row split might place records from every customer in both training and held-out data.",
        "We will also center the feature by subtracting a mean. Even this apparently harmless preprocessing step can leak information if its mean uses test records.",
      ],
    },
    intuition: {
      heading: "Separate identity, time, and transformation rules.",
      paragraphs: [
        "**Provenance** records where an example came from. **Deduplication** removes repeated sources. But two different records from the same customer can still violate a new-customer evaluation, even without exact duplication.",
        "**Leakage** means information unavailable to the intended learning or prediction process influences construction or evaluation. Fit learned preprocessing statistics on training data, then apply the saved transform to validation, test, and later inputs.",
        "A split should match the deployment question. For forecasting, training information must precede the prediction cutoff. For new customers, identities must remain separate. Passing one of those checks does not automatically pass the other.",
      ],
      limit:
        "The 2/2/2 customer split is a teaching fixture, not a recommended dataset size. Customer groups also have very different feature ranges here; a clean split does not guarantee representative data or good predictions.",
    },
    walkthrough: {
      heading: "Audit more than row membership.",
      intro:
        "Begin with customer A as training data, B as validation, and C as test.",
      steps: [
        {
          title: "Record provenance and roles",
          calculation:
            "A: sources a1,a2 → train; B: b1,b2 → validation; C: c1,c2 → test",
          why: "Stable original identities allow an audit after rows are copied, reordered, or transformed.",
        },
        {
          title: "Fit the training mean",
          calculation: "mean_train = (2 + 4) / 2 = 3",
          why: "Only training features may determine this learned preprocessing statistic.",
        },
        {
          title: "Apply it to held-out inputs",
          calculation: "Test values 10 and 12 → centered values 7 and 9",
          why: "Using the saved transform on a held-out input is different from using that input to fit the transform.",
        },
        {
          title: "Compare a leaking mean",
          calculation:
            "mean_all = (2+4+6+8+10+12)/6 = 7; test values become 3 and 5",
          why: "The changed representation now depends on held-out information. No label was needed for this leakage.",
        },
      ],
    },
    prediction: {
      prompt:
        "You remove exact duplicate files, then randomly split several records from each customer. Does that guarantee a valid new-customer test?",
      options: [
        "Yes, because the files differ",
        "No; customer identities can still cross the split",
        "Only the number of rows matters",
      ],
      correct: 1,
      answer: [
        "Customer identities can still cross the split. **Exact-source deduplication and group separation are different checks.**",
        "Choose the split unit to match the future use. A new-record task for known customers would be a different evaluation question.",
      ],
    },
    experimentIntro:
      "Compare a customer split, a random row split, a future-data leak, a global preprocessing fit, and a copied source. Inspect the exact check that fails.",
    math: {
      heading: "Make the information boundary auditable.",
      intro: [
        "A data contract should record source, unit of analysis, collection timing, label availability, split assignment, transformations, intended use, known limitations, and maintenance ownership.",
      ],
      rules: [
        {
          label: "Training-only centering",
          formula: "μ_train = average(x_train); transformed x = x − μ_train",
        },
        {
          label: "Exact-source separation",
          formula: "sources(train) ∩ sources(held-out) = ∅",
        },
        {
          label: "New-customer evaluation",
          formula:
            "customers(train), customers(validation), customers(test) are disjoint",
        },
        {
          label: "Forecast information boundary",
          formula:
            "training information must be available by the prediction cutoff",
        },
      ],
      paragraphs: [
        "In the random-row case, training values 2, 6, and 10 have mean 6, but customers A, B, and C reappear in held-out rows. Distinct source IDs do not rescue that evaluation design.",
        "In the time case, the declared cutoff is day 2. Including the day-3 record in training violates that cutoff even though it precedes the test record on day 4. ‘Before the test date’ and ‘available when the prediction was made’ are different conditions.",
      ],
      limit:
        "These audits catch declared forms of leakage. They cannot discover every hidden relationship, collection bias, label problem, or distribution shift. Data quality also needs documentation and domain-specific checks.",
    },
    transfer: {
      prompt:
        "A feature is computed as the next seven days of activity, but the prediction is supposed to be made today. Can a clean train/test row split make that feature valid?",
      answer: [
        "No. The feature itself uses information unavailable at prediction time. A split cannot repair its time definition.",
        "Define features using only information available as of the prediction, and record both event time and availability time when they differ.",
      ],
    },
    takeaways: [
      "Provenance and group/time boundaries complement row separation.",
      "Preprocessing statistics are learned information too.",
      "A clean split answers a stated evaluation question; it does not prove deployment quality.",
    ],
    sources: [
      {
        title: "scikit-learn · Common pitfalls and data leakage",
        url: "https://scikit-learn.org/stable/common_pitfalls.html",
      },
    ],
  },
];
