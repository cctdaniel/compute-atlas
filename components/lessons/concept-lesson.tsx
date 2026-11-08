"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { allLessons } from "@/lib/curriculum";
import type { LessonContent, PreparedExperiment } from "@/lib/lessons/types";
import { Icon } from "../icon";
import { useProgress } from "../preferences";
import { ConceptPlayer } from "./concept-player";
import { RichText } from "./text";

const sections = [
  { id: "the-problem", title: "The question", description: "Start with a small example." },
  { id: "intuition", title: "Intuition", description: "Understand the relationship." },
  { id: "worked-update", title: "Step by step", description: "Follow the calculation." },
  { id: "predict", title: "Make a prediction", description: "Commit, then check why." },
  { id: "experiment", title: "Try it yourself", description: "Change an input and compare." },
  { id: "the-math", title: "The math · optional", description: "The precise rule and its limits." },
  { id: "transfer", title: "The final challenge", description: "Apply the idea somewhere new." },
];
function Paragraphs({ items }: { items: string[] }) { return items.map((text) => <p key={text}><RichText text={text} /></p>); }
function Contents({ active, onNavigate }: { active: string; onNavigate?: () => void }) { return <nav aria-label="Lesson contents">{sections.map((section, index) => <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined} onClick={onNavigate}><span className="contents-number">0{index + 1}</span><span>{section.title}<small>{section.description}</small></span></a>)}</nav>; }

