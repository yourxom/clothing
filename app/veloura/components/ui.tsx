"use client";
import { useId, useState } from "react";

/* ── Star icons ─────────────────────────────────────────────────── */
function Star({ fill }: { fill: "full" | "half" | "empty" }) {
  // useId gives a stable, SSR-safe id (no Math.random hydration mismatch).
  const rawId = useId();
  const id = `star${rawId.replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {fill === "half" && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2l2.9 6.2 6.8.6-5.1 4.5 1.5 6.7L12 17l-6 3 1.5-6.7L2.4 8.8l6.8-.6z"
        fill={fill === "full" ? "currentColor" : fill === "half" ? `url(#${id})` : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

export function RatingStars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="vl-stars" style={{ fontSize: size }} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} fill={rating >= i ? "full" : rating >= i - 0.5 ? "half" : "empty"} />
      ))}
    </span>
  );
}

/* ── Wishlist button ────────────────────────────────────────────── */
export function WishlistButton({ productName }: { productName: string }) {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      className={`vl-wish${active ? " vl-wish--active" : ""}`}
      aria-pressed={active}
      aria-label={active ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      onClick={(e) => { e.preventDefault(); setActive((v) => !v); }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
