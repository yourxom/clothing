"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminReconciliationActions({ txId }: { txId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg,  setMsg]  = useState("");

  async function resolve() {
    setBusy(true);
    const res  = await fetch(`/api/admin/reconciliation/${txId}/resolve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() || "Manually resolved by admin." }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    setBusy(false);
    if (res.ok && json.ok) { setMsg("Resolved."); router.refresh(); }
    else setMsg(json.error ?? "Failed.");
  }

  if (!open) {
    return (
      <button type="button" className="button button-outline" style={{ fontSize: ".72rem", padding: ".35rem .65rem" }}
        onClick={() => setOpen(true)}>Resolve</button>
    );
  }

  return (
    <div className="payment-confirm-dialog" style={{ minWidth: "200px" }}>
      <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
        placeholder="Resolution note (optional)" maxLength={500}
        style={{ width: "100%", font: "inherit", fontSize: ".78rem", padding: ".4rem", border: "1px solid var(--line)", marginBottom: ".4rem", boxSizing: "border-box" }} />
      {msg && <p style={{ fontSize: ".73rem", margin: "0 0 .3rem", color: msg === "Resolved." ? "#2e7d32" : "#c0392b" }}>{msg}</p>}
      <div style={{ display: "flex", gap: ".4rem" }}>
        <button type="button" className="button" style={{ fontSize: ".72rem", padding: ".35rem .65rem" }}
          disabled={busy} onClick={resolve}>
          {busy ? "…" : "Confirm"}
        </button>
        <button type="button" className="button button-outline" style={{ fontSize: ".72rem", padding: ".35rem .65rem" }}
          onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
