import type { LessonContent } from "../types";
export const classicalLessons: LessonContent[] = [
  {
    slug: "l09",
    sourceId: "L09",
    deck: "Use the same delivery setting to separate a numeric prediction, a probability estimate, and the action taken from it.",
    objective:
      "Calculate regression residuals and a logistic score, then explain why a decision threshold is a separate choice.",
    prerequisites: ["l04", "l05", "l06", "l07", "l08"],
    problem: {
      heading:
        "Are we predicting a duration or deciding whether to raise a flag?",
      paragraphs: [
        "A delivery service can ask two different questions: **How many minutes will this route take?** and **Will this delivery arrive late?** The first asks for a number. The second asks about a category.",
        "Our invented duration dataset has four observations: **1 stop → 3 minutes, 2 → 5, 3 → 7, 4 → 9**. We will compare three straight-line predictions. Separately, a declared logistic model estimates lateness from a feature value.",
        "A prediction is useful only when its target, units, and intended use are clear. A probability estimate still needs an action rule before it can trigger an alert.",
      ],
    },
    intuition: {
      heading: "Choose the target before choosing the model.",
      paragraphs: [
        "**Regression** predicts a numeric quantity. A linear model uses **ŷ = wx+b**, where the slope w changes the prediction per unit of input and the intercept b supplies an offset. A **residual** is prediction minus observed target.",
        "**Classification** predicts a category or scores its alternatives. For two classes, logistic regression maps a linear score z through a **sigmoid**, producing a number between 0 and 1. Despite its name, logistic regression is a classifier.",
        "A **threshold** converts that estimate into an action. At a probability of about 0.731, a threshold of 0.5 flags the delivery; a threshold of 0.8 does not. The estimated probability has not changed.",
      ],
      limit:
        "These models use invented data. The line is a training-data comparison, and the logistic weights are supplied rather than fitted here. Neither establishes real delivery performance or calibrated probabilities.",
    },
    walkthrough: {
      heading: "Trace the number before choosing an action.",
      intro:
        "The regression target is minutes; the classification target is the event “late”. Their numerical outputs answer different questions.",
      steps: [
        {
          title: "Predict a duration",
          calculation: "For x=2 stops, w=1, b=1: ŷ=1×2+1=3 minutes",
          why: "This line predicts a duration of 3, while the observation is 5. The residual is −2 minutes.",
        },
        {
          title: "Measure every training residual",
          calculation: "MSE = ((−1)²+(−2)²+(−3)²+(−4)²)/4 = 7.5",
          why: "Averaging squared residuals scores all four observations. Changing the slope to 2 makes each residual zero on this fixture.",
        },
        {
          title: "Calculate a classification estimate",
          calculation:
            "For lateness feature x=2: z=2x−3=1; p=1/(1+exp(−1))≈0.7311",
          why: "The linear score is unrestricted; the sigmoid maps it to the model’s estimate for the positive class.",
        },
        {
          title: "Apply a separate threshold",
          calculation: "0.7311 ≥ 0.5 → flag; 0.7311 < 0.8 → pass",
          why: "Changing the action rule can trade missed late deliveries against false alarms without refitting the model.",
        },
      ],
    },
    prediction: {
      prompt:
        "A model estimates a late-delivery probability of 0.7311. You raise its action threshold from 0.5 to 0.8. What changes?",
      options: [
        "The probability becomes 0.8",
        "The flag can change while the probability stays fixed",
        "The model must retrain",
      ],
      correct: 1,
      answer: [
        "The **flag changes** from positive to negative under this rule. The model still estimates 0.7311.",
        "The threshold is an operational decision. Whether it is useful depends on costs, constraints, and evaluation, not just on the number looking more cautious.",
      ],
    },
    experimentIntro:
      "First compare underprediction, exact training fit, and overprediction. Then compare two thresholds applied to the same logistic estimate. Every change returns the experiment to its first step.",
    math: {
      heading: "Training objectives and action rules have different jobs.",
      intro: [
        "Squared error is one regression objective. Binary log loss scores the probability assigned to an observed class. A threshold is applied after the probability computation.",
      ],
      rules: [
        {
          label: "Linear regression",
          formula: "ŷᵢ = wxᵢ+b; MSE = (1/n)Σ(ŷᵢ−yᵢ)²",
        },
        { label: "Logistic model", formula: "z=wx+b; p=σ(z)=1/(1+exp(−z))" },
        { label: "Binary log loss", formula: "ℓ(p,y)=−[y ln p+(1−y)ln(1−p)]" },
        {
          label: "Declared action rule",
          formula: "flag if p≥threshold; otherwise pass",
        },
      ],
      paragraphs: [
        "For a positive outcome y=1, the supplied probability 0.7311 has log loss about 0.3133. For a negative outcome, it has loss about 1.3133. These score the probability, not merely its thresholded label.",
        "Both linear and logistic models can be fitted from training examples. Our regression view compares supplied slopes; the next lessons examine fitting and evaluation. A low training loss cannot replace a held-out check.",
      ],
      limit:
        "A number in [0,1] need not be a trustworthy probability estimate under every population or subgroup. Calibration, label definition, and distribution shift require separate evaluation.",
    },
    transfer: {
      prompt:
        "The service now asks for the probability that a delivery exceeds 30 minutes, rather than its expected duration. Is that the same target?",
      answer: [
        "No. An expected duration is a numeric summary; the event “duration > 30” defines a **binary classification target**. A mean alone does not determine the probability of that event.",
        "The service must also decide what to do with the estimate, using an action threshold appropriate to the consequences.",
      ],
    },
    takeaways: [
      "Define the target and units first: numeric duration and a late/not-late event differ.",
      "A logistic probability comes from a linear score and a sigmoid.",
      "A threshold changes the action without necessarily changing the model.",
    ],
    sources: [
      {
        title: "scikit-learn · Linear models",
        url: "https://scikit-learn.org/stable/modules/linear_model.html",
      },
      {
        title: "scikit-learn · Supervised learning",
        url: "https://scikit-learn.org/stable/supervised_learning.html",
      },
    ],
  },
  {
    slug: "l10",
    sourceId: "L10",
    deck: "Fit four noisy observations, then ask how well the fitted rule follows a separate underlying trend.",
    objective:
      "Distinguish underfitting from overfitting, calculate training and validation errors, and explain how regularization and cross-validation guide choices.",
    prerequisites: ["l08", "l09"],
    problem: {
      heading: "Can a perfect training fit learn the wrong details?",
      paragraphs: [
        "Start with the invented trend **y=2+x**. At inputs **−1, −0.3, 0.3, 1**, add fixed noise **+0.4, −0.4, +0.4, −0.4**. The observed training targets become **1.4, 1.3, 2.7, 2.6**.",
        "A cubic polynomial has enough freedom to pass through all four observations. But those observations contain noise. We need a different set of points to find out whether that freedom helps.",
        "Our validation inputs are **−0.8, 0, 0.8**, with targets from the original trend. These clean points expose this teaching example’s mechanism; a real validation set is also noisy and finite.",
      ],
    },
    intuition: {
      heading: "Fitting observations and finding a transferable rule differ.",
      paragraphs: [
        "**Underfitting** means a model misses useful structure. A constant cannot follow this rising trend. **Overfitting** means fitting details specific to training data that do not transfer well. The cubic can fit the supplied noise as well as the trend.",
        "**Regularization** changes which fitted solutions we prefer. Here we penalize large polynomial coefficients, excluding the intercept. That trades some training fit for a less flexible curve. Whether that tradeoff helps must be checked on validation data.",
        "**Validation** guides choices such as polynomial degree, penalty strength, or when to stop training. Keep the final test set outside that tuning loop. Repeatedly tuning against one small validation set can overfit that set too.",
      ],
      limit:
        "Polynomial interpolation is a small illustration of overfitting, not a universal law that larger models always generalize worse. Modern deep-learning curves can be more complicated.",
    },
    walkthrough: {
      heading: "Compare the same data under different constraints.",
      intro:
        "Use average squared error for every model so the scores remain comparable.",
      steps: [
        {
          title: "Fit a constant",
          calculation: "mean training target = (1.4+1.3+2.7+2.6)/4 = 2",
          why: "This is the best constant under squared loss, but it ignores the relationship between input and target.",
        },
        {
          title: "Fit a line",
          calculation: "f(x) = 2 + 0.743119…x",
          why: "Least squares balances all four residuals. It does not need to pass through any individual point.",
        },
        {
          title: "Allow cubic interpolation",
          calculation: "f(x) = 2 + 2.504762…x − 1.904762…x³",
          why: "Four coefficients can interpolate four distinct inputs here. Its training error reaches zero, including the noise.",
        },
        {
          title: "Evaluate outside the fitting rows",
          calculation:
            "validation MSE = average((f(x)−(2+x))²), for x∈{−0.8,0,0.8}",
          why: "The validation points were excluded from coefficient fitting. Compare their error across the constant, line, cubic, and penalized cubic.",
        },
      ],
    },
    prediction: {
      prompt:
        "You monitor a neural model during training and want to choose the checkpoint before it begins fitting training-specific noise. Which data should guide that early-stopping choice?",
      options: [
        "The training set only",
        "The validation set",
        "The final test set, repeatedly",
      ],
      correct: 1,
      answer: [
        "Use the **validation set** to guide the choice. Training loss alone does not measure transfer, and repeatedly using the final test set turns it into tuning data.",
        "After choices are locked, use the untouched test set for a final evaluation. The quality of that estimate still depends on sampling and the deployment question.",
      ],
    },
    experimentIntro:
      "Compare constant, linear, and cubic fits. Add a coefficient penalty, then reverse the fixed noise to see how an interpolating curve responds. Step through a separate two-fold refitting calculation.",
    math: {
      heading: "Regularization adds a preference to the fitting objective.",
      intro: [
        "Write a degree-d polynomial as c₀+c₁x+…+c_dxᵈ. The fitting code solves the least-squares system using all training rows.",
      ],
      rules: [
        {
          label: "Unpenalized objective",
          formula: "minimize (1/n)Σ(f(xᵢ)−yᵢ)²",
        },
        {
          label: "Our ridge-style penalty",
          formula: "minimize MSE_train + λΣⱼ₌₁ᵈ cⱼ²; c₀ is unpenalized",
        },
        {
          label: "Held-out score",
          formula: "MSE_validation = (1/m)Σ(f(xⱼ)−yⱼ)² on excluded rows",
        },
        {
          label: "Two-fold estimate",
          formula:
            "refit on fold 1, score fold 2; swap; average the two scores",
        },
      ],
      paragraphs: [
        "The experiment’s two-fold illustration refits a degree-1 model, rather than pretending a cubic can always be uniquely fitted on only two rows. Each fold trains a fresh model using only its training observations.",
        "Fold assignment must respect the unit that must be new: customers, sources, or future time. Fit preprocessing within each training fold. For time-ordered forecasts, a random fold split may answer the wrong question.",
        "Early stopping and data augmentation are other forms of regularization. Augmentation must preserve the target’s meaning; rotating an image is not automatically valid for every label.",
      ],
      limit:
        "The penalty 0.1 shrinks coefficients but raises validation MSE here from about 0.0348 to 0.0576. That is evidence against this penalty setting on this validation fixture, not a reason to tune against the final test set. Our validation points follow a known synthetic trend. Real-world validation estimates have sampling uncertainty, and choosing among many configurations can make the selected score optimistic.",
    },
    transfer: {
      prompt:
        "Your dataset contains five photos of each object. Would random photo-level folds necessarily estimate performance on completely new objects?",
      answer: [
        "No. Views of the same object could occur in training and validation. **Group folds by object** when the evaluation question concerns unseen objects.",
        "Model selection is only as useful as the information boundary it respects. A sophisticated regularizer cannot repair an evaluation that leaks identities.",
      ],
    },
    takeaways: [
      "Training error can fall while validation error gets worse.",
      "Regularization trades fitting freedom for a declared preference.",
      "Refit within every fold and keep the final test set outside tuning.",
    ],
    sources: [
      {
        title: "scikit-learn · Cross-validation",
        url: "https://scikit-learn.org/stable/modules/cross_validation.html",
      },
      {
        title: "scikit-learn · Ridge regression",
        url: "https://scikit-learn.org/stable/modules/linear_model.html#ridge-regression-and-classification",
      },
    ],
  },
  {
    slug: "l11",
    sourceId: "L11",
    deck: "Count eight fixed predictions, change the action threshold, and compare probability estimates with observed frequencies.",
    objective:
      "Calculate confusion counts, precision, recall, F1, accuracy, and a declared mistake cost; distinguish threshold performance from calibration.",
    prerequisites: ["l05", "l09"],
    problem: {
      heading: "Which mistakes disappear when you raise a threshold?",
      paragraphs: [
        "Eight messages have model scores **0.95, 0.80, 0.70, 0.60, 0.40, 0.20, 0.10, 0.05**. The messages at **0.95, 0.70, and 0.40** are actually spam; the other five are ordinary.",
        "At threshold 0.5, we flag the first four messages. That catches two spam messages, raises two false alarms, and misses one spam message. A single accuracy number hides those different outcomes.",
        "We will keep every score and label fixed. Changing the threshold changes which action is taken, allowing us to examine the tradeoff directly.",
      ],
    },
    intuition: {
      heading: "Choose a denominator that matches the question.",
      paragraphs: [
        "**Precision** asks: of messages we flagged, how many were spam? **Recall** asks: of the actual spam messages, how many did we flag? Their denominators are different.",
        "A **confusion matrix** counts true positives (spam flagged), false positives (ordinary messages flagged), false negatives (spam passed), and true negatives (ordinary messages passed). Every example enters one cell.",
        "**Calibration** asks another question: among cases assigned a probability near p, is the positive frequency near p? A model can rank examples well while its probabilities are overconfident. A thresholded confusion matrix cannot answer that frequency question by itself.",
      ],
      limit:
        "Eight examples and two probability bins are deliberately small. They make the arithmetic inspectable, not a dependable estimate of a real filter. A probability estimate can behave differently by subgroup or after a population shift.",
    },
    walkthrough: {
      heading: "Count first, then calculate the rates.",
      intro: "Use threshold 0.5 and count every example exactly once.",
      steps: [
        {
          title: "Build the confusion matrix",
          calculation: "TP=2, FP=2, FN=1, TN=3; total=8",
          why: "The missed positive has score 0.40. The false alarms have scores 0.80 and 0.60.",
        },
        {
          title: "Compare precision and recall",
          calculation: "precision=2/(2+2)=0.5; recall=2/(2+1)=2/3",
          why: "Flagged messages and actual spam messages form different comparison groups.",
        },
        {
          title: "Summarize with care",
          calculation: "F1=2TP/(2TP+FP+FN)=4/7; accuracy=(2+3)/8=0.625",
          why: "F1 balances precision and recall through a harmonic mean. It does not include true negatives or your operational costs.",
        },
        {
          title: "Price the declared mistakes",
          calculation: "cost = 1×FP + 4×FN = 2+4=6",
          why: "This exercise makes a missed spam message four times as costly as a false flag. Different applications can require different costs.",
        },
      ],
    },
    prediction: {
      prompt:
        "Only 1% of records are positive. A model labels every record negative. Can its accuracy be 99% while its positive recall is zero?",
      options: [
        "Yes",
        "No; accuracy and recall must agree",
        "No; recall is 99% too",
      ],
      correct: 0,
      answer: [
        "**Yes.** It correctly labels the 99% negative group but misses every positive, so recall is 0.",
        "Precision is undefined because it predicts no positives. Some software substitutes a configured value; report that convention rather than silently treating it as a measured rate.",
      ],
    },
    experimentIntro:
      "Count the same eight records under several thresholds, including a no-positive-predictions boundary. Then inspect the two probability bins to separate calibration from classification actions.",
    math: {
      heading:
        "Threshold curves describe tradeoffs, not a universal best cutoff.",
      intro: [
        "Sweeping the threshold produces many confusion matrices. ROC and precision–recall curves plot different summaries of that sweep.",
      ],
      rules: [
        {
          label: "Precision and recall",
          formula: "precision=TP/(TP+FP); recall=TP/(TP+FN)",
        },
        {
          label: "F1 and accuracy",
          formula: "F1=2TP/(2TP+FP+FN); accuracy=(TP+TN)/N",
        },
        {
          label: "ROC coordinates",
          formula: "x = false-positive rate = FP/(FP+TN); y = recall",
        },
        {
          label: "Precision–recall coordinates",
          formula: "x = recall; y = precision",
        },
        {
          label: "Calibration bin",
          formula:
            "compare mean(score in bin) with positives_in_bin / bin_size",
        },
      ],
      paragraphs: [
        "For scores below 0.5, the mean predicted probability is (0.40+0.20+0.10+0.05)/4=0.1875; the observed positive fraction is 1/4=0.25. For scores at least 0.5, the mean is 0.7625 but the observed fraction is 0.5.",
        "These bin differences are observations about a tiny sample. Bin boundaries, sample size, subgroup composition, and changes in deployment data affect their interpretation. A score of 0.9 does not guarantee a 90% chance of correctness in every subgroup.",
        "If a denominator is zero, the experiment explicitly says Undefined. A threshold above all scores yields no flagged messages, so precision cannot be calculated, while recall is zero because the dataset does contain positives.",
      ],
      limit:
        "AUC, F1, and accuracy do not encode every consequence of a decision. Choose metrics and thresholds using the actual task, then evaluate on data that matches the intended use.",
    },
    transfer: {
      prompt:
        "Raise our spam threshold from 0.5 to 0.85. Precision becomes 1, but does the declared total cost improve?",
      answer: [
        "No. Counts become **TP=1, FP=0, FN=2, TN=5**. Cost becomes **0+4×2=8**, worse than the original 6.",
        "Perfect precision describes the one flag that remains. It does not account for the additional missed spam or determine the best action rule.",
      ],
    },
    takeaways: [
      "Precision and recall use different denominators.",
      "A threshold changes the mix and cost of mistakes.",
      "Calibration checks probability frequencies and needs its own evaluation.",
    ],
    sources: [
      {
        title: "scikit-learn · Classification metrics",
        url: "https://scikit-learn.org/stable/modules/model_evaluation.html",
      },
      {
        title: "scikit-learn · Probability calibration",
        url: "https://scikit-learn.org/stable/modules/calibration.html",
      },
    ],
  },
];

