import Link from "next/link";
import { categories, occasions, type VProduct } from "../data";
import { SectionMedia } from "./section-media";
import { SectionHeader, ProductGrid } from "./sections-ui";

/* ── Optional real-photo images for the one-off sections ────────────
   Drop files in public/ and set the paths here. Empty string = keep the
   art-directed illustration. A missing/broken file also falls back safely. */
const SALE_IMAGE = "/hero/middle-hero.png";  // Mid Season Sale banner (public/hero/middle-hero.png)
const EDITORIAL_IMAGE = "/editorial/brand-story.png";  // Editorial (public/editorial/brand-story.png)

/* ── 8. Shop by Category ────────────────────────────────────────── */
export function CategorySection() {
  return (
    <section className="vl-section vl-container" id="categories" aria-labelledby="cat-h">
      <SectionHeader title="Shop by Category" viewAllHref="/shop" />
      <span id="cat-h" hidden>Shop by Category</span>
      <div className="vl-cat-grid">
        {categories.map((c) => (
          <Link key={c.id} className="vl-cat-card" href={c.href} aria-label={`Shop ${c.name}`}>
            <div className="vl-cat-card__body">
              <h3>{c.name}</h3>
              <p>{c.blurb}</p>
              <span className="vl-cat-card__cta">Shop Now →</span>
            </div>
            <div className="vl-cat-card__media">
              <SectionMedia src={c.image} tone={c.tone} pose={c.pose} uid={`cat-${c.id}`} alt={`${c.name} category — AURELIA`} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── 9. Trending Now ────────────────────────────────────────────── */
export function TrendingSection({ products }: { products: VProduct[] }) {
  return (
    <section className="vl-section vl-container" id="trending" aria-labelledby="trend-h">
      <SectionHeader title="Trending Now" viewAllHref="/shop" />
      <span id="trend-h" hidden>Trending Now</span>
      <ProductGrid products={products} />
    </section>
  );
}

/* ── 11. Mid Season Sale Banner ─────────────────────────────────── */
export function SaleBanner() {
  return (
    <section className="vl-section vl-container" id="sale" aria-label="Mid season sale">
      <div className="vl-sale">
        <div className="vl-sale__media">
          <SectionMedia src={SALE_IMAGE} tone="coral" pose="profile" uid="sale-left" alt="Model in AURELIA sale styles" />
        </div>
        <div className="vl-sale__center">
          <p className="vl-sale__eyebrow">Mid Season Sale</p>
          <p className="vl-sale__big">
            Up to <em>50%</em> Off
          </p>
          <p className="vl-sale__sub">On selected styles · Limited time only</p>
          <Link className="vl-btn" href="/shop">Shop the Sale →</Link>
        </div>
        <div className="vl-sale__deco" aria-hidden="true">
          <span className="vl-serif">Good<br />Outfits<br />Brighter<br />Days</span>
        </div>
      </div>
    </section>
  );
}

/* ── 12. Shop by Occasion ───────────────────────────────────────── */
export function OccasionSection() {
  return (
    <section className="vl-section vl-container" id="occasion" aria-labelledby="occ-h">
      <SectionHeader title="Shop by Occasion" viewAllHref="/shop" />
      <span id="occ-h" hidden>Shop by Occasion</span>
      <div className="vl-occ-grid">
        {occasions.map((o) => (
          <Link key={o.id} className="vl-occ-card" href={o.href} aria-label={`Shop ${o.name}`}>
            <div className="vl-occ-card__body">
              <h3>{o.name}</h3>
              <p>{o.blurb}</p>
              <span className="vl-occ-card__cta">Shop Now →</span>
            </div>
            <div className="vl-occ-card__media">
              <SectionMedia src={o.image} tone={o.tone} pose={o.pose} uid={`occ-${o.id}`} alt={`${o.name} — AURELIA`} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── 13. Best Sellers ───────────────────────────────────────────── */
export function BestSellersSection({ products }: { products: VProduct[] }) {
  return (
    <section className="vl-section vl-container" id="bestsellers" aria-labelledby="best-h">
      <SectionHeader title="Best Sellers" viewAllHref="/shop" />
      <span id="best-h" hidden>Best Sellers</span>
      <ProductGrid products={products} />
    </section>
  );
}

/* ── 14. Editorial / Brand Story ────────────────────────────────── */
export function EditorialSection() {
  return (
    <section className="vl-section vl-container" id="editorial" aria-labelledby="story-h">
      <div className="vl-editorial">
        <div className="vl-editorial__media">
          <SectionMedia src={EDITORIAL_IMAGE} tone="charcoal" pose="seated" uid="editorial" alt="AURELIA brand story — woman in premium knitwear" />
          {/* Heading overlaid on the image (right side). Shown on mobile; on
              desktop the body overlay carries its own heading. */}
          <div className="vl-editorial__caption">
            <p className="vl-editorial__eyebrow">Our Story</p>
            <h2 id="story-h" className="vl-serif">Style,<br />Reimagined</h2>
          </div>
        </div>
        <div className="vl-editorial__body">
          <p className="vl-editorial__eyebrow vl-editorial__eyebrow--body">Our Story</p>
          <h2 className="vl-serif vl-editorial__title--body">Style,<br />Reimagined</h2>
          <p>
            We believe fashion is more than just clothing — it&apos;s a way to express who you
            are. Our collections are designed to make you feel confident, beautiful and
            effortlessly you.
          </p>
          <Link className="vl-btn" href="/about">Explore Our Story →</Link>
        </div>
      </div>
    </section>
  );
}
