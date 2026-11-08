import type { InferenceScene } from "@/lib/lessons/full/inference-scenes";
const n = (v: number | null) =>
  v === null
    ? "—"
    : Math.abs(v) < 0.00005
      ? "0"
      : Number.isInteger(v)
        ? String(v)
        : v.toFixed(4);
const vec = (v: number[]) => "[" + v.map(n).join(", ") + "]";
const pct = (v: number) => (v * 100).toFixed(1) + "%";
export function InferenceVisual({ scene }: { scene: InferenceScene }) {
  switch (scene.kind) {
    case "kv-cache":
      return (
        <div className="systems-scene">
          <div className="scene-label">{scene.mode}</div>
          <ol className="cache-slots">
            {scene.tokens.map((token) => (
              <li
                key={token.position}
                className={
                  token.position === scene.processed ? "systems-active" : ""
                }
              >
                <header>
                  <strong>Position {token.position}</strong>
                  <span>{token.state}</span>
                </header>
                <p>Input {vec(token.input)}</p>
                <dl>
                  <div>
                    <dt>Key</dt>
                    <dd>
                      {token.state === "Unread" || token.state === "Evicted"
                        ? "—"
                        : vec(token.key)}
                    </dd>
                  </div>
                  <div>
                    <dt>Value</dt>
                    <dd>
                      {token.state === "Unread" || token.state === "Evicted"
                        ? "—"
                        : vec(token.value)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
          <dl className="training-readouts">
            <div>
              <dt>Current query</dt>
              <dd>{scene.query.length ? vec(scene.query) : "Not processed"}</dd>
            </div>
            <div>
              <dt>Attention weights over permitted positions</dt>
              <dd>{scene.weights.length ? vec(scene.weights) : "—"}</dd>
            </div>
            <div>
              <dt>Attention output</dt>
              <dd>{scene.output ? vec(scene.output) : "—"}</dd>
            </div>
            <div>
              <dt>Cumulative causal pairs / layer / head</dt>
              <dd>{scene.pairs}</dd>
            </div>
          </dl>
          <p>
            Declared cache: 2 × {scene.layers} layers × {scene.batch} sequences
            × retained positions × {scene.heads} KV heads × 2 coordinates × 2
            bytes. Representative vectors show one layer/head.
          </p>
          <p>
            Model weights stay fixed. Evicted entries are no longer available to
            this window. Recomputed mode retains no persistent KV cache.
          </p>
        </div>
      );
    case "device-memory":
      return (
        <div className="systems-scene">
          <div className="scene-label">Declared budget · 4,000,000 bytes</div>
          <ol className="memory-parts">
            {scene.parts.map((part, i) => (
              <li
                key={part.label}
                className={i === scene.added - 1 ? "systems-active" : ""}
              >
                <header>
                  <strong>{part.label}</strong>
                  <span>
                    {i < scene.added
                      ? `${(part.bytes / 1_000_000).toFixed(2)} MB`
                      : "Not added"}
                  </span>
                </header>
                <div className="systems-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${100 * Math.min(1, part.bytes / scene.budget)}%`,
                    }}
                  />
                </div>
                <small>
                  {part.bytes.toLocaleString("en-US")} declared bytes
                </small>
              </li>
            ))}
          </ol>
          <p className="memory-fit">
            Accounted total: {(scene.used / 1_000_000).toFixed(2)} MB ·{" "}
            {scene.used <= scene.budget ? "within budget" : "over budget"}
          </p>
          <details className="systems-details">
            <summary>Inspect numeric formats and the toy quantizer</summary>
            <ul className="format-list">
              {scene.formats.map((format) => (
                <li key={format.label}>
                  <strong>{format.label}</strong>
                  <span>
                    1 sign + {format.exponent} exponent + {format.fraction}{" "}
                    fraction bits
                  </span>
                </li>
              ))}
            </ul>
            <p>
              The uniform integer example below uses {scene.bits === 4 ? 4 : 8}{" "}
              bits, scale {n(scene.scale)}, symmetric clipping, and no zero
              point. It is separate from the floating-point formats above.
            </p>
            <ol className="quantized-values">
              {scene.quantization.map((row, i) => (
                <li key={i}>
                  <span>{n(row.weight)}</span>
                  <span aria-hidden="true">→</span>
                  <strong>{row.code}</strong>
                  <span aria-hidden="true">→</span>
                  <span>{n(row.restored)}</span>
                </li>
              ))}
            </ol>
            <p>
              Dot with [2,1,−1,0.5]: original {n(scene.fullOutput)}; restored{" "}
              {n(scene.quantOutput)}. Fewer bits do not prove a proportional
              speedup.
            </p>
          </details>
        </div>
      );
    case "parallel-work":
      return (
        <div className="systems-scene">
          <div className="scene-label">
            {scene.method.replaceAll("-", " ")} · arithmetic fixture
          </div>
          <p>Inputs: {scene.input.map(vec).join("; ")}</p>
          <div className="device-lanes">
            {scene.devices.map((device) => (
              <div
                key={device.name}
                className={device.done ? "systems-active" : ""}
              >
                <header>
                  <strong>{device.name}</strong>
                  <span>{device.stored} weight entries</span>
                </header>
                <p>{device.task}</p>
                <dl>
                  <dt>Local result</dt>
                  <dd>{device.done ? vec(device.result) : "Not run yet"}</dd>
                </dl>
              </div>
            ))}
          </div>
          <p>{scene.communication}</p>
          <dl className="training-readouts">
            <div>
              <dt>Assembled output</dt>
              <dd>
                {scene.output.length
                  ? scene.output.map(vec).join("; ")
                  : "Awaiting assembly"}
              </dd>
            </div>
          </dl>
          <p>
            These decompositions split different work. Communication,
            synchronization, utilization and actual kernels determine runtime;
            this figure does not predict speed.
          </p>
        </div>
      );
    case "serving-queue":
      return (
        <div className="systems-scene">
          <div className="scene-label">
            {scene.mode} · {scene.capacity} slot{scene.capacity > 1 ? "s" : ""}{" "}
            · tick {scene.cycle}
          </div>
          <div
            className="queue-timeline"
            aria-label="Generated work by request"
          >
            <div className="queue-scale">
              <span>0</span>
              <span>4</span>
              <span>8 time units</span>
            </div>
            {scene.requests.map((request) => (
              <div key={request.id} className="queue-timeline-row">
                <strong>{request.id}</strong>
                <div
                  role="img"
                  aria-label={`${request.id}: ${request.generated} of ${request.length} tokens generated; ${request.status}`}
                >
                  <span
                    style={{
                      left: `${(100 * (request.first === null ? 0 : request.first - scene.cycle)) / 8}%`,
                      width: `${(100 * request.generated * scene.cycle) / 8}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ol className="queue-requests">
            {scene.requests.map((request) => (
              <li key={request.id}>
                <header>
                  <strong>
                    {request.id} · {request.status}
                  </strong>
                  <span>
                    {request.generated}/{request.length} tokens
                  </span>
                </header>
                <small>
                  Arrive {request.arrival} · first {n(request.first)} · finish{" "}
                  {n(request.finish)}
                </small>
                <small>
                  Retained cache pages:{" "}
                  {request.pages.length ? request.pages.join(", ") : "none"}
                </small>
              </li>
            ))}
          </ol>
          <h4>Physical KV pages · two entries each</h4>
          <ol className="cache-pages">
            {scene.pages.map((page) => (
              <li
                key={page.id}
                aria-label={`Page ${page.id}: ${page.owner ?? "free"}, ${page.used} of 2 entries`}
                className={page.owner ? "systems-active" : ""}
              >
                <span>{page.id}</span>
                <strong>{page.owner ?? "Free"}</strong>
                <small>{page.used}/2</small>
              </li>
            ))}
          </ol>
          <p>
            Pages show retained state after the tick. Finished requests release
            their pages; active requests retain two prompt entries plus
            generated entries. Logical sequence pages can occupy separate
            physical slots.
          </p>
        </div>
      );
    case "online-attention":
      return (
        <div className="systems-scene">
          <div className="scene-label">Online softmax · one query row</div>
          <ol className="online-pairs">
            {scene.scores.map((score, i) => (
              <li key={i} className={i < scene.seen ? "systems-active" : ""}>
                <strong>Pair {i + 1}</strong>
                <span>Score {score}</span>
                <span>Value {scene.values[i]}</span>
                <small>{i < scene.seen ? "Consumed" : "Pending"}</small>
              </li>
            ))}
          </ol>
          <dl className="training-readouts">
            <div>
              <dt>Running maximum m</dt>
              <dd>{n(scene.maximum)}</dd>
            </div>
            <div>
              <dt>Scaled denominator l</dt>
              <dd>{n(scene.denominator)}</dd>
            </div>
            <div>
              <dt>Scaled weighted sum o</dt>
              <dd>{n(scene.numerator)}</dd>
            </div>
            <div>
              <dt>Current output o / l</dt>
              <dd>{n(scene.output)}</dd>
            </div>
            <div>
              <dt>Direct full-row answer</dt>
              <dd>{n(scene.direct)}</dd>
            </div>
          </dl>
          <p>
            Tile size: {scene.tile} pair{scene.tile > 1 ? "s" : ""}. The final
            mixture matches the direct stable-softmax result. Three keys still
            require three interactions for this query; dense attention across N
            queries and N keys still has N² pair interactions.
          </p>
          <p>
            This recurrence illustrates exact online attention arithmetic. It
            omits the GPU tiling, backward pass and implementation details of
            FlashAttention.
          </p>
        </div>
      );
    case "speculative-sample":
      return (
        <div className="systems-scene">
          <div className="scene-label">
            {scene.naive
              ? "Uncorrected draft sampling"
              : "Corrected speculative sampling"}{" "}
            · one position
          </div>
          <ol className="spec-distributions">
            {scene.target.map((p, i) => (
              <li
                key={i}
                className={
                  scene.phase >= 1 && scene.proposal === i
                    ? "systems-active"
                    : ""
                }
              >
                <header>
                  <strong>Token {i === 0 ? "A" : "B"}</strong>
                  <span>
                    {scene.phase >= 3 && scene.output === i
                      ? "Inspected output"
                      : ""}
                  </span>
                </header>
                <dl>
                  <div>
                    <dt>Target p</dt>
                    <dd>{pct(p)}</dd>
                  </div>
                  <div>
                    <dt>Draft q</dt>
                    <dd>{pct(scene.draft[i])}</dd>
                  </div>
                  <div>
                    <dt>Accept ratio</dt>
                    <dd>
                      {scene.phase >= 2
                        ? pct(scene.acceptance[i])
                        : "Not checked"}
                    </dd>
                  </div>
                  <div>
                    <dt>Accepted mass</dt>
                    <dd>
                      {scene.phase === 4
                        ? pct(scene.accepted[i])
                        : "Not accounted"}
                    </dd>
                  </div>
                  <div>
                    <dt>Residual draw</dt>
                    <dd>
                      {scene.phase >= 3
                        ? pct(scene.residual[i])
                        : "Not used yet"}
                    </dd>
                  </div>
                  <div>
                    <dt>Final output mass</dt>
                    <dd>
                      {scene.phase === 4
                        ? pct(scene.result[i])
                        : "Not accounted"}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
          <p>
            Inspected acceptance draw: {scene.uniform}.{" "}
            {scene.phase >= 2
              ? scene.naive
                ? "No correction is applied."
                : scene.acceptedProposal
                  ? "This proposal is accepted."
                  : "This proposal is rejected and replaced."
              : "Step forward to check the proposal."}
          </p>
          <p>
            With matching p and q, rejection has probability zero; the all-zero
            residual row means “never sampled,” not a probability distribution
            to draw from.
          </p>
        </div>
      );
    case "expert-routing":
      return (
        <div className="systems-scene">
          <div className="scene-label">
            {scene.policy} · gate + selected ReLU experts
          </div>
          <div className="expert-stations">
            {scene.experts.map((expert) => (
              <div
                key={expert.label}
                className={
                  expert.load === expert.capacity ? "systems-active" : ""
                }
              >
                <strong>{expert.label}</strong>
                <span>
                  {expert.load} / {expert.capacity} slots
                </span>
                <div className="systems-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${(100 * expert.load) / expert.capacity}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ol className="routed-tokens">
            {scene.tokens.map((token, i) => (
              <li
                key={i}
                className={scene.current === i ? "systems-active" : ""}
              >
                <header>
                  <strong>
                    {i + 1} · {vec(token.input)}
                  </strong>
                  <span>{token.status}</span>
                </header>
                <p>
                  {token.routes.length
                    ? `Experts ${token.routes.map((j) => j + 1).join(" + ")} → ${vec(token.output)}`
                    : token.status === "Dropped"
                      ? "No expert branch → [0, 0]"
                      : "Route pending"}
                </p>
              </li>
            ))}
          </ol>
          <dl className="training-readouts">
            <div>
              <dt>Current gate logits</dt>
              <dd>{scene.logits.length ? vec(scene.logits) : "—"}</dd>
            </div>
            <div>
              <dt>Current retained gate weights</dt>
              <dd>{scene.weights.length ? vec(scene.weights) : "—"}</dd>
            </div>
            <div>
              <dt>Total stored parameter entries</dt>
              <dd>{scene.total} = 8 gate + 16 experts</dd>
            </div>
            <div>
              <dt>Current token’s active entries</dt>
              <dd>{scene.processed ? scene.active : "Not run"}</dd>
            </div>
          </dl>
          <p>
            Eight gate entries are shared; each selected expert uses four
            entries. The configured top-{scene.topK} limit differs from actual
            work when a capacity policy drops branches. Batch-wide expert usage
            can exceed one token’s usage.
          </p>
        </div>
      );
    case "retrieval-ranking":
      return (
        <div className="systems-scene">
          <div className="scene-label">
            {scene.method} · supplied corpus and vectors
          </div>
          <div className="search-query">
            <h4>Query</h4>
            <p>{scene.query}</p>
            <small>Synthetic query vector: {vec(scene.queryVector)}</small>
          </div>
          <ol className="ranked-documents">
            {Array.from({ length: 3 }, (_, i) => {
              const doc = scene.documents.find(
                (d) => d.id === scene.ranking[i],
              );
              return (
                <li key={i} className={doc?.relevant ? "systems-active" : ""}>
                  <header>
                    <strong>
                      {i + 1} · {doc?.id ?? "Awaiting ranking"}
                    </strong>
                    <span>
                      {doc
                        ? doc.relevant
                          ? "Relevant fixture"
                          : "Not target evidence"
                        : "Pending"}
                    </span>
                  </header>
                  <p>
                    {doc?.text ??
                      "Step through the retrieval signals before assigning candidate positions."}
                  </p>
                  <small>
                    {doc
                      ? `BM25 ${n(doc.lexical)} · cosine ${n(doc.dense)} · RRF ${n(doc.fusion)}`
                      : "BM25 — · cosine — · RRF —"}
                  </small>
                  {scene.phase === 6 && doc && (
                    <small>Joint rule score: {doc.joint}</small>
                  )}
                </li>
              );
            })}
          </ol>
          <p>
            Shortlist:{" "}
            {scene.shortlist.length
              ? scene.shortlist.join(", ")
              : "Not selected yet"}
            . Relevance labels are declared separately from score. The joint
            rule is a transparent fixture, not a trained neural cross-encoder.
          </p>
          <details className="systems-details">
            <summary>Inspect all eight documents and supplied vectors</summary>
            <ol className="retrieval-corpus">
              {scene.documents.map((doc) => (
                <li key={doc.id}>
                  <strong>
                    {doc.id}
                    {!doc.included ? " · excluded from dense candidates" : ""}
                  </strong>
                  <p>{doc.text}</p>
                  <small>Vector {vec(doc.vector)}</small>
                </li>
              ))}
            </ol>
          </details>
        </div>
      );
    case "rag-evidence":
      return (
        <div className="systems-scene">
          <div className="scene-label">
            Fictional policy v2 · {scene.words} source words
          </div>
          <p className="rag-source">{scene.source}</p>
          <p>
            Windows: {scene.size} words · overlap {scene.overlap} · retrieve up
            to {scene.k}
          </p>
          <ol className="evidence-chunks">
            {scene.phase >= 1 ? (
              scene.chunks.slice(0, 3).map((chunk) => (
                <li
                  key={chunk.id}
                  className={
                    scene.phase >= 3 && chunk.selected ? "systems-active" : ""
                  }
                >
                  <header>
                    <strong>
                      {chunk.id} · [{chunk.start}, {chunk.end})
                    </strong>
                    <span>
                      {scene.phase >= 3
                        ? chunk.selected
                          ? "In context"
                          : "Omitted"
                        : "Candidate"}
                    </span>
                  </header>
                  <p>{chunk.text}</p>
                  <small>
                    {scene.phase >= 2
                      ? `Term matches: ${chunk.score}`
                      : "Not scored yet"}
                  </small>
                </li>
              ))
            ) : (
              <li>
                <strong>Before ingestion</strong>
                <p>Step forward to build the word windows from this source.</p>
              </li>
            )}
            {scene.missing && scene.phase >= 1 && (
              <li>
                <strong>No indexed source</strong>
                <p>
                  The displayed fixture exists, but this scenario intentionally
                  did not add it to the searchable index.
                </p>
              </li>
            )}
          </ol>
          {scene.chunks.length > 3 && (
            <details className="systems-details">
              <summary>Inspect all {scene.chunks.length} chunk windows</summary>
              <ol className="retrieval-corpus">
                {scene.chunks.map((chunk) => (
                  <li key={chunk.id}>
                    <strong>
                      {chunk.id} · words [{chunk.start}, {chunk.end})
                    </strong>
                    <p>{chunk.text}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}
          <ol className="claim-support">
            {scene.claims.map((claim) => (
              <li key={claim.text}>
                <strong>{claim.text}</strong>
                <span>
                  {scene.phase >= 5
                    ? claim.supported
                      ? "Supported"
                      : "Unsupported"
                    : "Not checked"}
                </span>
                <small>
                  Candidate support:{" "}
                  {scene.phase >= 5
                    ? claim.support.join(", ") || "none"
                    : "not inspected"}
                </small>
              </li>
            ))}
          </ol>
          <div className="grounded-answer">
            <h4>Assembled answer</h4>
            <p>
              {scene.phase === 6
                ? scene.answer
                : "Validate support before assembling the answer."}
            </p>
          </div>
          <p>
            Support uses required exact spans in selected chunks. A real system
            needs richer entailment and citation checks; this fixture does not
            simulate a language model generating prose.
          </p>
        </div>
      );
  }
}
