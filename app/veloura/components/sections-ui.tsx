import Link from "next/link";
import type { VProduct } from "../data";
import { ProductCard } from "./product-card";

/* ── Section header (serif title + coral underline + View All) ──── */
export function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref?: string }) {
  return (
    <div className="vl-section-head">
      <div className="vl-section-head__title">
        <h2>{title}</h2>
        <span className="vl-section-head__underline" aria-hidden="true" />
      </div>
      {viewAllHref && (
        <Link className="vl-viewall" href={viewAllHref}>
          View All →
        </Link>
      )}
    </div>
  );
}

/* ── Product grid ───────────────────────────────────────────────── */
export function ProductGrid({ products }: { products: VProduct[] }) {
  return (
    <div className="vl-prod-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
