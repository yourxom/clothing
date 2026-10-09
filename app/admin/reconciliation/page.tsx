import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { AdminReconciliationActions } from "@/components/admin-reconciliation-actions";

export const metadata: Metadata = { title: "Payment Reconciliation — Admin" };
export const dynamic = "force-dynamic";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p / 100);

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  MATCHED:         { bg: "#eafbf1", color: "#2e7d32" },
  UNMATCHED:       { bg: "#fff0f0", color: "#c0392b" },
  DUPLICATE:       { bg: "#fff0f0", color: "#c0392b" },
  AMOUNT_MISMATCH: { bg: "#fffbee", color: "#b77b00" },
  MANUAL_REVIEW:   { bg: "#fffbee", color: "#b77b00" },
  RESOLVED:        { bg: "#f5f5f0", color: "#706b62" },
  UNKNOWN:         { bg: "#f5f5f0", color: "#706b62" },
};

export default async function AdminReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const sp       = await searchParams;
  const provider = sp.provider ?? "";
  const status   = sp.status ?? "";
  const q        = sp.q ?? "";
  const page     = Math.max(1, parseInt(sp.page ?? "1", 10));
  const PAGE     = 50;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (provider) where.provider = provider.toLowerCase();
  if (status)   where.reconciliationStatus = status;
  if (q) {
    where.OR = [
      { providerTransactionId: { contains: q } },
      { rrn:              { contains: q } },
      { utr:              { contains: q } },
      { merchantReference:{ contains: q } },
      { orderId:          { contains: q } },
    ];
  }

  const [total, transactions, stats] = await Promise.all([
    db.paymentTransaction.count({ where }),
    db.paymentTransaction.findMany({
      where, orderBy: { receivedAt: "desc" },
      skip: (page - 1) * PAGE, take: PAGE,
      include: {
        bankAccount: { select: { displayName: true, provider: true, merchantVpa: true } },
        payment:     { select: { status: true, expectedAmountPaise: true, merchantReference: true } },
      },
    }),
    Promise.all([
      db.paymentTransaction.count({ where: { reconciliationStatus: "MATCHED" } }),
      db.paymentTransaction.count({ where: { reconciliationStatus: "UNMATCHED" } }),
      db.paymentTransaction.count({ where: { reconciliationStatus: "MANUAL_REVIEW" } }),
      db.paymentTransaction.count({ where: { reconciliationStatus: "AMOUNT_MISMATCH" } }),
      db.paymentTransaction.count({ where: { reconciliationStatus: "DUPLICATE" } }),
    ]),
  ]);

  const [sMatched, sUnmatched, sReview, sAmountMismatch, sDuplicate] = stats;
  const pages = Math.ceil(total / PAGE);

  function filterLink(extra: Record<string, string>) {
    const p = new URLSearchParams({ provider, status, q, page: "1", ...extra });
    return `/admin/reconciliation?${p.toString()}`;
  }

  return (
    <div className="admin-page">
      <div className="admin-heading-row">
        <h1 className="admin-heading">Payment Reconciliation</h1>
        <Link href="/admin/payment-accounts" className="button button-outline" style={{ fontSize: ".78rem" }}>
          Bank accounts
        </Link>
      </div>

      {/* Stat cards */}
      <div className="admin-stats-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Matched",        value: sMatched,       color: "#2e7d32" },
          { label: "Unmatched",      value: sUnmatched,     color: "#c0392b" },
          { label: "Manual Review",  value: sReview,        color: "#b77b00" },
          { label: "Amt Mismatch",   value: sAmountMismatch,color: "#c0392b" },
          { label: "Duplicate",      value: sDuplicate,     color: "#c0392b" },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <span className="admin-stat-label">{s.label}</span>
            <span className="admin-stat-value" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/reconciliation" className="admin-filter-bar" style={{ marginBottom: "1rem" }}>
        <input name="q" defaultValue={q} placeholder="Txn ID, RRN, UTR, order, reference…"
          className="admin-search-input" style={{ flex: 1 }} />
        <select name="provider" defaultValue={provider} className="admin-select">
          <option value="">All banks</option>
          {["axis","icici","hdfc","kotak","bob"].map(b => (
            <option key={b} value={b}>{b.toUpperCase()}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="admin-select">
          <option value="">All statuses</option>
          {["MATCHED","UNMATCHED","DUPLICATE","AMOUNT_MISMATCH","MANUAL_REVIEW","RESOLVED","UNKNOWN"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g," ")}</option>
          ))}
        </select>
        <button type="submit" className="button" style={{ fontSize: ".78rem" }}>Filter</button>
        <Link href="/admin/reconciliation" className="button button-outline" style={{ fontSize: ".78rem" }}>Reset</Link>
      </form>

      {/* Quick pills */}
      <div className="admin-pill-bar" style={{ marginBottom: "1.2rem" }}>
        {[
          { label: "All",           href: filterLink({ status: "", provider: "" }) },
          { label: "Manual Review", href: filterLink({ status: "MANUAL_REVIEW" }) },
          { label: "Unmatched",     href: filterLink({ status: "UNMATCHED" }) },
          { label: "Amt Mismatch",  href: filterLink({ status: "AMOUNT_MISMATCH" }) },
          { label: "Duplicate",     href: filterLink({ status: "DUPLICATE" }) },
          { label: "Matched",       href: filterLink({ status: "MATCHED" }) },
        ].map(p => <Link key={p.label} href={p.href} className="admin-pill">{p.label}</Link>)}
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Bank</th>
              <th>Provider Txn ID</th>
              <th>RRN / UTR</th>
              <th>Our Reference</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Recon</th>
              <th>Received</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                No transactions found.
              </td></tr>
            )}
            {transactions.map(t => {
              const style = STATUS_STYLES[t.reconciliationStatus] ?? STATUS_STYLES.UNKNOWN;
              return (
                <tr key={t.id}>
                  <td style={{ fontSize: ".8rem" }}>
                    <strong>{t.provider.toUpperCase()}</strong>
                    {t.bankAccount && (
                      <span style={{ display: "block", fontSize: ".7rem", color: "var(--muted)" }}>
                        {t.bankAccount.merchantVpa}
                      </span>
                    )}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: ".75rem" }}>
                    {t.providerTransactionId ?? "—"}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: ".75rem" }}>
                    <span>{t.rrn ?? "—"}</span>
                    {t.utr && t.utr !== t.rrn && (
                      <span style={{ display: "block", color: "var(--muted)" }}>{t.utr}</span>
                    )}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: ".75rem" }}>
                    {t.merchantReference ?? "—"}
                    {t.orderId && (
                      <Link href={`/admin/orders/${t.orderId}`}
                        style={{ display: "block", fontSize: ".7rem", color: "var(--accent)" }}>
                        View order ↗
                      </Link>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmt(t.amountPaise)}</td>
                  <td>
                    <span style={{ fontSize: ".72rem", fontWeight: 600, color: t.status === "SUCCESS" ? "#2e7d32" : t.status === "FAILURE" ? "#c0392b" : "#b77b00" }}>
                      {t.status}
                    </span>
                    <span style={{ display: "block", fontSize: ".7rem", color: "var(--muted)" }}>
                      {t.source}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "inline-block", padding: ".2rem .5rem", borderRadius: "20px", fontSize: ".7rem", fontWeight: 600, background: style.bg, color: style.color }}>
                      {t.reconciliationStatus.replace(/_/g, " ")}
                    </span>
                    {t.reconciliationNote && (
                      <span style={{ display: "block", fontSize: ".68rem", color: "var(--muted)", marginTop: ".2rem" }}>
                        {t.reconciliationNote}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: ".74rem", color: "var(--muted)" }}>
                    {new Date(t.receivedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    {["MANUAL_REVIEW","UNMATCHED","AMOUNT_MISMATCH","DUPLICATE"].includes(t.reconciliationStatus) && (
                      <AdminReconciliationActions txId={t.id} />
                    )}
                    {t.reconciliationStatus === "RESOLVED" && (
                      <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>Resolved</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
