"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReturnRequestButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle"|"submitting"|"done"|"error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    if (reason.trim().length < 10) {
      setStatus("error"); setMessage("Please provide a reason of at least 10 characters.");
      return;
    }
    setStatus("submitting");
    const res  = await fetch("/api/returns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason: reason.trim() }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    if (res.ok) {
      setStatus("done");
      setMessage("Return request submitted. We'll review it and get back to you.");
      router.refresh();
    } else {
      setStatus("error");
      setMessage(json.error ?? "Could not submit request.");
    }
  }

  if (!open) {
    return (
      <button type="button" className="button button-outline" onClick={() => setOpen(true)}>
        Request return
      </button>
    );
  }

  return (
    <div className="return-request-panel">
      <h3 style={{ margin: "0 0 .6rem", fontSize: ".95rem", fontWeight: 700 }}>
        Request a return — {orderNumber}
      </h3>
      {status === "done" ? (
        <p className="newsletter-success" role="status">{message}</p>
      ) : (
        <>
          {status === "error" && <p className="contact-field-error">{message}</p>}
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Tell us why you'd like to return this order (size, quality, changed mind, etc.)"
            rows={3} maxLength={2000}
            className="return-reason-input"
          />
          <div style={{ display: "flex", gap: ".6rem", marginTop: ".6rem" }}>
            <button type="button" className="button" disabled={status === "submitting"} onClick={submit}>
              {status === "submitting" ? "Submitting…" : "Submit request"}
            </button>
            <button type="button" className="button button-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
