import { useId } from "react";
import type { NeuralScene } from "@/lib/lessons/full/neural-scenes";
const num = (v: number | null) =>
  v === null
    ? "—"
    : Math.abs(v) < 0.00005
      ? "0"
      : Math.abs(v) >= 10000
        ? v.toExponential(2)
        : Number.isInteger(v)
          ? String(v)
          : v.toFixed(4);
const vec = (values: number[]) => `[${values.map(num).join(", ")}]`;

export function NeuralVisual({ scene }: { scene: NeuralScene }) {
  const id = useId().replaceAll(":", "");
  switch (scene.kind) {
    case "mlp":
      return (
        <div className="neural-scene">
          <div className="scene-label">
            Input switches {vec(scene.input)} · activation{" "}
            {scene.linear ? "Not used" : scene.activation}
          </div>
          <div className="network-branch" aria-hidden="true">
            <span /> <span />
          </div>
          <div className="hidden-units">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={
                  scene.stage === 1 || scene.stage === 2
                    ? "neural-node scene-active"
                    : "neural-node"
                }
              >
                <h4>Hidden unit {i + 1}</h4>
                <p>{i ? "z₂ = x₁+x₂−1" : "z₁ = x₁+x₂"}</p>
                <dl>
                  <div>
                    <dt>Before activation</dt>
                    <dd>
                      {!scene.linear && scene.stage >= 1
                        ? num(scene.z[i])
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>{scene.activation} output</dt>
                    <dd>
                      {!scene.linear && scene.stage >= 2
                        ? num(scene.h[i])
                        : "—"}
                    </dd>
                  </div>
                </dl>
                <small>Output weight {i ? "−2" : "+1"}</small>
              </div>
            ))}
          </div>
          <div className="network-branch network-merge" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="neural-node">
            <h4>
              {scene.linear ? "Affine baseline" : "Combine the hidden values"}
            </h4>
            <p>{scene.linear ? "score = x₁+x₂−0.5" : "score = h₁−2h₂"}</p>
            <strong className="neural-value">
              {scene.stage >= 3 ? num(scene.score) : "—"}
            </strong>
            <small>Class 1 if score ≥ 0.5</small>
          </div>
          <div className="scene-label neural-table-label">
            Check the entire XOR truth table
          </div>
          <div className="neural-truth">
            <div className="neural-truth-heading">
              <span>Input</span>
              <span>Target</span>
              <span>Class</span>
            </div>
            {scene.cases.map((row) => (
              <div key={row.input.join(",")}>
                <span>{vec(row.input)}</span>
                <span>{row.target}</span>
                <span>{scene.stage >= 5 ? row.predicted : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "autodiff":
      return (
        <div className="neural-scene">
          <div className="scene-label">
            {scene.phase === "inference"
              ? "Inference: forward computation only"
              : scene.stage === 7
                ? "Parameters updated · old forward values are cached"
                : scene.phase === "backward"
                  ? "Backward: multiply local sensitivities"
                  : scene.stage === 8
                    ? "New forward pass after the update"
                    : "Forward: compute and save values"}
          </div>
          <dl className="scene-fields">
            <div>
              <dt>Input x</dt>
              <dd>{scene.x}</dd>
            </div>
            <div>
              <dt>Target y</dt>
              <dd>{scene.target === null ? "Not supplied" : scene.target}</dd>
            </div>
          </dl>
          <ol className="neural-flow">
            <li className={scene.stage === 1 ? "scene-active" : ""}>
              <h4>Multiply by weight</h4>
              <p>product = w × x</p>
              <strong>{scene.stage >= 1 ? num(scene.product) : "—"}</strong>
            </li>
            <li className={scene.stage === 2 ? "scene-active" : ""}>
              <h4>Add the bias</h4>
              <p>prediction = product + b</p>
              <strong>{scene.stage >= 2 ? num(scene.prediction) : "—"}</strong>
            </li>
            <li className={scene.stage === 4 ? "scene-active" : ""}>
              <h4>
                {scene.target === null
                  ? "Return the prediction"
                  : "Compare with the target"}
              </h4>
              <p>
                {scene.target === null
                  ? "No loss or gradient requested"
                  : `error = ${scene.error === null ? "—" : num(scene.error)}; loss = ½ error²`}
              </p>
              <strong>
                {scene.target === null
                  ? "Forward only"
                  : scene.stage >= 4
                    ? num(scene.loss)
                    : "—"}
              </strong>
            </li>
          </ol>
          <div className="scene-label">
            {scene.phase === "inference"
              ? "No backward pass"
              : "Saved gradients from the old pass"}
          </div>
          <dl className="scene-fields gradient-fields">
            <div>
              <dt>∂L / ∂w = error × x</dt>
              <dd>{num(scene.gw)}</dd>
            </div>
            <div>
              <dt>∂L / ∂b = error</dt>
              <dd>{num(scene.gb)}</dd>
            </div>
          </dl>
        </div>
      );
    case "optimization": {
      const current = scene.path.at(-1)!;
      const outside = current.some((v) => Math.abs(v) > 5);
      const x = (v: number) => 200 + 24 * v,
        y = (v: number) => 140 - 24 * v;
      return (
        <div className="neural-scene">
          <div className="scene-label">
            L(u,v) = ½(u² + 10v²) · contour levels 0.5, 2, 8
          </div>
          <svg
            className="optimization-chart"
            viewBox="0 0 400 290"
            role="img"
            aria-label="Path on a two-dimensional quadratic. The plot shows coordinates between minus five and five; exact values appear below."
          >
            <defs>
              <clipPath id={id}>
                <rect x="80" y="20" width="240" height="240" />
              </clipPath>
            </defs>
            <path d="M80 140H320M200 20V260" className="plot-grid" />
            {[-4, 0, 4].map((v) => (
              <g key={v}>
                <text x={x(v)} y="283" textAnchor="middle">
                  {v}
                </text>
                <text x="68" y={y(v) + 5} textAnchor="end">
                  {v}
                </text>
              </g>
            ))}
            <g clipPath={`url(#${id})`}>
              {[0.5, 2, 8].map((loss) => (
                <ellipse
                  key={loss}
                  cx="200"
                  cy="140"
                  rx={24 * Math.sqrt(2 * loss)}
                  ry={24 * Math.sqrt((2 * loss) / 10)}
                  className="optimization-contour"
                />
              ))}
              <polyline
                points={scene.path
                  .map((p) => `${x(p[0])},${y(p[1])}`)
                  .join(" ")}
                className="plot-curve"
              />
              {scene.path.map((p, i) => (
                <circle
                  key={i}
                  cx={x(p[0])}
                  cy={y(p[1])}
                  r={i === scene.path.length - 1 ? 5 : 2.5}
                  className="plot-point"
                />
              ))}
            </g>
          </svg>
          <div className="scene-vector-labels">
            <span>v ↑ (steeper)</span>
            <span>u →</span>
          </div>
          <p className="optimization-boundary">
            {outside
              ? "Current point is outside this plot. Use its exact coordinates below."
              : "Current point is inside the displayed coordinate range."}
          </p>
          <dl className="training-readouts">
            <div>
              <dt>Current [u,v]</dt>
              <dd>{vec(current)}</dd>
            </div>
            <div>
              <dt>
                {scene.step
                  ? "Gradient used for this move"
                  : "Initial full gradient"}
              </dt>
              <dd>{vec(scene.gradient)}</dd>
            </div>
            <div>
              <dt>After any norm clipping</dt>
              <dd>{vec(scene.usedGradient)}</dd>
            </div>
            <div>
              <dt>Proposed update vector</dt>
              <dd>{vec(scene.update)}</dd>
            </div>
            <div>
              <dt>Actual move after rounding</dt>
              <dd>{vec(scene.appliedUpdate)}</dd>
            </div>
            <div>
              <dt>Learning rate</dt>
              <dd>{num(scene.rate)}</dd>
            </div>
            <div>
              <dt>Optimizer memory</dt>
              <dd>{vec(scene.memory)}</dd>
            </div>
          </dl>
          {scene.sample !== null && (
            <p className="scene-label">
              Supplied sample index: {scene.sample}. One draw is not one epoch.
            </p>
          )}
        </div>
      );
    }
    case "dropout":
      return (
        <div className="neural-scene">
          <div className="scene-label">
            Inverted dropout · keep probability {scene.keep}
          </div>
          <div className="dropout-units">
            {scene.activations.map((v, i) => (
              <div
                className={
                  scene.stage >= 1 && scene.mask[i] === 0
                    ? "neural-node dropout-removed"
                    : "neural-node"
                }
                key={i}
              >
                <h4>Unit {i + 1}</h4>
                <dl>
                  <div>
                    <dt>Original activation</dt>
                    <dd>{v}</dd>
                  </div>
                  <div>
                    <dt>Supplied mask</dt>
                    <dd>{scene.stage >= 1 ? scene.mask[i] : "—"}</dd>
                  </div>
                  <div>
                    <dt>After mask / keep</dt>
                    <dd>{scene.stage >= 2 ? num(scene.scaled[i]) : "—"}</dd>
                  </div>
                </dl>
                <small>
                  {scene.stage >= 1
                    ? scene.mask[i]
                      ? "Retained"
                      : "Dropped"
                    : "Mask not applied"}
                </small>
              </div>
            ))}
          </div>
          <dl className="scene-fields">
            <div>
              <dt>This training mask</dt>
              <dd>{scene.stage >= 3 ? scene.trainingOutput : "—"}</dd>
            </div>
            <div>
              <dt>Ordinary evaluation</dt>
              <dd>{scene.stage >= 4 ? scene.evaluationOutput : "—"}</dd>
            </div>
          </dl>
          <p className="scene-label">
            Evaluation disables the mask. The average over masks is not the
            output of every individual mask.
          </p>
        </div>
      );
    case "embedding": {
      const x = (v: number) => 200 + 40 * v,
        y = (v: number) => 160 - 40 * v;
      const active = scene.items[scene.active];
      return (
        <div className="neural-scene">
          <div className="scene-label">
            Query {vec(scene.query)} · metric {scene.metric}
          </div>
          <svg
            className="embedding-chart"
            viewBox="0 0 400 250"
            role="img"
            aria-label="Supplied two-dimensional vectors. The highlighted candidate has a connector from the query; names and exact coordinates are listed below."
          >
            <path d="M60 160H340M200 20V220" className="plot-grid" />
            {[-3, 0, 3].map((v) => (
              <text key={v} x={x(v)} y="242" textAnchor="middle">
                {v}
              </text>
            ))}
            {active && (
              <line
                x1={x(scene.query[0])}
                y1={y(scene.query[1])}
                x2={x(active.vector[0])}
                y2={y(active.vector[1])}
                className="plot-reference"
              />
            )}
            {scene.items.map((item, i) => (
              <circle
                key={item.label}
                cx={x(item.vector[0])}
                cy={y(item.vector[1])}
                r={i === scene.active ? 6 : 3.5}
                className={
                  i === scene.active ? "plot-validation" : "plot-point"
                }
              />
            ))}
            <path
              d={`M${x(scene.query[0]) - 5} ${y(scene.query[1]) - 5}l10 10m-10 0l10-10`}
              className="embedding-query"
            />
          </svg>
          <div className="scene-vector-labels">
            <span>Coordinate 2 ↑</span>
            <span>Coordinate 1 →</span>
          </div>
          <p className="scene-label">
            Cross = query · active candidate:{" "}
            {active ? active.label : "None selected"}
          </p>
          {scene.training && (
            <dl className="training-pair">
              <div>
                <dt>Positive / negative</dt>
                <dd>
                  {scene.training.positive} / {scene.training.negative}
                </dd>
              </div>
              <div>
                <dt>Probability within this pair</dt>
                <dd>{vec(scene.training.probabilities)}</dd>
              </div>
            </dl>
          )}
          <ol className="embedding-results">
            {scene.order.map((i) => (
              <li
                key={scene.items[i].label}
                className={i === scene.active ? "scene-active" : ""}
              >
                <span>
                  <strong>{scene.items[i].label}</strong>
                  <small>{vec(scene.items[i].vector)}</small>
                </span>
                <b>{num(scene.items[i].score)}</b>
              </li>
            ))}
          </ol>
          <p className="scene-label">
            Vectors are synthetic, not a projection of real model embeddings. A
            dash means hidden or undefined; the caption distinguishes those
            cases.
          </p>
        </div>
      );
    }
  }
}
