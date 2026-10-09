"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── Order status update ──────────────────────────────────────────── */
const ORDER_STATUSES = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"] as const;
const PAYMENT_STATUSES = ["PENDING","PAID","FAILED","REFUNDED"] as const;

export function AdminOrderActions({
  orderId, currentStatus, currentPaymentStatus = "PENDING",
}: {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus?: string;
}) {
  const router  = useRouter();
  const [status,  setStatus]  = useState(currentStatus);
  const [payment, setPayment] = useState(currentPaymentStatus);
  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState("");

  const statusChanged  = status !== currentStatus;
  const paymentChanged = payment !== currentPaymentStatus;
  const dirty = statusChanged || paymentChanged;

  async function handleUpdate() {
    setSaving(true);
    setMessage("");
    const payload: Record<string, string> = {};
    if (statusChanged)  payload.status        = status;
    if (paymentChanged) payload.paymentStatus = payment;
    const res  = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setMessage(res.ok ? "Order updated." : "Failed to update.");
    if (res.ok) router.refresh();
  }

  return (
    <div className="admin-status-controls">
      <label className="admin-status-field">
        <span>Status</span>
        <select value={status} onChange={e => setStatus(e.target.value)} className="admin-select">
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="admin-status-field">
        <span>Payment</span>
        <select value={payment} onChange={e => setPayment(e.target.value)} className="admin-select">
          {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <button type="button" className="button admin-status-btn"
        disabled={saving || !dirty} onClick={handleUpdate}>
        {saving ? "Saving…" : "Update order"}
      </button>
      {message && <span className="admin-status-msg">{message}</span>}
    </div>
  );
}

/* ── Review approve / delete ─────────────────────────────────────── */
export function AdminReviewActions({ reviewId, approved }: { reviewId: string; approved: boolean }) {
  const router  = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: !approved }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setBusy(true);
    await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: ".5rem", marginTop: ".6rem" }}>
      <button type="button" className="button" disabled={busy}
        style={{ minHeight: "34px", padding: ".4rem .8rem", fontSize: ".72rem" }}
        onClick={toggle}>
        {approved ? "Unapprove" : "Approve"}
      </button>
      <button type="button" className="button" disabled={busy}
        style={{ minHeight: "34px", padding: ".4rem .8rem", fontSize: ".72rem",
                 background: "#8b3344", borderColor: "#8b3344" }}
        onClick={remove}>
        Delete
      </button>
    </div>
  );
}

/* ── Mark contact message as read ────────────────────────────────── */
export function AdminMarkRead({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);

  async function mark() {
    await fetch(`/api/admin/contacts/${messageId}`, { method: "PATCH" });
    setDone(true);
    router.refresh();
  }

  return (
    <button type="button" disabled={done}
      style={{ fontSize: ".72rem", border: "1px solid var(--accent)", padding: ".25rem .6rem",
               background: "transparent", cursor: "pointer", color: "var(--accent)" }}
      onClick={mark}>
      {done ? "Marked read" : "Mark as read"}
    </button>
  );
}
