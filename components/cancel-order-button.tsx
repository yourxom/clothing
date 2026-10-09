"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    const json = await res.json() as { error?: string };
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError(json.error ?? "Could not cancel order.");
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="cancel-order-confirm">
        <span className="cancel-order-q">Cancel this order?</span>
        <button type="button" className="button" disabled={busy}
          style={{ background: "#8b3344", borderColor: "#8b3344", minHeight: "44px" }}
          onClick={cancel}>
          {busy ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button type="button" className="button button-outline"
          style={{ minHeight: "44px" }}
          onClick={() => setConfirming(false)} disabled={busy}>
          Keep order
        </button>
        {error && <span className="contact-field-error">{error}</span>}
      </span>
    );
  }

  return (
    <button type="button" className="cancel-order-trigger"
      onClick={() => setConfirming(true)}>
      Cancel order
    </button>
  );
}
