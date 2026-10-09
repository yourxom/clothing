import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { AdminPaymentActions } from "@/components/admin-payment-actions";

export const metadata: Metadata = { title: "Payments — Admin" };
export const dynamic = "force-dynamic";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p / 100);

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending", UNDER_REVIEW: "Under Review", PAID: "Paid",
  FAILED: "Failed", REJECTED: "Rejected", EXPIRED: "Expired",
  REFUNDED: "Refunded", PARTIALLY_REFUNDED: "Part. Refunded",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const sp     = await searchParams;
  const method = sp.method ?? "";
  const status = sp.status ?? "";
  const q      = sp.q ?? "";
  const page   = Math.max(1, parseInt(sp.page ?? "1", 10));
  const PAGE_SIZE = 25;

  // Build where clause.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (method) where.paymentMethod = method;
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { order: { orderNumber: { contains: q } } },
      { utr:   { contains: q } },
      { providerPaymentId: { contains: q } },
      { order: { user: { email: { contains: q } } } },
    ];
  }

  const [total, payments, stats] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      include: {
        order: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    Promise.all([
      db.payment.count(),
      db.payment.count({ where: { status: "PAID" } }),
      db.payment.count({ where: { status: "UNDER_REVIEW" } }),
      db.payment.count({ where: { status: "FAILED" } }),
      db.payment.count({ where: { status: "REJECTED" } }),
      db.payment.count({ where: { status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] } } }),
    ]),
  ]);

  const [sTotal, sPaid, sReview, sFailed, sRejected, sRefunded] = stats;
  const pages = Math.ceil(total / PAGE_SIZE);

  function filterLink(extra: Record<string, string>) {
    const p = new URLSearchParams({ method, status, q, page: "1", ...extra });
    return `/admin/payments?${p.toString()}`;
  }

  return (
    <div className="admin-page">
      <div className="admin-heading-row">
        <h1 className="admin-heading">Payments</h1>
        <Link href="/admin/settings/payments" className="button button-outline" style={{ fontSize: ".78rem" }}>
          Payment settings
        </Link>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="admin-stats-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Total",          value: sTotal,   color: "" },
          { label: "Paid",           value: sPaid,    color: "var(--green, #2e7d32)" },
          { label: "Under Review",   value: sReview,  color: "var(--amber, #b77b00)" },
          { label: "Failed",         value: sFailed,  color: "var(--red, #c0392b)" },
          { label: "Rejected",       value: sRejected,color: "var(--red, #c0392b)" },
          { label: "Refunded",       value: sRefunded,color: "" },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <span className="admin-stat-label">{s.label}</span>
            <span className="admin-stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <form method="GET" action="/admin/payments" className="admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <input name="q" defaultValue={q} placeholder="Search order, UTR, email…"
          className="admin-search-input" style={{ flex: 1, minWidth: "180px" }} />
        <select name="method" defaultValue={method} className="admin-select">
          <option value="">All methods</option>
          <option value="MERCHANT_UPI">Merchant UPI</option>
          <option value="PERSONAL_UPI">Personal UPI</option>
        </select>
        <select name="status" defaultValue={status} className="admin-select">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="button" style={{ fontSize: ".78rem" }}>Filter</button>
        <Link href="/admin/payments" className="button button-outline" style={{ fontSize: ".78rem" }}>Reset</Link>
      </form>

      {/* ── Quick-filter pill bar ────────────────────────────────── */}
      <div className="admin-pill-bar" style={{ marginBottom: "1.2rem" }}>
        {[
          { label: "All",           href: filterLink({ status: "", method: "" }) },
          { label: "Under Review",  href: filterLink({ status: "UNDER_REVIEW", method: "PERSONAL_UPI" }) },
          { label: "Paid",          href: filterLink({ status: "PAID" }) },
          { label: "Pending",       href: filterLink({ status: "PENDING_PAYMENT" }) },
          { label: "Rejected",      href: filterLink({ status: "REJECTED" }) },
          { label: "Merchant UPI",  href: filterLink({ method: "MERCHANT_UPI", status: "" }) },
          { label: "Personal UPI",  href: filterLink({ method: "PERSONAL_UPI", status: "" }) },
        ].map(p => (
          <Link key={p.label} href={p.href} className="admin-pill">{p.label}</Link>
        ))}
      </div>

      {/* ── Payments table ──────────────────────────────────────── */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>UTR / Ref</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                No payments found.
              </td></tr>
            )}
            {payments.map(p => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/orders/${p.orderId}`} className="text-link">
                    #{p.order.orderNumber}
                  </Link>
                </td>
                <td>
                  <span style={{ fontSize: ".8rem" }}>{p.order.user?.name ?? "Guest"}</span>
                  <br />
                  <span style={{ fontSize: ".73rem", color: "var(--muted)" }}>{p.order.user?.email ?? ""}</span>
                </td>
                <td style={{ fontSize: ".78rem" }}>
                  {p.paymentMethod === "MERCHANT_UPI" ? "Merchant UPI" : "Personal UPI"}
                </td>
                <td style={{ fontWeight: 600 }}>{fmt(p.expectedAmountPaise)}</td>
                <td>
                  <span className={`payment-status payment-status--${p.status.toLowerCase().replace(/_/g, "-")}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                  {p.possibleDuplicate && (
                    <span className="payment-dup-warning" title="This UTR may already have been used">⚠ Possible duplicate</span>
                  )}
                </td>
                <td style={{ fontSize: ".78rem" }}>
                  <span style={{ fontFamily: "monospace", display: "block" }}>{p.utr ?? p.providerPaymentId ?? "—"}</span>
                  {(p as any).payerName && (
                    <span style={{ fontSize: ".72rem", color: "var(--muted)", display: "block", marginTop: ".15rem" }}>
                      Paid by: <strong>{(p as any).payerName}</strong>
                    </span>
                  )}
                </td>
                <td style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                  {p.submittedAt ? new Date(p.submittedAt).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                </td>
                <td>
                  {p.paymentMethod === "PERSONAL_UPI" && ["UNDER_REVIEW", "PENDING_PAYMENT"].includes(p.status) && (
                    <AdminPaymentActions
                      paymentId={p.id}
                      orderNumber={p.order.orderNumber}
                      amountPaise={p.expectedAmountPaise}
                      utr={p.utr ?? ""}
                      payerName={(p as any).payerName}
                      screenshotUrl={p.screenshotUrl}
                      possibleDuplicate={p.possibleDuplicate}
                    />
                  )}
                  {p.status === "PAID" && (
                    <span style={{ fontSize: ".75rem", color: "var(--green, #2e7d32)" }}>
                      ✓ {p.verificationType === "AUTOMATIC" ? "Auto-verified" : "Admin-verified"}
                    </span>
                  )}
                  {p.status === "REJECTED" && (
                    <span style={{ fontSize: ".75rem", color: "var(--muted)" }} title={p.rejectionReason ?? ""}>
                      Rejected
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="admin-pagination">
          {page > 1 && <Link href={filterLink({ page: String(page - 1) })} className="admin-page-btn">← Prev</Link>}
          <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>Page {page} of {pages}</span>
          {page < pages && <Link href={filterLink({ page: String(page + 1) })} className="admin-page-btn">Next →</Link>}
        </div>
      )}
    </div>
  );
}
