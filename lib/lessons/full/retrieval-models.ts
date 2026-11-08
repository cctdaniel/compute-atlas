import type { Experiment } from "../types";
import { makeFrame as f, numeric as n, dot } from "./lesson-kit.ts";
export const searchDocuments = [
  {
    id: "D1",
    text: "ZX-17 battery replacement manual",
    vector: [0.95, 0.05, 0],
  },
  { id: "D2", text: "ZX-71 battery replacement manual", vector: [1, 0, 0] },
  {
    id: "D3",
    text: "unopened items may be returned within thirty days",
    vector: [0, 1, 0],
  },
  {
    id: "D4",
    text: "money back after a faulty purchase",
    vector: [0, 0.9, 0.2],
  },
  {
    id: "D5",
    text: "battery recycling collection depot",
    vector: [0.7, 0, 0.5],
  },
  { id: "D6", text: "store opening hours weekdays", vector: [0, 0, 1] },
  {
    id: "D7",
    text: "return address for parcel shipping",
    vector: [0, 0.6, 0.8],
  },
  { id: "D8", text: "refund totals accounting report", vector: [0, 0.8, 0.6] },
];
export const searchTerms = (text: string): string[] =>
  text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
export function bm25(query: string, documents: string[]) {
  const corpus = documents.map(searchTerms),
    terms = [...new Set(searchTerms(query))],
    average = corpus.reduce((s, v) => s + v.length, 0) / corpus.length,
    N = corpus.length;
  return corpus.map((words) =>
    terms.reduce((sum, term) => {
      const tf = words.filter((w) => w === term).length,
        df = corpus.filter((doc) => doc.includes(term)).length,
        idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      return (
        sum +
        (tf
          ? (idf * tf * 2.2) /
            (tf + 1.2 * (0.25 + (0.75 * words.length) / average))
          : 0)
      );
    }, 0),
  );
}
export function cosine(a: number[], b: number[]) {
  const norm = Math.hypot(...a) * Math.hypot(...b);
  return norm ? dot(a, b) / norm : 0;
}
export function reciprocalRanks(rankings: string[][], constant = 60) {
  const result: Record<string, number> = {};
  for (const ranking of rankings)
    ranking.forEach(
      (id, i) => (result[id] = (result[id] ?? 0) + 1 / (constant + i + 1)),
    );
  return result;
}
export function retrievalResult(id: string) {
  const code =
      id === "code-lexical" || id === "code-dense" || id === "code-hybrid",
    query = code ? "ZX-17" : "get my cash back",
    queryVector = code ? [1, 0, 0] : [0, 1, 0],
    lexical = bm25(
      query,
      searchDocuments.map((d) => d.text),
    ),
    dense = searchDocuments.map((d) => cosine(queryVector, d.vector)),
    sort = (scores: number[]) =>
      searchDocuments
        .map((doc, i) => ({ ...doc, score: scores[i] }))
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
        .map((d) => d.id),
    lexicalRanking = sort(lexical).filter(
      (id) => lexical[searchDocuments.findIndex((d) => d.id === id)] > 0,
    ),
    denseRanking = sort(dense);
  // Restricted candidate generation deliberately omits the exact best semantic match.
  const allowedDense =
      id === "restricted"
        ? denseRanking.filter((v) => v !== "D3")
        : denseRanking,
    fusion = reciprocalRanks([lexicalRanking, allowedDense]),
    fusionRanking = searchDocuments
      .map((d) => d.id)
      .filter((v) => fusion[v] > 0)
      .sort((a, b) => fusion[b] - fusion[a] || a.localeCompare(b));
  const method = id.endsWith("lexical")
      ? "Lexical BM25"
      : id.endsWith("hybrid")
        ? "Hybrid RRF"
        : id === "rerank"
          ? "Hybrid + joint-rule reranker"
          : "Dense cosine",
    first =
      method === "Lexical BM25"
        ? lexicalRanking
        : method.includes("Hybrid")
          ? fusionRanking
          : allowedDense,
    shortlist = first.slice(0, 3),
    joint = searchDocuments.map((d) =>
      code
        ? Number(searchTerms(d.text).includes("zx-17")) * 2
        : Number(d.text.includes("returned within thirty days")) * 2 +
          Number(d.text.includes("money back")),
    ),
    ranking =
      id === "rerank"
        ? [...shortlist].sort(
            (a, b) =>
              joint[searchDocuments.findIndex((d) => d.id === b)] -
                joint[searchDocuments.findIndex((d) => d.id === a)] ||
              first.indexOf(a) - first.indexOf(b),
          )
        : first;
  return {
    query,
    queryVector,
    lexical,
    dense,
    fusion,
    joint,
    lexicalRanking,
    allowedDense,
    shortlist,
    ranking,
    method,
    documents: searchDocuments.map((d, i) => ({
      ...d,
      lexical: lexical[i],
      dense: dense[i],
      fusion: fusion[d.id] ?? 0,
      joint: joint[i],
      included: id !== "restricted" || d.id !== "D3",
      relevant: d.id === (code ? "D1" : "D3"),
    })),
  };
}
export function retrievalTrace(id: string) {
  const result = retrievalResult(id);
  return Array.from({ length: 7 }, (_, phase) => {
    const ranking =
      phase < 2
        ? []
        : phase === 2
          ? result.lexicalRanking
          : phase === 3
            ? result.allowedDense
            : phase === 4 || phase === 5
              ? result.method.includes("Hybrid")
                ? result.shortlist
                : result.ranking
              : result.ranking;
    return f(
      [
        "Declare query and desired evidence",
        "Inspect lexical and vector signals",
        "Rank lexical matches",
        "Rank supplied dense vectors",
        "Choose the retrieval method",
        "Take a three-document shortlist",
        "Inspect final candidate order",
      ][phase],
      phase === 0
        ? `Query: “${result.query}”. Relevant fixture evidence is ${result.documents.find((d) => d.relevant)!.id}. The explicit relevance label is separate from computed ranking scores.`
        : phase === 1
          ? "BM25 uses token counts and document lengths. Cosine uses supplied three-dimensional vectors, not embeddings fitted or measured from a real model."
          : phase === 2
            ? "Lexical candidate generation excludes zero-score documents rather than giving arbitrary zero-score ties retrieval credit."
            : phase === 3
              ? `${id === "restricted" ? "The restricted candidate set omits D3 on purpose, modeling a candidate-recall failure without claiming a particular ANN implementation." : "Compare every supplied document vector with the query vector."} Similarity alone does not establish relevance.`
              : phase === 4
                ? "Hybrid retrieval uses reciprocal rank fusion rather than adding incomparable BM25 and cosine magnitudes."
                : phase === 5
                  ? "Only the first three selected candidates reach the joint-rule reranker. A missing candidate cannot be rescued by reranking."
                  : id === "rerank"
                    ? "A transparent query/document rule prioritizes the return-window passage within the shortlist. This stands in for more expensive joint scoring; it is not a trained cross-encoder."
                    : "The chosen method returns this order. Check the relevance label separately, especially for product codes and paraphrases.",
      `Method=${result.method}; ranked IDs=${ranking.join(" → ") || "not ranked yet"}`,
      [
        ["Phase", phase],
        ["Candidates", ranking.length],
        ["Top", ranking[0] ?? "—"],
      ],
      {
        kind: "retrieval-ranking",
        query: result.query,
        queryVector: result.queryVector,
        documents: result.documents,
        ranking,
        shortlist: phase >= 5 ? result.shortlist : [],
        phase,
        method: result.method,
      },
    );
  });
}
export const policySource =
  "Policy v2 unopened items can be returned within 30 days keep your receipt refunds use original payment method";
