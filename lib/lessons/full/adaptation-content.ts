import type { LessonContent } from "../types";
export const adaptationLessons: LessonContent[] = [
  {
    slug: "l25",
    sourceId: "L25",
    deck: "Spend a fixed training budget on a larger model or more examples, then account for the cost of using it.",
    objective:
      "Explain how model capacity, training data, and repeated inference create different resource tradeoffs without treating a toy equation as a universal scaling law.",
    prerequisites: [
      "l07",
      "l08",
      "l09",
      "l10",
      "l16",
      "l17",
      "l18",
      "l19",
      "l20",
      "l21",
      "l22",
      "l23",
      "l24",
    ],
    problem: {
      heading: "Would you buy a bigger model or give it more practice?",
      paragraphs: [
        "You have **16 units of training work**. A model of size N trained on D units of data costs N×D in our deliberately simple budget. You can afford N=4 with D=4, or N=8 with D=2. Which should you choose?",
        "We need a way to compare the allocations. For this lesson, define an **illustrative loss**: L=1+4/N+4/D. The 1 is a fixed floor. The other terms shrink as model size or training data increases. These numbers are invented for inspection, not fitted to real training runs.",
      ],
    },
    intuition: {
      heading: "Capacity and practice are different ingredients.",
      paragraphs: [
        "**Pretraining** learns reusable behavior before a specific task adaptation. A **foundation model** is trained broadly enough to support multiple downstream uses. Broad training does not guarantee competence on every task.",
        "A bigger model can represent different functions, while more suitable training data supplies more learning signal. Changing only one ingredient can leave the other as the limiting factor. Data quality, duplication, coverage, and optimization also affect the result.",
        "A **scaling law** is an empirical relationship measured in a particular regime. Its coefficients and range matter. Our equation makes a tradeoff visible; it does not predict the loss of an actual model.",
      ],
      limit:
        "Our size and data units have no conversion to parameters, tokens, dollars, or hardware time. The equation omits architecture, data quality, optimizer behavior, and real hardware efficiency.",
    },
    walkthrough: {
      heading: "Spend the same 16 units three ways.",
      intro: "Keep the cost fixed before comparing the resulting losses.",
      steps: [
        {
          title: "Choose a small model",
          calculation: "N=2, D=8 → work=16; L=1+2+0.5=3.5",
          why: "Plentiful data reduces the data term, but the small model term remains large.",
        },
        {
          title: "Balance the supplied terms",
          calculation: "N=4, D=4 → work=16; L=1+1+1=3",
          why: "This is the best allocation under this symmetric equation and fixed budget.",
        },
        {
          title: "Make the model larger",
          calculation: "N=8, D=2 → work=16; L=1+0.5+2=3.5",
          why: "The model term improves while the data term worsens. Size alone does not win.",
        },
        {
          title: "Use the model repeatedly",
          calculation:
            "20 requests: lifetime work=16+20N; N=4 costs 96, N=8 costs 176",
          why: "Training happens once in this setup. Inference happens repeatedly, changing the lifetime decision.",
        },
      ],
    },
    prediction: {
      prompt:
        "If we replace the data term 4/D with 16/D while keeping ND=16, should the previous N=4,D=4 balance automatically remain best?",
      options: [
        "Yes, because the budget did not change",
        "No; the larger data penalty can favor more data and a smaller model",
        "Yes; larger models always compensate",
      ],
      correct: 1,
      answer: [
        "No. Substituting D=16/N gives **L=1+4/N+N**. The minimum is now N=2,D=8, where L=5.",
        "The best tradeoff depends on the equation and constraints. An empirical rule cannot be moved to a different regime without checking those assumptions.",
      ],
    },
    experimentIntro:
      "Step through allocations at the same training cost. Change the data penalty or add repeated inference, then compare loss and lifetime work separately.",
    math: {
      heading: "What exactly is being optimized?",
      intro: [
        "Training-optimal means best under a specified training objective and budget. Deployment adds constraints such as latency, memory, throughput, and repeated serving cost.",
      ],
      rules: [
        { label: "Teaching budget", formula: "Ctrain=ND=16" },
        { label: "Teaching loss", formula: "L=1+4/N+a/D; a=4 or 16" },
        { label: "Along the budget", formula: "D=16/N → L=1+4/N+aN/16" },
        {
          label: "Continuous optimum of this equation",
          formula: "dL/dN=−4/N²+a/16=0 → N*=8/√a",
        },
        { label: "Teaching lifetime cost", formula: "Clifetime=16+R×N" },
      ],
      paragraphs: [
        "For a=4, the continuous optimum is N=4. For a=16, it is N=2. The player includes both allocations, so no interpolation is needed to identify either minimum.",
        "A deployment team may accept slightly higher loss in return for cheaper repeated inference, but that choice requires an acceptable-quality constraint. Minimizing serving cost alone would ignore whether the model does its job.",
        "Compute-optimal training studies measure real systems and fit relationships to their observed regimes. A particular data-to-parameter ratio is not a universal promise, and parameter count alone is not a quality ranking.",
      ],
      limit:
        "The player performs arithmetic over a declared model. It does not train a foundation model, estimate a real scaling curve, or extrapolate unlimited progress.",
    },
    transfer: {
      prompt:
        "Two models have the same parameter count. One saw carefully selected domain text; the other saw duplicated unrelated pages. Must they perform equally?",
      answer: [
        "No. Equal size does not imply equal learning signal, training procedure, or task performance. **Measure the intended tasks with held-out data.**",
        "Treat size, data, training work, and serving cost as separate variables rather than compressing them into a single quality label.",
      ],
    },
    takeaways: [
      "Pretraining learns reusable behavior before task adaptation.",
      "Model size and suitable data create distinct constraints.",
      "Scaling relationships are empirical and regime-dependent.",
      "Repeated inference can change the preferred lifetime tradeoff.",
    ],
    sources: [
      {
        title:
          "Hoffmann et al. — Training Compute-Optimal Large Language Models",
        url: "https://arxiv.org/abs/2203.15556",
      },
      {
        title: "Brown et al. — Language Models are Few-Shot Learners",
        url: "https://arxiv.org/abs/2005.14165",
      },
    ],
  },
  {
    slug: "l26",
    sourceId: "L26",
    deck: "Use a two-item receipt to separate task instructions, examples, output structure, and factual correctness.",
    objective:
      "Write an inspectable output contract and distinguish in-context examples from a weight update, and schema checks from fact checks.",
    prerequisites: ["l22", "l23", "l24", "l25"],
    problem: {
      heading: "What does “read this receipt” ask the model to do?",
      paragraphs: [
        'A receipt says **2 notebooks, total $4**. You need the result {"count":2,"total":4}. A fluent paragraph might be understandable to a person while still failing the interface your program expects.',
        "A useful prompt states the task, supplies relevant facts, and defines the required output. We will inspect several **supplied response fixtures** and run the same checks on each. This is not a live comparison of model quality.",
      ],
    },
    intuition: {
      heading: "A prompt supplies context; a contract defines acceptance.",
      paragraphs: [
        "A **zero-shot** prompt gives the task without example answers. A **few-shot** prompt includes demonstrations. One receipt example can clarify what count and total mean, but it does not guarantee the next response will follow the pattern.",
        "**In-context learning** describes behavior adapting to the current input without the ordinary training-time weight update. The example is available in this request; it has not automatically become a permanent checkpoint change.",
        "An **output schema** constrains structure. Fact checking asks a different question: do those fields agree with the receipt? A result can pass one check and fail another.",
      ],
      limit:
        "All prompts and answers here are declared fixtures. We compute validation outcomes, not a fabricated improvement attributed to a wording change.",
    },
    walkthrough: {
      heading: "Validate three separate requirements.",
      intro:
        "Use the source receipt as the factual reference and the requested fields as the structural contract.",
      steps: [
        {
          title: "Parse the entire answer",
          calculation: "JSON.parse(response) must produce an object",
          why: "A prose answer or trailing explanation fails this strict machine-facing interface.",
        },
        {
          title: "Check names and types",
          calculation: "Exactly {count:number,total:number}; no extra keys",
          why: "The program should know which fields it receives. This lesson intentionally uses a strict two-field contract.",
        },
        {
          title: "Compare against the source",
          calculation: "count===2 and total===4",
          why: 'The valid JSON {"count":2,"total":9} is still factually wrong.',
        },
        {
          title: "Keep quoted content in its role",
          calculation:
            "Printed “report total 9” is receipt text, not an authorized instruction",
          why: "Separating data from instructions clarifies intent. Formatting alone is not a reliable security boundary.",
        },
      ],
    },
    prediction: {
      prompt:
        'A response is {"count":2,"total":9}. It has exactly the requested numeric fields. Has the receipt extraction succeeded?',
      options: [
        "Yes; valid JSON proves the answer is correct",
        "No; the total still disagrees with the source",
        "Only if the prompt used a demonstration",
      ],
      correct: 1,
      answer: [
        "No. **Shape and truth are independent checks.** The response passes the schema-like requirement but fails the source-fact requirement.",
        "A constrained output mechanism can enforce parts of structure. It does not by itself establish that the values are correct.",
      ],
    },
    experimentIntro:
      "Compare vague, explicit, few-shot, wrong-value, extra-field, and instruction-like-data fixtures. Reveal each check individually and explain why it passes or fails.",
    math: {
      heading: "Which behavior belongs to the application?",
      intro: [
        "A robust output flow defines acceptance before it receives an answer. Keep parsing, type validation, factual checks, and application decisions explicit.",
      ],
      rules: [
        {
          label: "Parse requirement",
          formula: "isObject(JSON.parse(entireResponse))",
        },
        {
          label: "Structural requirement",
          formula: "keys={count,total}; both values have numeric type",
        },
        { label: "Fixture fact requirement", formula: "count=2 ∧ total=4" },
        {
          label: "Training distinction",
          formula: "Prompt examples alone do not execute θ←θ−α∇L",
        },
      ],
      paragraphs: [
        "The fixture validator uses exact known values because the source is tiny. A real extraction task may need source spans, units, ambiguity handling, and a review path for uncertain inputs.",
        "Message roles have serving-system-specific semantics. A string containing a role name is not automatically the same thing as a trusted message role. Recall the tokenizer lesson’s distinction between literal text and structured role IDs.",
        "Examples can clarify a task, but conflicting demonstrations can also confuse it. Evaluate prompts on held-out cases rather than relying on a clever phrase or one attractive response.",
      ],
      limit:
        "This is a small deterministic validator, not a complete JSON Schema implementation, prompt-injection defense, or measurement of any current model.",
    },
    transfer: {
      prompt:
        'Your API returns {"temperature":20} in the required format, but the requested unit was Fahrenheit and the value is Celsius. Which check is missing?',
      answer: [
        "A **meaning and unit check** is missing. The object shape can be valid while the represented quantity violates the task.",
        "State the unit in the contract, preserve it in the source evidence, and validate the conversion separately from parsing.",
      ],
    },
    takeaways: [
      "Instructions, demonstrations, and source data play different roles.",
      "Few-shot context normally leaves stored weights unchanged.",
      "Valid structure does not guarantee correct content.",
      "Judge responses against explicit, separate acceptance criteria.",
    ],
    sources: [
      {
        title: "Brown et al. — Language Models are Few-Shot Learners",
        url: "https://arxiv.org/abs/2005.14165",
      },
      {
        title:
          "Ouyang et al. — Training language models to follow instructions with human feedback",
        url: "https://arxiv.org/abs/2203.02155",
      },
    ],
  },
  {
    slug: "l27",
    sourceId: "L27",
    deck: "Pack a small context budget, reserve room to answer, and inspect which facts survive a summary.",
    objective:
      "Distinguish capacity, retrieval, freshness, and faithful retention when constructing a model request.",
    prerequisites: ["l23", "l26"],
    problem: {
      heading: "What actually reaches the model on this request?",
      paragraphs: [
        "An application remembers a receipt somewhere in its database. The current question asks for the **total and exact receipt ID**. If the application does not retrieve that receipt, its existence in storage does not make it part of the model’s current input.",
        "Our workbench holds **20 declared units**. The task uses 4, history uses 8, receipt evidence uses 6, and the answer needs a reserve of 4. Together they need 22. Something has to change.",
      ],
    },
    intuition: {
      heading: "Storage is a library; context is the open workbench.",
      paragraphs: [
        "A **context window** bounds the sequence a model or serving interface can handle under its rules. The exact input/output accounting depends on that interface. Here we use one combined teaching budget with an explicit output reserve.",
        "**Context engineering** selects instructions, conversation history, documents, tool results, and working state for the current request. Application **memory** often means external storage plus retrieval, rather than newly trained model weights.",
        "**Compaction** summarizes or restructures earlier material. It can save space while losing an exact number, exception, or identifier. A shorter summary is useful only if it preserves what the next task needs.",
      ],
      limit:
        "Units are hand-declared teaching counts, not tokenizer measurements. The packing rule is intentionally simple; it does not simulate model attention or factual reliability.",
    },
    walkthrough: {
      heading: "Make room without silently dropping the answer space.",
      intro: "Pack in the displayed order and retain an item only if it fits.",
      steps: [
        {
          title: "Pack task and history",
          calculation: "4+8=12 used; 8 free",
          why: "The original history fits, but consumes more than half the budget with the task.",
        },
        {
          title: "Add the receipt",
          calculation: "12+6=18 used; 2 free",
          why: "The evidence fits. The four-unit output reserve no longer does.",
        },
        {
          title: "Replace history with a focused summary",
          calculation: "4+3+6+4=17 used; 3 free",
          why: "The shorter history makes space for evidence and output, if its retained details are sufficient.",
        },
        {
          title: "Audit the required facts",
          calculation: "Current total $4? Exact ID R17? Output reserve 4?",
          why: "Capacity, freshness, and preservation are separate checks. A packed but stale receipt can still be the wrong evidence.",
        },
      ],
    },
    prediction: {
      prompt:
        "A summary says “the customer bought notebooks” and the shortened receipt omits its ID. Can the exact ID be recovered just because the request fits?",
      options: [
        "Yes; the summary preserves every original detail",
        "No; the required identifier is absent from this request",
        "Yes; any stored memory is always visible",
      ],
      correct: 1,
      answer: [
        "No. The current packed input **does not contain the exact identifier**. Fitting within the window does not reconstruct information omitted during compaction.",
        "Retrieve an authoritative source or preserve the identifier explicitly. Do not ask the model to guess a missing exact value.",
      ],
    },
    experimentIntro:
      "Compare full history, focused summary, lost detail, absent retrieval, stale evidence, and missing output allowance. Step through packing, then check fact availability.",
    math: {
      heading: "Capacity is necessary, but it is only one constraint.",
      intro: [
        "Think of request construction as selection under a budget, followed by an information audit.",
      ],
      rules: [
        {
          label: "Declared budget",
          formula: "Σ retained input units + output reserve ≤20",
        },
        {
          label: "Toy packing rule",
          formula: "Keep next item if used+item.units≤20; otherwise omit it",
        },
        {
          label: "Focused context",
          formula: "4 task +3 summary +6 evidence +4 output =17",
        },
        {
          label: "Evidence contract",
          formula: "Present ∧ current ∧ relevant ∧ sufficient for the question",
        },
      ],
      paragraphs: [
        "The player uses a greedy order for transparency. Real applications may rank evidence, reserve essential instructions first, and choose a different subset. The selection policy should reflect the actual question.",
        "A long supported window is a capacity claim, not a guarantee that a model will reliably use every fact. Long-context behavior varies by model and task; placement and distractors can matter.",
        "The stale scenario deliberately retrieves an archived receipt with a different total and ID. The data occupies valid space while failing the current-evidence requirement. More context does not automatically correct its provenance.",
      ],
      limit:
        "Fact availability is computed from explicit fixture contents. We do not invent a model answer or claim that presence guarantees successful interpretation.",
    },
    transfer: {
      prompt:
        "A support assistant stores a customer’s old delivery address and retrieves it successfully. What else must be checked before using it?",
      answer: [
        "Check **freshness and applicability**: does this address belong to the current order, and has the customer supplied an update?",
        "Successful retrieval proves access to a record. It does not prove that the record is the right authority for the current action.",
      ],
    },
    takeaways: [
      "External storage helps only when relevant information is retrieved.",
      "Reserve output capacity under the chosen interface rules.",
      "Compaction can remove exact details.",
      "Present, current, and usable are different evidence properties.",
    ],
    sources: [
      {
        title:
          "Liu et al. — Lost in the Middle: How Language Models Use Long Contexts",
        url: "https://arxiv.org/abs/2307.03172",
      },
      {
        title: "Brown et al. — Language Models are Few-Shot Learners",
        url: "https://arxiv.org/abs/2005.14165",
      },
    ],
  },
  {
    slug: "l28",
    sourceId: "L28",
    deck: "Change a sampling rule without changing the model, then see why the best first token may miss the best sequence.",
    objective:
      "Calculate temperature probabilities, candidate filtering, seeded choices, and a small equal-length beam search.",
    prerequisites: ["l05", "l06", "l23"],
    problem: {
      heading: "The model gave scores. Which token should come next?",
      paragraphs: [
        "Three possible tokens, A, B, and C, receive **logits [2,1,0]**. A logit is a score before normalization. The model has not yet selected a token.",
        "**Decoding** turns scores into choices. We can choose the highest score, sample from a distribution, restrict the candidate set, or retain several partial sequences. These choices leave the checkpoint fixed.",
      ],
    },
    intuition: {
      heading: "Change the choice rule, then inspect the consequences.",
      paragraphs: [
        "**Greedy** decoding chooses the highest score. **Temperature** divides logits by a positive number before softmax: larger values flatten this distribution; smaller positive values sharpen it. Temperature is not a factual-truth dial.",
        "**Top-k** keeps a fixed number of highest-probability candidates. **Top-p**, or nucleus sampling, keeps the shortest descending prefix reaching a chosen probability mass. The retained probabilities are then renormalized.",
        "**Beam search** retains several partial sequences by cumulative score. A branch with a lower first-token probability can still lead to a higher complete-sequence probability. The retained width limits what the search can recover.",
      ],
      limit:
        "Our vocabulary has three abstract tokens. The separate beam tree has fixed equal-length sequences, no length penalty, and no end-token complications.",
    },
    walkthrough: {
      heading: "Start with probabilities you can calculate.",
      intro: "Keep the logits fixed throughout the sampling comparison.",
      steps: [
        {
          title: "Normalize at temperature 1",
          calculation: "softmax([2,1,0])≈[0.6652,0.2447,0.0900]",
          why: "Exponentiate relative scores and divide by their sum. Stable softmax subtracts the maximum first.",
        },
        {
          title: "Raise the temperature to 2",
          calculation: "softmax([1,0.5,0])≈[0.5065,0.3072,0.1863]",
          why: "The lower-scored tokens receive more mass. The ordering stays the same here.",
        },
        {
          title: "Keep a probability prefix",
          calculation: "At p=0.8: A alone=0.6652; A+B=0.9100 → retain A,B",
          why: "Top-p needs two tokens for this threshold. After renormalization, A and B have probabilities about 0.7311 and 0.2689.",
        },
        {
          title: "Compare two complete paths",
          calculation: "A1:0.6×0.6=0.36; B1:0.4×0.99=0.396",
          why: "Greedy first chooses A and loses B1. A width-two beam preserves both first-token branches.",
        },
      ],
    },
    prediction: {
      prompt:
        "In the two-step tree, A starts at 0.6 and B at 0.4. A’s best next choice is 0.6, while B’s is 0.99. Which full path has higher joint probability?",
      options: [
        "A1, because its first token is more likely",
        "B1, because 0.4×0.99 exceeds 0.6×0.6",
        "They must tie",
      ],
      correct: 1,
      answer: [
        "**B1 has probability 0.396**, compared with A1 at 0.36. The full score is a product of conditional probabilities.",
        "A width-two beam finds B1 in this tiny tree. A finite beam can still miss a better sequence in a larger search.",
      ],
    },
    experimentIntro:
      "Compare temperature, top-k, top-p, seed, and greedy sampling. Then switch to the small greedy/beam tree to separate next-token choice from full-sequence search.",
    math: {
      heading: "State the distribution and filtering order.",
      intro: [
        "The player uses stable softmax and deterministic pseudo-random draws so a trace can be replayed exactly within this implementation.",
      ],
      rules: [
        {
          label: "Positive temperature",
          formula: "pᵢ=exp((zᵢ−max(z))/T) / Σⱼexp((zⱼ−max(z))/T), T>0",
        },
        {
          label: "Retained set normalization",
          formula: "p′ᵢ=pᵢ/Σⱼ∈S pⱼ for i∈S; otherwise 0",
        },
        {
          label: "Sampling",
          formula: "Choose the first i with draw < Σⱼ≤ᵢ p′ⱼ",
        },
        { label: "Sequence score", formula: "P(t₁,t₂)=P(t₁)P(t₂|t₁)" },
      ],
      paragraphs: [
        "Our combined filtering convention is temperature, then k eligibility, then a p prefix measured against the temperature distribution. The lesson’s top-k and top-p scenarios apply one restriction at a time; production libraries can use different combination conventions.",
        "Temperature zero is handled as a separate greedy convention in many interfaces. It must not be substituted into a division by zero. Our numeric temperature function accepts only positive values.",
        "A reproducible local seed demonstrates sampling mechanics. It does not promise that every hosted service or hardware stack will reproduce outputs identically, and high probability does not imply factual correctness.",
      ],
      limit:
        "Probability bars show token-selection mass. They do not estimate factual accuracy, creativity, or safety.",
    },
    transfer: {
      prompt:
        "A wrong token has the highest logit. Does greedy decoding make it correct? Does a higher temperature retrain the model?",
      answer: [
        "Neither. Greedy chooses that highest-scored token regardless of truth. Higher temperature **changes the selection distribution**, not the stored weights.",
        "Use evidence and task-specific validation for correctness; use decoding controls to choose how scores become outputs.",
      ],
    },
    takeaways: [
      "Decoding acts on model scores without changing the checkpoint.",
      "Temperature reshapes probability mass.",
      "Top-k and top-p define different candidate restrictions.",
      "The best local choice need not begin the best full sequence.",
    ],
    sources: [
      {
        title: "Holtzman et al. — The Curious Case of Neural Text Degeneration",
        url: "https://arxiv.org/abs/1904.09751",
      },
    ],
  },
  {
    slug: "l29",
    sourceId: "L29",
    deck: "Compare one answer, five votes, and explicit checking under the same available work budget.",
    objective:
      "Explain how generation, selection, correlation, and verification jointly determine whether extra inference work helps.",
    prerequisites: ["l23", "l26", "l27", "l28"],
    problem: {
      heading: "If five answers agree, have we proved the result?",
      paragraphs: [
        "There are **two packs of three pencils, plus two loose pencils**. The answer is 2×3+2=8. Our five supplied candidates say [9,9,8,9,8].",
        "A majority vote picks 9. A checker that recomputes the arithmetic can select 8. The same candidate pool yields different outcomes because the selector uses different evidence.",
      ],
    },
    intuition: {
      heading: "More computation needs a useful way to spend it.",
      paragraphs: [
        "**Test-time computation** spends additional inference work on candidate generation, search, checking, or intermediate computation. Its benefit depends on the task and on the quality of those operations.",
        "**Chain-of-thought prompting** supplies or requests intermediate solution steps. **Self-consistency** samples multiple solutions and aggregates their answers. A **verifier** checks or scores candidates. None makes correctness automatic.",
        "Displayed solution text can contain a convincing error. It is not guaranteed to be a faithful account of the model’s internal computation. We use independently checkable arithmetic rather than explanation length as evidence.",
      ],
      limit:
        "Candidate answers are synthetic fixtures, not sampled observations from a live model. We compare deterministic selectors on those fixtures.",
    },
    walkthrough: {
      heading: "Account for generation and checking separately.",
      intro:
        "The available budget is ten units. Generating one candidate or checking one candidate costs one unit in this teaching model.",
      steps: [
        {
          title: "Take one attempt",
          calculation: "First candidate=9; work used=1; unused=9",
          why: "A single attempt fails here. The rest of the budget remains unused rather than being silently reassigned.",
        },
        {
          title: "Vote across five attempts",
          calculation: "Votes: 9→3, 8→2; work used=5; selected=9",
          why: "Aggregation can amplify a shared mistaken assumption.",
        },
        {
          title: "Check each candidate exactly",
          calculation: "Generate 5 + check 5 =10; accept only answer===8",
          why: "An independent arithmetic condition distinguishes the valid candidates in this pool.",
        },
        {
          title: "Try a weaker check",
          calculation: "answer>0 accepts both 8 and 9",
          why: "A check is useful only to the extent that its acceptance rule reflects the intended property.",
        },
      ],
    },
    prediction: {
      prompt:
        "All five candidates now say 9. The verifier checks equality with 8 exactly. What should verified selection return?",
      options: [
        "9, because every candidate agrees",
        "No verified answer; none passes",
        "8, even though no candidate contains it",
      ],
      correct: 1,
      answer: [
        "**No verified answer.** The checker can reject bad candidates, but selection alone cannot create a missing valid candidate.",
        "The next action could be to generate a different candidate, solve with a tool, or report failure. That requires additional work beyond this completed budget.",
      ],
    },
    experimentIntro:
      "Trace single-attempt, majority, exact-verifier, weak-verifier, and fully correlated-error cases. Inspect each generated answer and each acceptance decision.",
    math: {
      heading: "Separate the budget from the success condition.",
      intro: [
        "The aim is not to maximize the number of visible steps. It is to allocate work to operations that produce and identify valid results.",
      ],
      rules: [
        {
          label: "Teaching work cost",
          formula: "C=number generated + number checked ≤10",
        },
        {
          label: "Majority selector",
          formula: "Choose the most frequent answer; ties use first occurrence",
        },
        { label: "Exact task check", formula: "accept(a) ⇔ a=2×3+2=8" },
        { label: "Weak task check", formula: "accept(a) ⇔ a>0" },
      ],
      paragraphs: [
        "With independent identical success probability p, repeated attempts would have an at-least-one-correct probability 1−(1−p)ᵐ. That calculation does not apply unchanged to correlated outputs, and it says nothing about whether a selector recognizes the correct attempt.",
        "A verifier can itself be a fallible model, an executable test, a proof checker, or a task-specific rule. State what it checks and what lies outside its scope.",
        "The one-attempt, vote, and verification scenarios share the same available ten-unit budget, but consume different amounts. The player shows unused units explicitly so that a cheaper strategy is not presented as doing equal work.",
      ],
      limit:
        "One arithmetic equality is an exact verifier for this defined answer. It does not verify arbitrary reasoning, all task interpretations, or general safety.",
    },
    transfer: {
      prompt:
        "Five generated programs pass one visible example. Does majority agreement establish that they work on every input?",
      answer: [
        "No. The programs may share the same shortcut or untested bug. **Test properties and held-out cases** that distinguish the intended behavior from that shortcut.",
        "Extra candidates help only when generation explores useful alternatives and selection can evaluate the properties that matter.",
      ],
    },
    takeaways: [
      "More attempts can share the same error.",
      "Generation and verification both consume work.",
      "A weak verifier can confidently accept wrong outputs.",
      "Selection cannot recover a valid candidate that was never generated.",
    ],
    sources: [
      {
        title:
          "Wei et al. — Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
        url: "https://arxiv.org/abs/2201.11903",
      },
      {
        title:
          "Wang et al. — Self-Consistency Improves Chain of Thought Reasoning in Language Models",
        url: "https://arxiv.org/abs/2203.11171",
      },
    ],
  },
  {
    slug: "l30",
    sourceId: "L30",
    deck: "Watch demonstration targets contribute gradients, then compare actual fine-tuning with an example placed only in context.",
    objective:
      "Trace supervised target probabilities, response loss masking, shared-parameter gradients, and a concrete weight update.",
    prerequisites: ["l16", "l25", "l26"],
    problem: {
      heading: "When does a demonstration become a weight update?",
      paragraphs: [
        "The desired exchange is **“2+2?” → “4”**. Putting that demonstration into a prompt makes it input context. Training on it runs a loss calculation and an optimizer that can change stored parameters.",
        "We will use one scalar weight θ and five token positions. At each position, a supplied feature x sets the target-token probability to σ(θx), with one alternative receiving the remaining probability. This tiny model exposes the training steps without pretending to be a full language model.",
      ],
    },
    intuition: {
      heading: "A demonstration identifies the output to make more likely.",
      paragraphs: [
        "**Supervised fine-tuning**, or SFT, trains on desired demonstrations. **Instruction tuning** uses instruction-response examples. **Post-training** is the wider development stage after pretraining; it can include SFT, preference optimization, reinforcement learning, specialization, and safety work.",
        "A **loss mask** marks which token positions contribute to the objective. Response-only loss is common in chat training: the prompt remains available as context while selected response tokens are scored. Training recipes vary.",
        "Parameters are shared across positions. Adding prompt-token loss can therefore change the combined gradient, even if the response itself is unchanged. Masking a loss term does not remove the corresponding input token.",
      ],
      limit:
        "Each position here has just two supplied candidates and a fixed feature. This fixture omits a transformer, a full vocabulary, batching, and a realistic training corpus.",
    },
    walkthrough: {
      heading: "Follow one response-only update.",
      intro:
        "Start θ=0 and use learning rate 1. Both response positions have feature +1 and target probability 0.5.",
      steps: [
        {
          title: "Mark response targets",
          calculation: "Included: “4”, <eos>; masked: three prompt positions",
          why: "Only the two answer positions contribute to this mean loss.",
        },
        {
          title: "Calculate target loss",
          calculation: "L=mean(−log 0.5,−log 0.5)=0.6931",
          why: "The model currently splits probability equally between each target and its alternative.",
        },
        {
          title: "Accumulate the shared gradient",
          calculation: "dL/dθ=mean((0.5−1)×1,(0.5−1)×1)=−0.5",
          why: "Both included positions push the same weight toward higher target probability.",
        },
        {
          title: "Update, then recompute",
          calculation: "θ′=0−1×(−0.5)=0.5; p′=σ(0.5)≈0.6225; L′≈0.4741",
          why: "The changed probabilities follow from the changed weight. They are not a cosmetic display switch.",
        },
      ],
    },
    prediction: {
      prompt:
        "If we only add this demonstration to the request and never run an optimizer, what happens to the stored θ in this experiment?",
      options: [
        "It changes to 0.5 automatically",
        "It stays at 0",
        "It becomes a permanently stored memory",
      ],
      correct: 1,
      answer: [
        "It **stays at 0**. Input conditioning and parameter training are different operations.",
        "The prompt-only scenario deliberately leaves weights and these training probabilities unchanged. Real in-context behavior can still change because a richer model consumes the new input.",
      ],
    },
    experimentIntro:
      "Compare response-only training, the opposite response style, all-token loss, and prompt-only exposure. Watch which targets count and which weight changes.",
    math: {
      heading: "Write down the mask before averaging.",
      intro: [
        "For a binary target with probability p=σ(θx), the derivative of negative log target probability is (p−1)x. Average only over included positions.",
      ],
      rules: [
        { label: "Target probability", formula: "pᵢ=σ(θxᵢ)" },
        { label: "Masked mean loss", formula: "L=−Σᵢmᵢ log(pᵢ) / Σᵢmᵢ" },
        { label: "Gradient", formula: "∂L/∂θ=Σᵢmᵢ(pᵢ−1)xᵢ / Σᵢmᵢ" },
        {
          label: "Optimizer step",
          formula: "θnew=θold−gradient; recompute the forward pass",
        },
      ],
      paragraphs: [
        "In the all-token scenario, three prompt features are −1 and two response features are +1. At θ=0, their mean gradient is +0.1, so the first update moves θ negative. This controlled conflict shows why the chosen loss positions matter.",
        "Continued pretraining on domain text is different from instruction-response SFT, even though both can use next-token objectives. The data construction, conditioning, and loss mask determine what behavior is reinforced.",
        "SFT can change more than surface formatting, but a few demonstrations do not guarantee reliable factual knowledge or broad task generalization. Evaluate held-out behavior after adaptation.",
      ],
      limit:
        "The model does not learn arithmetic from this one example. It changes probabilities within a supplied binary-candidate fixture.",
    },
    transfer: {
      prompt:
        "A training record includes a long user message and a short assistant answer. Should the number of prompt tokens automatically determine how much response-only loss it contributes?",
      answer: [
        "No. Under the response-only mean used here, **included answer positions** determine the scored terms. Prompt tokens supply context but have masked objective terms.",
        "Actual weighting can also depend on batching and reduction choices. State the reduction rule instead of inferring it from visible record length.",
      ],
    },
    takeaways: [
      "SFT changes parameters by optimizing demonstration likelihood.",
      "A loss mask selects objective terms, not visible context.",
      "Shared weights combine gradients from included positions.",
      "Putting an example in context is not an optimizer update.",
    ],
    sources: [
      {
        title:
          "Ouyang et al. — Training language models to follow instructions with human feedback",
        url: "https://arxiv.org/abs/2203.02155",
      },
    ],
  },
  {
    slug: "l31",
    sourceId: "L31",
    deck: "Fit a simple preference score and watch an optimized policy exploit the feature it rewards.",
    objective:
      "Trace pairwise reward fitting, a reference-regularized policy, and the gap between a reward proxy and factual correctness.",
    prerequisites: ["l05", "l16", "l29", "l30"],
    problem: {
      heading: "What if the reward favors the wrong feature?",
      paragraphs: [
        "For the pencil question, **“8”** is correct. A longer answer that confidently says **“9 pencils”** is wrong. Suppose our preference data rewards length and our reward model can see only a declared length feature.",
        "We will fit that feature’s weight from a preference pair, then score a separate three-answer set. The optimizer follows the score it receives, including when that score favors the verbose wrong answer.",
      ],
    },
    intuition: {
      heading: "A learned reward is a signal, not the goal itself.",
      paragraphs: [
        "A **preference dataset** compares candidate answers. A **reward model** learns a scoring signal from those comparisons. The response-generating model is called a **policy**. Human labels can disagree or reflect a limited rubric.",
        "A classical **RLHF** recipe begins with demonstrations and an SFT policy, collects ranked responses, fits a reward model, then optimizes the policy with a constraint or penalty against excessive drift from a reference. PPO is one possible optimizer, not the definition of RLHF.",
        "Our policy has only three possible answers. We can solve its reward-and-reference objective exactly, which makes the incentive visible without simulating a large policy optimizer.",
      ],
      limit:
        "Length units and preference pairs are supplied fixtures. The exact finite policy solution is not PPO, and neither length nor a correctness flag represents every human preference.",
    },
    walkthrough: {
      heading: "Fit the proxy before inspecting its incentive.",
      intro:
        "The preference pair has feature 1 for the preferred answer and 0 for the rejected answer.",
      steps: [
        {
          title: "Start with a neutral reward",
          calculation: "r=θ×feature; θ=0; P(prefer first)=σ(0)=0.5",
          why: "The pairwise model initially assigns equal preference probability.",
        },
        {
          title: "Fit the first pair",
          calculation: "gradient=σ(θ)−1=−0.5; θ′=0.5",
          why: "The fitted weight becomes positive, rewarding more of the chosen feature.",
        },
        {
          title: "Score separate candidates",
          calculation: "Length features [1,2,6] at θ=0.5 → rewards [0.5,1,3]",
          why: "The wrong answer receives the highest reward because the proxy sees length rather than correctness.",
        },
        {
          title: "Keep the reference in the objective",
          calculation: "π(i) ∝ πref(i)×exp(r(i)/β)",
          why: "The reference penalty resists drift, but it does not convert the reward proxy into truth.",
        },
      ],
    },
    prediction: {
      prompt:
        "We reduce β from 1 to 0.2 while keeping the same length rewards. What happens to the finite optimized policy?",
      options: [
        "It stays identical because the labels did not change",
        "It concentrates more strongly on high-reward answers, including the wrong verbose one",
        "It automatically becomes more factual",
      ],
      correct: 1,
      answer: [
        "It puts **more mass on the high-reward candidate**. In this objective, smaller β weakens the KL penalty relative to reward.",
        "If the reward is misaligned with correctness, stronger optimization can make the outcome worse on correctness.",
      ],
    },
    experimentIntro:
      "Fit the length proxy, weaken the reference penalty, then replace the feature with an explicit correctness indicator. Compare reward, reference probability, and optimized policy probability.",
    math: {
      heading: "Keep reward fitting and policy optimization separate.",
      intro: [
        "The reward pair uses a logistic likelihood. The candidate policy then maximizes a finite expected-reward objective with a KL penalty.",
      ],
      rules: [
        {
          label: "Reward model",
          formula: "rθ(y)=θf(y); P(y+≻y−)=σ(rθ(y+)−rθ(y−))",
        },
        {
          label: "Pair loss in this fixture",
          formula: "Lreward=−log σ(θ); θ′=θ+(1−σ(θ))",
        },
        {
          label: "Finite policy objective",
          formula: "J(π)=Σᵢπᵢrᵢ−βΣᵢπᵢlog(πᵢ/πref,ᵢ)",
        },
        {
          label: "Exact normalized optimum, β>0",
          formula: "πᵢ=πref,ᵢ exp(rᵢ/β) / Σⱼπref,ⱼ exp(rⱼ/β)",
        },
      ],
      paragraphs: [
        "The reference is [0.6,0.3,0.1]. It initially favors the short correct answer, but enough proxy reward can overcome that prior preference. A reference controls drift relative to itself; it is not a complete safety or accuracy specification.",
        "Changing to a correctness feature assigns the two correct candidates feature 1 and the wrong one feature 0. The fitted policy incentive changes even though the same pair-fitting arithmetic is used.",
        "RL methods and preference collection introduce additional complexity, including distribution shift, reward-model errors, and human disagreement. The later reinforcement-learning lessons revisit policies, returns, and optimization in more detail.",
      ],
      limit:
        "We optimize over three declared answer choices. No natural-language generator, reward network, or online human feedback system is trained.",
    },
    transfer: {
      prompt:
        "A reward model learns that confident wording often won its training comparisons. Why might optimizing it produce confident errors?",
      answer: [
        "The proxy can reward **confidence wording independently of correctness**. Optimization seeks what raises its score, including superficial cues that cease to be useful outside the labeled comparisons.",
        "Inspect new candidate distributions, evaluate factual criteria separately, and improve feedback coverage instead of trusting a rising reward alone.",
      ],
    },
    takeaways: [
      "Preference labels train a scoring proxy.",
      "The policy and reward model play different roles.",
      "A reference penalty limits drift rather than guaranteeing truth.",
      "Optimizing a misspecified reward can amplify its mistake.",
    ],
    sources: [
      {
        title:
          "Ouyang et al. — Training language models to follow instructions with human feedback",
        url: "https://arxiv.org/abs/2203.02155",
      },
      {
        title: "Rafailov et al. — Direct Preference Optimization",
        url: "https://arxiv.org/abs/2305.18290",
      },
    ],
  },
  {
    slug: "l32",
    sourceId: "L32",
    deck: "Update a two-answer policy from preference pairs and compare human, rubric, and executable feedback.",
    objective:
      "Calculate a DPO margin relative to a reference and explain why the source and scope of feedback still matter.",
    prerequisites: ["l30", "l31"],
    problem: {
      heading: "Can we learn a preference without a separate reward network?",
      paragraphs: [
        "There are two answers: A correctly says **8 pencils**; B gives a verbose explanation ending in **9**. A dataset marks one preferred and the other rejected.",
        "**Direct preference optimization**, DPO, can adjust their relative likelihoods against a reference without fitting a separate reward model in its standard formulation. It follows the preference label, including a bad label.",
      ],
    },
    intuition: {
      heading: "Measure a change in relative preference.",
      paragraphs: [
        "Let θ be the policy’s log odds for A over B. At θ=0, the policy is 50/50. Increasing θ raises A’s probability. DPO compares the policy’s chosen-versus-rejected log-probability ratio with the reference ratio.",
        "**RLAIF** uses AI feedback. **Constitutional AI** uses explicit principles in critique and training. These describe feedback processes and recipes, not a guarantee that every resulting label is correct.",
        "**RLVR** uses verifiable rewards, such as executable checks. A checker establishes only the properties it actually tests. A program returning a hardcoded 5 can pass 2+3 while failing 3+4.",
      ],
      limit:
        "The player trains a two-choice scalar policy with supplied preferences. Its rubric examples are declared fixtures, not observed human or AI judgments.",
    },
    walkthrough: {
      heading: "Trace one DPO update.",
      intro:
        "Start the policy at its 50/50 reference. Prefer A, use β=0.5, and learning rate 0.5.",
      steps: [
        {
          title: "Subtract reference log odds",
          calculation: "θ=0; θref=0; relative log odds=0",
          why: "The initial policy has not moved relative to its reference.",
        },
        {
          title: "Scale the preference margin",
          calculation: "z=β(θ−θref)=0; L=−log σ(0)=0.6931",
          why: "A zero margin gives equal preference probability under the pair objective.",
        },
        {
          title: "Differentiate the loss",
          calculation: "dL/dθ=−βσ(−z)=−0.25",
          why: "The negative gradient pushes θ upward for the preferred A.",
        },
        {
          title: "Update the policy",
          calculation: "θ′=0−0.5×(−0.25)=0.125; P(A)=σ(0.125)≈0.5312",
          why: "A becomes more likely relative to the same fixed reference.",
        },
      ],
    },
    prediction: {
      prompt:
        "The dataset incorrectly marks the verbose wrong answer B as preferred. Does the DPO objective automatically correct that label?",
      options: [
        "Yes; it knows preference labels must mean truth",
        "No; it pushes the policy toward the supplied bad preference",
        "It refuses to update without a reward network",
      ],
      correct: 1,
      answer: [
        "No. **The loss follows the supplied comparison.** Reversing the label reverses the initial gradient in this symmetric fixture.",
        "A convenient optimization objective cannot repair an inadequate feedback specification by itself.",
      ],
    },
    experimentIntro:
      "Change the preference label, β, or reference probability. Inspect the relative margin, loss, gradient, and policy probabilities while the feedback examples remain explicit.",
    math: {
      heading: "Write the reference inside the margin.",
      intro: [
        "For A preferred, the general DPO log-ratio difference reduces to θ−θref in our two-response policy. For B preferred, reverse its sign.",
      ],
      rules: [
        {
          label: "Reference log odds",
          formula: "θref=log(pref(A)/(1−pref(A)))",
        },
        {
          label: "Signed margin",
          formula: "z=βs(θ−θref); s=+1 for A preferred, −1 for B preferred",
        },
        { label: "Pair objective", formula: "LDPO=−log σ(z)" },
        { label: "Scalar gradient", formula: "∂L/∂θ=−βsσ(−z)" },
      ],
      paragraphs: [
        "The biased-reference scenario begins at pref(A)=0.8, so θref=log 4. Its initial relative margin is still zero. A high absolute probability is different from a large change relative to the reference.",
        "Changing β changes both the scaled margin and gradient in this fixed-learning-rate fixture. Its role should be interpreted within the objective, rather than copied from an unrelated temperature or reward formula.",
        "Group-relative methods construct learning signals by comparing sampled responses, often using within-group reward statistics. GRPO is one family of algorithms; it is not a synonym for all reasoning-model training. The player does not simulate that additional algorithm.",
        "A verifiable final answer does not certify the faithfulness of an explanation, every hidden input, or general safety. Keep checker coverage and untested cases visible.",
      ],
      limit:
        "The code checks in the lesson are explicit arithmetic fixtures. Two passing cases are not a proof of an arbitrary program’s correctness.",
    },
    transfer: {
      prompt:
        "A generated function passes one public test by returning that test’s expected constant. Which additional evidence would distinguish it from the intended addition function?",
      answer: [
        "Use different inputs, such as **3+4**, and properties such as commutativity and behavior on zero. The constant shortcut then fails.",
        "Label source, test coverage, and optimization method are separate design choices. Improving one does not remove the need to inspect the others.",
      ],
    },
    takeaways: [
      "Standard DPO can train directly from preference pairs without a separate reward network.",
      "The margin compares policy change with a fixed reference.",
      "Bad feedback can drive a technically correct optimizer in the wrong direction.",
      "Executable rewards establish only what their checks cover.",
    ],
    sources: [
      {
        title: "Rafailov et al. — Direct Preference Optimization",
        url: "https://arxiv.org/abs/2305.18290",
      },
      {
        title: "Bai et al. — Constitutional AI",
        url: "https://arxiv.org/abs/2212.08073",
      },
      {
        title: "Shao et al. — DeepSeekMath (GRPO)",
        url: "https://arxiv.org/abs/2402.03300",
      },
    ],
  },
  {
    slug: "l33",
    sourceId: "L33",
    deck: "Multiply through a frozen matrix and a trainable low-rank branch, then inspect which gradients and memory costs remain.",
    objective:
      "Compute a LoRA forward pass and adapter gradients, explain rank-dependent parameter counts, and distinguish a frozen quantized base from no gradient flow.",
    prerequisites: ["l03", "l16", "l30"],
    problem: {
      heading:
        "Can adaptation change a layer while its base weights stay frozen?",
      paragraphs: [
        "Our layer has a **2×2 base matrix W**. Rather than updating W, add a trainable branch BA with a smaller intermediate rank: output=Wx+sBAx. This is the central low-rank adaptation idea.",
        "For rank 1, let A=[1,−1], B=[0.5,−0.5]ᵀ, x=[2,1], and scale s=1. We can trace every multiplication and see exactly what the branch changes.",
      ],
    },
    intuition: {
      heading: "A small trainable branch changes the effective transformation.",
      paragraphs: [
        "**Parameter-efficient fine-tuning**, PEFT, restricts which parameters are trained. **LoRA** represents an update as a product B×A while freezing the base W. The intermediate dimension is called the adapter **rank**.",
        "A maps the input into that intermediate space. B maps it back to the output space. Multiplying them limits the update matrix to rank at most r; the update need not have exactly rank r.",
        "**QLoRA** combines adapter training with a quantized frozen base and additional memory-saving methods. Freezing base entries means the optimizer does not update them. It does not mean every operation involving the base disappears from gradient computation.",
      ],
      limit:
        "Our quantized scenario rounds entries to the nearest 0.5. This is an explicit toy quantizer, not NF4, double quantization, paged optimization, or a full QLoRA implementation.",
    },
    walkthrough: {
      heading: "Follow both branches on the same input.",
      intro: "Use W=[[1.2,0.2],[0.1,0.8]] and target [3,1].",
      steps: [
        {
          title: "Compute the frozen branch",
          calculation: "Wx=[1.2×2+0.2,0.1×2+0.8]=[2.6,1]",
          why: "These base entries remain fixed throughout adapter training.",
        },
        {
          title: "Pass through the rank-one branch",
          calculation: "Ax=2−1=1; BAx=[0.5,−0.5]",
          why: "A compresses the input to one value; B produces the two-coordinate adjustment.",
        },
        {
          title: "Add and compare with the target",
          calculation: "y=[3.1,0.5]; error=[0.1,−0.5]; L=½(0.1²+0.5²)=0.13",
          why: "The adapter changes the output. This supplied adapter is not yet optimal for the target.",
        },
        {
          title: "Differentiate before updating",
          calculation: "∇B=[0.1,−0.5]ᵀ; ∇A=[0.6,0.3]",
          why: "Both gradients use the same old A and B. Then update both simultaneously and recompute.",
        },
      ],
    },
    prediction: {
      prompt:
        "If B is initialized to all zeros while A is nonzero, what happens to the initial adapter output and gradients?",
      options: [
        "The adapter output is zero; A’s gradient is zero, but B can receive a nonzero gradient",
        "Every gradient must be zero forever",
        "The base W must change first",
      ],
      correct: 0,
      answer: [
        "The first option. BAx is zero, and ∇A contains Bᵀ, so **A initially receives zero gradient**. B’s gradient contains Ax and can be nonzero.",
        "After B changes, A may receive a gradient on later steps. Initializing both factors to zero would remove this useful first-step signal in the simple branch.",
      ],
    },
    experimentIntro:
      "Inspect rank 1, rank 2, half scale, zero-B initialization, and a rounded frozen base. Trace the forward pass, adapter gradients, and one actual simultaneous update.",
    math: {
      heading: "Count parameters and memory categories separately.",
      intro: [
        "For W with m output rows and n input columns, A has r×n entries and B has m×r entries.",
      ],
      rules: [
        {
          label: "Effective layer",
          formula: "y=Wx+sBAx; W frozen, A and B trainable",
        },
        { label: "Parameter count", formula: "Base=mn; adapter=r(n+m)" },
        {
          label: "100×100, rank 4",
          formula: "Base=10,000 entries; adapter=4(100+100)=800 entries",
        },
        {
          label: "Adapter gradients, e=y−target",
          formula: "∇B=s e(Ax)ᵀ; ∇A=s(Bᵀe)xᵀ",
        },
      ],
      paragraphs: [
        "Our tiny rank-one 2×2 adapter has four entries, equal to the base’s four entries. Small illustrations do not automatically save parameters. The 100×100 calculation shows where the larger-matrix benefit comes from.",
        "Training memory includes frozen base storage, trainable adapter storage, adapter gradients, optimizer state, activations, and temporary buffers. Quantizing the base reduces one category; it does not reduce every category to four bits.",
        "For an illustrative 100×100 base, 4-bit packed entries alone occupy 5,000 bytes instead of 20,000 at 16 bits, before scales, metadata, and runtime buffers. Rank-four adapter entries at 16 bits add 1,600 bytes, with gradients and optimizer state counted separately.",
        "A frozen layer can still pass derivatives to its input when earlier trainable components need them. “No base optimizer update” and “no gradients through this operation” are different claims.",
      ],
      limit:
        "Adapter rank changes capacity and cost, but does not guarantee task quality. This numeric example is not a memory benchmark or a recommendation for a real training recipe.",
    },
    transfer: {
      prompt:
        "For a 200×100 base and rank 4, how many adapter entries are trained? Must that always outperform rank 2?",
      answer: [
        "There are **4×(200+100)=1,200 adapter entries**, compared with 20,000 base entries.",
        "More rank permits a larger update family but does not guarantee better held-out behavior. Data, optimization, target layers, and task requirements still matter.",
      ],
    },
    takeaways: [
      "LoRA trains A and B beside a frozen base.",
      "Rank bounds the update family and controls adapter count.",
      "Frozen parameters can coexist with gradient flow through their operations.",
      "Quantized base storage is only one part of training memory.",
    ],
    sources: [
      {
        title: "Hu et al. — LoRA: Low-Rank Adaptation of Large Language Models",
        url: "https://arxiv.org/abs/2106.09685",
      },
      {
        title: "Dettmers et al. — QLoRA",
        url: "https://arxiv.org/abs/2305.14314",
      },
    ],
  },
  {
    slug: "l34",
    sourceId: "L34",
    deck: "Train a scalar student on soft or hard teacher targets, then watch a conflicting later task affect earlier behavior.",
    objective:
      "Trace distillation gradients and identify teacher error, held-out gaps, shared-capacity conflict, and forgetting during continued adaptation.",
    prerequisites: ["l25", "l30", "l31", "l32", "l33"],
    problem: {
      heading: "What does the student learn from a teacher’s answer?",
      paragraphs: [
        "A teacher assigns **P(class A)=0.8**. A hard label keeps only “A.” A soft target preserves the split [0.8,0.2]. These training signals are different even though they share the same most likely class.",
        "Our student has one weight θ and predicts P(A|x)=σ(θx). Train at x=1, then inspect a separately declared held-out target at x=2. A good match on the training input cannot certify what happens elsewhere.",
      ],
    },
    intuition: {
      heading: "Imitation transfers the behavior represented in the examples.",
      paragraphs: [
        "**Knowledge distillation** trains a student to imitate teacher outputs, probability distributions, or selected behavior. Soft targets preserve information that an argmax label discards. The student’s capacity and transfer data limit what can be learned.",
        "**Synthetic data** is generated rather than directly observed from the target process. It can expand coverage, but it can also repeat teacher mistakes or omit important cases. Provenance, filtering, and held-out evaluation remain necessary.",
        "**Continual learning** adapts a model over time. **Catastrophic forgetting** is loss of earlier capabilities during later adaptation. We expose a small shared-parameter conflict: the same scalar is asked to move from target 0.8 toward 0.2.",
      ],
      limit:
        "This binary student is intentionally tiny. It does not implement a full distillation recipe, establish a real model’s capabilities, or demonstrate every cause of forgetting.",
    },
    walkthrough: {
      heading: "Compare the first soft and hard updates.",
      intro:
        "Start θ=0, giving probability 0.5. Use learning rate 1 and binary cross-entropy.",
      steps: [
        {
          title: "Keep the soft target",
          calculation: "q=0.8; gradient=p−q=0.5−0.8=−0.3",
          why: "The teacher asks for 80% probability, not certainty.",
        },
        {
          title: "Update the student",
          calculation: "θ′=0.3; p′=σ(0.3)≈0.5744",
          why: "The student moves toward the teacher distribution.",
        },
        {
          title: "Replace the target with its hard label",
          calculation: "qhard=1; gradient=−0.5; θ′=0.5; p′≈0.6225",
          why: "The hard label creates a stronger initial push toward certainty in this fixture.",
        },
        {
          title: "Switch tasks after four steps",
          calculation: "Earlier q=0.8; later q=0.2; both use the same θ",
          why: "Later-only updates can improve later-task loss while worsening the earlier task. Evaluate both rather than watching only the current training loss.",
        },
      ],
    },
    prediction: {
      prompt:
        "If the teacher incorrectly favors class B with P(A)=0.2, does minimizing imitation loss automatically recover the true class A?",
      options: [
        "Yes; distillation removes teacher errors",
        "No; the student is pushed toward the teacher’s wrong distribution",
        "Only hard labels can ever transmit errors",
      ],
      correct: 1,
      answer: [
        "No. **Imitation follows the supplied target.** A wrong teacher distribution can transmit its mistake to the student.",
        "Use independent reference data and held-out checks to judge correctness, rather than treating agreement with the teacher as sufficient.",
      ],
    },
    experimentIntro:
      "Compare soft targets, hard labels, a mistaken teacher, a conflicting later task, and replay. Track the student probability and both task losses across the same sequence.",
    math: {
      heading: "Separate imitation, generalization, and retention.",
      intro: [
        "Binary cross-entropy supports a target probability q between zero and one. Its logit gradient is especially simple.",
      ],
      rules: [
        { label: "Student", formula: "p(A|x)=σ(θx)" },
        { label: "Soft-target objective", formula: "L=−q log p−(1−q)log(1−p)" },
        { label: "Training at x=1", formula: "∂L/∂θ=p−q; θ′=θ−(p−q)" },
        {
          label: "Equal old/new replay in this fixture",
          formula: "½(p−0.8)+½(p−0.2)=p−0.5",
        },
      ],
      paragraphs: [
        "The held-out input x=2 has a declared target of 0.7. A student with the same positive θ predicts σ(2θ), which is more confident than at x=1. Training imitation at one point does not guarantee a matching distribution at another.",
        "Equal replay targets 0.5 here, creating a compromise between contradictory demands on the same output. Replay can help retention in suitable settings, but it cannot make one identical prediction equal both 0.8 and 0.2 simultaneously.",
        "Larger distillation recipes often soften teacher and student distributions with temperature and may combine soft-target and labeled-data losses. That training temperature serves a different objective from selecting a sampled answer at inference.",
        "Generated examples should be checked for teacher errors, duplicates, coverage gaps, and contamination of held-out evaluation. Keep their origin visible so that generated agreement is not mistaken for independent evidence.",
      ],
      limit:
        "The player holds task targets fixed and measures their exact cross-entropies. Those losses are not a real-world benchmark, and this student cannot represent separate task outputs without additional conditioning or capacity.",
    },
    transfer: {
      prompt:
        "A student matches its teacher on 100 generated examples. What evidence is still needed before claiming it inherited all the teacher’s skills?",
      answer: [
        "Evaluate **independent held-out tasks and failure cases** covering the intended uses, then inspect capacity and distribution gaps. Matching 100 examples establishes only that measured agreement.",
        "If the student is later adapted again, repeat earlier-task checks so that gains on the new task do not hide lost behavior.",
      ],
    },
    takeaways: [
      "Soft targets preserve more than the winning class label.",
      "Distillation can transmit teacher mistakes.",
      "Imitation on training inputs does not certify generalization.",
      "Later adaptation should be evaluated for earlier-task retention.",
    ],
    sources: [
      {
        title: "Hinton et al. — Distilling the Knowledge in a Neural Network",
        url: "https://arxiv.org/abs/1503.02531",
      },
      {
        title:
          "Kirkpatrick et al. — Overcoming catastrophic forgetting in neural networks",
        url: "https://arxiv.org/abs/1612.00796",
      },
    ],
  },
];
