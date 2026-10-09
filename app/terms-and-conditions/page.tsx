import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using the AURELIA website and storefront.",
};

export default async function TermsPage() {
  const { domain } = await getSiteConfig();
  const legalEmail = `legal@${domain}`;
  return (
    <main id="main-content" className="container content-page">
      <span className="eyebrow">Legal</span>
      <h1 className="serif">Terms &amp; Conditions</h1>
      <p className="content-lead">
        By using this website and placing orders with AURELIA, you agree to these terms.
        Please read them carefully.
      </p>
      <p className="notice">
        Last updated: September 2026. This is a general template and should be reviewed
        by a qualified legal professional before you rely on it for your business.
      </p>

      <h2>1. Use of the website</h2>
      <p>You may use this website to browse products, create an account, and place orders for personal, non-commercial use. You agree to provide accurate account and delivery information and to keep your login credentials secure.</p>

      <h2>2. Products, pricing and availability</h2>
      <p>We make every effort to display products, colours, and prices accurately. Colours may vary slightly depending on your screen. All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless stated otherwise. Products are subject to availability, and we reserve the right to limit quantities or discontinue any product.</p>

      <h2>3. Orders and acceptance</h2>
      <p>Your order is an offer to buy. We accept your order once we send an order confirmation. We reserve the right to refuse or cancel an order — for example, in cases of pricing errors, suspected fraud, or stock unavailability. If we cancel a paid order, you will receive a full refund.</p>

      <h2>4. Payment</h2>
      <p>Payment is processed securely through our payment partner. By placing an order you confirm that the payment details you provide are valid and that you are authorised to use the chosen payment method.</p>

      <h2>5. Shipping, returns and refunds</h2>
      <p>Delivery timelines, returns, and refunds are governed by our <a href="/shipping-and-returns" className="text-link">Shipping &amp; Returns policy</a>, which forms part of these terms.</p>

      <h2>6. Intellectual property</h2>
      <p>All content on this website — including the AURELIA name, brand identity, product designs, artwork, copy, and layout — is the property of AURELIA. You may not reproduce, distribute, or use any content for commercial purposes without prior written permission.</p>

      <h2>7. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, AURELIA shall not be liable for any indirect, incidental, or consequential damages arising from your use of this website or products purchased through it. Nothing in these terms limits your statutory rights as a consumer.</p>

      <h2>8. Governing law</h2>
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.</p>

      <h2>9. Changes to terms</h2>
      <p>We may update these terms from time to time. Changes take effect upon posting. Continued use of the site constitutes acceptance of the revised terms.</p>

      <h2>10. Contact</h2>
      <p>For legal enquiries: <a href={`mailto:${legalEmail}`} className="text-link">{legalEmail}</a></p>
    </main>
  );
}
