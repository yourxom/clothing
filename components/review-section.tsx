"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type Review = {
  id: string; rating: number; title: string | null; body: string;
  verified: boolean; createdAt: string;
  user: { name: string | null };
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating" role={onChange ? "group" : "img"}
      aria-label={onChange ? "Select rating" : `${value} out of 5 stars`}>
      {[1,2,3,4,5].map(star => (
        <button
          key={star} type="button"
          className={`star-btn${(hover || value) >= star ? " star-btn--active" : ""}`}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          disabled={!onChange}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="review-card">
      <div className="review-card-header">
        <StarRating value={review.rating} />
        {review.verified && (
          <span className="review-verified" title="Verified purchase">✓ Verified purchase</span>
        )}
      </div>
      {review.title && <h4 className="review-title">{review.title}</h4>}
      <p className="review-body">{review.body}</p>
      <footer className="review-footer">
        <span>{review.user.name ?? "AURELIA customer"}</span>
        <span className="muted">
          {new Date(review.createdAt).toLocaleDateString("en-IN",
            { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </footer>
    </article>
  );
}

function ReviewForm({ productSlug, onSubmitted }: { productSlug: string; onSubmitted: () => void }) {
  const [rating,  setRating]  = useState(0);
  const [title,   setTitle]   = useState("");
  const [body,    setBody]    = useState("");
  const [status,  setStatus]  = useState<"idle"|"submitting"|"done"|"error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setStatus("error"); setMessage("Please select a rating."); return; }
    if (body.trim().length < 10) { setStatus("error"); setMessage("Review must be at least 10 characters."); return; }
    setStatus("submitting");
    const res  = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug, rating, title: title.trim() || undefined, body: body.trim() }),
    });
    const json = await res.json() as { ok?: boolean; message?: string; error?: string };
    if (res.ok) {
      setStatus("done");
      setMessage(json.message ?? "Review submitted.");
      onSubmitted();
    } else {
      setStatus("error");
      setMessage(json.error ?? "Could not submit review.");
    }
  }

  if (status === "done") {
    return <p className="newsletter-success" role="status">{message}</p>;
  }

  return (
    <form className="review-form contact-form" onSubmit={handleSubmit} noValidate>
      {status === "error" && <p className="contact-field-error" role="alert">{message}</p>}
      <div className="contact-field">
        <label>Your rating *</label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div className="contact-field">
        <label htmlFor="rev-title">Review title</label>
        <input id="rev-title" type="text" value={title} maxLength={100}
          onChange={e => setTitle(e.target.value)} placeholder="e.g. Beautiful fabric" />
      </div>
      <div className="contact-field">
        <label htmlFor="rev-body">Your review *</label>
        <textarea id="rev-body" rows={4} value={body} maxLength={2000}
          onChange={e => setBody(e.target.value)}
          placeholder="What did you think about the quality, fit, and style?" />
      </div>
      <button type="submit" className="button" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

export function ReviewSection({ productSlug }: { productSlug: string }) {
  const { data: session } = useSession();
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/reviews?product=${encodeURIComponent(productSlug)}`);
    const json = await res.json() as { reviews?: Review[]; averageRating?: number | null; hasReviewed?: boolean };
    setReviews(json.reviews ?? []);
    setAvgRating(json.averageRating ?? null);
    setHasReviewed(Boolean(json.hasReviewed));
    setLoading(false);
  }, [productSlug]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  return (
    <section className="review-section" aria-labelledby="reviews-heading">
      <div className="review-section-header">
        <h2 id="reviews-heading" className="serif">Customer reviews</h2>
        {avgRating !== null && reviews.length > 0 && (
          <div className="review-summary">
            <StarRating value={Math.round(avgRating)} />
            <span>{avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="review-skeleton">
          {[1,2].map(i => <div key={i} className="review-skeleton-item" />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className="notice">
          No reviews yet.{session ? " Be the first to review this style." : " Sign in to leave a review."}
        </p>
      ) : (
        <div className="review-list">
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      {session ? (
        hasReviewed ? (
          <p style={{ marginTop: "1.5rem", fontSize: ".85rem", color: "var(--muted)" }}>
            ✓ You&apos;ve already reviewed this product. Thank you.
          </p>
        ) : showForm ? (
          <div style={{ marginTop: "2rem" }}>
            <h3 className="serif" style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Write a review</h3>
            <ReviewForm productSlug={productSlug} onSubmitted={() => { setShowForm(false); loadReviews(); }} />
          </div>
        ) : (
          <button type="button" className="button button-outline"
            style={{ marginTop: "1.5rem" }}
            onClick={() => setShowForm(true)}>
            Write a review
          </button>
        )
      ) : (
        <p style={{ marginTop: "1.5rem", fontSize: ".85rem", color: "var(--muted)" }}>
          <a href="/login" style={{ fontWeight: 600, borderBottom: "1px solid currentColor" }}>Sign in</a>
          {" "}to leave a review.
        </p>
      )}
    </section>
  );
}
