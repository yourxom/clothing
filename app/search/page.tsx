import type { Metadata } from "next";
import Link from "next/link";
import { CatalogCard } from "@/components/catalog-card";
import { SearchExperience } from "@/components/search-experience";
import { getPreviewProducts } from "@/lib/catalog-reader";
import { filterPreviewProducts } from "@/lib/catalog-filters";
import { categories } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the AURELIA collection by style name, colour, or fabric.",
};

type Props = { searchParams: Promise<{ q?: string | string[] }> };
const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = first(params.q).slice(0, 100).trim();

  const products = await getPreviewProducts();
  const results = query
    ? filterPreviewProducts(products, { query })
    : [];

  // Build suggestions from category names when no query
  const suggestions = categories.slice(0, 6);

  return (
    <main id="main-content" className="container shop-page">
      <div className="shop-intro">
        <span className="eyebrow">Search the collection</span>
        <h1 className="serif">Find your style.</h1>
        <p>Search by name, colour, or fabric across {products.length} styles.</p>
      </div>

      {/* Instant search with live suggestions */}
      <SearchExperience products={products} initialQuery={query} />

      {/* Quick suggestions when no query */}
      {!query && (
        <div className="search-suggestions" style={{ marginTop: "1rem" }}>
          <p>Popular searches:</p>
          <ul>
            {["Kurtas", "Sarees", "Earth Rose", "Cotton blend", "Festive Lehenga", "Olive"].map(term => (
              <li key={term}>
                <Link href={`/search?q=${encodeURIComponent(term)}`}>{term}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Results */}
      {query && (
        <>
          <p className="catalog-result-count" role="status">
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`}
          </p>

          {results.length > 0 ? (
            <div className="catalog-grid">
              {results.map(product => (
                <CatalogCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="search-no-results">
              <p>Try a different spelling, or browse by category:</p>
              <nav className="catalog-category-nav" aria-label="Browse categories">
                {suggestions.map(cat => (
                  <Link key={cat.slug} href={`/collections/${cat.slug}`}>
                    {cat.name} <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </>
      )}

      {!query && (
        <section>
          <div className="catalog-heading">
            <span className="eyebrow">Browse by category</span>
            <h2 className="serif">Explore the collection</h2>
          </div>
          <nav className="catalog-category-nav" aria-label="Browse categories">
            {categories.map(cat => (
              <Link key={cat.slug} href={`/collections/${cat.slug}`}>
                {cat.name} <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </section>
      )}
    </main>
  );
}
