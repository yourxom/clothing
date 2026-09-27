"use client";
import Link from "next/link";
import { useState } from "react";
import { formatPrice, type Product } from "@/lib/catalog";
import { usePreviewStore } from "./preview-store";

type Item = { slug: string; name: string; sizes: readonly string[] };
export function SavePreview({ slug, name }: Pick<Item, "slug" | "name">) {
  const { ready, state, save } = usePreviewStore();
  const saved = ready && state.wishlist.includes(slug);
  return <button className="preview-save" type="button" disabled={!ready} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} wishlist`} onClick={() => save(slug)}>{saved ? "♥ Saved" : "♡ Save style"}</button>;
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
    <div className="preview-action-row"><button type="button" disabled={!ready || !selectedSize} onClick={() => { if (!selectedSize) return; add(slug, selectedSize); setMessage(`${name} (${selectedSize}) added to your demo bag. No order was placed.`); }}>Add to demo bag</button><button type="button" disabled={!ready} aria-pressed={saved} onClick={() => save(slug)}>{saved ? "♥ Saved" : "♡ Save style"}</button></div>
    <p role="status" aria-live="polite">{message || "Demo bag is a planning list only. Stock, size and price are unverified; checkout is disabled."}</p>
  </div>;
}
export function WishlistView({ products }: { products: Product[] }) {
  const { ready, state, save } = usePreviewStore();
  if (!ready) return <p className="notice" role="status">Loading saved styles from this browser…</p>;
  const catalog = new Map(products.map(product => [product.slug, product]));
  const available = state.wishlist.flatMap(slug => { const product = catalog.get(slug); return product ? [product] : []; });
  const missing = state.wishlist.filter(slug => !catalog.has(slug));
  return <section aria-label="Saved preview styles"><p className="catalog-result-count">{available.length} saved demo styles</p>{available.length ? <div className="preview-list">{available.map(product => <article className="preview-list-item" key={product.slug}><div><Link href={`/products/${product.slug}`}>{product.name}</Link><p>Demo style · {product.color} · Indicative {formatPrice(product.price)}</p></div><button type="button" onClick={() => save(product.slug)}>Remove</button></article>)}</div> : <p className="notice">No saved styles yet. Browse the demo catalogue to save ideas.</p>}{missing.length > 0 && <p className="notice">{missing.length} saved style(s) are no longer in this preview catalogue. They cannot be reserved or added to a bag.</p>}</section>;
}
export function BagView({ products }: { products: Product[] }) {
  const { ready, state, quantity } = usePreviewStore();
  if (!ready) return <p className="notice" role="status">Loading demo bag from this browser…</p>;
  const catalog = new Map(products.map(product => [product.slug, product]));
  const available = state.bag.flatMap(item => { const product = catalog.get(item.slug); return product && product.sizes.includes(item.size) ? [{ item, product }] : []; });
  const missing = state.bag.length - available.length;
  const indicativeTotal = available.reduce((total, { item, product }) => total + item.quantity * product.price, 0);
  return <section aria-label="Demo bag contents"><p className="catalog-result-count">{available.reduce((sum, { item }) => sum + item.quantity, 0)} demo items in this browser</p>{available.length ? <div className="preview-list">{available.map(({ item, product }) => <article className="preview-list-item" key={`${item.slug}:${item.size}`}><div><Link href={`/products/${item.slug}`}>{product.name}</Link><p>Proposed size: {item.size} · Indicative {formatPrice(product.price)} per item</p></div><div className="preview-quantity"><label htmlFor={`bag-${item.slug}-${item.size}`}>Demo quantity</label><select id={`bag-${item.slug}-${item.size}`} value={item.quantity} onChange={event => quantity(item.slug, item.size, Number(event.target.value))}>{Array.from({ length: 10 }, (_, n) => <option key={n + 1} value={n + 1}>{n + 1}</option>)}</select><button type="button" onClick={() => quantity(item.slug, item.size, 0)}>Remove</button></div></article>)}</div> : <p className="notice">Your demo bag is empty. Select a proposed size on a product page to add an idea.</p>}{missing > 0 && <p className="notice">{missing} saved entry/entries are no longer available in the preview and are excluded from the estimate.</p>}{available.length > 0 && <p className="preview-estimate">Illustrative total: {formatPrice(indicativeTotal)}. This is not a payable amount or a price quote.</p>}<p className="notice">Preview only. No reservation, delivery estimate, payment or checkout is available.</p></section>;
}
