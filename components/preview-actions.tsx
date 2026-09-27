"use client";
import Link from "next/link";
import { useState } from "react";
import { FashionPlaceholder } from "./fashion-placeholder";
import { formatPrice, type Product } from "@/lib/catalog";
import { usePreviewStore } from "./preview-store";

type Item = { slug: string; name: string; sizes: readonly string[] };
export function SavePreview({ slug, name }: Pick<Item, "slug" | "name">) {
  const { ready, state, save } = usePreviewStore();
  const saved = ready && state.wishlist.includes(slug);
  return <button className="preview-save" type="button" disabled={!ready} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} wishlist`} onClick={() => save(slug)}>{saved ? "♥ Saved" : "♡ Save style"}</button>;
}
export function ComparePreview({ slug, name }: Pick<Item, "slug" | "name">) {
  const { ready, comparison, compare } = usePreviewStore();
  const selected = comparison.includes(slug);
  const full = comparison.length >= 3 && !selected;
  return <button className="preview-save" type="button" disabled={!ready || full} aria-pressed={selected} aria-label={`${selected ? "Remove" : "Add"} ${name} ${selected ? "from" : "to"} comparison`} title={full ? "Remove a style from comparison before adding another" : undefined} onClick={() => compare(slug)}>{selected ? "✓ Comparing" : "Compare style"}</button>;
}
export function ComparisonNotice() {
  const { ready, comparison, persistent } = usePreviewStore();
  if (!ready || comparison.length === 0) return null;
  return <p className="catalog-result-count" role="status">{comparison.length} of 3 demo styles selected. <Link className="text-link" href="/compare">Compare styles ↗</Link>{!persistent ? " Browser storage is unavailable; selections may disappear on reload." : ""}</p>;
}
export function ProductPreviewActions({ slug, name, sizes }: Item) {
  const { ready, state, add, save } = usePreviewStore();
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");
  const saved = ready && state.wishlist.includes(slug);
  const selectedSize = sizes.includes(size) ? size : "";
  return <div className="preview-product-actions">
    <label htmlFor="preview-size">Proposed size</label>
    <select id="preview-size" value={size} onChange={event => { setSize(event.target.value); setMessage(""); }} disabled={!ready || sizes.length === 0}>
      <option value="">Select a proposed size</option>{sizes.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
    <div className="preview-action-row"><button type="button" disabled={!ready || !selectedSize} onClick={() => { if (!selectedSize) return; add(slug, selectedSize); setMessage(`${name} (${selectedSize}) added to your demo bag. No order was placed.`); }}>Add to demo bag</button><button type="button" disabled={!ready} aria-pressed={saved} onClick={() => save(slug)}>{saved ? "♥ Saved" : "♡ Save style"}</button><ComparePreview slug={slug} name={name}/></div>
    <ComparisonNotice/>
    <p role="status" aria-live="polite">{message || "Demo bag is a planning list only. Stock, size and price are unverified; checkout is disabled."}</p>
  </div>;
}
function InlinePreview({ product }: { product: Product }) {
  return <details className="preview-inline"><summary>Preview style</summary><div className="preview-inline-content"><FashionPlaceholder label={`${product.name} illustrative demo artwork`} tone={product.tone} /><div><h3 className="serif">{product.name}</h3><p>{product.description}</p><dl><div><dt>Colour</dt><dd>{product.color}</dd></div><div><dt>Fabric concept</dt><dd>{product.fabric}</dd></div><div><dt>Proposed sizes</dt><dd>{product.sizes.join(" · ") || "Not specified"}</dd></div><div><dt>Indicative price</dt><dd>{formatPrice(product.price)}</dd></div></dl><Link className="text-link" href={`/products/${product.slug}`}>View full demo details ↗</Link><p className="catalog-card-disclaimer">Concept artwork, not a product photo. Details and price are unverified; no purchase is available.</p></div></div></details>;
}
const storageNotice = <p className="notice" role="status">Browser storage is unavailable. This planning list may disappear when the page reloads.</p>;
export function WishlistView({ products }: { products: Product[] }) {
  const { ready, persistent, state, save } = usePreviewStore();
  if (!ready) return <p className="notice" role="status">Loading saved styles from this browser…</p>;
  const catalog = new Map(products.map(product => [product.slug, product]));
  const available = state.wishlist.flatMap(slug => { const product = catalog.get(slug); return product ? [product] : []; });
  const missing = state.wishlist.filter(slug => !catalog.has(slug));
  return <section aria-label="Saved preview styles">{!persistent && storageNotice}<p className="catalog-result-count">{available.length} saved demo styles</p>{available.length ? <div className="preview-list">{available.map(product => <article className="preview-list-item" key={product.slug}><div className="preview-list-info"><Link href={`/products/${product.slug}`}>{product.name}</Link><p>Demo style · {product.color} · Indicative {formatPrice(product.price)}</p><InlinePreview product={product}/></div><button type="button" onClick={() => save(product.slug)} aria-label={`Remove ${product.name} from saved styles`}>Remove</button></article>)}</div> : <p className="notice">No saved styles yet. Browse the demo catalogue to save ideas.</p>}{missing.length > 0 && <p className="notice" role="status">{missing.length} saved style(s) are no longer in this preview catalogue. They cannot be previewed or reserved.</p>}</section>;
}
export function BagView({ products }: { products: Product[] }) {
  const { ready, persistent, state, quantity } = usePreviewStore();
  if (!ready) return <p className="notice" role="status">Loading demo bag from this browser…</p>;
  const catalog = new Map(products.map(product => [product.slug, product]));
  const available = state.bag.flatMap(item => { const product = catalog.get(item.slug); return product && product.sizes.includes(item.size) ? [{ item, product }] : []; });
  const missing = state.bag.length - available.length;
  const indicativeTotal = available.reduce((total, { item, product }) => total + item.quantity * product.price, 0);
  return <section aria-label="Demo bag contents">{!persistent && storageNotice}<p className="catalog-result-count">{available.reduce((sum, { item }) => sum + item.quantity, 0)} demo items in this browser</p>{available.length ? <div className="preview-list">{available.map(({ item, product }) => <article className="preview-list-item" key={`${item.slug}:${item.size}`}><div className="preview-list-info"><Link href={`/products/${item.slug}`}>{product.name}</Link><p>Proposed size: {item.size} · Indicative {formatPrice(product.price)} per item</p><InlinePreview product={product}/></div><div className="preview-quantity"><label htmlFor={`bag-${item.slug}-${item.size}`}>Demo quantity</label><select id={`bag-${item.slug}-${item.size}`} value={item.quantity} onChange={event => quantity(item.slug, item.size, Number(event.target.value))}>{Array.from({ length: 10 }, (_, n) => <option key={n + 1} value={n + 1}>{n + 1}</option>)}</select><button type="button" onClick={() => quantity(item.slug, item.size, 0)} aria-label={`Remove ${product.name}, size ${item.size}, from demo bag`}>Remove</button></div></article>)}</div> : <p className="notice">Your demo bag is empty. Select a proposed size on a product page to add an idea.</p>}{missing > 0 && <p className="notice" role="status">{missing} saved entry/entries are no longer in this preview (or the proposed size changed). They cannot be previewed and are excluded from the estimate.</p>}{available.length > 0 && <p className="preview-estimate">Illustrative total: {formatPrice(indicativeTotal)}. This is not a payable amount or a price quote.</p>}<p className="notice">Preview only. No reservation, delivery estimate, payment or checkout is available.</p></section>;
}
export function ComparisonView({ products }: { products: Product[] }) {
  const { ready, persistent, comparison, compare } = usePreviewStore();
  if (!ready) return <p className="notice" role="status">Loading comparison from this browser…</p>;
  const catalog = new Map(products.map(product => [product.slug, product]));
  const available = comparison.flatMap(slug => { const product = catalog.get(slug); return product ? [product] : []; });
  const missing = comparison.filter(slug => !catalog.has(slug));
  return <section aria-label="Demo style comparison">{!persistent && storageNotice}<p className="catalog-result-count">{available.length} of 3 demo styles ready to compare</p>{available.length ? <div className="comparison-grid">{available.map(product => <article className="comparison-item" key={product.slug}><FashionPlaceholder label={`${product.name} illustrative demo artwork`} tone={product.tone}/><h2 className="serif"><Link href={`/products/${product.slug}`}>{product.name}</Link></h2><dl><div><dt>Category</dt><dd>{product.category}</dd></div><div><dt>Colour</dt><dd>{product.color}</dd></div><div><dt>Fabric concept</dt><dd>{product.fabric}</dd></div><div><dt>Proposed sizes</dt><dd>{product.sizes.join(" · ") || "Not specified"}</dd></div><div><dt>Indicative price</dt><dd>{formatPrice(product.price)}</dd></div></dl><p>{product.description}</p><button type="button" onClick={() => compare(product.slug)} aria-label={`Remove ${product.name} from comparison`}>Remove from comparison</button></article>)}</div> : <p className="notice">No styles currently available to compare. Visit the demo catalogue to choose up to three concepts.</p>}{missing.length > 0 && <div className="notice" role="status"><p>{missing.length} comparison selection(s) are no longer in this unpublished preview. They cannot be compared; remove them below to make room for other styles.</p><ul>{missing.map(slug => <li key={slug}><span>{slug}</span> <button type="button" onClick={() => compare(slug)} aria-label={`Remove unavailable style ${slug} from comparison`}>Remove unavailable style</button></li>)}</ul></div>}<p className="notice">Illustrative concepts only. Details, sizes and pricing are unverified; comparison does not reserve stock or enable checkout.</p><Link className="text-link" href="/shop">Browse demo styles ↗</Link></section>;
}
