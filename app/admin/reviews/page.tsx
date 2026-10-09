import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdminReviewActions } from "@/components/admin-actions";

export const metadata: Metadata = { title: "Reviews — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, slug: true } },
      user:    { select: { name: true, email: true } },
    },
  });

  const pending  = reviews.filter(r => !r.approved);
  const approved = reviews.filter(r =>  r.approved);

  return (
    <div className="admin-page">
      <h1 className="admin-heading">
        Reviews <span className="admin-count">({reviews.length})</span>
      </h1>

      {pending.length > 0 && (
        <>
          <h2 className="admin-section-title" style={{ color: "#7a5c00" }}>
            Pending approval ({pending.length})
          </h2>
          <div className="admin-review-list">
            {pending.map(r => (
              <article key={r.id} className="admin-review-card admin-review-card--pending">
                <div className="admin-review-meta">
                  <strong>{r.user.name ?? r.user.email}</strong>
                  <span className="muted">on</span>
                  <strong>{r.product.name}</strong>
                  <span className="admin-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  {r.verified && <span className="review-verified">✓ Verified</span>}
                </div>
                {r.title && <p><strong>{r.title}</strong></p>}
                <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>{r.body}</p>
                <AdminReviewActions reviewId={r.id} approved={r.approved} />
              </article>
            ))}
          </div>
        </>
      )}

      {approved.length > 0 && (
        <>
          <h2 className="admin-section-title" style={{ marginTop: "2rem" }}>
            Approved ({approved.length})
          </h2>
          <div className="admin-review-list">
            {approved.map(r => (
              <article key={r.id} className="admin-review-card">
                <div className="admin-review-meta">
                  <strong>{r.user.name ?? r.user.email}</strong>
                  <span className="muted">on</span>
                  <strong>{r.product.name}</strong>
                  <span className="admin-review-stars">{"★".repeat(r.rating)}</span>
                </div>
                <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>{r.body}</p>
                <AdminReviewActions reviewId={r.id} approved={r.approved} />
              </article>
            ))}
          </div>
        </>
      )}

      {reviews.length === 0 && <p className="notice">No reviews yet.</p>}
    </div>
  );
}
