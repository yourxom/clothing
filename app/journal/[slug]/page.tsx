import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findJournalEntry, journalEntries } from "@/lib/editorial";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return journalEntries.map(entry => ({ slug: entry.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const entry = findJournalEntry((await params).slug); return { title: entry?.title ?? "Style note", description: entry?.summary }; }
export default async function JournalArticle({ params }: Props) { const entry = findJournalEntry((await params).slug); if (!entry) notFound(); return <main id="main-content" className="container shop-page content-page"><nav className="catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/journal">Style notes</Link> / {entry.title}</nav><article><span className="eyebrow">AURELIA editorial · <time dateTime={entry.date}>{entry.date}</time> · {entry.author}</span><h1 className="serif">{entry.title}</h1><p className="content-lead">{entry.summary}</p>{entry.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</article><Link className="text-link" href="/journal">← All style notes</Link></main>; }
