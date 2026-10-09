import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getSiteConfig } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with AURELIA. We'd love to hear from you — questions, collaborations, press enquiries.",
};

export default async function ContactPage() {
  const { contactEmail, domain } = await getSiteConfig();
  const pressEmail = `press@${domain}`;
  return (
    <main id="main-content" className="container content-page">
      <span className="eyebrow">Get in touch</span>
      <h1 className="serif">We&apos;d love to hear from you.</h1>
      <p className="content-lead">
        Whether you have a question about the collection, want to explore a collaboration,
        or just want to say hello — we read every message.
      </p>

      <div className="contact-grid">
        <div className="contact-form-wrap">
          <ContactForm />
        </div>

        <aside className="contact-info">
          <div className="contact-info-block">
            <h2>General enquiries</h2>
            <p>
              For questions about the collection, partnerships, or press — use the form
              or email us directly.
            </p>
            <a href={`mailto:${contactEmail}`} className="text-link">{contactEmail}</a>
          </div>

          <div className="contact-info-block">
            <h2>Response time</h2>
            <p>We aim to respond within 1–2 business days. During launch periods it may take a little longer.</p>
          </div>

          <div className="contact-info-block">
            <h2>Press &amp; collaborations</h2>
            <p>For media enquiries, styling requests, or collaboration proposals:</p>
            <a href={`mailto:${pressEmail}`} className="text-link">{pressEmail}</a>
          </div>

          <div className="contact-info-block">
            <h2>Customer support</h2>
            <p>
              Order support, returns, and delivery queries will be handled through a dedicated
              support system launching alongside the shop. Until then, please email us.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
