"use client";

import { useEffect, useMemo, useState } from "react";
import type { PreparedExperiment } from "@/lib/lessons/types";
import { Icon } from "../icon";
import { ConceptScene } from "./concept-scene";
import { StableText } from "./text";

export function ConceptPlayer({ experiment, initialStep = 0, initialScenario, onProgress }: { experiment: PreparedExperiment; initialStep?: number; initialScenario?: string; onProgress: (step: number, scenario: string) => void }) {
  const [scenarioId, setScenarioId] = useState(() => experiment.scenarios.some((s) => s.id === initialScenario) ? initialScenario! : experiment.scenarios[0].id);
  const scenario = experiment.scenarios.find((s) => s.id === scenarioId)!;
  const [step, setStep] = useState(() => Math.max(0, Math.min(initialStep, scenario.frames.length - 1)));
  const [playing, setPlaying] = useState(false);
  const frame = scenario.frames[step];
  const allFrames = useMemo(() => experiment.scenarios.flatMap((s) => s.frames), [experiment]);
  // Reserve actual responsive content, including long alternate-scenario values.
  // The memoized hidden render stays unchanged during playback and has no tab stops.
  const sceneReserve = useMemo(() => <div className="scene-reserve" aria-hidden="true" inert>{allFrames.map((f, index) => <div key={index}><ConceptScene scene={f.scene} /></div>)}</div>, [allFrames]);
  useEffect(() => { onProgress(step, scenarioId); }, [step, scenarioId, onProgress]);
  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      const next = Math.min(step + 1, scenario.frames.length - 1);
      setStep(next);
      if (next === scenario.frames.length - 1) setPlaying(false);
    }, reduced ? 2600 : 1800);
    const pause = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", pause);
    return () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", pause); };
  }, [playing, step, scenario.frames.length]);
  function changeScenario(value: string) { setPlaying(false); setStep(0); setScenarioId(value); }
  function reset() { changeScenario(experiment.scenarios[0].id); }
  return <div className="concept-player" data-experiment={experiment.id}>
    <header className="concept-player-header"><span className="section-index">The interactive example</span><h3>{experiment.title}</h3><label htmlFor={`${experiment.id}-scenario`}>Compare a scenario</label><select name="scenario" autoComplete="off" id={`${experiment.id}-scenario`} value={scenarioId} onChange={(event) => changeScenario(event.target.value)}>{experiment.scenarios.map((s) => <option value={s.id} key={s.id}>{s.label}</option>)}</select><div className="scenario-description"><StableText value={scenario.description} options={experiment.scenarios.map((s) => s.description)} numeric /></div></header>
    <div className="concept-stage">{sceneReserve}<div data-current-scene><ConceptScene scene={frame.scene} /></div></div>
    <div className="concept-metrics">{frame.metrics.map((metric, index) => <div key={index}><span><StableText value={metric.label} options={allFrames.map((f) => f.metrics[index].label)} /></span><strong><StableText value={metric.value} options={allFrames.map((f) => f.metrics[index].value)} /></strong></div>)}</div>
    <div className="concept-frame" aria-live={playing ? "off" : "polite"} aria-atomic="true"><div className="concept-frame-step">Step {String(step).padStart(2, "0")} / {String(scenario.frames.length - 1).padStart(2, "0")}</div><h4><StableText value={frame.title} options={allFrames.map((f) => f.title)} numeric /></h4><p><StableText value={frame.caption} options={allFrames.map((f) => f.caption)} numeric /></p><div className="concept-calculation"><StableText value={frame.calculation} options={allFrames.map((f) => f.calculation)} numeric /></div></div>
    <div className="concept-playback" role="group" aria-label="Experiment playback">
      <button onClick={() => { setPlaying(false); setStep((s) => s - 1); }} disabled={step === 0} aria-label="Previous step"><Icon name="back" size={17} /><span>Back</span></button>
      <button className="concept-play" onClick={() => { if (step === scenario.frames.length - 1) setStep(0); setPlaying((p) => !p); }} aria-label={playing ? "Pause experiment" : step === scenario.frames.length - 1 ? "Replay experiment" : "Play experiment"}><Icon name={playing ? "pause" : "play"} size={17} /><span>{playing ? "Pause" : step === scenario.frames.length - 1 ? "Replay" : "Play"}</span></button>
      <button onClick={() => { setPlaying(false); setStep((s) => s + 1); }} disabled={step === scenario.frames.length - 1} aria-label="Next step"><span>Step</span><Icon name="step" size={17} /></button>
      <button onClick={reset} aria-label="Reset experiment"><Icon name="reset" size={19} /></button>
    </div>
    <details className="concept-trace"><summary>Inspect the exact trace <Icon name="chevron" size={15} /></summary><ol>{scenario.frames.map((f, index) => <li key={index} aria-current={step === index ? "step" : undefined}><button onClick={() => { setPlaying(false); setStep(index); }} aria-label={`Go to step ${index}: ${f.title}`}><span>{String(index).padStart(2, "0")}</span><strong>{f.title}</strong></button><code>{f.calculation}</code><span className="trace-values">{f.metrics.map((m) => `${m.label}: ${m.value}`).join(" · ")}</span></li>)}</ol></details>
  </div>;
}
