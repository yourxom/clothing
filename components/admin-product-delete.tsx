"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminProductDelete({
  productId,
  productName,
  redirectTo,
  compact,
}: {
  productId: string;
  productName: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function del() {
    if (!confirm(`Delete "${productName}"? If it has orders it will be unpublished instead.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg((json as { error?: string }).error ?? "Delete failed."); return; }
    if ((json as { softDeleted?: boolean }).softDeleted) {
      setMsg("Product had orders — unpublished & stock zeroed.");
      router.refresh();
    } else if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <button type="button" disabled={busy}
        className={`button button-outline${compact ? "" : ""}`}
        style={compact
          ? { minHeight: "32px", padding: ".3rem .7rem", fontSize: ".72rem", borderColor: "#8b3344", color: "#8b3344" }
          : { borderColor: "#8b3344", color: "#8b3344" }}
        onClick={del}>
        {busy ? "…" : "Delete"}
      </button>
      {msg && <span style={{ fontSize: ".72rem", color: "var(--muted)", marginLeft: ".5rem" }}>{msg}</span>}
    </>
  );
}
