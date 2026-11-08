import type { SequenceScene } from "@/lib/lessons/full/sequence-scenes";
const n = (v: number) =>
  Math.abs(v) < 0.00005 ? "0" : Number.isInteger(v) ? String(v) : v.toFixed(4);
const vec = (v: number[]) => `[${v.map(n).join(", ")}]`;
const short = (v: number) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2));
export function SequenceVisual({ scene }: { scene: SequenceScene }) {
  switch (scene.kind) {
    case "recurrent":
      return (
        <div className="sequence-scene">
          <div className="scene-label">
            {scene.method === "store"
              ? "Explicit token store"
              : scene.method.toUpperCase() + " · supplied parameters"}
          </div>
          <ol className="sequence-symbols" aria-label="Input symbols in order">
            {scene.tokens.map((value, i) => (
              <li
                key={i}
                className={
                  i === scene.seen - 1
                    ? "scene-active"
                    : i >= scene.seen
                      ? "symbol-unread"
                      : ""
                }
              >
                <span>{i + 1}</span>
                <strong>{value === 1 ? "Red" : "Blue"}</strong>
                <small>{i < scene.seen ? "Read" : "Next"}</small>
              </li>
            ))}
          </ol>
          <p className="sequence-rule">{scene.rule}</p>
          {scene.store ? (
            <>
              <div className="neural-node">
                <h4>Retained prefix</h4>
                <p>
                  {scene.store.length
                    ? scene.store
                        .map((x) => (x === 1 ? "Red" : "Blue"))
                        .join(" → ")
                    : "Empty"}
                </p>
                <small>
                  First indexed item:{" "}
                  {scene.recall === null
                    ? "—"
                    : scene.recall === 1
                      ? "Red"
                      : "Blue"}
                </small>
              </div>
              <table className="attention-grid store-lookup">
                <caption>
                  Indexed lookup selects slot 1. Unread symbols have not been
                  retained.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Slot</th>
                    <th scope="col">Value</th>
                    <th scope="col">Read</th>
                  </tr>
                </thead>
                <tbody>
                  {scene.tokens.map((_, i) => (
                    <tr key={i}>
                      <th scope="row">{i + 1}</th>
                      <td>
                        {i < scene.seen ? (
                          <>
                            <span>
                              {scene.store![i] === 1 ? "Red" : "Blue"}
                            </span>
                            <small>{scene.store![i] === 1 ? "+1" : "−1"}</small>
                          </>
                        ) : (
                          "Empty"
                        )}
                      </td>
                      <td>{i === 0 ? 1 : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div className="recurrent-transition">
                <div>
                  <span>Previous h</span>
                  <strong>{n(scene.previous)}</strong>
                </div>
                <span aria-hidden="true">→</span>
                <div>
                  <span>New h</span>
                  <strong>{n(scene.state)}</strong>
                </div>
              </div>
              <dl className="training-readouts">
                {scene.cell !== null && (
                  <div>
                    <dt>Cell memory c</dt>
                    <dd>{n(scene.cell)}</dd>
                  </div>
                )}
                {scene.gates.map((gate) => (
                  <div key={gate.label}>
                    <dt>{gate.label}</dt>
                    <dd>{n(gate.value)}</dd>
                  </div>
                ))}
              </dl>
              <p className="scene-label">
                Recall rule: sign(h). This readout is supplied, not trained.
              </p>
            </>
          )}
        </div>
      );
    case "attention-matrix":
      return (
        <div className="sequence-scene">
          <div className="scene-label">{scene.phase}</div>
          <div className="attention-input-lists">
            <div>
              <h4>Queries</h4>
              {scene.queries.map((q, i) => (
                <p key={i}>
                  <span>
                    Q{i + 1} · {scene.queryNames[i]}
                  </span>
                  <code>{vec(q)}</code>
                </p>
              ))}
            </div>
            <div>
              <h4>Keys / values</h4>
              {scene.keys.map((k, i) => (
                <p key={i}>
                  <span>
                    K{i + 1} · {scene.keyNames[i]}
                  </span>
                  <code>
                    k {vec(k)}
                    <br />v {vec(scene.values[i])}
                  </code>
                </p>
              ))}
            </div>
          </div>
          <table className="attention-grid">
            <caption>
              {scene.stage === 1
                ? "Unscaled query–key dot products"
                : "Scaled scores · blocked future cells have no probability"}
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span aria-hidden="true">Q</span>
                  <span className="sr-only">Query</span>
                </th>
                {scene.keys.map((_, j) => (
                  <th scope="col" key={j}>
                    K{j + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scene.scores.map((row, i) => (
                <tr
                  key={i}
                  className={scene.activeRow === i ? "scene-active" : ""}
                >
                  <th scope="row">Q{i + 1}</th>
                  {row.map((score, j) => (
                    <td key={j}>
                      {scene.stage >= 3 && !scene.allowed[i][j] ? (
                        <span
                          className="matrix-blocked"
                          role="img"
                          aria-label="Blocked"
                        >
                          ×
                        </span>
                      ) : scene.stage >= 1 ? (
                        short(scene.stage === 1 ? scene.rawScores[i][j] : score)
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <table className="attention-grid">
            <caption>
              Row-normalized weights · each permitted row sums to 1
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span aria-hidden="true">Q</span>
                  <span className="sr-only">Query</span>
                </th>
                {scene.keys.map((_, j) => (
                  <th scope="col" key={j}>
                    K{j + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scene.weights.map((row, i) => (
                <tr
                  key={i}
                  className={scene.activeRow === i ? "scene-active" : ""}
                >
                  <th scope="row">Q{i + 1}</th>
                  {row.map((weight, j) => (
                    <td
                      key={j}
                      className={!scene.allowed[i][j] ? "matrix-blocked" : ""}
                    >
                      {scene.stage >= 4 ? short(weight) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="training-readouts">
            {scene.outputs.map((out, i) => (
              <div key={i}>
                <dt>
                  {scene.outputLabel} · Q{i + 1}
                </dt>
                <dd>
                  {scene.stage >= 7 || scene.stage >= 5 + i ? vec(out) : "—"}
                </dd>
              </div>
            ))}
          </dl>
          <p className="scene-label">
            {scene.note} Tables round to two decimals; mixtures use
            full-precision weights.
          </p>
        </div>
      );
    case "decoder-block":
      return (
        <div className="sequence-scene">
          <div className="scene-label">
            Pre-normalized decoder · inspect position {scene.token}
          </div>
          <div className="block-inputs">
            {scene.inputTokens.map((token, i) => (
              <span key={i}>
                {i}: {vec(token)}
              </span>
            ))}
          </div>
          <ol className="decoder-operation-list">
            {scene.nodes.map((node, i) => (
              <li
                key={node.label}
                className={i === scene.stage ? "scene-active" : ""}
              >
                <span className="decoder-operation-number">{i + 1}</span>
                <div>
                  <h4>{node.label}</h4>
                  <small>{node.shape}</small>
                  <code>{i <= scene.stage ? vec(node.value) : "—"}</code>
                </div>
                {[3, 7].includes(i) && (
                  <span className="residual-status">
                    {scene.residuals ? "Input + path" : "Skip off"}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="scene-label">
            RoPE {scene.positions ? "on" : "off"} · all weights are supplied.
            This block has no vocabulary head.
          </p>
        </div>
      );
    case "tokenizer":
      return (
        <div className="sequence-scene">
          <div className="scene-label">
            Synthetic BPE · printable ASCII alphabet
          </div>
          <div className="bpe-corpus">
            {scene.corpus.map((row) => (
              <div key={row.word}>
                <h4>
                  {row.word}
                  <small>Corpus count {row.count}</small>
                </h4>
                <div className="bpe-pieces">
                  {row.tokens.map((token, i) => (
                    <span key={i}>{token}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="scene-label">Current adjacent-pair counts</div>
          <ol className="bpe-counts">
            {scene.pairCounts.map((row) => (
              <li key={row.pair.join(" ")}>
                <code>{row.pair.join(" + ")}</code>
                <b>{row.count}</b>
              </li>
            ))}
          </ol>
          <div className="neural-node">
            <h4>Encode the body: {scene.query}</h4>
            <div className="bpe-pieces">
              {scene.encoded.length ? (
                scene.encoded.map((token, i) => (
                  <span key={i}>
                    <strong>{token}</strong>
                    <small>ID {scene.ids[i]}</small>
                  </span>
                ))
              ) : (
                <span>Apply learned merges, then encode</span>
              )}
            </div>
          </div>
          <dl className="training-readouts">
            <div>
              <dt>Structured role</dt>
              <dd>{scene.stage >= 6 ? scene.role : "—"}</dd>
            </div>
            <div>
              <dt>Serialized role + body + turn end + assistant prompt</dt>
              <dd>{scene.serialized.length ? vec(scene.serialized) : "—"}</dd>
            </div>
          </dl>
          <p className="scene-label">
            An ID is a vocabulary index. Its meaning depends on this vocabulary
            and serialization contract.
          </p>
        </div>
      );
    case "language-model":
      return (
        <div className="sequence-scene">
          <div className="scene-label">
            {scene.mode === "train"
              ? "Teacher-forced targets"
              : "Autoregressive generation"}{" "}
            · supplied last-token model
          </div>
          <div className="lm-prefix" aria-label="Current token sequence">
            {scene.sequence.map((token, i) => (
              <span key={i}>{token}</span>
            ))}
          </div>
          {scene.mode === "train" ? (
            <ol className="teacher-rows">
              {scene.rows.map((row, i) => (
                <li key={i}>
                  <h4>
                    Position {i + 1} → target {row.target}
                  </h4>
                  <p>Allowed prefix: {row.prefix.join(" ")}</p>
                  <dl>
                    <div>
                      <dt>Target probability</dt>
                      <dd>{scene.stage >= 3 ? n(row.probability) : "—"}</dd>
                    </div>
                    <div>
                      <dt>Negative log probability</dt>
                      <dd>{scene.stage >= 4 ? n(row.loss) : "—"}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="lm-vocabulary">
              {scene.vocabulary.map((token, i) => (
                <li
                  key={token}
                  className={scene.selected === i ? "scene-active" : ""}
                >
                  <div>
                    <strong>{token}</strong>
                    <span>
                      Logit {scene.stage >= 1 ? n(scene.logits[i]) : "—"} · p{" "}
                      {scene.stage >= 1 ? n(scene.probabilities[i]) : "—"}
                    </span>
                  </div>
                  <div className="lm-probability" aria-hidden="true">
                    <span
                      style={{
                        width: `${scene.stage >= 1 ? 100 * scene.probabilities[i] : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="lm-stop">
            {scene.mode === "train"
              ? "Known targets are used for scoring, not exposed as future context."
              : `Status: ${scene.stop}`}
          </p>
        </div>
      );
  }
}
