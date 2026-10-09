"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminProductDelete } from "./admin-product-delete";

export function AdminProductActions({
  productId,
  productName,
  published,
}: {
  productId: string;
  productName: string;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    router.refresh();
    setBusy(false);
  }

  const btn = { minHeight: "32px", padding: ".3rem .7rem", fontSize: ".72rem" } as const;

  return (
    <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexWrap: "wrap" }}>
      <Link href={`/admin/products/${productId}/edit`} className="button button-outline" style={btn}>
        Edit
      </Link>
      <button type="button" disabled={busy} className="button button-outline" style={btn} onClick={toggle}>
        {busy ? "…" : published ? "Unpublish" : "Publish"}
      </button>
      <AdminProductDelete productId={productId} productName={productName} compact />
    </div>
  );
}
