"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserActions({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();
  const [busy, setBusy]   = useState(false);
  const [msg,  setMsg]    = useState("");

  async function toggleRole() {
    setBusy(true);
    setMsg("");
    const newRole = currentRole === "admin" ? "customer" : "admin";
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const json = await res.json() as { error?: string };
    if (!res.ok) { setMsg(json.error ?? "Failed"); }
    else { router.refresh(); }
    setBusy(false);
  }

  if (currentRole === "superadmin") {
    return <span className="muted" style={{ fontSize: ".72rem", fontStyle: "italic" }}>Superadmin</span>;
  }

  return (
    <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
      <button type="button" disabled={busy} onClick={toggleRole}
        className="button button-outline"
        style={{ minHeight:"32px", padding:".3rem .7rem", fontSize:".72rem" }}>
        {busy ? "…" : currentRole === "admin" ? "Remove admin" : "Make admin"}
      </button>
      {msg && <span style={{ fontSize:".72rem", color:"#8b3344" }}>{msg}</span>}
    </div>
  );
}
