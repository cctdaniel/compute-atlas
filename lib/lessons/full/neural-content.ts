import type { LessonContent } from "../types";
export const neuralLessons: LessonContent[] = [
  {
    slug: "l15",
    sourceId: "L15",
    deck: "Use two binary switches to see what a hidden nonlinearity adds—and why stacking affine layers is not enough.",
    objective:
      "Trace a two-unit MLP, distinguish pre-activation from activation, and explain why nonlinear features can represent XOR.",
    prerequisites: ["l03", "l04", "l09"],
    problem: {
      heading: "Can one straight-line rule recognize “exactly one”?",
      paragraphs: [
        "Two switches each hold **0 or 1**. We want output **1 when exactly one is on**, and 0 when neither or both are on. This is **XOR**, exclusive OR. Its four target pairs are [0,0]→0, [0,1]→1, [1,0]→1, [1,1]→0.",
        "The affine baseline **score=x₁+x₂−0.5** flags any input with score at least 0.5. It handles three corners, but incorrectly flags [1,1]. Changing one straight boundary cannot separate both positive corners from both negative corners.",
        "We’ll construct two hidden features and combine them. The weights are supplied deliberately so every operation can be inspected; this experiment demonstrates representation rather than training.",
      ],
    },
    intuition: {
      heading: "Compute features that can bend the final rule.",
      paragraphs: [
        "A mathematical **neuron** first calculates a weighted sum plus bias, called its **pre-activation** z. An **activation function** transforms that number into a. For ReLU, a=max(0,z): negative inputs become zero and positive inputs pass through.",
        "An **MLP**, multilayer perceptron, composes such layers. Here both hidden units read the switch count s=x₁+x₂. One returns ReLU(s); the other returns ReLU(s−1). The second feature turns on only when the count exceeds one.",
        "The output **h₁−2h₂** rises from 0 to 1, then falls back to 0 as the count goes from 0 to 1 to 2. That piecewise behavior is what a single affine score cannot provide.",
      ],
      limit:
        "This is a hand-built mathematical network, not a simulation of biological neurons. Its units have inspectable roles because we chose them; learned units in a larger model need not correspond to named human concepts.",
    },
    walkthrough: {
      heading: "Follow the both-on case through two hidden units.",
      intro:
        "Start with [x₁,x₂]=[1,1], use ReLU in both hidden units, and keep output threshold 0.5.",
      steps: [
        {
          title: "Build two pre-activations",
          calculation: "s=1+1=2; z₁=s=2; z₂=s−1=1",
          why: "The two units share input weights [1,1] but use different biases, 0 and −1.",
        },
        {
          title: "Apply the nonlinearity",
          calculation: "h₁=max(0,2)=2; h₂=max(0,1)=1",
          why: "ReLU is a separate operation from the weighted sum. It changes the function outside the positive region.",
        },
        {
          title: "Combine the hidden features",
          calculation: "score=1×h₁−2×h₂=2−2=0",
          why: "The second feature cancels the unwanted both-on response. This score is not a probability.",
        },
        {
          title: "Check all four inputs",
          calculation: "[0,0]→0; [0,1]→1; [1,0]→1; [1,1]→0",
          why: "A network should satisfy the entire declared task, not only the selected example.",
        },
      ],
    },
    prediction: {
      prompt:
        "Replace both ReLUs with identity functions but keep the supplied weights. Have the extra layers preserved the ability to solve every XOR input?",
      options: [
        "Yes; two layers are always nonlinear",
        "No; the composition becomes affine",
        "Yes; the output threshold trains the model",
      ],
      correct: 1,
      answer: [
        "No. Without nonlinear activations, **score=s−2(s−1)=2−s**, an affine rule. At [0,0] it returns 2 and incorrectly predicts class 1.",
        "Adding more affine transformations cannot create a bend. The composition is still one affine transformation, regardless of its parameter count.",
      ],
    },
    experimentIntro:
      "Compare the affine baseline with the two-hidden-unit network. Change the input, remove the nonlinearities, then swap to sigmoid or GELU without refitting the output weights. Inspect every row of the truth table.",
    math: {
      heading: "Separate the architecture, activation, and fitted parameters.",
      intro: [
        "For an input vector x, a neuron computes z=w·x+b and a=φ(z). A layer performs this for several units. The next layer receives their activations.",
      ],
      rules: [
        { label: "One neuron", formula: "z=w·x+b; a=φ(z)" },
        {
          label: "Our hidden layer",
          formula: "h₁=ReLU(x₁+x₂); h₂=ReLU(x₁+x₂−1)",
        },
        {
          label: "Output and decision",
          formula: "score=h₁−2h₂; predict 1 if score≥0.5",
        },
        {
          label: "Two affine layers",
          formula: "W₂(W₁x+b₁)+b₂=(W₂W₁)x+(W₂b₁+b₂)",
        },
        {
          label: "Other activations",
          formula: "sigmoid(z)=1/(1+exp(−z)); GELU(z)=zΦ(z)",
        },
      ],
      paragraphs: [
        "Φ denotes the standard normal cumulative distribution function. The experiment uses the common tanh approximation GELU(z)≈0.5z[1+tanh(√(2/π)(z+0.044715z³))]. Sigmoid and GELU produce different hidden values; swapping an activation is a change to the model.",
        "A simple impossibility check explains the affine baseline: for any affine score, score(0,0)+score(1,1)=score(1,0)+score(0,1). XOR would require the negative pair to sum below 1 while the positive pair sums to at least 1 at threshold 0.5. Those equal sums cannot satisfy both requirements.",
        "Weights normally come from training, not from manually designing a feature for each task. The next lesson shows how derivatives support those parameter updates.",
      ],
      limit:
        "Success on four binary inputs does not establish generalization to other inputs or tasks. A nonlinearity supplies representational capacity; it does not guarantee that training finds a useful solution.",
    },
    transfer: {
      prompt:
        "You replace one affine layer with five affine layers, with no activation between them. Have you gained a fundamentally nonlinear input–output function?",
      answer: [
        "No. **A composition of affine maps is affine.** The parameterization changes, but the overall function still has the form Ax+c.",
        "Insert an appropriate nonlinearity to expand the function family. Then train and evaluate the resulting model rather than assuming more layers automatically solve the task.",
      ],
    },
    takeaways: [
      "A neuron separates an affine pre-activation from an activation function.",
      "Nonlinear hidden features let an MLP represent relationships such as XOR.",
      "More layers or a different activation do not guarantee useful trained behavior.",
    ],
    sources: [
      {
        title: "Dive into Deep Learning · Multilayer perceptrons",
        url: "https://d2l.ai/chapter_multilayer-perceptrons/mlp.html",
      },
      {
        title: "Hendrycks & Gimpel · Gaussian Error Linear Units",
        url: "https://arxiv.org/abs/1606.08415",
      },
    ],
  },
  {
    slug: "l16",
    sourceId: "L16",
    deck: "Compute a prediction, differentiate the saved operations, and then explicitly update a weight and bias together.",
    objective:
      "Distinguish forward computation, backward differentiation, and optimizer updates, using derivatives from the same old parameter state.",
    prerequisites: ["l04", "l15"],
    problem: {
      heading: "Which operation actually changes the model?",
      paragraphs: [
        "A receipt says **2 items cost $4**. Our model is **prediction=w×x+b**, starting at **w=1, b=0**. It predicts $2 and incurs loss **L=½(prediction−target)²=2**.",
        "We need to learn how the loss responds to w and b. Computing those sensitivities is different from applying them. Backpropagation can finish while the model’s parameters remain unchanged.",
        "The experiment separates the forward pass, the backward pass, the optimizer update, and the next forward pass. Watch the cached values as well as the parameters.",
      ],
    },
    intuition: {
      heading: "Save values, propagate sensitivities, then choose a move.",
      paragraphs: [
        "The **forward pass** evaluates the computation graph: multiply, add, compare, and square. It saves intermediate values needed by derivative rules.",
        "**Backpropagation** applies the chain rule in reverse through those operations. **Automatic differentiation** is the broader technique for differentiating implemented computations; reverse-mode differentiation efficiently accumulates sensitivities for many parameters feeding one scalar loss.",
        "An **optimizer** decides how to use those gradients. Plain gradient descent subtracts a learning rate times each parameter’s derivative. Both derivatives in this update must refer to the same old forward pass.",
      ],
      limit:
        "One affine model keeps the graph small. Large networks add many operations and shared paths, whose gradient contributions must be accumulated correctly. This trace does not implement a general-purpose automatic-differentiation library.",
    },
    walkthrough: {
      heading: "Differentiate one saved receipt calculation.",
      intro: "Keep x=2, target=4, old w=1, old b=0, and learning rate α=0.1.",
      steps: [
        {
          title: "Run the forward pass",
          calculation:
            "product=1×2=2; prediction=2+0=2; error=2−4=−2; L=½(−2)²=2",
          why: "Every value comes from the old checkpoint. These saved values define the computation being differentiated.",
        },
        {
          title: "Differentiate the loss",
          calculation: "∂L/∂prediction=error=−2",
          why: "The derivative of half squared error is the residual. This sensitivity is passed toward the operations that produced the prediction.",
        },
        {
          title: "Differentiate both parameters",
          calculation: "∂L/∂w=(−2)×x=−4; ∂L/∂b=(−2)×1=−2",
          why: "The prediction changes by x per unit of w, and by 1 per unit of b. Neither derivative calculation changes a parameter.",
        },
        {
          title: "Apply one simultaneous update",
          calculation: "w′=1−0.1(−4)=1.4; b′=0−0.1(−2)=0.2",
          why: "Use both old gradients. Recomputing the bias gradient after changing w would be a different update procedure.",
        },
        {
          title: "Run a new forward pass",
          calculation: "prediction′=1.4×2+0.2=3; L′=½(3−4)²=0.5",
          why: "Parameter updates invalidate old forward values. Re-evaluate the model to measure the resulting loss.",
        },
      ],
    },
    prediction: {
      prompt:
        "The backward pass has computed ∂L/∂w=−4 and ∂L/∂b=−2. Before the optimizer update, what are w and b?",
      options: ["w=1.4 and b=0.2", "w=1 and b=0", "w=−4 and b=−2"],
      correct: 1,
      answer: [
        "They remain **w=1 and b=0**. Backpropagation computed sensitivities; it did not apply a learning rule.",
        "The gradients become inputs to the optimizer. A gradient is not a replacement parameter value.",
      ],
    },
    experimentIntro:
      "Step through the forward and backward passes. At the gradient frame, use Update to apply the optimizer move, then recompute. Compare a frozen bias, an excessive learning rate, zero error, and inference without a target.",
    math: {
      heading: "Gradients belong to the computation that produced them.",
      intro: [
        "Write e=wx+b−y. With L=½e², the local derivatives multiply through the graph. The input and target stay fixed while differentiating parameters.",
      ],
      rules: [
        { label: "Loss sensitivity", formula: "∂L/∂e=e; ∂e/∂prediction=1" },
        {
          label: "Weight derivative",
          formula: "∂L/∂w=(∂L/∂e)(∂e/∂prediction)(∂prediction/∂w)=e×1×x",
        },
        { label: "Bias derivative", formula: "∂L/∂b=e×1×1=e" },
        {
          label: "Simultaneous descent",
          formula: "[w,b]′=[w,b]−α[∂L/∂w,∂L/∂b] from the old state",
        },
      ],
      paragraphs: [
        "After Update, the workbench explicitly labels the old loss as cached. The following forward step replaces that cached result with the new loss. This makes the boundary between changing parameters and evaluating them visible.",
        "At α=0.5, the same old gradients produce w′=3 and b′=1. Prediction becomes 7 and loss 4.5, larger than the starting loss 2. The derivative is correct; the chosen step is too large for this example.",
        "Inference normally needs only the forward computation and the saved weights. It need not have a target, construct a training loss, accumulate parameter gradients, or update the model. Frameworks can also differentiate at inference for other purposes, but that is an additional requested operation.",
      ],
      limit:
        "Gradients can be zero, undefined at some operations, unstable in finite precision, or misleading for a large step. A valid backward calculation is not a guarantee of useful optimization or generalization.",
    },
    transfer: {
      prompt:
        "Someone changes w first, recomputes the error, then uses that new error to update b. Is that the same simultaneous gradient step?",
      answer: [
        "No. The bias derivative now comes from a **different parameter state**. It can define a legitimate sequential procedure, but it is not the simultaneous update just derived.",
        "For the declared gradient-descent rule, compute both gradients from one saved forward pass, apply them together, then evaluate the new state.",
      ],
    },
    takeaways: [
      "Forward passes compute values; backward passes compute sensitivities.",
      "The optimizer applies parameter changes as a separate operation.",
      "A new forward pass is needed to evaluate the new checkpoint.",
    ],
    sources: [
      {
        title: "Dive into Deep Learning · Forward and backpropagation",
        url: "https://d2l.ai/chapter_multilayer-perceptrons/backprop.html",
      },
      {
        title: "PyTorch · Automatic differentiation",
        url: "https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html",
      },
    ],
  },
  {
    slug: "l17",
    sourceId: "L17",
    deck: "Compare training rules on one two-coordinate loss, then inspect dropout and a concrete numerical-overflow failure.",
    objective:
      "Separate gradients, optimizer memory, updates, batches, epochs, schedules, clipping, and numerical arithmetic; explain why each control changes training differently.",
    prerequisites: ["l16"],
    problem: {
      heading: "Why can the same gradient lead to different training behavior?",
      paragraphs: [
        "Use **L(u,v)=½(u²+10v²)**, starting at **[u,v]=[4,1]**. The minimum is [0,0]. The v direction is ten times as curved as the u direction, so a step that looks small in one coordinate can be excessive in the other.",
        "At the start, the gradient is **[4,10]** and loss is **13**. Plain descent at learning rate 0.05 moves to [3.8,0.5], reducing loss to 8.47. A learning rate of 0.25 moves to [3,−1.5], raising loss to 15.75.",
        "Training has several controls beyond learning rate. We will inspect what each one actually changes, rather than treating optimizer names as a performance ranking.",
      ],
    },
    intuition: {
      heading: "A gradient, an update, and a data pass are different objects.",
      paragraphs: [
        "A **batch** supplies examples for one gradient estimate. An **epoch** conventionally means one pass through a finite training dataset. With 100 examples and batch size 20, a pass without replacement has five updates, not one. Sampling with replacement does not guarantee a complete pass after a fixed number of draws.",
        "**Momentum** carries update history; **Adam** uses first and second gradient moments to adapt coordinates. A **schedule** changes learning rate over updates. **Gradient clipping** caps a gradient’s magnitude before the optimizer uses it. These interventions operate at different stages.",
        "**Initialization** chooses the starting parameters. **Precision** limits representable values and changes rounding. **Dropout** masks activations during training and normally changes behavior at evaluation. None of these controls guarantees convergence simply by being enabled.",
      ],
      limit:
        "This is a small deterministic training laboratory. Optimizer settings are explicitly declared and differ between some scenarios; their traces explain mechanisms, not a universal benchmark or recommendation.",
    },
    walkthrough: {
      heading: "Inspect the proposed move before applying it.",
      intro:
        "Begin with the same two-coordinate quadratic and keep track of the parameter vector, gradient, and update separately.",
      steps: [
        {
          title: "Compute the full gradient",
          calculation: "∇L=[u,10v]=[4,10]; ||∇L||=√116≈10.7703",
          why: "Curvature makes v more sensitive. The gradient is a property of this objective at this point.",
        },
        {
          title: "Apply plain descent",
          calculation: "Δ=0.05[4,10]=[0.2,0.5]; [u,v]′=[3.8,0.5]",
          why: "The optimizer subtracts an update vector. Its norm and direction need not equal those of the raw gradient.",
        },
        {
          title: "Carry momentum",
          calculation: "m₁=[4,10]; m₂=0.8[4,10]+[3.8,5]=[7,13]",
          why: "The second momentum move includes previous information. At α=0.05 it subtracts [0.35,0.65].",
        },
        {
          title: "Bound a large gradient",
          calculation: "g_clipped=g×min(1,2/||g||)",
          why: "With α=0.25, the resulting plain-gradient move has norm at most 0.5. Bounding a move does not make that learning rate converge.",
        },
        {
          title: "Mask a training activation",
          calculation:
            "h=[2,4], keep q=0.5, mask=[1,0] → masked/scaled h=[4,0]",
          why: "Inverted dropout divides retained activations by the keep probability. This training mask sums to 4; ordinary evaluation returns 6.",
        },
        {
          title: "Avoid a numerical overflow",
          calculation: "softmax([1000,1001])=softmax([−1,0])≈[0.2689,0.7311]",
          why: "Subtracting the maximum preserves probability ratios while keeping these exponentials finite.",
        },
      ],
    },
    prediction: {
      prompt:
        "You clip a gradient’s norm before taking a very large learning-rate step. What has clipping guaranteed?",
      options: [
        "The model must converge",
        "The gradient used by this step has a bounded norm",
        "The validation loss must decrease",
      ],
      correct: 1,
      answer: [
        "Clipping bounds **the gradient used by the step**. Under plain descent at a fixed rate, that also bounds the move’s norm.",
        "It does not guarantee convergence, a lower loss, or better generalization. With an adaptive optimizer, the final update also depends on its moments and scaling rule.",
      ],
    },
    experimentIntro:
      "Compare descent, momentum, Adam, a large rate, clipping, a schedule, sampled gradients, rounded parameters, and another initialization. Then inspect two dropout masks and stable softmax. Each scenario states the rule it uses.",
    math: {
      heading: "Make each training convention explicit.",
      intro: [
        "The numerical path is computed in JavaScript Number. A rounded-parameter scenario deliberately quantizes to one decimal; it is not an emulation of float16 or another hardware format.",
      ],
      rules: [
        { label: "Full-gradient descent", formula: "g=[u,10v]; θ′=θ−αg" },
        {
          label: "Our momentum convention",
          formula: "mₜ=0.8mₜ₋₁+gₜ; θ′=θ−αmₜ",
        },
        {
          label: "Adam moments",
          formula: "mₜ=0.9mₜ₋₁+0.1gₜ; sₜ=0.999sₜ₋₁+0.001gₜ²",
        },
        {
          label: "Adam correction and update",
          formula: "m̂=m/(1−0.9ᵗ); ŝ=s/(1−0.999ᵗ); Δ=αm̂/(√ŝ+10⁻⁸)",
        },
        { label: "Our learning-rate schedule", formula: "αₜ=0.05×0.7^(t−1)" },
        {
          label: "Inverted dropout",
          formula: "h_train=mask×h/q; ordinary h_eval=h",
        },
      ],
      paragraphs: [
        "The sampled-gradient case uses two component losses: ℓ₀=½[(u−1)²+10(v+0.1)²] and ℓ₁=½[(u+1)²+10(v−0.1)²]. Their mean is L+0.55, so their mean gradient is exactly [u,10v]. The plot reports L, omitting that constant. A supplied draw sequence makes the experiment reproducible.",
        "For dropout, the four equally likely masks produce sums 0, 4, 8, and 12, averaging 6. One training realization can differ from ordinary evaluation while the scaled activations preserve the mean under the declared mask distribution. This is not a guarantee that nonlinear whole-network outputs have identical train/evaluation expectations.",
        "Small updates can disappear after coarse rounding. Very large exponentials can overflow. Initialization can also affect activation scales and gradient propagation. Stable formulas, suitable initialization, monitoring, and appropriate arithmetic address specific failures; they do not eliminate every numerical risk.",
      ],
      limit:
        "The optimizer path stops after eight updates. A short toy trace cannot establish long-run convergence or decide which optimizer, schedule, batch size, initialization, or precision is best for another model.",
    },
    transfer: {
      prompt:
        "A dataset has 100 examples, batches contain 20 examples, and each example is visited exactly once per pass. After ten optimizer updates, how many epochs have completed?",
      answer: [
        "There are **five updates per epoch**, so ten updates complete **two epochs**, assuming no dropped batch, accumulation, or other convention changes.",
        "If examples were instead sampled with replacement, ten updates would count processed examples but would not by itself prove two complete passes over distinct records. State the sampling convention.",
      ],
    },
    takeaways: [
      "Inspect the gradient and final update as separate quantities.",
      "Batch size, epochs, optimizer state, schedules, and clipping control different parts of training.",
      "Dropout and arithmetic conventions must match the intended training/evaluation procedure.",
    ],
    sources: [
      {
        title: "PyTorch · Optimizer conventions",
        url: "https://docs.pytorch.org/docs/stable/optim.html",
      },
      { title: "Kingma & Ba · Adam", url: "https://arxiv.org/abs/1412.6980" },
      {
        title: "Dive into Deep Learning · Dropout",
        url: "https://d2l.ai/chapter_multilayer-perceptrons/dropout.html",
      },
      {
        title:
          "Dive into Deep Learning · Numerical stability and initialization",
        url: "https://d2l.ai/chapter_multilayer-perceptrons/numerical-stability-and-init.html",
      },
    ],
  },
  {
    slug: "l18",
    sourceId: "L18",
    deck: "Compare eight supplied vectors, then learn a tiny query representation from a declared matching-versus-nonmatching objective.",
    objective:
      "Calculate cosine and distance rankings, handle zero vectors honestly, and trace how a contrastive objective changes an embedding without establishing universal semantic truth.",
    prerequisites: ["l03", "l15", "l16"],
    problem: {
      heading: "What does it mean for two items to be close?",
      paragraphs: [
        "An **embedding** maps an item to a vector. Our eight synthetic items include **Cat=[1,0]**, **Dog=[0.8,0.2]**, **Apple=[0,1]**, and **Scaled cat=[3,0]**. Their names make the geometry memorable; no real embedding model produced these coordinates.",
        "For query [1,0], Cat and Scaled cat have the same cosine direction. Yet their Euclidean distances are 0 and 2. Changing the metric changes what “similar” means.",
        "We will first inspect supplied vectors. Then we will learn only a query vector using a small contrastive objective, while the key vectors stay fixed. That separates having a representation from learning one.",
      ],
    },
    intuition: {
      heading: "A representation is useful relative to a task.",
      paragraphs: [
        "**Cosine similarity** compares directions for nonzero vectors. Positive scaling preserves the direction, so it preserves cosine. **Euclidean distance** measures displacement and depends on vector length as well as direction.",
        "**Representation learning** fits features through an objective instead of requiring each coordinate to be designed by hand. **Contrastive learning** uses matching and nonmatching examples to shape relative scores. The choice of pairs, negatives, model, and loss determines what gets rewarded.",
        "A high similarity is not a truth score. It can reflect lexical resemblance, topic, style, or a training relation that is unsuitable for your current task. Coordinates also need not correspond to individual human-readable attributes.",
      ],
      limit:
        "The vector map is synthetic and exactly two-dimensional. A plot of real high-dimensional embeddings would be a lossy projection; distances in that plot need not preserve the original geometry.",
    },
    walkthrough: {
      heading: "Keep the vectors fixed before comparing metrics.",
      intro:
        "Start query q=[1,0]. Cat is [1,0], Dog is [0.8,0.2], and Scaled cat is [3,0].",
      steps: [
        {
          title: "Calculate a dot product",
          calculation: "q·Dog=1×0.8+0×0.2=0.8",
          why: "Matching coordinates contribute to the compatibility score. A dot product by itself also depends on vector norms.",
        },
        {
          title: "Normalize to cosine",
          calculation: "cos(q,Dog)=0.8/(1×√0.68)≈0.9701",
          why: "Dividing by both norms compares direction. A zero norm makes this expression undefined.",
        },
        {
          title: "Compare with distance",
          calculation: "distance(q,Dog)=√((1−0.8)²+(0−0.2)²)≈0.2828",
          why: "Distance asks how far the coordinates differ, rather than only how their directions align.",
        },
        {
          title: "Rescale a collinear vector",
          calculation: "cos(q,[3,0])=1; distance(q,[3,0])=2",
          why: "A positive rescaling preserves cosine but changes distance. Rankings can therefore differ under the two metrics.",
        },
        {
          title: "Learn a pairwise preference",
          calculation:
            "q=[0,0]; Cat positive, Apple negative; pair loss=−ln(0.5)≈0.6931",
          why: "The next experiment fits q so its positive dot score exceeds its negative dot score. That objective is explicitly about this pair.",
        },
      ],
    },
    prediction: {
      prompt:
        "Multiply a nonzero query vector by a positive scalar. Must its cosine similarities to all nonzero candidates change?",
      options: [
        "Yes; every metric depends on length",
        "No; the scalar cancels in the cosine ratio",
        "No; the candidates become identical",
      ],
      correct: 1,
      answer: [
        "No. **The positive scalar cancels** between numerator and query norm, so cosine is unchanged for nonzero candidates.",
        "Distances and raw dot scores can change. A zero vector still has no cosine direction, and multiplying by a negative scalar reverses it.",
      ],
    },
    experimentIntro:
      "Compare cosine and distance rankings for eight vectors. Rescale the query or use a zero query. Then learn a Cat-versus-Apple preference, swap the training relation, and inspect the resulting query and pair loss.",
    math: {
      heading:
        "The training loss and retrieval metric need their own definitions.",
      intro: [
        "In the contrastive experiment only the query q is learned. Positive and negative key vectors k⁺ and k⁻ are fixed, and temperature is 1. Other supplied vectors are visible but do not participate in this pair loss.",
      ],
      rules: [
        {
          label: "Cosine",
          formula:
            "cos(q,k)=(q·k)/(||q||||k||), only when both norms are nonzero",
        },
        { label: "Euclidean distance", formula: "d(q,k)=√Σᵢ(qᵢ−kᵢ)²" },
        {
          label: "Pair probability",
          formula: "p⁺=exp(q·k⁺)/(exp(q·k⁺)+exp(q·k⁻))",
        },
        {
          label: "Contrastive pair loss",
          formula: "L=−ln p⁺; ∂L/∂q=(p⁺−1)k⁺+p⁻k⁻",
        },
        { label: "Learned query update", formula: "q′=q−0.5∂L/∂q" },
      ],
      paragraphs: [
        "For Cat positive and Apple negative at q=[0,0], the gradient is [−0.5,0.5]. One update gives q′=[0.25,−0.25]. The positive pair probability becomes about 0.6225 and the loss falls to about 0.4741. Swapping the relation reverses the gradient direction.",
        "This objective uses dot scores and a two-item denominator. It does not optimize all eight-item retrieval rankings, Euclidean distances, or factual relevance. For example, the Scaled cat key can have a larger dot score than Cat without affecting this pair loss.",
        "An embedding is not necessarily an invertible encoding. Many inputs can map to the same representation, and omitted information need not be recoverable. Evaluation must match the downstream use rather than rely on an attractive vector plot.",
      ],
      limit:
        "This tiny loss illustrates how supervision shapes a representation. It does not train a real text encoder, validate negative sampling, or prove that larger pair separation generalizes to unseen items.",
    },
    transfer: {
      prompt:
        "An embedding retriever finds a passage very close to a question. Does that establish that the passage is correct, current, and sufficient to answer it?",
      answer: [
        "No. **Similarity is a retrieval signal**, not a guarantee of factual correctness, freshness, or evidential sufficiency.",
        "Check source quality and support for the actual claim. Evaluate retrieval and the final answering system separately, using tasks that reflect the intended use.",
      ],
    },
    takeaways: [
      "Cosine compares directions; distance also depends on lengths.",
      "Representations learn the relations rewarded by their objective.",
      "Embedding similarity does not establish truth, invertibility, or universal relevance.",
    ],
    sources: [
      {
        title: "Mikolov et al. · Distributed word representations",
        url: "https://arxiv.org/abs/1301.3781",
      },
      {
        title: "Chen et al. · Contrastive representation learning",
        url: "https://arxiv.org/abs/2002.05709",
      },
    ],
  },
];
