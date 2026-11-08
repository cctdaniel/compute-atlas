import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allLessons } from "@/lib/curriculum";
import { conceptLessons, contentBySlug } from "@/lib/lessons/content";
import { prepareExperiment } from "@/lib/lessons/models";
import { ConceptLesson } from "@/components/lessons/concept-lesson";

export function generateStaticParams() { return conceptLessons.map(({ slug }) => ({ lesson: slug })); }
export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const { lesson } = await params;
  const content = Object.hasOwn(contentBySlug, lesson) ? contentBySlug[lesson] : undefined;
  return { title: allLessons.find((l) => l.slug === lesson)?.title || "Lesson not found", description: content?.deck };
}
export default function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  return <Suspense fallback={<div className="lesson-page page-width" role="status">Opening your lesson…</div>}><LessonContent params={params} /></Suspense>;
}
async function LessonContent({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  if (!Object.hasOwn(contentBySlug, lesson)) notFound();
  return <ConceptLesson key={lesson} content={contentBySlug[lesson]} experiment={prepareExperiment(lesson)} />;
}
