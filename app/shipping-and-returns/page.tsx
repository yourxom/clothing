import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "AURELIA shipping policy, delivery timelines, and hassle-free returns information.",
};

const shippingFaqs = [
  {
    q: "How long does delivery take?",
    a: "Standard delivery across India takes 4–7 business days. Express delivery (1–2 business days) is available in select cities. Your exact estimated delivery date is shown at checkout.",
  },
  {
    q: "Is delivery free?",
    a: "We offer free standard delivery on orders above ₹2,000. A flat delivery fee applies to smaller orders and is shown at checkout before you pay.",
  },
  {
    q: "Do you ship internationally?",
    a: "We currently ship within India. International shipping is planned for a later phase — we'll announce supported countries here when it's available.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order is dispatched, you'll receive a tracking link by email. You can also track your order any time from your AURELIA account.",
  },
  {
    q: "What if my item arrives damaged?",
    a: "If your order arrives damaged or defective, please contact us within 48 hours with photographs. We'll arrange a replacement or full refund at no cost to you.",
  },
];

const returnsFaqs = [
  {
    q: "What is your returns policy?",
    a: "We offer hassle-free returns within 15 days of delivery. Items must be unworn, unwashed, and in original packaging with all tags attached.",
  },
  {
    q: "How do I start a return?",
    a: "Initiate a return from your account dashboard within 15 days of delivery. We'll arrange a free pickup from your registered address.",
  },
  {
    q: "When will I receive my refund?",
    a: "Refunds are processed within 5–7 business days of receiving the returned item. The amount is credited to your original payment method.",
  },
  {
    q: "What items cannot be returned?",
    a: "For hygiene reasons, accessories such as jewellery and hair accessories cannot be returned. Sale items and custom orders are also non-returnable.",
  },
  {
    q: "Can I exchange instead of returning?",
    a: "Yes. Exchanges for a different size or colour (subject to availability) are available — use the same returns flow from your account and select an exchange.",
  },
];

export default function ShippingReturnsPage() {
  return (
    <main id="main-content" className="container content-page">
      <span className="eyebrow">Help &amp; support</span>
      <h1 className="serif">Shipping &amp; Returns</h1>
      <p className="content-lead">
        We want you to love every AURELIA piece. If something isn&apos;t right, we&apos;ll make it right.
      </p>

      <div className="content-card-grid">
        <div className="content-card">
          <span className="eyebrow">Delivery</span>
          <h2 className="serif">Fast &amp; tracked.</h2>
          <p>Standard delivery across India · 4–7 business days</p>
          <p>Express delivery (select cities) · 1–2 business days</p>
          <p>Free shipping on orders above ₹2,000</p>
        </div>
        <div className="content-card">
          <span className="eyebrow">Returns</span>
          <h2 className="serif">Easy &amp; free.</h2>
          <p>15-day return window from delivery date</p>
          <p>Free pickup from your address</p>
          <p>Refund in 5–7 business days</p>
        </div>
      </div>

      <h2>Shipping FAQ</h2>
      {shippingFaqs.map((faq, i) => (
        <details key={i}>
          <summary>{faq.q}</summary>
          <p>{faq.a}</p>
        </details>
      ))}

      <h2>Returns FAQ</h2>
      {returnsFaqs.map((faq, i) => (
        <details key={i}>
          <summary>{faq.q}</summary>
          <p>{faq.a}</p>
        </details>
      ))}

      <p style={{ marginTop: "2.5rem" }}>
        Still have questions? <Link href="/contact" className="text-link">Contact us</Link> and we&apos;ll help.
      </p>
    </main>
  );
}
