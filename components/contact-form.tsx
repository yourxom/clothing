"use client";
import { useState } from "react";
import { useToast } from "@/components/toast";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const { toast } = useToast();
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(data: FormData) {
    const errs: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name) errs.name = "Please enter your name.";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email address.";
    if (!message || message.length < 10) errs.message = "Please enter a message of at least 10 characters.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const errs = validate(data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setState("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    String(data.get("name")).trim(),
          email:   String(data.get("email")).trim(),
          subject: String(data.get("subject")),
          message: String(data.get("message")).trim(),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrors({ submit: (json as { error?: string }).error ?? "Something went wrong." });
        setState("idle");
        toast("Could not send message. Please try again.", "error");
        return;
      }
      setState("success");
      toast("Message sent! We'll be in touch soon.", "success");
    } catch {
      setState("error");
      toast("Network error. Please try again.", "error");
    }
  }

  if (state === "success") {
    return (
      <div className="contact-success" role="status">
        <span className="eyebrow">Message received</span>
        <h2 className="serif">Thank you for reaching out.</h2>
        <p>We&apos;ll get back to you at the email you provided within 1–2 business days.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate aria-label="Contact form">
      {state === "error" && (
        <p className="notice" role="alert">Something went wrong. Please try again or email us directly.</p>
      )}

      <div className="contact-field">
        <label htmlFor="contact-name">Your name <span aria-hidden="true">*</span></label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          aria-required="true"
          aria-describedby={errors.name ? "contact-name-error" : undefined}
        />
        {errors.name && <span id="contact-name-error" className="contact-field-error" role="alert">{errors.name}</span>}
      </div>

      <div className="contact-field">
        <label htmlFor="contact-email">Email address <span aria-hidden="true">*</span></label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-describedby={errors.email ? "contact-email-error" : undefined}
        />
        {errors.email && <span id="contact-email-error" className="contact-field-error" role="alert">{errors.email}</span>}
      </div>

      <div className="contact-field">
        <label htmlFor="contact-subject">Subject</label>
        <select id="contact-subject" name="subject">
          <option value="general">General enquiry</option>
          <option value="collection">Collection question</option>
          <option value="press">Press &amp; media</option>
          <option value="collaboration">Collaboration proposal</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">Message <span aria-hidden="true">*</span></label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          aria-required="true"
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {errors.message && <span id="contact-message-error" className="contact-field-error" role="alert">{errors.message}</span>}
      </div>

      <button type="submit" className="button" disabled={state === "submitting"}>
        {state === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
