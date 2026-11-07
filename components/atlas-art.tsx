"use client";

import { useId } from "react";
import { example, train } from "@/lib/gradient-descent";

/** Labels occupy their own band; leaders identify the exact calculated points. */
export function AtlasArt() {
  const id = useId();
  const trace = train(0.1);
  const x = (weight: number) => 50 + weight / 4 * 420;
  const y = (loss: number) => 280 - loss / 8 * 190;
  const optimum = example.target / example.x;
  const annotations = [
    { key: "start", label: "Start", weight: trace[0].weight, loss: trace[0].loss, color: "var(--orange)", path: `M86.67 4 H150 Q170 4 170 24 L${x(trace[0].weight)} ${y(trace[0].loss)}` },
    { key: "update", label: "After one step", weight: trace[1].weight, loss: trace[1].loss, color: "var(--green)", path: `M260 4 Q235 68 ${x(trace[1].weight)} ${y(trace[1].loss)}` },
    { key: "best", label: "Best fit", weight: optimum, loss: 0, color: "var(--muted)", path: `M433.33 4 Q350 100 ${x(optimum)} ${y(0)}` },
  ];
  const points = Array.from({ length: 81 }, (_, i) => {
    const weight = i / 20;
    return `${x(weight)},${y(0.5 * (example.x * weight - example.target) ** 2)}`;
  }).join(" ");
  return <div className="loss-landscape-diagram">
    <ol className="landscape-labels" aria-label="Points on the loss curve">
      {annotations.map((point) => <li key={point.key} style={{ color: point.color }} data-landscape-label={point.key}><span>{point.label}</span><strong>w = {point.weight}</strong></li>)}
    </ol>
    <svg className="atlas-art" viewBox="0 0 520 350" role="img" aria-label="Loss versus weight for two notebooks costing four dollars. Arrows connect the labels above to the start, first update, and best fit on the curve.">
      <defs>{annotations.map((point) => <marker key={point.key} id={`${id}-${point.key}`} viewBox="0 0 10 10" refX="16" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M1 1 L9 5 L1 9" fill="none" stroke={point.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></marker>)}</defs>
      <g stroke="var(--border)" strokeWidth="1">
        {[0, 2, 4, 6, 8].map((loss) => <line key={loss} x1="50" x2="470" y1={y(loss)} y2={y(loss)} strokeDasharray={loss ? "3 5" : undefined} />)}
      </g>
      <g fill="var(--muted)" fontFamily="var(--font-body), sans-serif" fontSize="20">
        <text x="50" y="70">Loss</text><text x="470" y="334" textAnchor="end">Weight (price) →</text>
        {[0, 2, 4].map((weight) => <text key={weight} x={x(weight)} y="307" textAnchor="middle">{weight}</text>)}
        {[0, 4, 8].map((loss) => <text key={loss} x="34" y={y(loss) + 5} textAnchor="end">{loss}</text>)}
      </g>
      <polyline points={points} fill="none" stroke="var(--green)" strokeWidth="2.5" />
      {annotations.map((point) => <g key={point.key}>
        <path className="landscape-leader" data-point={point.key} d={point.path} fill="none" stroke={point.color} strokeWidth="1.25" markerEnd={`url(#${id}-${point.key})`} />
        <circle data-landscape-point={point.key} cx={x(point.weight)} cy={y(point.loss)} r="4.5" fill={point.color} stroke="var(--background)" strokeWidth="1.5"><title>{`${point.label}: weight ${point.weight}, loss ${Number(point.loss.toFixed(4))}`}</title></circle>
      </g>)}
    </svg>
  </div>;
}

export function NotebookExample() {
  return <figure className="notebook-example">
    <div className="notebook-data">
      <span className="figure-label">THE EXAMPLE WE KNOW</span>
      <div className="notebook-pair" aria-hidden="true">{[0, 1].map((i) => <svg key={i} width="46" height="58" viewBox="0 0 46 58" fill="none"><rect x="6" y="3" width="35" height="50" rx="3" fill="var(--green-soft)" stroke="var(--green)" strokeWidth="1.5" /><path d="M13 3v50M20 18h14M20 24h10M3 12h6M3 23h6M3 34h6M3 45h6" stroke="var(--green)" strokeWidth="1.5" /></svg>)}</div>
      <strong>2 notebooks</strong><span>Actual total: <b>$4</b></span>
    </div>
    <div className="notebook-estimate"><span className="figure-label">THE MODEL’S FIRST GUESS</span><div className="receipt-row"><span>Price per notebook</span><strong>$1</strong></div><div className="receipt-row"><span>Quantity</span><strong>× 2</strong></div><div className="receipt-row receipt-total"><span>Predicted total</span><strong>$2</strong></div><span className="receipt-error">$2 below the actual total</span></div>
    <figcaption>Keep the quantity fixed. Adjust the estimated price until the prediction gets closer to $4.</figcaption>
  </figure>;
}