export function ConceptLesson({ content, experiment }: { content: LessonContent; experiment: PreparedExperiment }) {
  const lesson = allLessons.find((item) => item.slug === content.slug)!;
  const index = allLessons.indexOf(lesson), next = allLessons[index + 1], previous = allLessons[index - 1];
  const contents = useRef<HTMLDetailsElement>(null);
  const [active, setActive] = useState("the-problem");
  const [answer, setAnswer] = useState<number | null>(null);
  const [transfer, setTransfer] = useState(false);
  const { ready, saved, completed, toggleSaved, toggleCompleted, lessonProgress, saveLessonExperiment, saveLessonSection, visitLesson } = useProgress();
  const save = useCallback((step: number, scenario: string) => saveLessonExperiment(content.slug, step, scenario), [content.slug, saveLessonExperiment]);
  useEffect(() => { if (ready) visitLesson(content.slug); }, [ready, content.slug, visitLesson]);
  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) { setActive(visible.target.id); saveLessonSection(content.slug, visible.target.id); }
    }, { rootMargin: "-40% 0px -59% 0px" });
    [...sections.map((s) => s.id), "sources"].forEach((id) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [ready, content.slug, saveLessonSection]);
  const isSaved = saved.includes(content.slug), isComplete = completed.includes(content.slug);
  return <div className="lesson-page page-width concept-lesson">
    <div className="lesson-topline"><Link href={`/#${lesson.chapterId}`} className="text-button"><Icon name="arrow" size={16} style={{ transform: "rotate(180deg)" }} />The learning path</Link><button className={`save-button ${isSaved ? "is-saved" : ""}`} aria-pressed={isSaved} onClick={() => toggleSaved(content.slug)}><Icon name="bookmark" size={17} />{isSaved ? "Saved" : "Save lesson"}</button></div>
    <header className="lesson-header"><div className="eyebrow">AI & ML <span className="header-divider">/</span>{lesson.chapter}</div><h1>{lesson.title}</h1><p>{content.deck}</p><div className="lesson-meta"><span><Icon name="clock" size={15} />{lesson.minutes} min read</span><span><Icon name="chart" size={15} />Interactive lesson</span></div></header>
    <details className="reader-contents" ref={contents}><summary><span>In this lesson <small>7 short sections</small></span><Icon name="chevron" size={16} /></summary><Contents active={active} onNavigate={() => { if (contents.current) contents.current.open = false; }} /></details>
    <div className="lesson-layout"><article className="lesson-body" aria-label={`${lesson.title} explained`}>
      <div className="learning-goal"><p><strong>What you’ll understand</strong>{content.objective}</p></div>
      <p className="prerequisite-note">{content.prerequisites.length ? "Builds on: " : "No prior lessons needed."} {content.prerequisites.map((title, i) => { const prerequisite = allLessons.find((l) => l.title === title || l.slug === title); return <span key={title}>{i > 0 && " · "}{prerequisite ? <Link href={prerequisite.href}>{prerequisite.title}</Link> : title}</span>; })}</p>
      <section id="the-problem" className="lesson-section"><span className="section-index">01 / The question</span><h2>{content.problem.heading}</h2><Paragraphs items={content.problem.paragraphs} /><a href="#experiment" className="text-button experiment-jump">Try the interactive example<Icon name="arrow" size={16} style={{ transform: "rotate(90deg)" }} /></a></section>
      <section id="intuition" className="lesson-section"><span className="section-index">02 / Intuition</span><h2>{content.intuition.heading}</h2><Paragraphs items={content.intuition.paragraphs} /><p className="aside-note"><RichText text={content.intuition.limit} /></p></section>
      <section id="worked-update" className="lesson-section"><span className="section-index">03 / Step by step</span><h2>{content.walkthrough.heading}</h2><p>{content.walkthrough.intro}</p><ol className="concept-worked">{content.walkthrough.steps.map((item, i) => <li key={item.title}><span className="worked-index">0{i + 1}</span><div><h3>{item.title}</h3><div className="worked-calculation">{item.calculation}</div><p><RichText text={item.why} /></p></div></li>)}</ol></section>
      <section id="predict" className="lesson-section"><span className="section-index">04 / Make a prediction</span><h2>What do you think happens?</h2><p><RichText text={content.prediction.prompt} /></p><p className="question-prompt">Choose an answer, then inspect the reasoning.</p><div className="quiz-options concept-quiz" role="group" aria-label="Choose your prediction">{content.prediction.options.map((option, i) => <button key={option} aria-pressed={answer === i} className={answer === i ? i === content.prediction.correct ? "correct" : "incorrect" : ""} onClick={() => setAnswer(i)}>{option}{answer === i && <Icon name={i === content.prediction.correct ? "check" : "close"} size={17} />}</button>)}</div>{answer !== null && <div className={`quiz-answer ${answer === content.prediction.correct ? "correct-answer" : ""}`} role="status"><strong>{answer === content.prediction.correct ? "Exactly. Here’s why." : "Let’s follow the rule."}</strong><Paragraphs items={content.prediction.answer} /></div>}</section>
      <section id="experiment" className="lesson-section experiment-section"><span className="section-index">05 / Try it yourself</span><p className="experiment-intro">{content.experimentIntro}</p>{ready ? <ConceptPlayer key={content.slug} experiment={experiment} initialStep={lessonProgress[content.slug]?.step} initialScenario={lessonProgress[content.slug]?.scenario} onProgress={save} /> : <div className="simulation-loading">Preparing your experiment…</div>}</section>
      <section id="the-math" className="lesson-section"><span className="section-index">06 / The math <span className="optional-label">Optional</span></span><p className="optional-reading">Keep reading for the precise rule, or <a href="#transfer">continue to the final challenge <Icon name="arrow" size={14} /></a>.</p><h2>{content.math.heading}</h2><Paragraphs items={content.math.intro} /><dl className="concept-rules">{content.math.rules.map((rule) => <div key={rule.label}><dt>{rule.label}</dt><dd>{rule.formula}</dd></div>)}</dl><Paragraphs items={content.math.paragraphs} /><p className="aside-note"><RichText text={content.math.limit} /></p></section>
      <section id="transfer" className="lesson-section transfer-section"><span className="section-index">07 / The final challenge</span><h2>Take the idea one step further.</h2><p><RichText text={content.transfer.prompt} /></p><button className="transfer-toggle text-button" onClick={() => setTransfer((value) => !value)} aria-expanded={transfer} aria-controls="transfer-answer">{transfer ? "Hide the explanation" : "Reveal the explanation"}<Icon name="chevron" size={16} /></button>{transfer && <div className="transfer-answer" id="transfer-answer"><Paragraphs items={content.transfer.answer} /></div>}<div className="takeaway"><span className="eyebrow">WHAT YOU CAN NOW EXPLAIN</span><h2>Keep these ideas.</h2><ul className="takeaway-points">{content.takeaways.map((item) => <li key={item}>{item}</li>)}</ul><button className={`button ${isComplete ? "button-complete" : "button-primary"}`} aria-pressed={isComplete} onClick={() => toggleCompleted(content.slug)}><Icon name="check" size={18} />{isComplete ? "Lesson completed" : "Mark as understood"}</button><span className="completion-note">{isComplete ? "Marked complete on this device. Tap again to undo." : "Your completion is saved in this browser."}</span></div></section>
      <section className="sources" id="sources"><span className="section-index">Further reading</span><h2>Explore the original references.</h2><p>The examples and visual traces here are original teaching models. These sources explain the underlying methods in more depth.</p>{content.sources.map((source, i) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span><small>0{i + 1} / REFERENCE</small><strong>{source.title}</strong></span><Icon name="arrow" size={18} /></a>)}</section>
      <nav className="lesson-neighbors" aria-label="Continue learning">{next ? <Link href={next.href} className="back-to-path"><Icon name="book" size={22} /><span><small>NEXT LESSON</small><strong>{next.title}</strong></span><Icon name="arrow" size={18} /></Link> : <Link href="/#learning-path" className="back-to-path"><Icon name="compass" size={22} /><span><small>PATH COMPLETE</small><strong>Review your learning path</strong></span><Icon name="arrow" size={18} /></Link>}{previous && <Link href={previous.href} className="previous-lesson"><Icon name="arrow" size={15} style={{ transform: "rotate(180deg)" }} />Previous: {previous.title}</Link>}</nav>
    </article><aside className="lesson-toc"><div className="eyebrow">IN THIS LESSON</div><Contents active={active} /><a href="#sources" className="toc-sources">Further reading <Icon name="arrow" size={14} /></a></aside></div>
  </div>;
}
