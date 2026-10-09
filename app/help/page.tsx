import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description: "Frequently asked questions about AURELIA — orders, sizing, returns, and the preview catalogue.",
};

function buildFaqs(contactEmail: string, pressEmail: string) {
  return [
  {
    section: "Shopping & ordering",
    items: [
      {
        q: "Can I place an order?",
        a: "Not yet — checkout is in preview mode. You can add items to your demo bag and go through the address step, but no payment is collected and no goods are dispatched. Full checkout with Razorpay payment launches in a future phase.",
      },
      {
        q: "Are prices, sizes and materials confirmed?",
        a: "No. The catalogue contains original demo concepts. All prices are indicative (in INR), sizes are proposed, and fabric descriptions are illustrative. Everything will be verified before the shop launches.",
      },
      {
        q: "How do I save styles I like?",
        a: "Click 'Save style' on any product card or product page. If you're signed in, saved styles are stored in your account. If you're browsing as a guest, they're stored in your browser — create an account to keep them permanently.",
      },
      {
        q: "Can I compare products?",
        a: "Yes — click 'Compare style' on any product card to add it to your comparison. You can compare up to 3 styles side by side. Visit the Compare page from the navigation.",
      },
    ],
  },
  {
    section: "Account & sign-in",
    items: [
      {
        q: "How do I create an account?",
        a: "Visit the Register page and enter your name, email, and a password. Your account is created immediately and you'll be signed in automatically.",
      },
      {
        q: "I forgot my password.",
        a: `Password reset will be available at launch. For now, please contact us at ${contactEmail} and we'll assist you manually.`,
      },
      {
        q: "Where are my saved styles and bag?",
        a: "If you're signed in, they're in your account and synced across devices. If you're a guest, they're stored only in your current browser — clearing browser storage will remove them.",
      },
    ],
  },
  {
    section: "Delivery & returns",
    items: [
      {
        q: "What are the delivery timelines?",
        a: "Standard delivery across India: 4–7 business days. Express delivery (select cities): 1–2 business days. Free shipping on orders above ₹2,000. These are planned timelines — delivery will be available when the shop launches.",
      },
      {
        q: "What is your returns policy?",
        a: "We offer hassle-free returns within 15 days of delivery. Items must be unworn, unwashed, and in original packaging. Returns will be available when checkout launches.",
      },
      {
        q: "Do you ship internationally?",
        a: "International shipping is planned for a later phase. We'll announce supported countries when we launch global delivery.",
      },
    ],
  },
  {
    section: "The preview & catalogue",
    items: [
      {
        q: "What is the AURELIA preview?",
        a: "The preview lets you explore original AURELIA design concepts before the shop launches. All images are illustrative artwork — not photographs of finished garments. Nothing is available to purchase yet.",
      },
      {
        q: "When will the full shop launch?",
        a: "We're targeting a 2026 launch. Sign up to our newsletter to be first to know.",
      },
      {
        q: "How do I contact AURELIA?",
        a: `Use our Contact page to send us a message — we read every one. For press and collaboration enquiries, email ${pressEmail}.`,
      },
    ],
  },
  ];
}

export default async function HelpPage() {
  const { contactEmail, domain } = await getSiteConfig();
  const faqs = buildFaqs(contactEmail, `press@${domain}`);
  return (
    <main id="main-content" className="container content-page">
      <span className="eyebrow">Help &amp; FAQ</span>
      <h1 className="serif">How can we help?</h1>
      <p className="content-lead">
        Answers to the most common questions about AURELIA, the preview catalogue,
        and what to expect when we launch.
      </p>

      <div className="help-cta-row">
        <Link href="/contact"           className="button">Send us a message</Link>
        <Link href="/shipping-and-returns" className="button button-outline">Shipping &amp; returns</Link>
      </div>

      {faqs.map(section => (
        <section key={section.section} className="help-section">
          <h2 className="serif">{section.section}</h2>
          {section.items.map((item, i) => (
            <details key={i}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      ))}

      <div className="help-contact-block">
        <span className="eyebrow">Still need help?</span>
        <h2 className="serif">Get in touch.</h2>
        <p>We&apos;re a small team and we read every message.</p>
        <Link href="/contact" className="button" style={{ marginTop: "1.2rem", display: "inline-flex", marginBottom: "3rem" }}>
          Contact us ↗
        </Link>
      </div>
    </main>
  );
}
