"use client";
import { useState } from "react";

export function TestEmailForm() {
  const [to,     setTo]     = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"ok"|"error">("idle");
  const [msg,    setMsg]    = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!to) return;
    setStatus("sending"); setMsg("");
    try {
      const res  = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const json = await res.json() as { ok?: boolean; message?: string; error?: string };
      if (res.ok && json.ok) {
        setStatus("ok");
        setMsg(json.message ?? `Test email sent to ${to}. Check your inbox.`);
      } else {
        setStatus("error");
        setMsg(json.error ?? "Failed to send. Check EMAIL_GMAIL_USER and EMAIL_GMAIL_PASS in .env");
      }
    } catch {
      setStatus("error");
      setMsg("Network error — is the dev server running?");
    }
  }

  return (
    <form className="admin-settings-form" onSubmit={send}>
      <div className="contact-field" style={{ maxWidth: "340px" }}>
        <label htmlFor="test-email-to">Send a test email to</label>
        <input
          id="test-email-to"
          type="email"
          required
          placeholder="you@example.com"
          value={to}
          onChange={e => setTo(e.target.value)}
          className="admin-settings-input"
        />
      </div>
      <span className="admin-settings-hint">
        Sends a welcome email via Gmail SMTP to confirm everything is working.
      </span>
      {msg && (
        <p className={status === "ok" ? "newsletter-success" : "contact-field-error"} role="status">
          {status === "ok" ? "✓ " : "✖ "}{msg}
        </p>
      )}
      <button type="submit" className="button" disabled={status === "sending"} style={{ marginTop: ".5rem" }}>
        {status === "sending" ? "Sending…" : "Send test email"}
      </button>
    </form>
  );
}
