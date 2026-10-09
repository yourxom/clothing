import type { Metadata } from "next";
import Link from "next/link";
import { CatalogCard } from "@/components/catalog-card";
import { ComparisonNotice } from "@/components/preview-actions";
import { categories } from "@/lib/catalog";
import { filterPreviewProducts, getOccasionLabel, OCCASIONS, SALE_THRESHOLD } from "@/lib/catalog-filters";
import { getPreviewProducts } from "@/lib/catalog-reader";

export const dynamic = "force-dynamic";

type ShopParams = {
  q?:        string | string[];
  category?: string | string[];
  size?:     string | string[];
  sort?:     string | string[];
  color?:    string | string[];
  occasion?: string | string[];
  sale?:     string | string[];
  page?:     string | string[];
};

const PAGE_SIZE = 12;
type Props = { searchParams: Promise<ShopParams> };
const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params  = await searchParams;
  const occasion = first(params.occasion);
  const category = first(params.category);
  const label = occasion
    ? getOccasionLabel(occasion)
    : category
    ? categories.find(c => c.slug === category)?.name
    : null;
  return {
    title: label ? `${label} — Shop the edit` : "Shop the edit",
    description: "Shop the AURELIA collection — contemporary Indian and modern womenswear in breathable fabrics.",
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const products = await getPreviewProducts();
  const params   = await searchParams;

  const query    = first(params.q).slice(0, 100);
  const category = first(params.category);
  const size     = first(params.size);
  const sort     = first(params.sort);
  const color    = first(params.color);
  const occasion = first(params.occasion);
  const onSale   = first(params.sale) === "1";

  const sizes = Array.from(new Set(products.flatMap(p => p.sizes))).sort((a, b) => {
    const order = ["XS", "S", "M", "L", "XL", "XXL"];
    const ai = order.indexOf(a), bi = order.indexOf(b);
    return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi) || a.localeCompare(b);
  });
  const colors = Array.from(new Set(products.map(p => p.color))).sort((a, b) => a.localeCompare(b));

  const selectedCategory = categories.some(c => c.slug === category) ? category : "";
  const selectedSize     = sizes.includes(size) ? size : "";
  const selectedSort     = ["price-asc", "price-desc", "name", "newest"].includes(sort) ? sort : "";
  const selectedColor    = colors.includes(color) ? color : "";
  const selectedOccasion = OCCASIONS.includes(occasion) ? occasion : "";

  const allVisible = filterPreviewProducts(products, {
    query,
    category: selectedCategory,
    size:     selectedSize,
    sort:     selectedSort,
    color:    selectedColor,
    occasion: selectedOccasion,
    sale:     onSale,
  });

  // Pagination
  const pageNum   = Math.max(1, parseInt(first(params.page)) || 1);
  const totalPages = Math.max(1, Math.ceil(allVisible.length / PAGE_SIZE));
  const currentPage = Math.min(pageNum, totalPages);
  const visible = allVisible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Build a query string preserving filters for pagination links
  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (query)            sp.set("q", query);
    if (selectedCategory) sp.set("category", selectedCategory);
    if (selectedSize)     sp.set("size", selectedSize);
    if (selectedSort)     sp.set("sort", selectedSort);
    if (selectedColor)    sp.set("color", selectedColor);
    if (selectedOccasion) sp.set("occasion", selectedOccasion);
    if (onSale)           sp.set("sale", "1");
    if (p > 1)            sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const occasionLabel = selectedOccasion ? getOccasionLabel(selectedOccasion) : null;
  const isNewest = selectedSort === "newest" && !occasionLabel && !onSale;
  const hasActiveFilter = query || selectedCategory || selectedSize || selectedColor || selectedOccasion || onSale;

  return (
    <main id="main-content" className="container shop-page">
      <div className="shop-intro">
        <span className="eyebrow">
          {onSale ? "Sale" : isNewest ? "Just in" : occasionLabel ? `${occasionLabel} edit` : "The AURELIA collection"}
        </span>
        <h1 className="serif">
          {onSale
            ? `Sale — ${SALE_THRESHOLD}% off & more.`
            : isNewest
            ? "New arrivals."
            : occasionLabel
            ? `Dressed for ${occasionLabel.toLowerCase()}.`
            : "A wardrobe for every moment."}
        </h1>
      </div>

      {/* Occasion quick-links */}
      <div className="occasion-pills" role="navigation" aria-label="Browse by occasion">
        <Link
          href="/shop"
          className={`occasion-pill${!selectedOccasion ? " occasion-pill--active" : ""}`}
          aria-current={!selectedOccasion ? "page" : undefined}
        >
          All styles
        </Link>
        {OCCASIONS.map(occ => (
          <Link
            key={occ}
            href={`/shop?occasion=${occ}`}
            className={`occasion-pill${selectedOccasion === occ ? " occasion-pill--active" : ""}`}
            aria-current={selectedOccasion === occ ? "page" : undefined}
          >
            {getOccasionLabel(occ)}
          </Link>
        ))}
        <Link
          href="/shop?sale=1"
          className={`occasion-pill occasion-pill--sale${onSale ? " occasion-pill--active" : ""}`}
          aria-current={onSale ? "page" : undefined}
        >
          Sale
        </Link>
      </div>

      {/* Category nav */}
      <nav className="catalog-category-nav" aria-label="Shop by category">
        {categories.map(item => (
          <Link key={item.slug} href={`/collections/${item.slug}`}>
            {item.name} <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>

      {/* Heading */}
      <div className="catalog-heading">
        <span className="eyebrow">{occasionLabel ? `${occasionLabel} styles` : "The collection"}</span>
        <h2 className="serif">Discover the collection</h2>
        <p>{visible.length} styles</p>
      </div>

      {/* Filters */}
      <form action="/shop" method="get" className="catalog-filters" role="search" aria-label="Filter preview catalogue">
        {/* Preserve occasion across filter submit */}
        {selectedOccasion && (
          <input type="hidden" name="occasion" value={selectedOccasion} />
        )}
        {/* Preserve the Sale edit across filter submit */}
        {onSale && <input type="hidden" name="sale" value="1" />}

        <div className="catalog-filter-field catalog-filter-search">
          <label htmlFor="catalog-query">Search styles</label>
          <input
            id="catalog-query"
            name="q"
            type="text"
            maxLength={100}
            defaultValue={query}
            placeholder="Name, colour or fabric"
            autoComplete="off"
          />
        </div>

        <div className="catalog-filter-field">
          <label htmlFor="catalog-category">Category</label>
          <select id="catalog-category" name="category" defaultValue={selectedCategory}>
            <option value="">All categories</option>
            {categories.map(item => (
              <option key={item.slug} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </div>

        <div className="catalog-filter-field">
          <label htmlFor="catalog-size">Size</label>
          <select id="catalog-size" name="size" defaultValue={selectedSize}>
            <option value="">All sizes</option>
            {sizes.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="catalog-filter-field">
          <label htmlFor="catalog-color">Colour</label>
          <select id="catalog-color" name="color" defaultValue={selectedColor}>
            <option value="">All colours</option>
            {colors.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="catalog-filter-field">
          <label htmlFor="catalog-sort">Sort by</label>
          <select id="catalog-sort" name="sort" defaultValue={selectedSort}>
            <option value="">Catalogue order</option>
            <option value="newest">New arrivals</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        <div className="catalog-filter-actions">
          <button type="submit">Apply</button>
          {hasActiveFilter && <Link href="/shop">Clear all</Link>}
          <Link href="/search">Instant search ↗</Link>
        </div>
      </form>

      <p className="catalog-result-count" role="status">
        {allVisible.length} {allVisible.length === 1 ? "style" : "styles"}
        {occasionLabel ? ` for ${occasionLabel}` : ""}
        {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}
      </p>

      <ComparisonNotice />

      {visible.length ? (
        <div className="catalog-grid">
          {visible.map(product => (
            <CatalogCard product={product} key={product.slug} />
          ))}
        </div>
      ) : (
        <div>
          <p className="notice">
            {products.length
              ? "No styles match these filters. Try adjusting your selection."
              : "No styles available."}
          </p>
          {hasActiveFilter && (
            <Link href="/shop" className="button button-outline" style={{ marginTop: "1rem", display: "inline-flex" }}>
              Clear all filters
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          {currentPage > 1 && (
            <Link href={buildPageUrl(currentPage - 1)} className="pagination-btn" aria-label="Previous page">
              ← Prev
            </Link>
          )}
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} style={{ display: "contents" }}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pagination-gap">…</span>}
                  <Link
                    href={buildPageUrl(p)}
                    className={`pagination-page${p === currentPage ? " pagination-page--active" : ""}`}
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {p}
                  </Link>
                </span>
              ))}
          </div>
          {currentPage < totalPages && (
            <Link href={buildPageUrl(currentPage + 1)} className="pagination-btn" aria-label="Next page">
              Next →
            </Link>
          )}
        </nav>
      )}

      <p className="catalog-more">
        Free shipping on orders above ₹2,000 · Easy 15-day returns
      </p>
    </main>
  );
}
