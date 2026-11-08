"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useProgress } from "./preferences";
import { allLessons, firstLesson } from "@/lib/curriculum";
import { Icon } from "./icon";

export function SavedLessons() {
  const { saved, completed, ready, toggleSaved } = useProgress();
  const [removed, setRemoved] = useState<string | null>(null);
  const undo = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const lessons = allLessons.filter((lesson) => lesson.status === "available" && saved.includes(lesson.slug));
  const removedLesson = allLessons.find((lesson) => lesson.slug === removed);

  function remove(slug: string) {
    toggleSaved(slug);
    setRemoved(slug);
    requestAnimationFrame(() => undo.current?.focus({ preventScroll: true }));
  }
  return <div className="saved-page page-width">
    <div className="eyebrow">YOUR READING LIST</div><h1 ref={heading} tabIndex={-1}>Saved lessons.</h1>
    <p className="page-intro">Keep lessons here to read or revisit later.</p>
    {removedLesson && <div className="saved-notice"><p role="status">Removed “{removedLesson.title}”.</p><button ref={undo} className="text-button" onClick={() => { toggleSaved(removedLesson.slug); setRemoved(null); heading.current?.focus({ preventScroll: true }); }}>Undo <Icon name="reset" size={16} /></button></div>}
    {!ready ? <p className="storage-note" role="status">Loading saved lessons…</p> : lessons.length ? <div className="saved-list">{lessons.map((lesson) => <article key={lesson.slug}>
      <div><span className="eyebrow">{lesson.tag}</span><h2><Link href={lesson.href}>{lesson.title}</Link></h2><p>{lesson.description}</p><span className="lesson-meta">{lesson.minutes} min read · {completed.includes(lesson.slug) ? "Completed" : "Available to read"}</span></div>
      <button className="icon-button is-saved" aria-label={`Remove ${lesson.title} from saved lessons`} onClick={() => remove(lesson.slug)}><Icon name="bookmark" /></button>
    </article>)}</div> : <div className="empty-state"><span className="subject-symbol"><Icon name="bookmark" size={28} /></span><h2>No saved lessons yet.</h2><p>Use “Save lesson” at the top of a lesson to add it to this list.</p><Link href={firstLesson.href} className="button button-primary">Read the first lesson <Icon name="arrow" size={17} /></Link></div>}
    <p className="storage-note"><Icon name="info" size={15} />Saved and completed lessons stay in this browser. No account needed.</p>
  </div>;
}
