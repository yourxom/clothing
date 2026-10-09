"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductMedia } from "@/components/product-media";
import { formatPrice, type Tone } from "@/lib/catalog";

const KEY       = "aurelia-recently-viewed-v1";
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  function get(): string[] {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    } catch { return []; }
  }

  function push(slug: string) {
    try {
      const current = get().filter(s => s !== slug);
      window.localStorage.setItem(KEY, JSON.stringify([slug, ...current].slice(0, MAX_ITEMS)));
    } catch { /* storage unavailable */ }
  }

  return { get, push };
}

// Component to track a viewed product — mount it on the product page
export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const raw     = window.localStorage.getItem(KEY);
      const current = (raw ? JSON.parse(raw) : []) as string[];
      const updated = [slug, ...current.filter((s: string) => s !== slug)].slice(0, MAX_ITEMS);
      window.localStorage.setItem(KEY, JSON.stringify(updated));
    } catch { /* noop */ }
  }, [slug]);
  return null;
}

type Slim = {
  slug: string;
  name: string;
  color: string;
  tone: Tone;
  image?: string | null;
  price?: number;
  mrp?: number;
};

export function RecentlyViewedStrip({ currentSlug, products }: { currentSlug: string; products: Slim[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const all = (raw ? JSON.parse(raw) : []) as string[];
      setSlugs(all.filter((s: string) => s !== currentSlug).slice(0, 4));
    } catch { setSlugs([]); }
  }, [currentSlug]);

  const visible = slugs
    .map(slug => products.find(p => p.slug === slug))
    .filter((p): p is Slim => Boolean(p));

  if (visible.length === 0) return null;

  return (
    <section className="recently-viewed" aria-labelledby="rv-heading">
      <div className="catalog-heading">
        <span className="eyebrow">Recently viewed</span>
        <h2 id="rv-heading" className="serif">Styles you&apos;ve explored.</h2>
      </div>
      <div className="rv-grid">
        {visible.map(p => (
          <Link key={p.slug} href={`/products/${p.slug}`} className="rv-card">
            <div className="rv-card-art">
              <ProductMedia src={p.image} alt={p.name} tone={p.tone} />
            </div>
            <p className="rv-card-name">{p.name}</p>
            <p className="rv-card-color muted">{p.color}</p>
            {typeof p.price === "number" && (
              <p className="catalog-price" style={{ margin: "0.25rem 0 0", fontSize: "0.82rem" }}>
                {formatPrice(p.price)}
                {p.mrp && p.mrp > p.price ? (
                  <del style={{ marginLeft: "0.35rem", color: "var(--muted)", fontSize: "0.78em" }}>
                    {formatPrice(p.mrp)}
                  </del>
                ) : null}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
