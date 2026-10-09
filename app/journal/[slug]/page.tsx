import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryMedia } from "@/components/story-media";
import { articles, getArticle } from "@/lib/journal";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export function generateStaticParams() {
  return articles.map(a => ({ slug: a.slug }));
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = articles.filter(a => a.slug !== slug).slice(0, 3);

  return (
    <main id="main-content" className="container content-page journal-article">
      {/* Breadcrumb */}
      <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/journal">Journal</Link>
        <span aria-hidden="true">/</span>
        {article.title}
      </nav>

      {/* Hero */}
      <header className="journal-article-header">
        <div className="journal-meta">
          <span className="eyebrow">{article.category}</span>
          <span className="journal-date">{article.date} · {article.readTime}</span>
        </div>
        <h1 className="serif">{article.title}</h1>
        <p className="content-lead">{article.excerpt}</p>
      </header>

      <div className="journal-article-layout">
        {/* Hero image */}
        <div className="journal-article-art">
          <StoryMedia src={article.image} label={`${article.title} — editorial artwork`} tone={article.tone} artwork="arch" />
          <p className="journal-art-caption">Illustrative editorial artwork · AURELIA concept</p>
        </div>

        {/* Body */}
        <div className="journal-article-body">
          {article.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}

          <div className="journal-article-footer">
            <span className="eyebrow">AURELIA · The journal</span>
            <Link href="/journal" className="text-link">Back to all articles ↗</Link>
          </div>
        </div>
      </div>

      {/* Related articles */}
      <section className="journal-related" aria-labelledby="related-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Keep reading</span>
            <h2 id="related-heading" className="serif">More from the journal.</h2>
          </div>
          <Link href="/journal" className="text-link">All articles ↗</Link>
        </div>
        <div className="journal-grid journal-grid--compact">
          {related.map(rel => (
            <article key={rel.slug} className="journal-card">
              <Link href={`/journal/${rel.slug}`} className="journal-card-media" aria-label={`Read: ${rel.title}`}>
                <StoryMedia src={rel.image} label={rel.title} tone={rel.tone} />
              </Link>
              <div className="journal-card-copy">
                <div className="journal-meta">
                  <span className="eyebrow">{rel.category}</span>
                  <span className="journal-date">{rel.date}</span>
                </div>
                <h3 className="serif">
                  <Link href={`/journal/${rel.slug}`}>{rel.title}</Link>
                </h3>
                <Link href={`/journal/${rel.slug}`} className="text-link">Read ↗</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
