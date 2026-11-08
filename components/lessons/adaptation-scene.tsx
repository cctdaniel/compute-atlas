import type { AdaptationScene } from "@/lib/lessons/full/adaptation-scenes";
const n = (v: number) =>
  Math.abs(v) < 0.00005 ? "0" : Number.isInteger(v) ? String(v) : v.toFixed(4);
const vec = (v: number[]) => "[" + v.map(n).join(", ") + "]";
function Matrix({ label, values }: { label: string; values: number[][] }) {
  return (
    <div className="adapter-matrix">
      <h4>{label}</h4>
      <div
        style={{
          gridTemplateColumns: `repeat(${values[0].length},minmax(0,1fr))`,
        }}
      >
        {values.flatMap((row, i) =>
          row.map((value, j) => <span key={`${i}-${j}`}>{n(value)}</span>),
        )}
      </div>
      <small>
        {values.length} × {values[0].length}
      </small>
    </div>
  );
}
function Probability({
  label,
  value,
  detail,
  active = false,
}: {
  label: string;
  value: number;
  detail?: string;
  active?: boolean;
}) {
  return (
    <li className={active ? "adapt-active" : ""}>
      <div>
        <strong>{label}</strong>
        <span>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="adapt-track" aria-hidden="true">
        <span style={{ width: `${100 * value}%` }} />
      </div>
      {detail && <small>{detail}</small>}
    </li>
  );
}
export function AdaptationVisual({ scene }: { scene: AdaptationScene }) {
  switch (scene.kind) {
    case "scaling-budget":
      return (
        <div className="adapt-scene">
          <div className="scene-label">
            Illustrative loss · fixed N × D = 16
          </div>
          <ol className="scaling-allocations">
            {scene.rows.map((row, i) => (
              <li
                key={row.n}
                className={i === scene.active ? "adapt-active" : ""}
                aria-current={i === scene.active ? "step" : undefined}
              >
                <div>
                  <strong>
                    N {row.n} · D {row.d}
                  </strong>
                  <span>Loss {n(row.loss)}</span>
                </div>
                <div className="allocation-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${100 / scene.rows.reduce((m, r) => Math.max(m, r.loss), 0)}%`,
                    }}
                  />
                  <span
                    style={{
                      width: `${(100 * row.modelTerm) / scene.rows.reduce((m, r) => Math.max(m, r.loss), 0)}%`,
                    }}
                  />
                  <span
                    style={{
                      width: `${(100 * row.dataTerm) / scene.rows.reduce((m, r) => Math.max(m, r.loss), 0)}%`,
                    }}
                  />
                </div>
                <small>
                  1 floor + {n(row.modelTerm)} model + {n(row.dataTerm)} data
                </small>
                <small>Lifetime work: {row.lifetime} units</small>
              </li>
            ))}
          </ol>
          <p>
            Bars share one scale. Each sums the three loss terms. Serving{" "}
            {scene.requests} requests adds requests × N.
          </p>
        </div>
      );
    case "prompt-contract":
      return (
        <div className="adapt-scene">
          <div className="scene-label">
            Supplied fixtures · deterministic checks
          </div>
          <div className="contract-text">
            <h4>Task input</h4>
            <p>{scene.prompt}</p>
            <h4>Receipt data</h4>
            <p>{scene.source}</p>
            <h4>Answer fixture</h4>
            <code>{scene.response}</code>
          </div>
          <ol className="contract-checks">
            {scene.checks.map((check, i) => (
              <li
                key={check.label}
                className={i === scene.revealed - 1 ? "adapt-active" : ""}
              >
                <strong>{check.label}</strong>
                <span>
                  {i < scene.revealed
                    ? check.passed
                      ? "Pass"
                      : "Fail"
                    : "Not checked"}
                </span>
              </li>
            ))}
          </ol>
          <p>
            Each requirement is checked separately. No model is being called or
            trained.
          </p>
        </div>
      );
    case "context-budget":
      return (
        <div className="adapt-scene">
          <div className="scene-label">20 declared units · pack in order</div>
          <div
            className="context-capacity"
            role="img"
            aria-label={`${scene.used} of ${scene.capacity} units used`}
          >
            <span style={{ width: `100%` }} />
            {scene.items
              .filter((v) => v.processed && v.kept)
              .map((v, i) => (
                <span
                  key={v.label}
                  className={`budget-tone-${i % 4}`}
                  style={{ width: `${(100 * v.units) / scene.capacity}%` }}
                />
              ))}
          </div>
          <p className="adapt-formula">
            Used {scene.used} / {scene.capacity} · free{" "}
            {scene.capacity - scene.used}
          </p>
          <ol className="context-items">
            {scene.items.map((item) => (
              <li
                key={item.label}
                className={item.processed ? "" : "adapt-pending"}
              >
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.units} units</span>
                </div>
                <p>{item.text}</p>
                <small>
                  {!item.processed
                    ? "Not packed yet"
                    : item.kept
                      ? item.units
                        ? "Retained"
                        : "Zero allowance"
                      : "Omitted: does not fit"}
                </small>
              </li>
            ))}
          </ol>
          <ul className="context-facts">
            {scene.facts.map((fact) => (
              <li key={fact.label}>
                <span>{fact.label}</span>
                <strong>
                  {scene.checked
                    ? fact.available
                      ? "Available"
                      : "Missing"
                    : "Unchecked"}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      );
    case "decode-choice":
      return (
        <div className="adapt-scene">
          <div className="scene-label">
            {scene.branches.length
              ? "Equal-length sequence probabilities"
              : "Next-token distribution"}
          </div>
          <ul className="probability-list">
            {scene.labels.map((label, i) => (
              <Probability
                key={label}
                label={label}
                value={scene.filtered[i]}
                active={scene.selected === i}
                detail={`Before filtering: ${(100 * scene.probabilities[i]).toFixed(1)}% · draws: ${scene.counts[i] ?? 0}`}
              />
            ))}
          </ul>
          <div className="decode-draw">
            <span>Uniform draw</span>
            <strong>{scene.draw === null ? "Not used" : n(scene.draw)}</strong>
          </div>
          {scene.branches.length > 0 ? (
            <ol className="beam-branches">
              {scene.branches.map((branch) => (
                <li key={branch.label}>
                  <strong>{branch.label}</strong>
                  <span>{n(branch.probability)}</span>
                  <small>{branch.retained ? "Retained" : "Pruned"}</small>
                </li>
              ))}
            </ol>
          ) : (
            <p>
              Descending cumulative intervals determine which sampled token
              contains the draw. Greedy instead selects the highest score.
            </p>
          )}
        </div>
      );
    case "candidate-verifier":
      return (
        <div className="adapt-scene">
          <div className="scene-label">2 × 3 + 2 = 8 · supplied candidates</div>
          <h4 className="adapt-heading">{scene.method}</h4>
          <ol className="verifier-candidates">
            {scene.candidates.map((c, i) => (
              <li
                key={i}
                className={scene.selected === i ? "adapt-active" : ""}
              >
                <span>Attempt {i + 1}</span>
                <strong>{i < scene.generated ? c.answer : "—"}</strong>
                <small>
                  {i >= scene.generated
                    ? "Not generated"
                    : c.checked
                      ? c.passed
                        ? "Check passed"
                        : "Check failed"
                      : "Not checked"}
                  {scene.selected === i ? " · selected" : ""}
                </small>
              </li>
            ))}
          </ol>
          <dl className="training-readouts">
            <div>
              <dt>Work used</dt>
              <dd>
                {scene.used} / {scene.budget}
              </dd>
            </div>
            <div>
              <dt>Work left</dt>
              <dd>{scene.budget - scene.used}</dd>
            </div>
            <div>
              <dt>Selected answer</dt>
              <dd>
                {scene.selected === null
                  ? "None"
                  : scene.candidates[scene.selected].answer}
              </dd>
            </div>
          </dl>
          <p>
            The correct answer is declared separately from the selector. Passing
            a weak check does not imply correctness.
          </p>
        </div>
      );
    case "sft-mask":
      return (
        <div className="adapt-scene">
          <div className="scene-label">
            Binary-token fixture · shared scalar θ
          </div>
          <ol className="sft-positions">
            {scene.rows.map((row, i) => (
              <li key={i} className={row.included ? "adapt-active" : ""}>
                <div>
                  <strong>{row.token}</strong>
                  <span>{row.included ? "Loss included" : "Loss masked"}</span>
                </div>
                <p>Alternative: {row.alternative}</p>
                <small>
                  Feature {row.feature} · target probability{" "}
                  {n(row.probability)}
                </small>
              </li>
            ))}
          </ol>
          <dl className="training-readouts">
            <div>
              <dt>Weight θ</dt>
              <dd>{n(scene.weight)}</dd>
            </div>
            <div>
              <dt>Mean target loss</dt>
              <dd>{n(scene.loss)}</dd>
            </div>
            <div>
              <dt>Next update gradient</dt>
              <dd>
                {scene.gradient === null ? "No optimizer" : n(scene.gradient)}
              </dd>
            </div>
          </dl>
          <p>
            {scene.updated
              ? "Values recomputed after the update."
              : "Weights have not been updated in this frame."}{" "}
            Masking omits an objective term; it does not erase the input token.
          </p>
        </div>
      );
    case "reward-policy":
      return (
        <div className="adapt-scene">
          <div className="scene-label">
            {scene.featureName} · fitted reward proxy
          </div>
          <p className="adapt-formula">Reward = {n(scene.weight)} × feature</p>
          <ul className="probability-list reward-candidates">
            {scene.candidates.map((c, i) => (
              <Probability
                key={i}
                label={c.text}
                value={c.policy}
                detail={`Fact check: ${c.correct ? "correct" : "wrong"} · feature ${c.feature} · reward ${n(c.reward)} · reference ${(100 * c.reference).toFixed(0)}%`}
              />
            ))}
          </ul>
          <p>
            Policy maximizes expected reward − {scene.beta} × KL(policy ‖
            reference) over these three candidates. This exact finite solution
            is not a PPO simulation.
          </p>
        </div>
      );
    case "preference-update":
      return (
        <div className="adapt-scene">
          <div className="scene-label">Two-response DPO · fixed reference</div>
          <ul className="probability-list">
            <Probability
              label="A · 8 pencils (correct)"
              value={scene.probability}
              active={scene.preferred === 1}
              detail={`Reference: ${(100 * scene.reference).toFixed(0)}%`}
            />
            <Probability
              label="B · verbose answer of 9 (wrong)"
              value={1 - scene.probability}
              active={scene.preferred === -1}
              detail={`Reference: ${(100 * (1 - scene.reference)).toFixed(0)}%`}
            />
          </ul>
          <dl className="training-readouts">
            <div>
              <dt>Relative margin z</dt>
              <dd>{n(scene.margin)}</dd>
            </div>
            <div>
              <dt>Preference loss</dt>
              <dd>{n(scene.loss)}</dd>
            </div>
            <div>
              <dt>Gradient at this state</dt>
              <dd>{n(scene.gradient)}</dd>
            </div>
          </dl>
          <h4 className="adapt-heading">Feedback sources can disagree</h4>
          <ul className="feedback-checks">
            {scene.checks.map((check) => (
              <li key={check.label}>
                <strong>{check.label}</strong>
                <span>{check.result}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "lora-adapter":
      return (
        <div className="adapt-scene">
          <div className="scene-label">W frozen · A and B trainable</div>
          <h4 className="adapt-operation">
            {
              [
                "1 / Frozen base branch",
                "2 / Trainable adapter branch",
                "3 / Add base and adapter outputs",
                "4 / Differentiate the adapter loss",
                "5 / Update adapters and recompute",
              ][scene.stage]
            }
          </h4>
          <div className="adapter-matrices">
            <Matrix
              label={scene.quantized ? "Rounded base W" : "Base W"}
              values={scene.base}
            />
            <Matrix label="Adapter A" values={scene.a} />
            <Matrix label="Adapter B" values={scene.b} />
            <Matrix
              label={`Scaled update ${scene.scale}BA`}
              values={scene.delta}
            />
          </div>
          <div className="adapter-flow">
            <div>
              <span>Input x</span>
              <strong>{vec(scene.input)}</strong>
            </div>
            <span aria-hidden="true">↓</span>
            <div>
              <span>Wx + {scene.scale}BAx</span>
              <strong>{vec(scene.output)}</strong>
            </div>
            <span aria-hidden="true">↓</span>
            <div>
              <span>Target</span>
              <strong>{vec(scene.target)}</strong>
            </div>
          </div>
          <div className="adapter-matrices">
            <Matrix label="Gradient A" values={scene.gradA} />
            <Matrix label="Gradient B" values={scene.gradB} />
          </div>
          <p>
            For a 100 × 100 base: 10,000 frozen entries and {200 * scene.rank}{" "}
            trainable adapter entries at rank {scene.rank}. This 2 × 2
            illustration itself may not save parameters.
          </p>
          <p>
            {scene.updated
              ? "Adapter values and gradients recomputed after one simultaneous update."
              : "Gradients show the next possible adapter update; W stays frozen."}
          </p>
        </div>
      );
    case "distillation":
      return (
        <div className="adapt-scene">
          <div className="scene-label">
            {scene.phase} · scalar student σ(θx)
          </div>
          <ul className="probability-list">
            <Probability label="Teacher P(A)" value={scene.teacher} />
            <Probability label="Training target" value={scene.target} />
            <Probability
              label="Student at training x = 1"
              value={scene.probability}
            />
            <Probability
              label="Student at held-out x = 2"
              value={scene.heldOut}
              detail={`Separate held-out target: ${scene.heldTarget}`}
            />
          </ul>
          <ol
            className="distillation-history"
            aria-label="Student probability after each step"
          >
            {scene.history.map((point) => (
              <li
                key={point.step}
                aria-label={`Step ${point.step}: student probability ${n(point.p)}`}
              >
                <span>{point.step}</span>
                <div className="history-height" aria-hidden="true">
                  <span style={{ height: `${100 * point.p}%` }} />
                </div>
              </li>
            ))}
          </ol>
          <dl className="training-readouts">
            <div>
              <dt>Earlier-task loss (target 0.8)</dt>
              <dd>{n(scene.oldLoss)}</dd>
            </div>
            <div>
              <dt>Later-task loss (target 0.2)</dt>
              <dd>{n(scene.newLoss)}</dd>
            </div>
          </dl>
          <p>
            Losses are evaluated on declared targets, not measured real-world
            accuracy. Both tasks share one student weight.
          </p>
        </div>
      );
  }
}
