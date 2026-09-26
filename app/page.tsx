import Link from "next/link";
import { FashionPlaceholder } from "@/components/fashion-placeholder";
import { CatalogCard } from "@/components/catalog-card";
import { products } from "@/lib/catalog";

const categories = [
  { name: "Kurtas", slug: "kurtas", tone: "rose" },
  { name: "Kurta Sets", slug: "kurta-sets", tone: "olive" },
  { name: "Dresses", slug: "dresses", tone: "blue" },
  { name: "Sarees", slug: "sarees", tone: "clay" },
  { name: "Lehengas", slug: "lehengas", tone: "plum" },
  { name: "Suits", slug: "suits", tone: "sand" },
] as const;
const occasions = [
  { name: "Workwear", tone: "blue" }, { name: "Festive", tone: "clay" },
  { name: "Wedding", tone: "plum" }, { name: "Casual", tone: "olive" },
] as const;
const featured = [products[0], products[7], products[20], products[31]];

export default function Home() {
  return <main id="main-content">
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-content">
        <span className="eyebrow">AURELIA / A new perspective</span>
        <h1 id="hero-title" className="serif">Make room<br />for <em>you.</em></h1>
        <p>Contemporary Indian dressing, imagined for every version of your day. Discover the first edit of original AURELIA concepts.</p>
        <div className="hero-actions"><Link className="button" href="/shop">Explore the edit</Link><a className="button button-outline" href="#categories">Find your style</a></div>
        <span className="hero-note">01 / A collection in the making · Preview only</span>
      </div>
      <FashionPlaceholder label="AURELIA editorial campaign concept" tone="clay" artwork="arch" />
    </section>
    <div className="editorial-ticker" aria-label="AURELIA collection values"><span>Original concepts</span><span aria-hidden="true">✦</span><span>Modern Indian dressing</span><span aria-hidden="true">✦</span><span>Made for every moment</span></div>
    <section id="categories" className="section container" aria-labelledby="categories-title">
      <div className="section-heading"><div><span className="eyebrow">01 / Browse by silhouette</span><h2 id="categories-title" className="serif">Find your own way to dress.</h2></div><Link className="text-link" href="/shop">See the full edit ↗</Link></div>
      <div className="category-grid">{categories.map((category, index) => <Link href={`/collections/${category.slug}`} className="category-card" key={category.slug}><FashionPlaceholder label={`${category.name} category`} tone={category.tone} /><div className="category-meta"><span>0{index + 1}</span><h3>{category.name}</h3><span aria-hidden="true">↗</span></div></Link>)}</div>
    </section>
    <section id="new-arrivals" className="section container" aria-labelledby="edit-title"><div className="section-heading"><div><span className="eyebrow">02 / The first edit · Demo</span><h2 id="edit-title" className="serif">A closer look.</h2></div><Link className="text-link" href="/shop">Explore all concepts ↗</Link></div><div className="catalog-grid">{featured.map(product => <CatalogCard key={product.slug} product={product} />)}</div><p className="collection-disclaimer">Illustrative artwork and indicative pricing. These pieces are not available to purchase.</p></section>
    <section id="occasions" className="section container" aria-labelledby="occasions-title"><div className="section-heading"><div><span className="eyebrow">03 / The mood</span><h2 id="occasions-title" className="serif">For every kind of day.</h2></div></div><div className="occasion-grid">{occasions.map((item, index) => <div className="occasion-card" key={item.name}><FashionPlaceholder label={`${item.name} mood concept`} tone={item.tone} /><div className="occasion-meta"><span className="eyebrow">0{index + 1} / Moodboard</span><h3>{item.name}</h3></div></div>)}</div></section>
    <section id="best-sellers" className="section container" aria-labelledby="favourites-title"><div className="section-heading"><div><span className="eyebrow">A first look</span><h2 id="favourites-title" className="serif">Future favourites.</h2></div></div><p className="notice">Sales rankings will appear after verified orders. The current catalogue is a preview; purchases are not yet available.</p></section>
    <section id="editorial" className="editorial" aria-labelledby="story-title"><FashionPlaceholder label="AURELIA brand story concept" tone="sand" artwork="fold" /><div className="editorial-copy"><span className="eyebrow">04 / Our point of view</span><h2 id="story-title" className="serif">Tradition, with room to move.</h2><p>Inspired by the changing rhythms of everyday life, AURELIA imagines a fresh perspective on Indian occasionwear and the pieces you reach for in between.</p><a className="text-link" href="#journal">Read our style notes ↗</a></div></section>
    <section id="journal" className="section container" aria-labelledby="journal-title"><div className="section-heading"><div><span className="eyebrow">05 / Style notes</span><h2 id="journal-title" className="serif">Ideas to wear.</h2></div></div><div className="mini-grid">{["A wardrobe that moves with you", "Small details, lasting impressions", "The many moods of occasionwear"].map((title, index) => <article className="mini-card" key={title}><span className="eyebrow">Editorial / 0{index + 1}</span><h3>{title}</h3><p className="muted">Original editorial stories are coming in a later phase.</p></article>)}</div></section>
    <section id="stores" className="section container" aria-labelledby="stores-title"><div className="store-note"><span className="eyebrow">Beyond the screen</span><h2 id="stores-title" className="serif">Meet us, eventually.</h2><p>A store finder is planned. No physical AURELIA locations are listed until verified.</p></div></section>
    <section id="newsletter" className="newsletter" aria-labelledby="newsletter-title"><span className="eyebrow">Stay in the know</span><h2 id="newsletter-title" className="serif">A little more AURELIA.</h2><p>Newsletter sign-up will be available when email delivery is configured. We won’t collect addresses before then.</p></section>
  </main>;
}
