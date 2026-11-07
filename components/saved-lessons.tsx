"use client";
import Link from "next/link";
import { useProgress } from "./preferences";
import { allLessons } from "@/lib/curriculum";
import { Icon } from "./icon";

export function SavedLessons() {
  const { saved, completed, ready, toggleSaved } = useProgress();
  const lessons = allLessons.filter((lesson) => saved.includes(lesson.slug));
  return <div className="saved-page page-width"><div className="eyebrow">KEEP YOUR CURIOSITY CLOSE</div><h1>Your little collection.</h1><p className="page-intro">Good ideas are worth coming back to. Your saved lessons live here.</p>{!ready ? <p>Opening your collection…</p> : lessons.length ? <div className="saved-list">{lessons.map((lesson) => <article key={lesson.slug}><div><span className="eyebrow">{lesson.tag}</span><h2><Link href={lesson.href}>{lesson.title}</Link></h2><p>{lesson.description}</p><span className="lesson-meta">{lesson.minutes} min · {completed.includes(lesson.slug) ? "Completed" : "Ready to explore"}</span></div><button className="icon-button is-saved" aria-label={`Remove ${lesson.title} from saved lessons`} onClick={() => toggleSaved(lesson.slug)}><Icon name="bookmark" /></button></article>)}</div> : <div className="empty-state"><span className="subject-symbol"><Icon name="bookmark" size={28} /></span><h2>A space for your next discovery.</h2><p>Tap the bookmark on a lesson to keep it here.<br />Your collection and progress stay in this browser.</p><Link href="/ai-ml/gradient-descent" className="button button-primary">Explore your first lesson <Icon name="arrow" size={17} /></Link></div>}<p className="storage-note"><Icon name="info" size={15} /> Saved on this device. No account needed.</p></div>;
}
