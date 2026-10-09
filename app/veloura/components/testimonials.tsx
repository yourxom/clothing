"use client";
import { testimonials } from "../data";
import { RatingStars } from "./ui";

export function TestimonialsSection() {
  const count = testimonials.length;
  const average = count ? testimonials.reduce((s, t) => s + t.rating, 0) / count : 0;

  // Count reviews per star (5 → 1) for the breakdown bars.
  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    n: testimonials.filter(t => Math.round(t.rating) === star).length,
  }));
  const maxN = Math.max(1, ...breakdown.map(b => b.n));

  return (
    <section className="vl-section vl-container vl-reviews" aria-labelledby="reviews-h">
      <div className="vl-section-head">
        <div className="vl-section-head__title">
          <h2 id="reviews-h">What Our Customers Say</h2>
          <span className="vl-section-head__underline" aria-hidden="true" />
        </div>
      </div>

      {/* Summary row */}
      <div className="vl-reviews-summary">
        <div className="vl-reviews-score">
          <span className="vl-reviews-label">Customer reviews</span>
          <div className="vl-reviews-avg">
            <strong>{average.toFixed(1)}</strong>
            <span className="vl-reviews-outof">/ 5</span>
          </div>
          <RatingStars rating={Math.round(average)} size={18} />
          <span className="vl-reviews-count">{count} review{count !== 1 ? "s" : ""}</span>
        </div>

        <ul className="vl-reviews-bars">
          {breakdown.map(({ star, n }) => (
            <li key={star}>
              <span className="vl-reviews-bar-label">{star} <span className="vl-reviews-star" aria-hidden="true">★</span></span>
              <span className="vl-reviews-bar-track">
                <span className="vl-reviews-bar-fill" style={{ width: `${(n / maxN) * 100}%` }} />
              </span>
              <span className="vl-reviews-bar-n">{n}</span>
            </li>
          ))}
        </ul>

        <div className="vl-reviews-cta">
          <a href="#" className="vl-btn">Write a review</a>
        </div>
      </div>

      {/* Review cards */}
      <div className="vl-reviews-grid">
        {testimonials.map(t => (
          <article key={t.id} className="vl-review-card">
            <div className="vl-review-top">
              <span className="vl-review-stars"><RatingStars rating={t.rating} size={15} /></span>
              <span className="vl-review-date">{t.date}</span>
            </div>
            <div className="vl-review-author">
              {t.name} <span aria-hidden="true">🇮🇳</span>
            </div>
            {t.title && <p className="vl-review-title">{t.title}</p>}
            <p className="vl-review-body">{t.quote}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
