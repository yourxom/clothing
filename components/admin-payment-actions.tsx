"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const REJECTION_REASONS = [
  "Payment not received",
  "Incorrect amount",
  "Invalid UTR",
  "Duplicate transaction",
  "Transaction failed",
  "Screenshot/details do not match",
  "Other",
];

export function AdminPaymentActions({
  paymentId, orderNumber, amountPaise, utr, payerName, screenshotUrl, possibleDuplicate,
}: {
  paymentId:       string;
  orderNumber:     string;
  amountPaise:     number;
  utr:             string;
  payerName?:      string | null;
  screenshotUrl:   string | null | undefined;
  possibleDuplicate: boolean;
}) {
  const router = useRouter();
  const [mode,   setMode]   = useState<"idle" | "approve" | "reject">("idle");
  const [reason, setReason] = useState(REJECTION_REASONS[0]);
  const [custom, setCustom] = useState("");
  const [busy,   setBusy]   = useState(false);
  const [msg,    setMsg]    = useState("");

  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amountPaise / 100);

  async function approve() {
    setBusy(true); setMsg("");
    const res  = await fetch(`/api/admin/payments/${paymentId}/approve`, { method: "POST" });
    const json = await res.json() as { ok?: boolean; error?: string };
    setBusy(false);
    if (res.ok && json.ok) { setMsg("Approved ✓"); router.refresh(); }
    else setMsg(json.error ?? "Approval failed.");
  }

  async function reject() {
    const finalReason = reason === "Other" ? custom.trim() : reason;
    if (!finalReason) { setMsg("Please enter a rejection reason."); return; }
    setBusy(true); setMsg("");
    const res  = await fetch(`/api/admin/payments/${paymentId}/reject`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: finalReason }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    setBusy(false);
    if (res.ok && json.ok) { setMsg("Rejected."); router.refresh(); }
    else setMsg(json.error ?? "Rejection failed.");
  }

  if (mode === "idle") {
    return (
      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
        <button type="button" className="button" style={{ fontSize: ".73rem", padding: ".4rem .75rem", background: "var(--green, #2e7d32)" }}
          onClick={() => setMode("approve")}>
          Approve
        </button>
        <button type="button" className="button" style={{ fontSize: ".73rem", padding: ".4rem .75rem", background: "var(--red, #c0392b)" }}
          onClick={() => setMode("reject")}>
          Reject
        </button>
      </div>
    );
  }

  if (mode === "approve") {
    return (
      <div className="payment-confirm-dialog">
        {possibleDuplicate && (
          <p className="payment-dup-alert">
            ⚠ This UTR may already have been used in another approved payment. Verify carefully before approving.
          </p>
        )}
        <p style={{ fontSize: ".82rem", margin: "0 0 .6rem" }}>
          Confirm that <strong>{amount}</strong> has been received for order{" "}
          <strong>#{orderNumber}</strong>?
        </p>
        {utr && <p style={{ fontSize: ".75rem", color: "var(--muted)", margin: "0 0 .4rem" }}>UTR: <strong>{utr}</strong></p>}
        {payerName && <p style={{ fontSize: ".75rem", color: "var(--muted)", margin: "0 0 .4rem" }}>Paid by (A/C Name): <strong>{payerName}</strong></p>}
        {screenshotUrl && (
          <a href={screenshotUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: ".73rem", display: "block", marginBottom: ".5rem", color: "var(--accent)" }}>
            View screenshot ↗
          </a>
        )}
        {msg && <p style={{ fontSize: ".75rem", color: "var(--accent)", margin: "0 0 .4rem" }}>{msg}</p>}
        <div style={{ display: "flex", gap: ".4rem" }}>
          <button type="button" className="button" disabled={busy}
            style={{ fontSize: ".73rem", padding: ".4rem .75rem", background: "var(--green, #2e7d32)" }}
            onClick={approve}>
            {busy ? "…" : "Confirm payment"}
          </button>
          <button type="button" className="button button-outline" disabled={busy}
            style={{ fontSize: ".73rem", padding: ".4rem .75rem" }}
            onClick={() => { setMode("idle"); setMsg(""); }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Reject mode
  return (
    <div className="payment-confirm-dialog">
      <p style={{ fontSize: ".82rem", margin: "0 0 .5rem" }}>Rejection reason:</p>
      <select value={reason} onChange={e => setReason(e.target.value)} className="admin-select"
        style={{ width: "100%", marginBottom: ".4rem" }}>
        {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      {reason === "Other" && (
        <input type="text" value={custom} onChange={e => setCustom(e.target.value)}
          placeholder="Describe the reason" maxLength={300}
          style={{ width: "100%", padding: ".45rem", border: "1px solid var(--line)", font: "inherit", fontSize: ".8rem", marginBottom: ".4rem", boxSizing: "border-box" }} />
      )}
      {msg && <p style={{ fontSize: ".75rem", color: "var(--accent)", margin: "0 0 .4rem" }}>{msg}</p>}
      <div style={{ display: "flex", gap: ".4rem" }}>
        <button type="button" className="button" disabled={busy}
          style={{ fontSize: ".73rem", padding: ".4rem .75rem", background: "var(--red, #c0392b)" }}
          onClick={reject}>
          {busy ? "…" : "Confirm rejection"}
        </button>
        <button type="button" className="button button-outline" disabled={busy}
          style={{ fontSize: ".73rem", padding: ".4rem .75rem" }}
          onClick={() => { setMode("idle"); setMsg(""); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
