"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"];

export function AdminReturnActions({ returnId, currentStatus }: { returnId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote]     = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/returns/${returnId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note || undefined }),
    });
    setSaving(false);
    if (res.ok) { setMsg("Updated."); router.refresh(); }
    else setMsg("Failed to update.");
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center", marginTop: ".7rem" }}>
      <select value={status} onChange={e => setStatus(e.target.value)} className="admin-select">
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <input type="text" value={note} onChange={e => setNote(e.target.value)}
        placeholder="Add a note (optional)" maxLength={2000}
        style={{ flex: 1, minWidth: "180px", padding: ".5rem", border: "1px solid var(--line)", font: "inherit", fontSize: ".8rem" }} />
      <button type="button" className="button" disabled={saving || status === currentStatus && !note}
        style={{ minHeight: "38px", padding: ".5rem 1rem", fontSize: ".78rem" }}
        onClick={save}>
        {saving ? "…" : "Update"}
      </button>
      {msg && <span style={{ fontSize: ".75rem", color: "var(--accent)" }}>{msg}</span>}
    </div>
  );
}
