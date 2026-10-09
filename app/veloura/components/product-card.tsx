"use client";
import Link from "next/link";
import type { VProduct } from "../data";
import { inr } from "../data";
import { FashionImage } from "./fashion-image";
import { RatingStars } from "./ui";
import { usePreviewStore } from "@/components/preview-store";

export function ProductCard({ product }: { product: VProduct }) {
  const { ready, state, save } = usePreviewStore();
  const wished = ready && state.wishlist.includes(product.slug);

  function toggleWish(e: React.MouseEvent) {
    // Keep the click inside the wishlist button — don't follow the card link.
    e.preventDefault();
    e.stopPropagation();
    save(product.slug);
  }

  return (
    <article className="vl-card">
      {/* The whole card is a link to the product page. */}
      <Link href={product.href} className="vl-card__link" aria-label={`View ${product.name}`}>
        <div className="vl-card__media">
          {product.badge && <span className="vl-card__badge">{product.badge}</span>}
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={`${product.name} — AURELIA`} loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <FashionImage tone={product.tone} pose={product.pose} uid={product.id} alt={`${product.name} — AURELIA`} />
          )}
        </div>

        <div className="vl-card__info">
          <h3 className="vl-card__name">{product.name}</h3>
          <div className="vl-card__price">
            <b>{inr(product.price)}</b>
            {product.originalPrice && <del>{inr(product.originalPrice)}</del>}
          </div>
          <div className="vl-card__rating">
            <RatingStars rating={product.rating} />
            <span>{product.rating.toFixed(1)} ({product.reviews})</span>
          </div>
          <div className="vl-card__colour">
            <span className="vl-swatches" aria-label={`${product.colors.length} colour${product.colors.length !== 1 ? "s" : ""} available`}>
              {product.colors.map((c) => (
                <span key={c.name} className="vl-swatch" style={{ background: c.hex }} title={c.name} />
              ))}
            </span>
            {product.colors.length > 1 && (
              <span className="vl-card__colour-name">{product.colors.length} colours</span>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist stays on top of the card link. */}
      <button
        type="button"
        className={`vl-wish${wished ? " vl-wish--active" : ""}`}
        aria-pressed={wished}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        onClick={toggleWish}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </button>
    </article>
  );
}
