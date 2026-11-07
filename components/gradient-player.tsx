"use client";

import { useEffect, useState } from "react";
import { example, format, train, type TrainingState } from "@/lib/gradient-descent";
import { Icon } from "./icon";

const baseline = train(0.1);

function captionFor(trace: TrainingState[], step: number) {
  const state = trace[step];
  const before = trace[Math.max(0, step - 1)];
  if (step === 0) return "Our model predicts $2 for two notebooks. The receipt says $4. Take one step to adjust the price.";
  return `Weight ${format(before.weight)} → ${format(state.weight)}. Prediction ${format(before.prediction)} → ${format(state.prediction)}. Loss ${format(before.loss)} → ${format(state.loss)}.`;
}

/** Reserve the natural size of every playback value, including when text wraps. */
function StableText({ value, reserve, testId }: { value: string; reserve: string[]; testId?: string }) {
  return <span className="stable-text">
    {[...new Set(reserve)].map((text) => <span className="stable-text-reserve" aria-hidden="true" key={text}>{text}</span>)}
    <span data-testid={testId}>{value}</span>
  </span>;
}

function LossChart({ trace, step, compare }: { trace: TrainingState[]; step: number; compare: boolean }) {
  const visible = trace.slice(0, step + 1);
  const maxLoss = Math.max(2, ...visible.map((state) => state.loss)) * 1.1;
  const x = (index: number) => 52 + index / example.updates * 324;
  const y = (loss: number) => 194 - loss / maxLoss * 160;
  const points = (states: TrainingState[]) => states.map((state) => `${x(state.step)},${y(state.loss)}`).join(" ");
  return <svg className="loss-chart" viewBox="0 0 400 245" role="img" aria-label={`Loss after ${step} updates is ${format(trace[step].loss)}. ${trace[step].loss > trace[0].loss ? "The error is growing." : "Lower loss means a closer prediction."}`}>
    <text x="17" y="18" className="chart-label">LOSS ↓</text>
    {[0,1,2,3,4].map((index) => { const loss = maxLoss * index / 4; return <g key={index}><line x1="52" x2="376" y1={y(loss)} y2={y(loss)} className="chart-gridline" /><text x="42" y={y(loss) + 4} textAnchor="end" className="chart-tick">{loss > 100 ? Math.round(loss).toLocaleString() : loss.toFixed(1)}</text></g>; })}
    {[0,2,4,6,8,10,12].map((index) => <text x={x(index)} y="216" textAnchor="middle" key={index} className="chart-tick">{index}</text>)}
    <text x="376" y="239" textAnchor="end" className="chart-label">TRAINING UPDATES →</text>
    {compare && <polyline points={points(baseline)} fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="5 5" />}
    {step > 0 && <polygon points={`${x(0)},194 ${points(visible)} ${x(step)},194`} fill="var(--green)" opacity=".06" />}
    <polyline points={points(visible)} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinejoin="round" />
    {visible.map((state) => <circle key={state.step} cx={x(state.step)} cy={y(state.loss)} r={state.step === step ? 5.5 : 3} fill={state.step === step ? "var(--orange)" : "var(--green)"} stroke="var(--surface)" strokeWidth="2"><title>Update {state.step}: weight {format(state.weight)}, loss {format(state.loss)}</title></circle>)}
    <line x1={x(step)} x2={x(step)} y1={y(trace[step].loss) + 9} y2="194" stroke="var(--orange)" opacity=".5" strokeDasharray="3 4" />
  </svg>;
}