classicalLessons.push(
  {
    slug: "l12",
    sourceId: "L12",
    deck: "Keep six labeled observations and one query. Change the algorithm, then inspect how the prediction is produced.",
    objective:
      "Trace neighbors, tree splits, ensemble aggregation, residual corrections, margin losses, and naive-Bayes factors without treating their scores as interchangeable probabilities.",
    prerequisites: ["l09", "l10", "l11"],
    problem: {
      heading:
        "Where does a prediction come from if there are no neural layers?",
      paragraphs: [
        "Six observations have inputs **x=[0,1,2,3,4,5]** and binary labels **y=[0,0,1,0,1,1]**. A new query has **x=2.2**. No correct label is supplied for that query.",
        "One method looks at nearby stored observations. Another routes the query through a fitted feature test. Others combine trees, optimize a margin, or multiply estimated likelihoods. Their mechanisms make different assumptions.",
        "We will inspect these differences on the same small dataset. This comparison teaches how predictions are constructed; it does not decide which method is best on a real task.",
      ],
    },
    intuition: {
      heading: "Choose a rule for turning examples into a prediction.",
      paragraphs: [
        "**k-nearest neighbors** stores examples and uses nearby labels. Distance and feature scaling matter. **Decision trees** fit feature tests that route inputs into leaves. A one-split tree, or **stump**, makes its entire rule visible.",
        "A **random forest** averages many randomized trees. Our one-feature illustration uses three supplied bootstrap resamples and shallow trees; there is no feature-subset variation with only one feature. **Gradient boosting** instead adds corrections sequentially to the current ensemble.",
        "A **support vector machine** balances a margin-based objective against model complexity. **Naive Bayes** combines class priors and feature likelihoods using a conditional-independence assumption. These are different routes to a score, not different names for a neural network.",
      ],
      limit:
        "The trees are deliberately shallow, the SVM uses a finite subgradient run, and the boosting example uses squared loss on binary targets. These expose mechanisms rather than reproducing a production library’s full training procedure.",
    },
    walkthrough: {
      heading: "Reuse the query while changing the mechanism.",
      intro:
        "The labels around x=2.2 are not perfectly ordered. That makes the assumptions visible.",
      steps: [
        {
          title: "Look at the nearest observation",
          calculation: "k=1: nearest x=2, label=1 → predict 1",
          why: "The closest stored example is 0.2 away. No neural weights are fitted.",
        },
        {
          title: "Widen the neighborhood",
          calculation: "k=3: x=2,3,1 have labels 1,0,0 → predict 0",
          why: "Changing the neighborhood changes the local majority while the query and original labels stay fixed.",
        },
        {
          title: "Fit a feature test",
          calculation:
            "Best one-split cut: x≤1.5; right leaf positive fraction=3/4",
          why: "Candidate midpoints are evaluated on training labels. Query 2.2 takes the right branch and receives that leaf’s value.",
        },
        {
          title: "Add a residual correction",
          calculation: "Start f₀=0.5; residual rᵢ=yᵢ−f₀; f₁=f₀+0.5×stump(r)",
          why: "Boosting fits what the current ensemble has left unexplained. A new stump depends on the previous prediction.",
        },
        {
          title: "Penalize margin violations",
          calculation: "hinge loss=max(0,1−y(wx+b)), with y∈{−1,+1}",
          why: "A correctly signed score can still incur loss if its margin is below 1. The score is not a probability.",
        },
        {
          title: "Multiply conditional likelihoods",
          calculation:
            "A=(x≥2), B=(x≥4); query is A and not B; class weights both equal 0.16",
          why: "Smoothed naive-Bayes factors give a posterior of 0.5 here. The derived features are dependent, so the simplifying assumption is visibly imperfect.",
        },
      ],
    },
    prediction: {
      prompt:
        "At query 2.2, the closest label is 1, but the closest three labels are 1,0,0. Does changing k from 1 to 3 require changing the query to change the prediction?",
      options: [
        "Yes",
        "No; the neighborhood rule changes the vote",
        "No, because k never affects a prediction",
      ],
      correct: 1,
      answer: [
        "No. **The neighborhood changes**. With k=1 the prediction is 1; with k=3 the local majority predicts 0.",
        "That is a consequence of the declared rule, not evidence that one k is universally better. Choose and evaluate k using a valid model-selection procedure.",
      ],
    },
    experimentIntro:
      "Compare the two neighbor rules, a fitted stump, three bootstrap trees, residual boosting, a soft-margin run, and smoothed naive Bayes. Inspect each method’s intermediate evidence and score type.",
    math: {
      heading: "Read each score according to its training rule.",
      intro: [
        "The experiment keeps its arithmetic explicit. Neighbor votes, tree leaf fractions, regression scores, margins, and model-based posteriors do not have identical interpretations.",
      ],
      rules: [
        {
          label: "Neighbor vote",
          formula: "positive fraction = sum(neighbor labels)/k",
        },
        {
          label: "Tree leaf",
          formula: "leaf value = average(labels in that leaf)",
        },
        {
          label: "Bootstrap ensemble",
          formula: "output = average(tree leaf values on the same query)",
        },
        {
          label: "Squared-loss boosting",
          formula: "rᵢ=yᵢ−f(xᵢ); f_new=f_old+η×fitted_residual_stump",
        },
        {
          label: "Our soft-margin objective",
          formula: "½w² + mean(max(0,1−y(wx+b)))",
        },
        {
          label: "Naive Bayes",
          formula: "P(c|features) ∝ P(c)∏ⱼP(featureⱼ|c)",
        },
      ],
      paragraphs: [
        "For naive Bayes we add one success and one failure when estimating each binary feature likelihood. Class 1 has P(A)=4/5 and P(B)=3/5; class 0 has P(A)=2/5 and P(B)=1/5. At A=true, B=false, both class weights equal 0.16.",
        "A forest usually adds further randomness, including feature subsampling, and can grow deeper trees. A kernel SVM can represent a nonlinear boundary through a chosen similarity function. Neither extension removes the need to select assumptions and evaluate generalization.",
        "Features measured in large numerical units can dominate distance-based methods. Fit any learned scaling on training data only, and apply it consistently to stored examples and queries.",
      ],
      limit:
        "A vote fraction or leaf fraction is not automatically calibrated. No method wins on every dataset; data size, geometry, missingness, objectives, interpretability, and deployment constraints all matter.",
    },
    transfer: {
      prompt:
        "You change a distance feature from kilometers to meters but leave another feature in hours. Can a nearest-neighbor prediction change even though the underlying trip is identical?",
      answer: [
        "Yes. The numerical distance contribution becomes much larger unless the metric or preprocessing compensates. **Units affect the geometry** used to choose neighbors.",
        "Define scaling and distance deliberately, fit any scaling statistics within the training split, and evaluate the resulting procedure rather than assuming raw units are comparable.",
      ],
    },
    takeaways: [
      "Classical methods produce predictions through distinct, inspectable mechanisms.",
      "Ensemble averaging and sequential residual correction are different operations.",
      "A score’s interpretation depends on its objective and assumptions.",
    ],
    sources: [
      {
        title: "scikit-learn · Supervised algorithm families",
        url: "https://scikit-learn.org/stable/supervised_learning.html",
      },
      {
        title: "scikit-learn · Nearest neighbors",
        url: "https://scikit-learn.org/stable/modules/neighbors.html",
      },
    ],
  },
  {
    slug: "l13",
    sourceId: "L13",
    deck: "Use twelve points to see how centers, density, and projection directions reveal different kinds of structure.",
    objective:
      "Trace k-means assignments and means, distinguish density-based noise, and calculate the variance retained by a one-dimensional projection.",
    prerequisites: ["l03", "l07", "l12"],
    problem: {
      heading: "Which structure are we asking the geometry to preserve?",
      paragraphs: [
        "Our twelve points lie at x coordinates **−3, −2, 2, 3**, with y coordinates **−1, 0, 1** at each x. Their mean is **[0,0]**. The picture has two separated regions, but no human class labels.",
        "We can ask for nearby groups, a low-dimensional summary, or a measure of how unusual a new point is. Those are different questions, so we should expect different operations and outputs.",
        "The experiment keeps these points visible while changing initialization, projection direction, or the grouping rule. A nested-ring variation exposes a limitation of nearest-center grouping.",
      ],
    },
    intuition: {
      heading: "The objective determines what counts as useful structure.",
      paragraphs: [
        "**K-means** alternates two operations: assign each point to its nearest center, then replace each center with its assigned mean. It prefers compact groups under squared Euclidean distance. A center count and initialization must be supplied.",
        "**DBSCAN** expands density-connected regions from points with sufficiently many nearby neighbors. Under its chosen radius and minimum count, it can mark unsupported points as noise. Noise is a description relative to these settings, not proof that a record is bad.",
        "**PCA**, principal component analysis, finds orthogonal directions of high variance. A one-dimensional projection keeps one signed coordinate and discards perpendicular information. **Anomaly detection** scores deviation from a baseline; usefulness depends on what that baseline represents.",
      ],
      limit:
        "The examples use two numeric coordinates and twelve baseline points. Similarity, scaling, density parameters, and the sample itself determine what becomes visible. Groups do not automatically correspond to meaningful human categories.",
    },
    walkthrough: {
      heading: "Change one geometric operation at a time.",
      intro: "First use centers [−3,0] and [3,0].",
      steps: [
        {
          title: "Assign points to centers",
          calculation: "For [−2,1], squared distance to A is 2; to B it is 26",
          why: "The point joins group A while both centers remain fixed. Equal distances use the declared A-first tie rule.",
        },
        {
          title: "Move the means",
          calculation: "A → [−2.5,0]; B → [2.5,0]; total squared distance = 11",
          why: "Each center becomes the average of its six assigned points. Movement follows membership, rather than replacing the assignment step.",
        },
        {
          title: "Project onto a unit direction",
          calculation: "u=[1,0]; projected coordinate of [−3,−1] is −3",
          why: "The dot product keeps horizontal position and loses vertical position. Distinct original points can share one projected coordinate.",
        },
        {
          title: "Measure retained variance",
          calculation:
            "horizontal variance=6.5; total=6.5+2/3; retained≈90.70%",
          why: "This fixture varies much more horizontally. Rotating to the vertical direction retains only about 9.30%.",
        },
        {
          title: "Inspect a distant point",
          calculation:
            "Distance from [8,0] to nearest baseline center [2.5,0] is 5.5",
          why: "The point is unusual under this distance baseline. DBSCAN also marks it noise with radius 1.1 and minimum neighborhood size 3.",
        },
      ],
    },
    prediction: {
      prompt:
        "A PCA direction retains the most variance. Does that guarantee it preserves the information needed for a later classification task?",
      options: [
        "Yes; variance is the same as relevance",
        "No; PCA does not use that task’s labels",
        "Yes, if the projection looks separated",
      ],
      correct: 1,
      answer: [
        "No. **PCA does not know the downstream labels**. A low-variance direction could contain the distinction that a classifier needs.",
        "Evaluate the full downstream procedure. A compact or visually attractive projection is not a guarantee that important relationships survived.",
      ],
    },
    experimentIntro:
      "Step through two k-means rounds, try identical initial centers, and compare nested rings. Rotate a projection through 0°, 45°, and 90°. Then add a distant point and inspect density grouping and a separate anomaly score.",
    math: {
      heading: "Write down the geometry before interpreting the picture.",
      intro: [
        "Squared distance and projection calculations depend on coordinate units. Centered data removes the mean but does not automatically put differently scaled features on comparable footing.",
      ],
      rules: [
        {
          label: "K-means assignment",
          formula: "group(x) = argmin_c ||x−center_c||²",
        },
        {
          label: "Center update",
          formula: "center_c = average(points assigned to c)",
        },
        {
          label: "Our empty-group policy",
          formula: "if a group has no points, retain its previous center",
        },
        { label: "Unit projection", formula: "zᵢ = (xᵢ−mean)·u, with ||u||=1" },
        {
          label: "Retained fraction",
          formula: "variance(z) / sum(original coordinate variances)",
        },
        {
          label: "Density rule",
          formula:
            "radius=1.1; core neighborhood size≥3, including the point itself",
        },
      ],
      paragraphs: [
        "At 45°, the projected variance is 3.5833, exactly half the total for these centered points with zero cross-covariance. The horizontal direction is the leading PCA direction; the vertical direction is orthogonal to it.",
        "With identical initial centers, all points initially tie into A. B is empty. Retaining B’s old center lets the next assignment differ; other implementations may reinitialize empty groups. The policy must be stated instead of dividing by zero.",
        "Nested rings are not well described by two nearest-center regions. Density methods can express other shapes, but their radius and minimum-density settings introduce their own assumptions and failure cases.",
      ],
      limit:
        "K-means can reach different local solutions and its iterations do not supply a semantic label. A distance threshold for anomalies is a chosen rule; rare events can be valid, and frequent events can still be harmful.",
    },
    transfer: {
      prompt:
        "A feature measuring background noise has much larger variance than a subtle signal that identifies the target. If PCA keeps only the noisy direction, what has gone wrong?",
      answer: [
        "PCA optimized its stated objective: **retain variance**, not target information. The high-variance feature won even though it was irrelevant to the later task.",
        "Inspect units and preprocessing, consider a task-aware representation, and validate the downstream model. More variance is not a universal measure of usefulness.",
      ],
    },
    takeaways: [
      "K-means separates assignment from mean updates.",
      "Density, distance, and projection answer different structural questions.",
      "Retained variance does not guarantee retained task relevance.",
    ],
    sources: [
      {
        title: "scikit-learn · Clustering",
        url: "https://scikit-learn.org/stable/modules/clustering.html",
      },
      {
        title: "scikit-learn · PCA",
        url: "https://scikit-learn.org/stable/modules/decomposition.html#pca",
      },
    ],
  },
  {
    slug: "l14",
    sourceId: "L14",
    deck: "Compare selecting observations with changing a causal mechanism, then examine a frozen prediction interval after a distribution shift.",
    objective:
      "Separate association from intervention, distinguish sources of uncertainty, and explain the assumptions behind marginal prediction-interval coverage.",
    prerequisites: ["l05", "l08", "l09", "l10", "l11"],
    problem: {
      heading: "Does a useful predictor tell us what an intervention will do?",
      paragraphs: [
        "In an invented population of **200 days**, half are hot and half are cool. Hot weather raises both ice-cream sales and swimming. High sales therefore predicts swimming, even though sales has no causal effect on swimming in our declared model.",
        "We can **observe high-sales days**, which selects a particular weather mix, or **set sales high**, which changes the sales mechanism while preserving the weather mix. These operations answer different questions.",
        "A second experiment asks about prediction uncertainty: after calibrating an interval on held-out errors, what happens if the evaluation outcomes shift? A frozen interval cannot silently adapt to new data.",
      ],
    },
    intuition: {
      heading:
        "Prediction, intervention, and uncertainty need their own assumptions.",
      paragraphs: [
        "A **confounder** influences both an observed predictor and an outcome. Here weather is a common cause. Filtering by sales changes which weather conditions are common in the selected group. Intervening on sales does not have that selection effect.",
        "**Distribution shift** means deployment data differs from the data used to develop or calibrate the system. The input mix can change, the outcome relationship can change, or both. Performance and uncertainty estimates need not transfer unchanged.",
        "**Aleatoric uncertainty** concerns variability remaining under a chosen observation setup. **Epistemic uncertainty** concerns limited knowledge about the mechanism or model. The distinction depends on what is observed and assumed; a confident score does not resolve either one by itself.",
      ],
      limit:
        "The causal arrows are declared assumptions in a synthetic simulator. They are not inferred merely from the counts. In real problems, identifying intervention effects requires an appropriate design and defensible assumptions.",
    },
    walkthrough: {
      heading: "Keep the operation and its denominator visible.",
      intro:
        "Weather generates sales and swimming independently conditional on its state.",
      steps: [
        {
          title: "Generate the population",
          calculation:
            "Cool: 100 days, 10 high-sales, 20 swimming; hot: 100 days, 90 high-sales, 80 swimming",
          why: "The common cause changes both variables. Within each weather state, changing sales is not part of the swimming rule.",
        },
        {
          title: "Observe high sales",
          calculation: "P(swim | high sales)=(2+72)/(10+90)=0.74",
          why: "The filtered group contains 90 hot days and only 10 cool days. The weather mix differs from the original population.",
        },
        {
          title: "Intervene on sales",
          calculation: "P(swim | do(high sales))=0.5×0.2+0.5×0.8=0.5",
          why: "Setting sales leaves the original 50/50 weather distribution unchanged. The association 0.74 is not this intervention effect.",
        },
        {
          title: "Calibrate a separate prediction interval",
          calculation:
            "n=9, α=0.2; quantile rank=ceil((9+1)×0.8)=8; radius=0.6",
          why: "Use held-out absolute residuals from a frozen predictor. A finite-sample rank correction determines the radius.",
        },
        {
          title: "Keep the interval fixed after shift",
          calculation:
            "Evaluation coverage: 5/5 before the declared shift; 1/5 after adding 1 to each target residual",
          why: "The predictor and calibration radius stay fixed. A changed outcome relationship can break the conditions that justified the interval.",
        },
      ],
    },
    prediction: {
      prompt:
        "High ice-cream sales predicts swimming in these counts. Does that association by itself establish how forcing sales higher would change swimming?",
      options: [
        "Yes; the association is the causal effect",
        "No; observation and intervention differ",
        "Yes, if the sample is large enough",
      ],
      correct: 1,
      answer: [
        "No. **Observation and intervention differ.** Weather changes the composition of the observed high-sales group. A larger observational sample alone does not remove that confounding.",
        "The simulator’s no-effect conclusion follows from its supplied causal rules. Another causal model can require different evidence or a different conclusion.",
      ],
    },
    experimentIntro:
      "Compare filtering high-sales days with setting sales high. Then freeze a predictor and conformal radius, inspect the finite-sample quantile, and compare evaluation outcomes before and after a declared shift.",
    math: {
      heading: "Coverage is a statement about a procedure and a population.",
      intro: [
        "For the interval example, f(x)=2x is frozen before calibration. The nine absolute residuals are 0.1, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.6, 0.8.",
      ],
      rules: [
        {
          label: "Observational conditioning",
          formula: "P(Y|X=x) averages over the population selected by X=x",
        },
        {
          label: "Intervention",
          formula:
            "do(X=x) replaces X’s generating rule, leaving other declared rules intact",
        },
        {
          label: "Split-conformal score",
          formula: "rᵢ=|yᵢ−f(xᵢ)| on held-out calibration rows",
        },
        {
          label: "Finite-sample radius",
          formula: "k=ceil((n+1)(1−α)); q=kth sorted residual; if k>n, q=∞",
        },
        {
          label: "Prediction interval",
          formula: "[f(x)−q, f(x)+q]; here q=0.6",
        },
      ],
      paragraphs: [
        "The original evaluation errors are −0.5, −0.2, 0, 0.3, 0.5. All five lie within ±0.6. Adding 1 changes them to 0.5, 0.8, 1, 1.3, 1.5; only the first is covered. These are fixed teaching outcomes, not a theorem illustrated by a statistically representative sample.",
        "Under suitable exchangeability of calibration and future examples, split conformal gives a marginal repeated-sampling coverage statement. It does not guarantee the target rate for every individual, subgroup, location, or time period.",
        "Collecting more relevant data can reduce some epistemic uncertainty. Observing a useful missing variable can also change how much variability remains. Neither distinction makes a model immune to shift.",
      ],
      limit:
        "These examples do not infer a causal graph, estimate an effect from real observational data, or validate an uncertainty guarantee after shift. Their purpose is to expose which assumptions each conclusion uses.",
    },
    transfer: {
      prompt:
        "An interval method achieved its target marginal coverage last month. Is that enough to promise the same coverage for every subgroup next month after the target-generating process changes?",
      answer: [
        "No. **Marginal coverage is not subgroup coverage**, and a changed process can violate exchangeability. A past aggregate result cannot establish either promise.",
        "Evaluate the new setting, inspect relevant subgroups and information timing, and revisit the calibration procedure and its assumptions.",
      ],
    },
    takeaways: [
      "Association does not by itself identify an intervention effect.",
      "Uncertainty estimates depend on the observation setup and available knowledge.",
      "Marginal interval coverage needs assumptions that distribution shift can break.",
    ],
    sources: [
      {
        title: "Angelopoulos & Bates · Conformal prediction introduction",
        url: "https://arxiv.org/abs/2107.07511",
      },
      {
        title: "Pearl · Causal inference in statistics",
        url: "https://ftp.cs.ucla.edu/pub/stat_ser/r350.pdf",
      },
    ],
  },
);
