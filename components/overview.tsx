"use client";

import Link from "next/link";
import { useState } from "react";
import { allLessons, chapters, domains, firstLesson, lessonHref } from "@/lib/curriculum";
import { Icon } from "./icon";
import { FullCurriculum } from "./full-curriculum";
import { AtlasArt } from "./atlas-art";
import { useProgress } from "./preferences";

const starterLessons = allLessons.filter((lesson) => !lesson.sourceId);
const availableLessons = allLessons.filter((lesson) => lesson.status === "available");

export function Overview() {
  const { completed, visited, lastSection, lastLesson, lessonProgress } = useProgress();
  const [filter, setFilter] = useState("all");
  const isComplete = completed.includes(firstLesson.slug);
  const featuredHref = visited && !isComplete ? `${firstLesson.href}#${lastSection}` : firstLesson.href;
  const last = availableLessons.find((lesson) => lesson.slug === lastLesson && !completed.includes(lesson.slug));
  const resume = last || availableLessons.find((lesson) => !completed.includes(lesson.slug)) || firstLesson;
  const section = resume.slug === firstLesson.slug ? lastSection : lessonProgress[resume.slug]?.section || "the-problem";
  const resumeHref = `${resume.href}${last ? `#${section}` : ""}`;
  const lessonCount = chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
  const availableCount = chapters.flatMap((chapter) => chapter.lessons).filter((lesson) => lesson.status === "available").length;

  return <div className="overview page-width">
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">A FIELD GUIDE TO COMPUTER SCIENCE</div>
        <h1>Learn the idea.<br /><em>See it work.</em></h1>
        <p>Visual explanations and small experiments that make the details understandable. Start with AI and machine learning.</p>
        <div className="hero-actions">
          <Link href={availableLessons.every((lesson) => completed.includes(lesson.slug)) ? "/#learning-path" : resumeHref} className="button button-primary">{availableLessons.every((lesson) => completed.includes(lesson.slug)) ? "Review the learning path" : last ? "Continue your lesson" : "Start learning"}<Icon name="arrow" size={18} /></Link>
          <a href="#learning-path" className="text-button">View the learning path <Icon name="chevron" size={15} /></a>
        </div>
        <div className="hero-meta"><span><Icon name="book" size={15} /> No prerequisites</span><span className="meta-dot" aria-hidden="true">·</span><span>Learn step by step</span></div>
        {last && <p className="resume-context">Your place: <Link href={resumeHref}>{resume.title}</Link></p>}
      </div>
      <div className="hero-visual"><span className="art-label">FIG. 01 / LEARNING THROUGH ADJUSTMENT</span><AtlasArt /><div className="art-caption">One model. Smaller errors with each step.</div></div>
    </section>

    <section className="subject-heading">
      <div className="subject-title"><span className="subject-symbol"><Icon name="network" size={25} /></span><div><div className="eyebrow">START HERE</div><h2>AI & machine learning<span className="status-badge">{availableCount} lessons available</span></h2></div></div>
      <p>Begin with the 16-lesson introduction, then work through the complete curriculum.</p>
    </section>

    <section className="featured-lesson" aria-labelledby="featured-title">
      <div className="featured-copy">
        <div className="eyebrow">LESSON 01 <span aria-hidden="true">/</span> GRADIENT DESCENT</div>
        <h3 id="featured-title">How machines learn</h3>
        <p>Two notebooks cost $4. Follow a tiny model as it learns the price, one adjustment at a time.</p>
        <div className="lesson-meta"><span><Icon name="clock" size={15} />12 min read</span><span><Icon name="chart" size={15} />Interactive</span><span className="pill">Beginner</span></div>
        <Link href={featuredHref} className="featured-link">{isComplete ? "Review lesson" : visited ? "Continue lesson" : "Read the lesson"}<span className="round-arrow"><Icon name="arrow" size={18} /></span></Link>
      </div>
      <div className="feature-diagram">
        <div className="diagram-top-label">THE TRAINING LOOP</div>
        <ol className="training-loop"><li><span>01</span><div><strong>Predict</strong><small>Estimate the total price.</small></div></li><li><span>02</span><div><strong>Measure</strong><small>Compare it with the receipt.</small></div></li><li><span>03</span><div><strong>Adjust</strong><small>Update the price. Repeat.</small></div></li></ol>
      </div>
    </section>

    <section id="learning-path" className="learning-path" aria-labelledby="path-title">
      <div className="section-heading"><div><div className="eyebrow">THE QUICK-START PATH</div><h2 id="path-title">From foundations to language models.</h2></div><div className="path-count">{chapters.length} chapters<span aria-hidden="true">·</span>{lessonCount} concepts</div></div>
      <div className="path-toolbar">
        <div className="path-filters" role="group" aria-label="Filter the learning path">
          <button onClick={() => setFilter("all")} className={filter === "all" ? "selected" : ""} aria-pressed={filter === "all"}>All concepts</button>
          <button onClick={() => setFilter("unfinished")} className={filter === "unfinished" ? "selected" : ""} aria-pressed={filter === "unfinished"}>To learn <span>{lessonCount - completed.filter((slug) => starterLessons.some((l) => l.slug === slug)).length}</span></button>
        </div>
        <span className="path-note">{completed.filter((slug) => starterLessons.some((l) => l.slug === slug)).length} of {lessonCount} understood</span>
      </div>
      <div className="chapter-grid">
        {chapters.filter((chapter) => filter === "all" || chapter.lessons.some((lesson) => !completed.includes(lesson.slug))).map((chapter) => {
          const ready = chapter.lessons.filter((lesson) => lesson.status === "available").length;
          return <article className="chapter-card" key={chapter.id} id={chapter.id}>
            <div className="chapter-card-top"><span className={`chapter-icon chapter-icon-${chapter.number}`}><Icon name={chapter.icon} size={23} /></span><span className="chapter-number">CHAPTER {chapter.number}</span></div>
            <h3>{chapter.title}</h3><p>{chapter.description}</p>
            <div className="chapter-lessons">{chapter.lessons.filter((lesson) => filter === "all" || !completed.includes(lesson.slug)).map((lesson) => lesson.status === "available" ?
              <Link className="chapter-lesson available" href={lessonHref("ai-ml", lesson.slug)} key={lesson.slug}><span className="lesson-state"><Icon name={completed.includes(lesson.slug) ? "check" : "play"} size={11} /></span><span>{lesson.title}</span><Icon name="arrow" size={16} /></Link> :
              <div className="chapter-lesson" key={lesson.slug}><span className="planned-circle" aria-hidden="true" /><span>{lesson.title}</span></div>)}</div>
            <div className="chapter-card-footer"><span>{chapter.lessons.length} concepts</span><span className={ready ? "ready-label" : "planned-label"}>{ready ? `${ready} available` : "Planned"}</span></div>
          </article>;
        })}
      </div>
      {filter === "unfinished" && completed.filter((slug) => starterLessons.some((l) => l.slug === slug)).length === lessonCount && <p className="path-empty">You’ve marked every lesson understood. Choose All concepts to revisit one.</p>}
      <p className="roadmap-note"><Icon name="info" size={16} /> These 16 introductions give you a first pass through the subject. The complete curriculum below covers the reference in greater depth.</p>
    </section>

    <FullCurriculum />

    <section className="philosophy">
      <div><h2>Start with intuition.<br />Keep going to the details.</h2><p>Follow one example from the idea to a worked update, then try it yourself. The mathematics follows when you’re ready.</p></div>
      <div className="depth-stack"><span>01 <strong>Intuition</strong><span>The idea in plain language</span></span><span>02 <strong>Step by step</strong><span>A complete worked example</span></span><span>03 <strong>The math</strong><span>The rule and its limits</span></span></div>
    </section>

    <section className="more-subjects"><div className="section-heading"><div><div className="eyebrow">THE REST OF THE ATLAS</div><h2>More subjects, over time.</h2></div><span className="path-note">Planned subjects</span></div>
      <div className="future-grid">{domains.slice(1).map((domain) => <Link href={`/${domain.slug}`} key={domain.slug} className="future-card"><Icon name={domain.icon} size={22} /><strong>{domain.short}</strong><span>View planned topics</span><Icon name="arrow" size={16} /></Link>)}</div>
    </section>
  </div>;
}