export function GradientPlayer({ onStep, initialStep, initialRate }: { onStep: (step: number, rate: number) => void; initialStep: number; initialRate: number }) {
  const [rate, setRate] = useState(initialRate);
  const [step, setStep] = useState(initialStep);
  const [playing, setPlaying] = useState(false);
  const [compare, setCompare] = useState(false);
  const trace = train(rate);
  const state = trace[step];
  const before = trace[Math.max(0, step - 1)];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(example.updates, current + 1));
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1600 : 1000);
    return () => window.clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (playing && step === example.updates) {
      // Playback has reached its final state; release the interval.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaying(false);
    }
  }, [step, playing]);
  useEffect(() => { onStep(step, rate); }, [step, rate, onStep]);

  const captions = trace.map((item) => captionFor(trace, item.step));
  const weightNotes = ["the number we adjust", ...trace.map((item) => `was ${format(item.weight)}`)];
  const lossNotes = ["lower is closer", ...trace.map((item) => `was ${format(item.loss)}`)];

  function move(next: number) { setPlaying(false); setStep(next); }
  function changeRate(next: number) { setRate(next); setStep(0); setPlaying(false); }
  return <section className="simulation" aria-labelledby="simulation-title">
    <div className="simulation-heading"><div><span className="eyebrow"><span className="live-dot" /> THE EXPERIMENT</span><h2 id="simulation-title">Watch the model adjust.</h2></div><span className="simulation-step">STEP {String(step).padStart(2, "0")} / 12</span></div>
    <div className="simulation-inputs"><span>Quantity <strong>x = {example.x}</strong></span><span>Receipt <strong>y = {example.target}</strong></span><span>Starting price <strong>w = {example.initialWeight}</strong></span></div>
    <LossChart trace={trace} step={step} compare={compare} />
    <div className="chart-legend"><span><i />Your model · α = {rate.toFixed(2)}</span>{compare && <span><i className="baseline-key" />Reference · α = 0.10</span>}<span><i className="current-key" />Current step</span></div>
    <div className="simulation-stats"><div><span>WEIGHT <small>w</small></span><strong><StableText value={format(state.weight)} reserve={trace.map((item) => format(item.weight))} testId="weight" /></strong><small><StableText value={step ? `was ${format(before.weight)}` : "the number we adjust"} reserve={weightNotes} /></small></div><div><span>PREDICTION <small>w × 2</small></span><strong><StableText value={format(state.prediction)} reserve={trace.map((item) => format(item.prediction))} testId="prediction" /></strong><small>target: 4.000</small></div><div><span>LOSS <small>½(error)²</small></span><strong><StableText value={format(state.loss)} reserve={trace.map((item) => format(item.loss))} testId="loss" /></strong><small><StableText value={step ? `was ${format(before.loss)}` : "lower is closer"} reserve={lossNotes} /></small></div></div>
    <div className="player-caption" aria-live={playing ? "off" : "polite"} aria-atomic="true"><span className="caption-number">{String(step).padStart(2, "0")}</span><p><StableText value={captions[step]} reserve={captions} /></p></div>
    <div className="player-controls"><div className="transport"><button className="player-button" aria-label="Back one step" title="Back one step" disabled={step === 0} onClick={() => move(step - 1)}><Icon name="back" size={18} /><span>Back</span></button><button className="play-button" aria-label={playing ? "Pause simulation" : step === 12 ? "Replay simulation" : "Play simulation"} onClick={() => { if (step === 12) setStep(0); setPlaying(!playing); }}><Icon name={playing ? "pause" : "play"} size={17} /><StableText value={playing ? "Pause" : step === 12 ? "Replay" : "Play"} reserve={["Play", "Pause", "Replay"]} /></button><button className="player-button" aria-label="Forward one step" title="Forward one step" disabled={step === 12} onClick={() => move(step + 1)}><span>Step</span><Icon name="step" size={18} /></button><button className="icon-button reset-button" aria-label="Reset simulation" title="Reset simulation" onClick={() => move(0)}><Icon name="reset" size={18} /></button></div><span className="player-hint">Pause. Notice. Try again.</span></div>
    <div className="experiment-controls"><div className="rate-label"><label htmlFor="learning-rate">Learning rate <span>α</span></label><output htmlFor="learning-rate">{rate.toFixed(2)}</output></div><input id="learning-rate" type="range" min="0.02" max="0.6" step="0.01" value={rate} onChange={(event) => changeRate(Number(event.target.value))} /><div className="range-labels"><span>Small, careful steps</span><span>Big, risky steps</span></div><div className="rate-presets"><button onClick={() => changeRate(0.1)} aria-pressed={rate === 0.1}>Steady · 0.10</button><button onClick={() => changeRate(0.25)} aria-pressed={rate === 0.25}>Exact fit · 0.25</button><button onClick={() => changeRate(0.6)} aria-pressed={rate === 0.6}>Overshoot · 0.60</button></div><label className="compare-control"><input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} /> Compare with a steady learning rate (0.10)</label><p className={`experiment-note ${rate >= 0.5 ? "warning-note" : ""}`}><Icon name="info" size={16} />{rate > 0.5 ? "Overshooting: each update increases the loss. Try stepping forward, then compare with 0.10." : rate === 0.5 ? "At 0.50, the weight bounces between 1 and 3. The loss stays at 2." : rate === 0.25 ? "For this particular example, 0.25 reaches the exact answer in one step." : "Changing the rate starts a fresh experiment from w = 1. Take a step to compare the result."}</p></div>
    <details className="trace-details"><summary>Inspect the exact trace <span>All 13 states</span></summary><div className="table-scroll" tabIndex={0} role="region" aria-label="Training trace"><table><caption>Values rounded for display; updates use full precision. Bias fixed at 0.</caption><thead><tr><th>Step</th><th>Weight</th><th>Prediction</th><th>Gradient</th><th>Loss</th></tr></thead><tbody>{trace.map((item) => <tr className={item.step === step ? "current-row" : ""} key={item.step}><td>{item.step}</td><td>{format(item.weight)}</td><td>{format(item.prediction)}</td><td>{format(item.gradient)}</td><td>{format(item.loss)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
