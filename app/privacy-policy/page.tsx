import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AURELIA collects, uses, and protects your personal information.",
};

export default async function PrivacyPolicyPage() {
  const { domain } = await getSiteConfig();
  const privacyEmail = `privacy@${domain}`;
  return (
    <main id="main-content" className="container content-page">
      <span className="eyebrow">Legal</span>
      <h1 className="serif">Privacy Policy</h1>
      <p className="content-lead">
        Your privacy matters to us. This policy explains how AURELIA collects, uses,
        and safeguards your personal information when you shop with us.
      </p>
      <p className="notice">
        Last updated: September 2026. This is a general template and should be reviewed
        by a qualified legal professional before you rely on it for your business.
      </p>

      <h2>1. Information we collect</h2>
      <p><strong>Account information:</strong> When you create an account, we collect your name, email address, phone number, and a securely hashed password.</p>
      <p><strong>Order information:</strong> To fulfil orders, we collect your shipping and billing address, contact details, and order history. Payment card details are processed directly by our payment partner and are never stored on our servers.</p>
      <p><strong>Communications:</strong> If you contact us or subscribe to our newsletter, we collect your email address and the content of your messages.</p>
      <p><strong>Technical data:</strong> We collect limited technical information such as device type and pages visited to keep the site secure and improve your experience.</p>

      <h2>2. How we use your information</h2>
      <p>We use your information to process and deliver orders, manage your account, provide customer support, send transactional emails (order confirmations, shipping updates, restock and status alerts), and — with your consent — send marketing communications. We do not sell or rent your personal information to third parties.</p>

      <h2>3. Sharing with service providers</h2>
      <p>We share information only with trusted providers who help us operate the store — for example, payment gateways, delivery partners, and email services. These providers are permitted to use your data only to perform services on our behalf.</p>

      <h2>4. Cookies</h2>
      <p>We use cookies that are necessary for the site to function (such as keeping you logged in and remembering your bag), and, where you consent, analytics cookies that help us understand how the store is used. You can manage cookie preferences in your browser.</p>

      <h2>5. Data retention</h2>
      <p>We retain order and account information for as long as your account is active and as required to comply with tax, accounting, and legal obligations. You may request deletion of your account at any time, subject to those obligations.</p>

      <h2>6. Your rights</h2>
      <p>Under applicable Indian data protection law and, where relevant, GDPR, you have the right to access, correct, or request deletion of your personal data, and to withdraw consent for marketing. To exercise these rights, contact us at <a href={`mailto:${privacyEmail}`} className="text-link">{privacyEmail}</a>.</p>

      <h2>7. Security</h2>
      <p>We take reasonable technical and organisational measures to protect your information, including encrypted connections and hashed passwords. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>

      <h2>8. Children</h2>
      <p>Our website is not directed at children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.</p>

      <h2>9. Changes to this policy</h2>
      <p>We may update this policy from time to time. Material changes will be communicated on this page with an updated date. Continued use of the site after changes constitutes acceptance of the revised policy.</p>

      <h2>10. Contact</h2>
      <p>For privacy-related questions: <a href={`mailto:${privacyEmail}`} className="text-link">{privacyEmail}</a></p>
    </main>
  );
}
