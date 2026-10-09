"use client";
import Link from "next/link";
import { useState } from "react";
import { FashionPlaceholder } from "./fashion-placeholder";
import { ProductMedia } from "./product-media";
import { formatPrice, type Product } from "@/lib/catalog";
import { usePreviewStore } from "./preview-store";

type Item = { slug: string; name: string; sizes: readonly string[] };

export function SavePreview({ slug, name }: Pick<Item, "slug" | "name">) {
  const { ready, state, save } = usePreviewStore();
  const saved = ready && state.wishlist.includes(slug);
  return (
    <button className="preview-save" type="button" disabled={!ready} aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} wishlist`}
      onClick={() => save(slug)}>
      {saved ? "♥ Saved" : "♡ Save"}
    </button>
  );
}

export function ComparePreview({ slug, name }: Pick<Item, "slug" | "name">) {
  const { ready, comparison, compare } = usePreviewStore();
  const selected = comparison.includes(slug);
  const full = comparison.length >= 3 && !selected;
  return (
    <button className="preview-save" type="button" disabled={!ready || full} aria-pressed={selected}
      aria-label={`${selected ? "Remove" : "Add"} ${name} ${selected ? "from" : "to"} comparison`}
      title={full ? "Remove a style from comparison before adding another" : undefined}
      onClick={() => compare(slug)}>
      {selected ? "✓ Comparing" : "Compare"}
    </button>
  );
}

export function ComparisonNotice() {
  const { ready, comparison } = usePreviewStore();
  if (!ready || comparison.length === 0) return null;
  return (
    <p className="catalog-result-count" role="status">
      {comparison.length} of 3 styles selected. <Link className="text-link" href="/compare">Compare ↗</Link>
    </p>
  );
}

export function ProductPreviewActions({ slug, name, sizes }: Item) {
  const { ready, state, add, save } = usePreviewStore();
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");
  const saved = ready && state.wishlist.includes(slug);
  const selectedSize = sizes.includes(size) ? size : "";

  return (
    <div className="preview-product-actions">
      <label htmlFor="preview-size">Select size</label>
      <select id="preview-size" value={size}
        onChange={event => { setSize(event.target.value); setMessage(""); }}
        disabled={!ready || sizes.length === 0}>
        <option value="">Choose a size</option>
        {sizes.map(option => <option key={option} value={option}>{option}</option>)}
      </select>

      <div className="preview-action-row">
        <button type="button" className="pa-add-btn" disabled={!ready || !selectedSize}
          onClick={() => {
            if (!selectedSize) return;
            add(slug, selectedSize);
            setMessage(`${name} (Size ${selectedSize}) added to your bag.`);
          }}>
          Add to bag
        </button>
        <button type="button" className="pa-save-btn" disabled={!ready} aria-pressed={saved}
          onClick={() => save(slug)}>
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
        <ComparePreview slug={slug} name={name} />
      </div>
      <ComparisonNotice />
      {message && <p className="pa-message" role="status" aria-live="polite">{message} <Link href="/bag" className="text-link">View bag ↗</Link></p>}
    </div>
  );
}

export function WishlistView({ products }: { products: Product[] }) {
  const { ready, state, save } = usePreviewStore();
  if (!ready) return <p className="notice" role="status">Loading your saved styles…</p>;
  const catalog = new Map(products.map(product => [product.slug, product]));
  const available = state.wishlist.flatMap(slug => { const product = catalog.get(slug); return product ? [product] : []; });

  return (
    <section aria-label="Saved styles">
      <p className="catalog-result-count">{available.length} saved {available.length === 1 ? "style" : "styles"}</p>
      {available.length ? (
        <div className="catalog-grid">
          {available.map(product => (
            <article className="catalog-card" key={product.slug}>
              <Link href={`/products/${product.slug}`} className="catalog-card-media">
                <ProductMedia src={product.image} alt={product.name} tone={product.tone} />
              </Link>
              <div className="catalog-card-copy">
                <p className="catalog-card-overline">{product.color}</p>
                <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                <p className="catalog-price">{formatPrice(product.price)}
                  {product.mrp > product.price && <del>{formatPrice(product.mrp)}</del>}</p>
                <button type="button" className="preview-save" onClick={() => save(product.slug)}
                  aria-label={`Remove ${product.name} from saved styles`}>Remove</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="notice">No saved styles yet. <Link href="/shop" className="text-link">Browse the collection ↗</Link></p>
      )}
    </section>
  );
}

export function BagView({ products }: { products: Product[] }) {
  const { ready, state, quantity } = usePreviewStore();
  if (!ready) return <p className="notice" role="status">Loading your bag…</p>;
  const catalog = new Map(products.map(product => [product.slug, product]));
  const available = state.bag.flatMap(item => {
    const product = catalog.get(item.slug);
    return product && product.sizes.includes(item.size) ? [{ item, product }] : [];
  });
  const colourLabel = (item: { color: string }, product: { color: string }) => item.color || product.color;
  const itemCount = available.reduce((sum, { item }) => sum + item.quantity, 0);
  // Prices from getPreviewProducts() are in rupees. Free shipping over ₹2,000, else ₹99.
  const subtotal  = available.reduce((total, { item, product }) => total + item.quantity * product.price, 0);
  const shipping  = subtotal >= 2000 ? 0 : 99;
  const total     = subtotal + shipping;

  return (
    <section aria-label="Shopping bag" className="bag-view">
      {available.length ? (
        <div className="bag-layout">
          <div className="bag-items">
            <p className="catalog-result-count">{itemCount} {itemCount === 1 ? "item" : "items"} in your bag</p>
            {available.map(({ item, product }) => (
              <article className="bag-item" key={`${item.slug}:${item.color}:${item.size}`}>
                <div className="bag-item-art">
                  <ProductMedia
                    src={product.colorImages?.[item.color] ?? product.image}
                    alt={product.name}
                    tone={product.tone}
                  />
                </div>
                <div className="bag-item-info">
                  <Link href={`/products/${item.slug}`} className="bag-item-name">{product.name}</Link>
                  <p className="bag-item-meta">{colourLabel(item, product)} · Size {item.size}</p>
                  <p className="bag-item-price">{formatPrice(product.price)}</p>
                </div>
                <div className="bag-item-controls">
                  <label htmlFor={`bag-${item.slug}-${item.color}-${item.size}`} className="sr-only">Quantity</label>
                  <select id={`bag-${item.slug}-${item.color}-${item.size}`} value={item.quantity}
                    onChange={event => quantity(item.slug, item.size, item.color, Number(event.target.value))}>
                    {Array.from({ length: 10 }, (_, n) => <option key={n + 1} value={n + 1}>{n + 1}</option>)}
                  </select>
                  <button type="button" className="bag-remove"
                    onClick={() => quantity(item.slug, item.size, item.color, 0)}
                    aria-label={`Remove ${product.name}, ${colourLabel(item, product)}, size ${item.size}`}>Remove</button>
                </div>
              </article>
            ))}
          </div>

          <aside className="bag-summary">
            <h2 className="serif">Order summary</h2>
            <div className="bag-summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="bag-summary-row"><span>Shipping</span><span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span></div>
            <div className="bag-summary-row bag-summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
            {shipping > 0 && (
              <p className="bag-shipping-hint">Add {formatPrice(2000 - subtotal)} more for free shipping.</p>
            )}
            <Link href="/checkout" className="button bag-checkout-btn">Proceed to checkout</Link>
            <Link href="/shop" className="text-link bag-continue">Continue shopping ↗</Link>
          </aside>
        </div>
      ) : (
        <div className="bag-empty">
          <span className="bag-empty-icon" aria-hidden="true">🛍️</span>
          <h2 className="serif">Your bag is empty</h2>
          <p>Add styles you love to your bag and they&apos;ll appear here.</p>
          <Link href="/shop" className="button" style={{ marginTop: "1rem" }}>Start shopping</Link>
        </div>
      )}
    </section>
  );
}

export function ComparisonView({ products }: { products: Product[] }) {
  const { ready, comparison, compare } = usePreviewStore();
  if (!ready) return <p className="notice" role="status">Loading comparison…</p>;
  const catalog = new Map(products.map(product => [product.slug, product]));
  const available = comparison.flatMap(slug => { const product = catalog.get(slug); return product ? [product] : []; });

  return (
    <section aria-label="Compare styles">
      <p className="catalog-result-count">{available.length} of 3 styles</p>
      {available.length ? (
        <div className="comparison-grid">
          {available.map(product => (
            <article className="comparison-item" key={product.slug}>
              <ProductMedia src={product.image} alt={product.name} tone={product.tone} />
              <h2 className="serif"><Link href={`/products/${product.slug}`}>{product.name}</Link></h2>
              <dl>
                <div><dt>Category</dt><dd>{product.category}</dd></div>
                <div><dt>Colour</dt><dd>{product.color}</dd></div>
                <div><dt>Fabric</dt><dd>{product.fabric}</dd></div>
                <div><dt>Sizes</dt><dd>{product.sizes.join(" · ") || "—"}</dd></div>
                <div><dt>Price</dt><dd>{formatPrice(product.price)}</dd></div>
              </dl>
              <p>{product.description}</p>
              <button type="button" onClick={() => compare(product.slug)}
                aria-label={`Remove ${product.name} from comparison`}>Remove</button>
            </article>
          ))}
        </div>
      ) : (
        <p className="notice">No styles to compare. <Link href="/shop" className="text-link">Browse the collection ↗</Link></p>
      )}
    </section>
  );
}
