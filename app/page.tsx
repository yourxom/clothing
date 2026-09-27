import Link from "next/link";
import { FashionPlaceholder } from "@/components/fashion-placeholder";
import { CatalogCard } from "@/components/catalog-card";
import { getPreviewProducts } from "@/lib/catalog-reader";
import { journalEntries } from "@/lib/editorial";

export const dynamic = "force-dynamic";
const categories = [
  { name: "Kurtas", slug: "kurtas", tone: "rose" },
  { name: "Kurta Sets", slug: "kurta-sets", tone: "olive" },
  { name: "Dresses", slug: "dresses", tone: "blue" },
  { name: "Sarees", slug: "sarees", tone: "clay" },
  { name: "Lehengas", slug: "lehengas", tone: "plum" },
  { name: "Suits", slug: "suits", tone: "sand" },
] as const;
const occasions = [
  { name: "Workwear", tone: "blue", term: "workwear" }, { name: "Festive", tone: "clay", term: "festive" },
  { name: "Wedding", tone: "plum", term: "wedding" }, { name: "Casual", tone: "olive", term: "casual" },
] as const;

export default async function Home() {
  const products = await getPreviewProducts();
  const featured = [0, 7, 20, 31].map(index => products[index]).filter((product): product is (typeof products)[number] => Boolean(product));
  const colors = Array.from(new Set(products.map(product => product.color))).slice(0, 5);
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
    <section id="categories" className="section container section--tinted" aria-labelledby="categories-title">
      <div className="section-heading"><div><span className="eyebrow">01 / Browse by silhouette</span><h2 id="categories-title" className="serif">Find your own way to dress.</h2></div><Link className="text-link" href="/shop">See the full edit ↗</Link></div>
      <div className="category-grid">{categories.map((category, index) => <Link href={`/collections/${category.slug}`} className="category-card" key={category.slug}><FashionPlaceholder label={`${category.name} category`} tone={category.tone} /><div className="category-meta"><span>0{index + 1}</span><h3>{category.name}</h3><span aria-hidden="true">↗</span></div></Link>)}</div>
    </section>
    <section id="new-arrivals" className="section container" aria-labelledby="edit-title"><div className="section-heading"><div><span className="eyebrow">02 / The first edit · Demo</span><h2 id="edit-title" className="serif">A closer look.</h2></div><Link className="text-link" href="/shop">Explore all concepts ↗</Link></div>{featured.length ? <div className="catalog-grid">{featured.map(product => <CatalogCard key={product.slug} product={product} />)}</div> : <p className="notice">Preview concepts are being prepared.</p>}<p className="collection-disclaimer">Illustrative artwork and indicative pricing. These pieces are not available to purchase.</p></section>
    <section id="occasions" className="section container section--tinted" aria-labelledby="occasions-title"><div className="section-heading"><div><span className="eyebrow">03 / The mood</span><h2 id="occasions-title" className="serif">For every kind of day.</h2></div></div><div className="occasion-grid">{occasions.map((item, index) => <Link href={`/search?q=${item.term}`} className="occasion-card" key={item.name}><FashionPlaceholder label={`${item.name} mood concept`} tone={item.tone} /><div className="occasion-meta"><span className="eyebrow">0{index + 1} / Moodboard</span><h3>{item.name} ↗</h3></div></Link>)}</div><p className="collection-disclaimer">Moodboards search existing preview copy; an empty result means no verified occasion tags are available.</p></section>
    {colors.length > 0 && <section className="section container" aria-labelledby="palette-title"><div className="section-heading"><div><span className="eyebrow">Browse by colour</span><h2 id="palette-title" className="serif">A palette of ideas.</h2></div></div><nav className="catalog-category-nav" aria-label="Explore demo colours">{colors.map(color => <Link key={color} href={`/shop?color=${encodeURIComponent(color)}`}>{color} ↗</Link>)}</nav></section>}
    <section id="best-sellers" className="section container" aria-labelledby="favourites-title"><div className="section-heading"><div><span className="eyebrow">A first look</span><h2 id="favourites-title" className="serif">Future favourites.</h2></div></div><p className="notice">Sales rankings will appear after verified orders. The current catalogue is a preview; purchases are not yet available.</p></section>
    <section id="editorial" className="editorial" aria-labelledby="story-title"><FashionPlaceholder label="AURELIA brand story concept" tone="sand" artwork="fold" /><div className="editorial-copy"><span className="eyebrow">04 / Our point of view</span><h2 id="story-title" className="serif">Tradition, with room to move.</h2><p>Inspired by the changing rhythms of everyday life, AURELIA imagines a fresh perspective on Indian occasionwear and the pieces you reach for in between.</p><Link className="text-link" href="/about">Our story ↗</Link></div></section>
    <section id="journal" className="section container section--tinted" aria-labelledby="journal-title"><div className="section-heading"><div><span className="eyebrow">05 / Style notes</span><h2 id="journal-title" className="serif">Ideas to wear.</h2></div><Link className="text-link" href="/journal">All style notes ↗</Link></div><div className="mini-grid">{journalEntries.map((entry, index) => <article className="mini-card" key={entry.slug}><span className="eyebrow">Editorial / 0{index + 1}</span><h3><Link href={`/journal/${entry.slug}`}>{entry.title}</Link></h3><p className="muted">{entry.summary}</p></article>)}</div></section>
    <section id="stores" className="section container" aria-labelledby="stores-title"><div className="store-note"><span className="eyebrow">Beyond the screen</span><h2 id="stores-title" className="serif">Meet us, eventually.</h2><p>No physical AURELIA locations are listed until verified. <Link className="text-link" href="/stores">Store information ↗</Link></p></div></section>
    <section id="newsletter" className="newsletter" aria-labelledby="newsletter-title"><p className="newsletter-quote">“The best dressed woman is one who wears her confidence.”</p><span className="eyebrow">Stay in the know</span><h2 id="newsletter-title" className="serif">A little more AURELIA.</h2><p>Newsletter sign-up will be available when email delivery is configured. We won’t collect addresses before then.</p></section>
  </main>;
}
