import { example, train } from "@/lib/gradient-descent";

/** The actual loss surface of the lesson, rather than a decorative landscape. */
export function AtlasArt() {
  const trace = train(0.1);
  const x = (weight: number) => 50 + weight / 4 * 420;
  const y = (loss: number) => 252 - loss / 8 * 190;
  const points = Array.from({ length: 81 }, (_, i) => {
    const weight = i / 20;
    return `${x(weight)},${y(0.5 * (example.x * weight - example.target) ** 2)}`;
  }).join(" ");
  return <svg className="atlas-art" viewBox="0 0 520 330" role="img" aria-label="The loss curve for two notebooks costing four dollars. Weight 1 gives loss 2. One update moves to weight 1.4 and loss 0.72. The lowest loss is zero at weight 2.">
    <g stroke="var(--border)" strokeWidth="1">
      {[0, 2, 4, 6, 8].map((loss) => <line key={loss} x1="50" x2="470" y1={y(loss)} y2={y(loss)} strokeDasharray={loss ? "3 5" : undefined} />)}
    </g>
    <g fill="var(--muted)" fontFamily="var(--font-body), sans-serif" fontSize="15">
      <text x="50" y="28">Loss</text><text x="470" y="310" textAnchor="end">Weight (price per notebook) →</text>
      {[0, 1, 2, 3, 4].map((weight) => <text key={weight} x={x(weight)} y="280" textAnchor="middle">{weight}</text>)}
      {[0, 4, 8].map((loss) => <text key={loss} x="34" y={y(loss) + 5} textAnchor="end">{loss}</text>)}
    </g>
    <polyline points={points} fill="none" stroke="var(--green)" strokeWidth="2.5" />
    <line x1={x(1)} x2={x(1)} y1={y(2)} y2="252" stroke="var(--orange)" strokeDasharray="3 5" />
    <line x1={x(1.4)} x2={x(1.4)} y1={y(0.72)} y2="252" stroke="var(--green)" strokeDasharray="3 5" />
    {[trace[0], trace[1]].map((state) => <circle key={state.step} cx={x(state.weight)} cy={y(state.loss)} r="5" fill={state.step ? "var(--green)" : "var(--orange)"} stroke="var(--background)" strokeWidth="2" />)}
    <circle cx={x(2)} cy={y(0)} r="5" fill="var(--green)" />
    <g fontFamily="var(--font-body), sans-serif" fontSize="15">
      <text x="105" y="178" fill="var(--orange)">Start: w = 1</text>
      <text x="219" y="208" fill="var(--green)">After one step: w = 1.4</text>
      <text x="295" y="249" fill="var(--muted)">Best fit: w = 2</text>
    </g>
  </svg>;
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
