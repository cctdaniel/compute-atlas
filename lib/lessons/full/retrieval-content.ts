import type { LessonContent } from "../types";
export const retrievalLessons: LessonContent[] = [
  {
    slug: "l39",
    sourceId: "L39",
    deck: "Search eight documents with lexical and supplied vector signals, fuse their ranks, and inspect what reranking can recover.",
    objective:
      "Calculate a small BM25/cosine retrieval comparison and distinguish candidate recall, rank fusion, joint scoring, and actual relevance.",
    prerequisites: ["l11", "l18"],
    problem: {
      heading: "Would you search a product code like a paraphrase?",
      paragraphs: [
        "One user asks for **ZX-17**. Another asks **“get my cash back.”** Our eight-document library contains two nearly identical battery codes, a return-window policy, a partial money-back passage, and several distractors.",
        "Exact terms and semantic similarity offer different signals. We will calculate a lexical score and compare **supplied synthetic vectors**. Their strengths and failures are deliberately visible; no real embedding model is called.",
      ],
    },
    intuition: {
      heading: "Find candidates quickly, then spend more on the shortlist.",
      paragraphs: [
        "**Sparse retrieval** uses term-based signals. BM25 rewards query-term matches while accounting for frequency, rarity, and document length. Exact product identifiers can be important even when their surrounding text looks similar.",
        "**Dense retrieval** compares vectors representing queries and documents. A **bi-encoder** produces them separately, allowing document vectors to be indexed ahead of time. Similar vectors are candidates for relevance, not proof of it.",
        "**Hybrid retrieval** combines signals. We use reciprocal rank fusion, RRF, so that a large BM25 magnitude is not directly added to a cosine score with a different scale.",
        "A **cross-encoder** scores the joint query/document input, often at greater cost per pair. Reranking therefore commonly operates on a shortlist. Our reranker is an explicitly supplied rule that recognizes a return-window phrase, not a neural cross-encoder.",
      ],
      limit:
        "Three-dimensional vectors and relevance labels are declared fixtures. The restricted-candidate case illustrates recall loss; it is not an implementation or measurement of a specific approximate-nearest-neighbor index.",
    },
    walkthrough: {
      heading: "Keep the query, score, and relevance label separate.",
      intro:
        "Start with the exact-code query, then change to the cash-back paraphrase.",
      steps: [
        {
          title: "Preserve the exact identifier",
          calculation: "Query token zx-17 appears in D1, not D2’s zx-71",
          why: "The tokenizer retains hyphenated identifiers. Zero lexical matches are excluded from the lexical candidate list.",
        },
        {
          title: "Inspect a misleading dense match",
          calculation:
            "q=[1,0,0]; D2=[1,0,0] has cosine 1; D1=[0.95,0.05,0] has slightly less",
          why: "The supplied vector fixture favors the wrong code despite D1 being the declared relevant document.",
        },
        {
          title: "Fuse ranked evidence",
          calculation: "RRF(d)=Σ lists containing d 1/(60+rank(d))",
          why: "A positive lexical candidate and a dense candidate can both contribute without treating their raw score units as equivalent.",
        },
        {
          title: "Rerank only what was retrieved",
          calculation:
            "Take three candidates; joint rule favors “returned within thirty days”",
          why: "The expensive joint stage can change the order of a shortlist, but cannot recover an absent document.",
        },
      ],
    },
    prediction: {
      prompt:
        "The best return-policy document D3 is excluded from candidate generation. Can reranking only those remaining candidates recover D3?",
      options: [
        "Yes; reranking creates the missing document",
        "No; candidate recall has already lost it",
        "Yes; a vector database guarantees truth",
      ],
      correct: 1,
      answer: [
        "No. **A reranker cannot select a candidate it never receives.** Improve candidate generation or retrieve again.",
        "Measure retrieval recall separately from ranking quality and final answer quality. A polished answer does not show which evidence was missed.",
      ],
    },
    experimentIntro:
      "Compare lexical, dense, and fused retrieval for product codes and paraphrases. Inspect all eight source texts and vectors, then test shortlist reranking and a deliberately restricted candidate set.",
    math: {
      heading: "State the scoring convention.",
      intro: [
        "The teaching BM25 uses k₁=1.2, b=0.75, natural logs, distinct query terms, and a positive smoothed inverse-document-frequency term. This is a transparent formula, not a bit-for-bit Lucene index.",
      ],
      rules: [
        {
          label: "Term rarity",
          formula: "idf(t)=ln(1+(N−df(t)+0.5)/(df(t)+0.5))",
        },
        {
          label: "BM25 teaching score",
          formula: "Σt idf(t)×tf(t,d)(k₁+1) / [tf(t,d)+k₁(1−b+b|d|/avgLen)]",
        },
        { label: "Dense comparison", formula: "cos(q,d)=(q·d)/(‖q‖‖d‖)" },
        {
          label: "Rank fusion",
          formula: "RRF(d)=Σr 1/(60+rankᵣ(d)); ranks begin at 1",
        },
        {
          label: "Joint-rule fixture",
          formula: "Return-window phrase →2 points; “money back” →1 point",
        },
      ],
      paragraphs: [
        "The paraphrase “get my cash back” has a lexical match for back in D4, but the desired return-window evidence is D3. The supplied dense query vector favors D3. Fusion can still favor D4 because it appears highly in both lists; combining methods is not an unconditional improvement.",
        "The lexical list includes only positive-score documents. Dense ranks include the allowed corpus. Equal scores break by document ID so replay remains deterministic; those tie breaks are not evidence of relevance.",
        "Approximate nearest-neighbor search trades search effort against exact nearest-neighbor recovery. The restricted scenario simply removes D3 to make the consequence inspectable; it does not claim how any real index chooses candidates.",
        "A vector database manages vectors, metadata, and retrieval operations. Data quality, authorization, freshness, and task relevance remain separate responsibilities. The next lesson uses retrieved passages to support an answer.",
      ],
      limit:
        "Lexical tokenization does not stem returned into return. The dense vectors and joint scoring rule are deliberately small supplied functions. These choices are part of the experiment, not universal retrieval behavior.",
    },
    transfer: {
      prompt:
        "A query contains a rare replacement-part code and a natural-language symptom. Which retrieval choice should be evaluated first?",
      answer: [
        "Evaluate **complementary lexical and dense candidate signals**, including exact-code recall and symptom paraphrases, then compare fusion or reranking on held-out labeled queries.",
        "Do not assume one method always wins. Inspect which stage loses the necessary document and change that stage.",
      ],
    },
    takeaways: [
      "Lexical and dense retrieval provide different evidence signals.",
      "Similarity scores and relevance labels are separate.",
      "Fusion should respect incompatible score scales.",
      "Reranking depends on the candidates it receives.",
    ],
    sources: [
      {
        title: "Apache Lucene — BM25Similarity",
        url: "https://lucene.apache.org/core/10_3_1/core/org/apache/lucene/search/similarities/BM25Similarity.html",
      },
      {
        title: "Karpukhin et al. — Dense Passage Retrieval",
        url: "https://arxiv.org/abs/2004.04906",
      },
      {
        title: "Cormack et al. — Reciprocal Rank Fusion",
        url: "https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf",
      },
    ],
  },
  {
    slug: "l40",
    sourceId: "L40",
    deck: "Follow a fictional policy from word windows to retrieved context and claim-level support, including a boundary failure.",
    objective:
      "Trace a small RAG pipeline, explain chunk overlap and retrieval count, and distinguish available passages from supported answer claims.",
    prerequisites: ["l23", "l26", "l27", "l39"],
    problem: {
      heading: "Did the answer receive the passage it needs?",
      paragraphs: [
        "A fictional policy says unopened items can be **returned within 30 days** and asks customers to **keep their receipt**. The question asks for both facts. The text is short, but a bad chunk boundary can still split an important phrase.",
        "We will split the source into word windows, retrieve some chunks, and check fixed candidate claims against their available evidence. The answer is assembled from those claims; this player does not pretend to run a live language model.",
      ],
    },
    intuition: {
      heading: "External evidence travels through several decisions.",
      paragraphs: [
        "**Retrieval-augmented generation**, RAG, supplies retrieved external information to a generator. **Grounding** connects an answer to available evidence. Retrieval can change what information is supplied now without ordinarily changing a fixed generator’s weights.",
        "An application pipeline can ingest documents, parse text, create chunks, attach metadata, index them, retrieve candidates, rerank, assemble context, generate an answer, and verify support. A failure in any stage can affect the result.",
        "**Chunking** divides documents into searchable units. **Overlap** repeats neighboring material across windows to reduce some boundary loss. More overlap creates more indexed repetition; it does not add independent evidence.",
        "The original RAG research included trained retrieval-generation systems. Many application pipelines instead retrieve into a fixed model’s current context. These are related uses of external information, not identical training procedures.",
      ],
      limit:
        "The source is a fictional eighteen-word teaching policy. Retrieval uses an explicit term-count rule, and support uses required exact spans. This is not a general entailment checker or a production RAG system.",
    },
    walkthrough: {
      heading: "Preserve the relationship across the boundary.",
      intro:
        "The source words have zero-based indices. An end index is exclusive: [0,10) includes positions 0 through 9.",
      steps: [
        {
          title: "Build ten-word chunks",
          calculation:
            "C1=[0,10): “Policy v2 unopened items can be returned within 30 days”",
          why: "This window contains the complete return-window span.",
        },
        {
          title: "Overlap the next window",
          calculation:
            "C2 starts at 8: “30 days keep your receipt refunds use original payment method”",
          why: "The repeated boundary words connect context, while the receipt instruction is also retained as a complete span.",
        },
        {
          title: "Retrieve two positive-score results",
          calculation: "Query terms: unopened, returned, 30, days, receipt",
          why: "The simple score selects both passages. Only selected chunks become context for the claim checks.",
        },
        {
          title: "Check the claims separately",
          calculation:
            "Return claim requires “unopened items” and “returned within 30 days”; receipt claim requires “keep your receipt”",
          why: "Each required span must occur within a selected chunk. A shipping-free claim has no supporting span at all.",
        },
      ],
    },
    prediction: {
      prompt:
        "Four-word windows without overlap split “returned within” from “30 days.” Under this fixture’s span rule, is the complete return claim supported just because both fragments exist somewhere in the index?",
      options: [
        "Yes; indexed text is automatically available in full",
        "No; the required span must survive inside retrieved context",
        "Yes; a citation string supplies missing evidence",
      ],
      correct: 1,
      answer: [
        "No. **Index contents and retrieved context differ**, and this explicit checker requires each defined span to occur inside a selected chunk.",
        "Overlap or a better chunking/retrieval policy may preserve the needed relationship. A richer real checker might combine evidence differently, but must still justify the resulting claim.",
      ],
    },
    experimentIntro:
      "Change chunk size, overlap, and retrieval count. Remove the indexed source or deliberately emit an unsupported shipping claim. Inspect source word ranges, selected context, support IDs, and the assembled answer.",
    math: {
      heading: "Make the pipeline’s evidence contract visible.",
      intro: [
        "The fixture treats each candidate claim as a set of required spans. This makes the support decision reproducible without simulating learned language understanding.",
      ],
      rules: [
        {
          label: "Window stride",
          formula: "stride=chunkSize−overlap; 0≤overlap<chunkSize",
        },
        {
          label: "Teaching retrieval score",
          formula: "score(chunk)=number of distinct query terms present",
        },
        {
          label: "Retrieved context",
          formula:
            "First k positive-score chunks; ties break by source start index",
        },
        {
          label: "Fixture claim support",
          formula:
            "For every required span, at least one selected chunk contains that complete span",
        },
        {
          label: "Grounded assembly",
          formula:
            "Emit supported claims + their chunk IDs; expose insufficiency when none are supported",
        },
      ],
      paragraphs: [
        "With four-word windows and no overlap, phrase fragments can be separated. With two-word overlap, a window [6,10) preserves “returned within 30 days.” Whether other required spans are retrieved still depends on ranking and k.",
        "The support IDs shown for an unsupported claim are only candidate partial evidence. Their presence does not establish complete support. The deliberately flawed scenario emits unsupported content and marks it rather than inventing a citation.",
        "The missing-source scenario displays the teaching fixture for comparison but intentionally omits it from the searchable index. The answer path cannot silently borrow that text outside retrieved context.",
        "Retrieval count can increase coverage while also increasing cost and distractors. Do not assume more chunks always improve an answer. Evaluate retrieval separately from generation and inspect support at the claim level.",
        "Real systems need document IDs, versions, source locations, permissions, freshness, and richer support checks. The next reliability lesson treats those obligations directly.",
      ],
      limit:
        "Exact phrase matching can reject valid paraphrases and miss subtle contradictions. It is a narrow transparent fixture for seeing evidence flow, not a claim that string matching proves arbitrary factual entailment.",
    },
    transfer: {
      prompt:
        "A citation points to a real policy document, but its passage says nothing about free return shipping. Is the shipping claim grounded?",
      answer: [
        "No. **A real source must actually support the claim.** Citation existence is different from citation correctness.",
        "Omit the unsupported claim, find additional authoritative evidence, or state the uncertainty. RAG does not remove that responsibility.",
      ],
    },
    takeaways: [
      "RAG supplies external evidence through a pipeline of decisions.",
      "Chunk boundaries and retrieval selection affect available support.",
      "Overlap repeats context rather than creating new evidence.",
      "Grounded answers require support for their material claims.",
    ],
    sources: [
      {
        title:
          "Lewis et al. — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        url: "https://arxiv.org/abs/2005.11401",
      },
      {
        title: "Karpukhin et al. — Dense Passage Retrieval",
        url: "https://arxiv.org/abs/2004.04906",
      },
    ],
  },
];
