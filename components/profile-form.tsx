"use client";
import { useState } from "react";

type Props = { user: { name: string | null; email: string; phone: string | null } };

export function ProfileForm({ user }: Props) {
  const [status, setStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:  String(data.get("name")).trim(),
        phone: String(data.get("phone")).trim(),
      }),
    });
    if (res.ok) {
      setStatus("saved");
      setMessage("Profile updated.");
    } else {
      setStatus("error");
      setMessage("Could not save changes. Please try again.");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} style={{ maxWidth: "480px" }}>
      {message && (
        <p className={status === "saved" ? "newsletter-success" : "contact-field-error"} role="status">
          {message}
        </p>
      )}

      <div className="contact-field">
        <label htmlFor="profile-name">Full name</label>
        <input id="profile-name" name="name" type="text"
          defaultValue={user.name ?? ""} maxLength={100} autoComplete="name" />
      </div>

      <div className="contact-field">
        <label htmlFor="profile-email">Email address</label>
        <input id="profile-email" type="email"
          defaultValue={user.email} disabled
          style={{ opacity: .6, cursor: "not-allowed" }} />
        <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
          Email cannot be changed here.
        </span>
      </div>

      <div className="contact-field">
        <label htmlFor="profile-phone">Phone number</label>
        <input id="profile-phone" name="phone" type="tel"
          defaultValue={user.phone ?? ""} maxLength={20} autoComplete="tel" />
      </div>

      <button type="submit" className="button" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
