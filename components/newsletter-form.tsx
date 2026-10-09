"use client";
import { useState } from "react";

type State = "idle" | "submitting" | "success" | "error";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setState("submitting");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Request failed");
      setState("success");
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <p className="newsletter-success" role="status">
        ✦ You&apos;re on the list. We&apos;ll be in touch when AURELIA launches.
      </p>
    );
  }

  return (
    <form
      className={compact ? "newsletter-form newsletter-form--compact" : "newsletter-form"}
      onSubmit={handleSubmit}
      noValidate
      aria-label="Newsletter sign-up"
    >
      <div className="newsletter-form-fields">
        <label htmlFor={compact ? "nl-email-compact" : "nl-email"} className="sr-only">
          Email address
        </label>
        <input
          id={compact ? "nl-email-compact" : "nl-email"}
          name="email"
          type="email"
          placeholder="Your email address"
          autoComplete="email"
          aria-required="true"
          aria-describedby={error ? "nl-error" : undefined}
          disabled={state === "submitting"}
        />
        <button type="submit" className="button" disabled={state === "submitting"}>
          {state === "submitting" ? "…" : "Notify me"}
        </button>
      </div>
      {error && <span id="nl-error" className="contact-field-error" role="alert">{error}</span>}
      {state === "error" && (
        <span className="contact-field-error" role="alert">
          Something went wrong. Please try again.
        </span>
      )}
      <p className="newsletter-disclaimer">
        No spam. Unsubscribe at any time. We won&apos;t share your address.
      </p>
    </form>
  );
}
