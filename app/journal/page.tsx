import type { Metadata } from "next";
import Link from "next/link";
import { StoryMedia } from "@/components/story-media";
import { articles } from "@/lib/journal";

export const metadata: Metadata = {
  title: "The Journal",
  description: "Style notes, craft stories, and ideas about contemporary Indian dressing from AURELIA.",
};

export default function JournalPage() {
  const [featured, ...rest] = articles;

  return (
    <main id="main-content" className="container content-page journal-index">
      <span className="eyebrow">The AURELIA journal</span>
      <h1 className="serif">Ideas to wear.</h1>
      <p className="content-lead">
        Style notes, craft stories, and a fresh perspective on contemporary Indian dressing.
      </p>

      {/* Featured article */}
      <article className="journal-featured">
        <Link href={`/journal/${featured.slug}`} className="journal-featured-media" aria-label={`Read: ${featured.title}`}>
          <StoryMedia src={featured.image} label={featured.title} tone={featured.tone} artwork="arch" />
        </Link>
        <div className="journal-featured-copy">
          <div className="journal-meta">
            <span className="eyebrow">{featured.category}</span>
            <span className="journal-date">{featured.date} · {featured.readTime}</span>
          </div>
          <h2 className="serif">
            <Link href={`/journal/${featured.slug}`}>{featured.title}</Link>
          </h2>
          <p>{featured.excerpt}</p>
          <Link href={`/journal/${featured.slug}`} className="text-link">Read article ↗</Link>
        </div>
      </article>

      {/* Article grid */}
      <section aria-labelledby="more-articles-heading">
        <div className="section-heading" style={{ marginTop: "3rem" }}>
          <div>
            <span className="eyebrow">More from the journal</span>
            <h2 id="more-articles-heading" className="serif">Keep reading.</h2>
          </div>
        </div>
        <div className="journal-grid">
          {rest.map(article => (
            <article key={article.slug} className="journal-card">
              <Link href={`/journal/${article.slug}`} className="journal-card-media" aria-label={`Read: ${article.title}`}>
                <StoryMedia src={article.image} label={article.title} tone={article.tone} />
              </Link>
              <div className="journal-card-copy">
                <div className="journal-meta">
                  <span className="eyebrow">{article.category}</span>
                  <span className="journal-date">{article.date} · {article.readTime}</span>
                </div>
                <h3 className="serif">
                  <Link href={`/journal/${article.slug}`}>{article.title}</Link>
                </h3>
                <p>{article.excerpt}</p>
                <Link href={`/journal/${article.slug}`} className="text-link">Read ↗</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
