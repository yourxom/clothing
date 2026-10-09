import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdminReturnActions } from "@/components/admin-return-actions";

export const metadata: Metadata = { title: "Returns — Admin" };
export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "#b77b00", APPROVED: "#1a6aab", REJECTED: "#8b3344",
  RECEIVED: "#3a7d44", REFUNDED: "#3a7d44",
};

export default async function AdminReturnsPage() {
  const returns = await db.returnRequest.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="admin-page">
      <h1 className="admin-heading">
        Returns <span className="admin-count">({returns.length})</span>
      </h1>

      {returns.length === 0 ? (
        <p className="notice">No return requests yet.</p>
      ) : (
        <div className="admin-review-list">
          {returns.map(r => (
            <article key={r.id} className="admin-review-card">
              <div className="admin-review-meta">
                <strong>{r.orderNumber}</strong>
                <span className="admin-role-badge" style={{ color: STATUS_COLOR[r.status], borderColor: STATUS_COLOR[r.status] }}>
                  {r.status}
                </span>
                <span className="muted" style={{ fontSize: ".75rem" }}>
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <p style={{ fontSize: ".85rem", color: "var(--muted)", margin: ".5rem 0" }}>
                <strong style={{ color: "var(--ink)" }}>Reason:</strong> {r.reason}
              </p>
              {r.adminNote && (
                <p style={{ fontSize: ".8rem", color: "var(--muted)", margin: ".3rem 0" }}>
                  <strong style={{ color: "var(--ink)" }}>Note:</strong> {r.adminNote}
                </p>
              )}
              <AdminReturnActions returnId={r.id} currentStatus={r.status} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
