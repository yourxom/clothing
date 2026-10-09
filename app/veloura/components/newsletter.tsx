"use client";
import { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
    } catch {
      /* Non-blocking — still show success to the user. */
    }
    setDone(true);
  }

  return (
    <section className="vl-news" aria-labelledby="news-h">
      <div className="vl-container vl-news__inner">
        <div className="vl-news__copy">
          <svg className="vl-news__leaf" viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
            <path d="M12 2C7 6 5 11 6 18c5 1 10-1 14-6-3 1-6 1-9-1 3-1 5-3 6-6-3 2-6 2-9 0 2-1 3-2 4-3z" />
          </svg>
          <div>
            <h2 id="news-h">Join Our Newsletter</h2>
            <p>Get exclusive offers, new arrivals and style inspiration delivered to your inbox.</p>
          </div>
        </div>

        {done ? (
          <p className="vl-news__done" role="status">Thanks for subscribing — check your inbox soon.</p>
        ) : (
          <form className="vl-news__form" onSubmit={submit}>
            <label htmlFor="vl-news-email" hidden>Email address</label>
            <input
              id="vl-news-email"
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="vl-btn">Subscribe</button>
          </form>
        )}
      </div>
    </section>
  );
}