export function chunkWords(text: string, size: number, overlap: number) {
  if (size < 1 || overlap < 0 || overlap >= size)
    throw new RangeError(
      "Chunk size must be positive and overlap smaller than size.",
    );
  const words = text.split(/\s+/),
    chunks = [];
  for (let start = 0; start < words.length; start += size - overlap) {
    const end = Math.min(words.length, start + size);
    chunks.push({
      id: `C${chunks.length + 1}`,
      start,
      end,
      text: words.slice(start, end).join(" "),
    });
    if (end === words.length) break;
  }
  return chunks;
}
export function ragResult(id: string) {
  const size = id === "small" || id === "overlap" ? 4 : 10,
    overlap = id === "overlap" ? 2 : id === "small" ? 0 : 2,
    k = id === "one" ? 1 : id === "overlap" ? 3 : 2,
    missing = id === "missing",
    chunks = missing ? [] : chunkWords(policySource, size, overlap),
    query = ["unopened", "returned", "30", "days", "receipt"],
    ranked = chunks
      .map((chunk) => ({
        ...chunk,
        score: query.filter((term) => chunk.text.split(" ").includes(term))
          .length,
      }))
      .sort((a, b) => b.score - a.score || a.start - b.start),
    selected = ranked.filter((v) => v.score > 0).slice(0, k),
    specs = [
      {
        text: "Unopened items can be returned within 30 days.",
        spans: ["unopened items", "returned within 30 days"],
      },
      { text: "Keep your receipt.", spans: ["keep your receipt"] },
      { text: "Return shipping is free.", spans: ["return shipping is free"] },
    ];
  const claims = specs.map((claim) => {
      const supported = claim.spans.every((span) =>
          selected.some((chunk) => chunk.text.includes(span)),
        ),
        support = selected
          .filter((chunk) =>
            claim.spans.some((span) => chunk.text.includes(span)),
          )
          .map((v) => v.id),
        emitted = id === "unsupported" || supported;
      return { text: claim.text, supported, support, emitted };
    }),
    answer =
      claims
        .filter((c) => c.emitted)
        .map(
          (c) =>
            `${c.text} ${c.supported ? "[" + c.support.join(",") + "]" : "[unsupported]"}`,
        )
        .join(" ") ||
      "Insufficient retrieved evidence. Retrieve more before answering.";
  return {
    size,
    overlap,
    k,
    missing,
    claims,
    answer,
    chunks: ranked.map((chunk) => ({
      ...chunk,
      selected: selected.some((c) => c.id === chunk.id),
    })),
  };
}
export function ragTrace(id: string) {
  const result = ragResult(id);
  return Array.from({ length: 7 }, (_, phase) =>
    f(
      [
        "Ingest a versioned source",
        "Split into word windows",
        "Score candidate chunks",
        "Retrieve the top chunks",
        "Assemble the evidence context",
        "Check each candidate claim",
        "Answer or expose missing support",
      ][phase],
      phase === 0
        ? "Question: what is the unopened-return window, and should the receipt be kept? The source is a declared fictional policy v2, not a real store policy."
        : phase === 1
          ? `Use ${result.size}-word chunks with ${result.overlap}-word overlap. Boundaries refer to zero-based word positions; repeated words are not new evidence.`
          : phase === 2
            ? "Score each chunk by the number of distinct declared query terms it contains. This is a transparent lexical teaching retriever."
            : phase === 3
              ? `Retrieve up to ${result.k} positive-score chunks. ${result.missing ? "No source was indexed, so the candidate set is empty." : "Ranking is not yet proof that the required phrase survived the boundary."}`
              : phase === 4
                ? "Only selected chunks enter the answer context. Other indexed text is not silently available to the claim checker."
                : phase === 5
                  ? "Each claim has explicit required spans. Every span must occur inside at least one selected chunk. This narrow fixture check reveals boundary loss; it is not a general entailment model."
                  : id === "unsupported"
                    ? "This deliberately flawed answer emits every candidate claim. The unsupported shipping claim is marked; a real-looking citation would not repair missing support."
                    : "Emit only supported candidate claims with their source chunk IDs. When none are supported, expose insufficient evidence rather than inventing a source.",
      `Chunk size=${result.size}; overlap=${result.overlap}; k=${result.k}; selected=${
        result.chunks
          .filter((c) => c.selected)
          .map((c) => c.id)
          .join(",") || "none"
      }`,
      [
        ["Chunks", phase >= 1 ? result.chunks.length : 0],
        [
          "Retrieved",
          phase >= 3 ? result.chunks.filter((c) => c.selected).length : 0,
        ],
        [
          "Supported",
          phase >= 5 ? result.claims.filter((c) => c.supported).length : 0,
        ],
      ],
      {
        kind: "rag-evidence",
        source: policySource,
        words: policySource.split(" ").length,
        ...result,
        phase,
      },
    ),
  );
}
const option = (id: string, label: string, description: string) => ({
  id,
  label,
  description,
});
export const retrievalExperiments: Experiment[] = [
  {
    id: "l39",
    title: "Find candidates, then inspect relevance.",
    scenarios: [
      option(
        "code-lexical",
        "Product code · lexical",
        "BM25 preserves an exact ZX-17 term match.",
      ),
      option(
        "code-dense",
        "Product code · dense",
        "The supplied embedding fixture favors the wrong near-identical code.",
      ),
      option(
        "code-hybrid",
        "Product code · hybrid",
        "Fuse positive lexical ranks with dense ranks using constant 60.",
      ),
      option(
        "paraphrase-lexical",
        "Paraphrase · lexical",
        "“Get my cash back” matches a partial passage rather than the exact return-window policy.",
      ),
      option(
        "paraphrase-dense",
        "Paraphrase · dense",
        "The supplied semantic vector retrieves the declared return-window evidence.",
      ),
      option(
        "paraphrase-hybrid",
        "Paraphrase · hybrid",
        "Fusion can favor a partial lexical/semantic overlap; combining signals is not a relevance guarantee.",
      ),
      option(
        "rerank",
        "Rerank the shortlist",
        "A transparent joint rule recognizes the return-window passage among three candidates.",
      ),
      option(
        "restricted",
        "Miss the best dense candidate",
        "Exclude D3 from candidate generation to expose unrecoverable recall loss.",
      ),
    ],
    build: retrievalTrace,
  },
  {
    id: "l40",
    title: "Follow evidence from source to answer.",
    scenarios: [
      option(
        "normal",
        "Ten-word chunks, two results",
        "Preserve the return-window span and the receipt instruction in retrieved context.",
      ),
      option(
        "small",
        "Small chunks without overlap",
        "A key phrase crosses a boundary and fails the declared support rule.",
      ),
      option(
        "overlap",
        "Small overlapping chunks",
        "Overlap can preserve one key span; retrieval count still controls other missing evidence.",
      ),
      option(
        "one",
        "Retrieve only one chunk",
        "The top return-window passage omits the receipt instruction.",
      ),
      option(
        "missing",
        "Source absent from the index",
        "No chunks are available; the grounded path exposes insufficient evidence.",
      ),
      option(
        "unsupported",
        "Emit an unsupported shipping claim",
        "Inspect a deliberately flawed fixed answer against the same evidence checks.",
      ),
    ],
    build: ragTrace,
  },
];
