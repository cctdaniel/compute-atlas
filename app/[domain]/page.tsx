import { notFound } from "next/navigation";
import Link from "next/link";
import { domains } from "@/lib/curriculum";
import { Overview } from "@/components/overview";
import { Icon } from "@/components/icon";
import type { Metadata } from "next";
import { Suspense } from "react";

export function generateStaticParams() { return domains.map(({ slug }) => ({ domain: slug })); }
export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const subject = domains.find((item) => item.slug === domain);
  return { title: subject?.title || "Subject not found" };
}
export default function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  return <Suspense fallback={<div className="placeholder-page page-width" role="status"><div className="eyebrow">FOLLOWING YOUR CURIOSITY</div><h1>A new corner of the atlas.</h1><p className="page-intro">Opening this subject…</p></div>}><DomainContent params={params} /></Suspense>;
}

async function DomainContent({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const subject = domains.find((item) => item.slug === domain);
  if (!subject) notFound();
  if (domain === "ai-ml") return <Overview />;
  return <div className="placeholder-page page-width"><Link href="/" className="text-button"><Icon name="arrow" size={17} style={{ transform: "rotate(180deg)" }} />Back to the atlas</Link><div className="placeholder-symbol"><Icon name={subject.icon} size={45} /></div><div className="eyebrow">A FUTURE EXPEDITION</div><h1>{subject.title}</h1><p className="placeholder-description">{subject.description}</p><span className="pill">On the horizon</span><div className="placeholder-note"><h2>A new corner of the atlas.</h2><p>We’re starting with AI & machine learning, giving each lesson the attention it deserves. This subject has a place here, and these are the paths we plan to explore.</p></div><div className="topic-list">{subject.topics.map((topic, index) => <div key={topic}><span>0{index + 1}</span><strong>{topic}</strong><span className="planned-label">Planned</span></div>)}</div><Link href="/ai-ml/gradient-descent" className="button button-primary">Explore the first AI & ML lesson <Icon name="arrow" size={18} /></Link></div>;
}
