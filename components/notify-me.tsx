"use client";
import { useState } from "react";

export function NotifyMe({ productSlug, size }: { productSlug: string; size?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"submitting"|"done"|"error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const res = await fetch("/api/stock-alerts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), productSlug, size }),
    });
    const json = await res.json() as { ok?: boolean; message?: string; error?: string };
    if (res.ok) { setStatus("done"); setMessage(json.message ?? "You're on the list."); }
    else { setStatus("error"); setMessage(json.error ?? "Something went wrong."); }
  }

  if (status === "done") {
    return <p className="notify-me-success" role="status">✓ {message}</p>;
  }

  if (!open) {
    return (
      <button type="button" className="button button-outline notify-me-trigger"
        onClick={() => setOpen(true)}>
        Notify me when available
      </button>
    );
  }

  return (
    <form className="notify-me-form" onSubmit={submit}>
      <p className="notify-me-label">Enter your email to be notified when this is back in stock:</p>
      <div className="notify-me-row">
        <input type="email" required value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" className="notify-me-input" />
        <button type="submit" className="button" disabled={status === "submitting"}>
          {status === "submitting" ? "…" : "Notify me"}
        </button>
      </div>
      {status === "error" && <p className="contact-field-error">{message}</p>}
    </form>
  );
}
