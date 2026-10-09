import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { getSiteConfig, getWhatsappConfig, getDeliveryConfig, getEmailConfig, getSmsConfig, getReferralConfig } from "@/lib/settings";
import { BrandSettingsForm } from "@/components/brand-settings-form";
import { WhatsAppSettingsForm } from "@/components/whatsapp-settings-form";
import { DeliverySettingsForm } from "@/components/delivery-settings-form";
import { ReferralSettingsForm } from "@/components/referral-settings-form";
import { IntegrationsSettingsForm } from "@/components/integrations-settings-form";
import { TestEmailForm } from "@/components/test-email-form";

export const metadata: Metadata = { title: "Settings — Admin" };
export const dynamic = "force-dynamic";

// Mask a secret for display so the full key is never sent to the browser.
function maskKey(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 6) return "••••••";
  return `${secret.slice(0, 3)}••••${secret.slice(-3)}`;
}

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const [site, whatsapp, delivery, email, sms, referral] = await Promise.all([
    getSiteConfig(), getWhatsappConfig(), getDeliveryConfig(), getEmailConfig(), getSmsConfig(), getReferralConfig(),
  ]);
  const emailInit = { enabled: email.enabled, from: email.from, apiKeyMasked: maskKey(email.apiKey), hasApiKey: Boolean(email.apiKey) };
  const smsInit = {
    enabled: sms.enabled, provider: sms.provider, senderId: sms.senderId,
    dltTemplateId: sms.dltTemplateId,
    authTemplate: sms.authTemplate, apiKeyMasked: maskKey(sms.apiKey), hasApiKey: Boolean(sms.apiKey),
  };

  return (
    <div className="admin-page">
      <h1 className="admin-heading">Settings</h1>
      <p className="muted" style={{ marginBottom: "2rem", fontSize: ".85rem" }}>
        Configure store-wide settings and integrations.
      </p>

      {/* Brand & domain */}
      <div className="admin-settings-section" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">🌐</span>
          <div>
            <h2 className="admin-settings-title">Brand &amp; domain</h2>
            <p className="admin-settings-sub">
              Set your live domain and contact email. These appear in page metadata, SEO links,
              the sitemap, emails, and across the contact/help/legal pages. Until you set a real
              domain, a placeholder is used.
            </p>
          </div>
        </div>
        <BrandSettingsForm initial={{ siteUrl: site.siteUrl, contactEmail: site.contactEmail }} />
      </div>

      {/* Delivery estimate */}
      <div className="admin-settings-section" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">🚚</span>
          <div>
            <h2 className="admin-settings-title">Delivery estimate</h2>
            <p className="admin-settings-sub">
              Set the expected delivery window shown to customers at checkout
              (in business days from order date).
            </p>
          </div>
        </div>
        <DeliverySettingsForm initial={{ minDays: delivery.minDays, maxDays: delivery.maxDays }} />
      </div>

      {/* Refer & Earn */}
      <div className="admin-settings-section" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">🎁</span>
          <div>
            <h2 className="admin-settings-title">Refer &amp; Earn</h2>
            <p className="admin-settings-sub">
              Reward customers who refer friends. The referrer earns points when their referred
              friend completes a first purchase — a fixed amount plus a percentage of that order.
              Points are store credit (1 point = ₹1) redeemable at checkout.
            </p>
          </div>
        </div>
        <ReferralSettingsForm initial={{ enabled: referral.enabled, fixedRupees: referral.fixedRupees, percentRate: referral.percentRate }} />
      </div>

      {/* Payment settings — link to dedicated sub-page */}
      <div className="admin-settings-section" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">💳</span>
          <div>
            <h2 className="admin-settings-title">Payment Settings</h2>
            <p className="admin-settings-sub">
              Choose and configure Merchant UPI (automatic verification) and/or Personal UPI
              (manual verification). Manage provider credentials, QR generation, and defaults.
            </p>
          </div>
        </div>
        <Link href="/admin/settings/payments" className="button button-outline">
          Open payment settings →
        </Link>
      </div>

      {/* WhatsApp */}
      <div className="admin-settings-section">
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">💬</span>
          <div>
            <h2 className="admin-settings-title">WhatsApp queries</h2>
            <p className="admin-settings-sub">
              Show a floating WhatsApp button on the storefront. Customers who tap it are
              taken straight to a WhatsApp chat with your business number.
            </p>
          </div>
        </div>
        <WhatsAppSettingsForm
          initial={{ number: whatsapp.number, message: whatsapp.message, enabled: whatsapp.enabled }}
        />
      </div>

      {/* Email + SMS integrations */}
      <div className="admin-settings-section" style={{ marginTop: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">✉️</span>
          <div>
            <h2 className="admin-settings-title">Email &amp; SMS</h2>
            <p className="admin-settings-sub">
              Configure the email (Resend) and SMS (SMS Horizon / MSG91 / Twilio) providers used for
              order emails, password resets, and phone/email verification codes.
              Values set here override any keys in the environment file.
            </p>
          </div>
        </div>
        <IntegrationsSettingsForm email={emailInit} sms={smsInit} />
      </div>

      {/* Gmail SMTP test */}
      <div className="admin-settings-section" style={{ marginTop: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">📧</span>
          <div>
            <h2 className="admin-settings-title">Test email (Gmail SMTP)</h2>
            <p className="admin-settings-sub">
              Verify that Gmail SMTP is working. Sends a real welcome email via
              <strong> inaureliaa@gmail.com</strong>. Make sure
              <code style={{ fontSize: ".78rem", background: "var(--canvas)", padding: ".1rem .3rem", borderRadius: "3px" }}>
                EMAIL_GMAIL_USER
              </code> and{" "}
              <code style={{ fontSize: ".78rem", background: "var(--canvas)", padding: ".1rem .3rem", borderRadius: "3px" }}>
                EMAIL_GMAIL_PASS
              </code>{" "}
              are set in <code style={{ fontSize: ".78rem", background: "var(--canvas)", padding: ".1rem .3rem", borderRadius: "3px" }}>.env</code>.
            </p>
          </div>
        </div>
        <TestEmailForm />
      </div>
    </div>
  );
}
