// Email sending — Brevo HTTP API (primary) with Gmail SMTP fallback.
// Brevo HTTP API needs NO IP whitelisting unlike Brevo SMTP.
//
// ── Brevo HTTP API setup (recommended) ───────────────────────────────────────
//   1. Sign up free at https://app.brevo.com (300 emails/day free)
//   2. Go to: Account → SMTP & API → API Keys tab → Generate a new API key
//   3. Add to .env:
//        BREVO_API_KEY="xkeysib-..."
//        EMAIL_FROM="AURELIA <your@email.com>"
//
// ── Gmail SMTP fallback ───────────────────────────────────────────────────────
//   EMAIL_GMAIL_USER / EMAIL_GMAIL_PASS still work when BREVO_API_KEY is not set.

import nodemailer from "nodemailer";

// ── Brevo HTTP API sender ──────────────────────────────────────────────────
async function sendViaBrevoApi(
  to: string, subject: string, html: string, textBody: string, from: string
): Promise<{ ok: boolean; id?: string; error?: unknown }> {
  const apiKey = process.env.BREVO_API_KEY || "";
  if (!apiKey) return { ok: false, error: "No BREVO_API_KEY" };

  // Parse "Name <email>" or plain email
  const fromMatch = from.match(/^(.*?)\s*<([^>]+)>$/);
  const fromName  = fromMatch?.[1]?.trim() || "AURELIA";
  const fromEmail = fromMatch?.[2]?.trim() || from.trim();

  const body = {
    sender:     { name: fromName, email: fromEmail },
    to:         [{ email: to }],
    subject,
    htmlContent: html,
    textContent: textBody,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method:  "POST",
    headers: {
      "accept":       "application/json",
      "content-type": "application/json",
      "api-key":      apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: err };
  }
  const data = await res.json() as { messageId?: string };
  return { ok: true, id: data.messageId };
}

// ── Gmail SMTP fallback ────────────────────────────────────────────────────
let _transporter: nodemailer.Transporter | null = null;

function getGmailTransporter() {
  const user = process.env.EMAIL_GMAIL_USER || "";
  const pass = process.env.EMAIL_GMAIL_PASS || "";
  if (!user || !pass) return null;
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user, pass },
      pool: true, maxConnections: 3,
    });
  }
  return _transporter;
}

// ── HTML → plain text ──────────────────────────────────────────────────────
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n")
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, "$2 ( $1 )")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/&nbsp;/g," ").replace(/&#39;/g,"'").replace(/&quot;/g,'"')
    .replace(/\n{3,}/g,"\n\n").trim();
}

// ── Main send function ────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  // Never send to dummy phone-only placeholder emails
  if (!to || to.endsWith("@phone.aurelia.local") || to.includes("@phone.aurelia.local")) {
    return { ok: true, skipped: true };
  }

  const user = process.env.EMAIL_SMTP_USER || process.env.EMAIL_GMAIL_USER || process.env.EMAIL_SMTP_USER || "";
  const from = process.env.EMAIL_FROM || `AURELIA <${user || "hello@aurelia.in"}>`;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://aurelia.in";

  const hasBrevo = Boolean(process.env.BREVO_API_KEY);
  const hasGmail = Boolean(process.env.EMAIL_GMAIL_USER && process.env.EMAIL_GMAIL_PASS);

  if (!hasBrevo && !hasGmail) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[email dev] TO: ${to} | SUBJECT: ${subject}`);
    }
    return { ok: true, dev: true };
  }

  // Wrap in a clean email template with unsubscribe footer
  const wrappedHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f7f1e8;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1e8;padding:24px 8px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="max-width:560px;width:100%;background:#fffdf9;border-radius:8px;border:1px solid #ded7cc">
      <tr><td style="padding:32px 36px 8px">
        <p style="margin:0 0 20px;font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:#9a9288">AURELIA</p>
        ${html}
      </td></tr>
      <tr><td style="padding:20px 36px 28px;border-top:1px solid #ded7cc">
        <p style="margin:0;font-size:.68rem;color:#9a9288;line-height:1.6">
          You are receiving this email because you have an account at
          <a href="${site}" style="color:#6b7c5c">${site.replace(/^https?:\/\//,"")}</a>.
          &nbsp;·&nbsp;
          <a href="${site}/account" style="color:#9a9288;text-decoration:underline">Manage preferences</a>
          &nbsp;·&nbsp;
          <a href="mailto:${from.match(/<([^>]+)>/)?.[1] || from}?subject=unsubscribe"
            style="color:#9a9288;text-decoration:underline">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const plainText = htmlToText(html);

  // Try Brevo HTTP API first (no IP whitelisting required)
  if (hasBrevo) {
    const result = await sendViaBrevoApi(to, subject, wrappedHtml, plainText, from);
    if (result.ok) return result;
    console.error("[email] Brevo API failed:", result.error);
    // Fall through to Gmail if Brevo fails
  }

  // Gmail SMTP fallback
  if (hasGmail) {
    try {
      const transporter = getGmailTransporter();
      if (!transporter) return { ok: false, error: "No transporter" };
      const gmailUser = process.env.EMAIL_GMAIL_USER || "";
      const domain    = gmailUser.split("@")[1] || "gmail.com";
      const info = await transporter.sendMail({
        from, to, subject,
        text: plainText,
        html: wrappedHtml,
        headers: {
          "List-Unsubscribe":      `<mailto:${gmailUser}?subject=unsubscribe>, <${site}/unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "Precedence":            "bulk",
          "Message-ID":            `<${Date.now()}.${Math.random().toString(36).slice(2)}@${domain}>`,
        },
      });
      return { ok: true, id: info.messageId };
    } catch (err) {
      console.error("[email] Gmail SMTP failed:", err);
      return { ok: false, error: err };
    }
  }

  return { ok: false, error: "No email provider configured" };
}

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurelia.in";

/* ── Welcome email ──────────────────────────────────────────────────────── */
export async function sendWelcomeEmail(to: string, name: string | null) {
  const firstName = name?.split(" ")[0] ?? "there";
  return send(to, "Welcome to AURELIA", `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:2rem;margin:.5rem 0">Welcome, ${firstName}.</h1>
      <p style="color:#706b62;line-height:1.7">Your AURELIA account is ready. Explore the collection and save styles you love.</p>
      <a href="${siteUrl()}/shop" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">Explore the edit</a>
    </div>`);
}

/* ── OTP email ──────────────────────────────────────────────────────────── */
export async function sendOtpEmail(to: string, code: string) {
  return send(to, "Your AURELIA verification — action required", `
    <div style="font-family:Georgia,serif;max-width:480px;color:#29251f">
      <h1 style="font-size:1.5rem;margin:0 0 .8rem">One-time verification</h1>
      <p style="color:#706b62;line-height:1.6;margin:0 0 1.5rem">Enter this code to verify your identity. It expires in 10 minutes.</p>
      <div style="background:#f7f1e8;border:1px solid #ded7cc;border-radius:8px;padding:1.2rem;text-align:center;margin:0 0 1.5rem">
        <p style="margin:0 0 .4rem;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#706b62">Verification code</p>
        <div style="font-size:2.4rem;letter-spacing:.5em;font-weight:700;color:#29251f;font-family:ui-monospace,monospace">${code}</div>
      </div>
      <p style="color:#706b62;font-size:.82rem;line-height:1.6">If you didn't request this, ignore this email. Your account is secure.</p>
    </div>`);
}

/* ── Order confirmation ──────────────────────────────────────────────────── */
export async function sendOrderConfirmationEmail(
  to: string, orderNumber: string, totalPaise: number,
  lines: { productName: string; size: string; quantity: number }[]
) {
  const total = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalPaise / 100);
  const items = lines.map(l => `<li>${l.productName} · Size ${l.size} · Qty ${l.quantity}</li>`).join("");
  return send(to, `Order ${orderNumber} confirmed — AURELIA`, `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.8rem">Order confirmed ✓</h1>
      <p style="color:#706b62">Your order <strong>${orderNumber}</strong> has been confirmed by our team and is now being processed.</p>
      <ul style="color:#706b62;line-height:2">${items}</ul>
      <p style="font-size:1.1rem;font-weight:600;margin-top:1rem">Total: ${total}</p>
      <a href="${siteUrl()}/account/orders" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">View order</a>
    </div>`);
}

/* ── Password reset ──────────────────────────────────────────────────────── */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return send(to, "Reset your AURELIA password", `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.8rem">Reset your password.</h1>
      <p style="color:#706b62;line-height:1.7">Click the button below to reset your password. The link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">Reset password</a>
      <p style="margin-top:1.5rem;font-size:.8rem;color:#706b62">If you didn't request this, ignore this email.</p>
    </div>`);
}

/* ── Email verification ──────────────────────────────────────────────────── */
export async function sendVerificationEmail(to: string, verifyUrl: string) {
  return send(to, "Verify your AURELIA email address", `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.8rem">Verify your email.</h1>
      <p style="color:#706b62;line-height:1.7">Please verify your email to complete your account setup. Expires in 24 hours.</p>
      <a href="${verifyUrl}" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">Verify email address</a>
    </div>`);
}

/* ── Shipping notification ───────────────────────────────────────────────── */
export async function sendShippingEmail(to: string, orderNumber: string, trackingNumber: string | null, trackingProvider: string | null) {
  const tracking = trackingNumber ? `<p style="color:#706b62;font-size:.85rem">Tracking: <strong>${trackingProvider ?? ""} ${trackingNumber}</strong></p>` : "";
  return send(to, `Order ${orderNumber} has been shipped — AURELIA`, `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.8rem">Your order is on its way. 🚚</h1>
      <p style="color:#706b62">Order <strong>${orderNumber}</strong> has been shipped.</p>
      ${tracking}
      <a href="${siteUrl()}/account/orders" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">Track order</a>
    </div>`);
}

/* ── Restock alert ───────────────────────────────────────────────────────── */
export async function sendRestockEmail(to: string, productName: string, productSlug: string, size: string | null) {
  const sizeText = size ? ` (Size ${size})` : "";
  return send(to, `Back in stock: ${productName} — AURELIA`, `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.7rem">It's back. ✨</h1>
      <p style="color:#706b62;line-height:1.7"><strong>${productName}</strong>${sizeText} is back in stock.</p>
      <a href="${siteUrl()}/products/${productSlug}" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">Shop now</a>
    </div>`);
}

/* ── Order status update ─────────────────────────────────────────────────── */
export async function sendOrderStatusEmail(to: string, orderNumber: string, status: string) {
  const messages: Record<string, { title: string; body: string }> = {
    CONFIRMED:  { title: "Order confirmed ✓",          body: "We've confirmed your order and are getting it ready." },
    PROCESSING: { title: "Order being prepared 📦",    body: "Our team is carefully packing your order." },
    DELIVERED:  { title: "Order delivered 🎉",         body: "We hope you love your new AURELIA pieces!" },
    CANCELLED:  { title: "Order cancelled",             body: "Your order has been cancelled. Any payment will be refunded." },
    REFUNDED:   { title: "Refund processed",            body: "Your refund is on its way back to your original payment method." },
  };
  const m = messages[status] ?? { title: `Order ${orderNumber} update`, body: `Your order status is now ${status.toLowerCase()}.` };
  return send(to, `${m.title} — Order ${orderNumber}`, `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.7rem">${m.title}</h1>
      <p style="color:#706b62">Order <strong>${orderNumber}</strong></p>
      <p style="color:#706b62;line-height:1.7">${m.body}</p>
      <a href="${siteUrl()}/account/orders" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">View order</a>
    </div>`);
}

/* ── Payment submitted (Personal UPI — awaiting admin review) ──────────── */
export async function sendPaymentSubmittedEmail(
  to: string, orderNumber: string, totalPaise: number, utr: string
) {
  const total = new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(totalPaise / 100);
  return send(to, `Payment submitted — Order ${orderNumber}`, `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.8rem">Payment submitted</h1>
      <p style="color:#706b62;line-height:1.7">
        We have received your payment details for order <strong>${orderNumber}</strong>.
        Our team will verify the transaction and confirm your order shortly.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:1.2rem 0">
        <tr><td style="padding:.5rem 0;color:#706b62;font-size:.85rem">Order</td><td style="padding:.5rem 0;font-weight:600">${orderNumber}</td></tr>
        <tr><td style="padding:.5rem 0;color:#706b62;font-size:.85rem">Amount</td><td style="padding:.5rem 0;font-weight:600">${total}</td></tr>
        <tr><td style="padding:.5rem 0;color:#706b62;font-size:.85rem">UTR / Reference</td><td style="padding:.5rem 0;font-weight:600">${utr}</td></tr>
        <tr><td style="padding:.5rem 0;color:#706b62;font-size:.85rem">Status</td><td style="padding:.5rem 0;color:#b77b00;font-weight:600">Verification Pending</td></tr>
      </table>
      <p style="color:#706b62;font-size:.82rem;line-height:1.6">
        You will receive another email once your payment is verified. If you have not paid yet, please complete
        the payment and resubmit your details.
      </p>
      <a href="${siteUrl()}/account/orders" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">View order</a>
    </div>`);
}

/* ── Payment verified (Personal UPI — admin approved) ───────────────────── */
export async function sendPaymentVerifiedEmail(
  to: string, orderNumber: string, totalPaise: number
) {
  const total = new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(totalPaise / 100);
  return send(to, `Payment verified — Order ${orderNumber} confirmed`, `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.8rem">Payment verified ✓</h1>
      <p style="color:#706b62;line-height:1.7">
        Your payment of <strong>${total}</strong> for order <strong>${orderNumber}</strong> has been verified
        and your order is now confirmed. We are getting it ready for dispatch.
      </p>
      <a href="${siteUrl()}/account/orders" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">View order</a>
    </div>`);
}

/* ── Payment rejected (Personal UPI — admin rejected) ───────────────────── */
export async function sendPaymentRejectedEmail(
  to: string, orderNumber: string, reason: string
) {
  return send(to, `Payment could not be verified — Order ${orderNumber}`, `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <h1 style="font-size:1.8rem">Payment not verified</h1>
      <p style="color:#706b62;line-height:1.7">
        We were unable to verify your payment for order <strong>${orderNumber}</strong>.
      </p>
      <p style="color:#706b62;font-size:.85rem"><strong>Reason:</strong> ${reason}</p>
      <p style="color:#706b62;line-height:1.7">
        Please try submitting your payment again, or contact us if you believe this is an error.
      </p>
      <a href="${siteUrl()}/account/orders" style="display:inline-block;margin-top:1.5rem;padding:.85rem 1.55rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase">View order &amp; retry payment</a>
    </div>`);
}

export type OrderPlacedItem = {
  productName: string;
  size: string;
  quantity: number;
  totalPaise?: number;
};

export type OrderShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

/* ── Order placed email (when order is placed / payment proof submitted) ──── */
export async function sendOrderPlacedEmail(params: {
  to: string;
  orderNumber: string;
  totalPaise: number;
  lines: OrderPlacedItem[];
  shippingAddress?: OrderShippingAddress | null;
  paymentMethod?: string;
  utr?: string | null;
}) {
  const { to, orderNumber, totalPaise, lines, shippingAddress, paymentMethod, utr } = params;
  const total = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalPaise / 100);

  const itemsHtml = lines.map(l => {
    const priceText = l.totalPaise ? ` · ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(l.totalPaise / 100)}` : "";
    return `<li style="margin-bottom:.5rem">${l.productName} — Size <strong>${l.size}</strong> · Qty <strong>${l.quantity}</strong>${priceText}</li>`;
  }).join("");

  const addressHtml = shippingAddress ? `
    <div style="background:#f9f6f0;border:1px solid #ded7cc;border-radius:6px;padding:1rem;margin:1.2rem 0;font-size:.85rem;line-height:1.6">
      <p style="margin:0 0 .3rem;font-weight:600;color:#29251f">Shipping Address:</p>
      <p style="margin:0;color:#706b62">${shippingAddress.fullName} · ${shippingAddress.phone}</p>
      <p style="margin:0;color:#706b62">${shippingAddress.line1}${shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}</p>
      <p style="margin:0;color:#706b62">${shippingAddress.city}, ${shippingAddress.state} – ${shippingAddress.pincode}</p>
    </div>` : "";

  const paymentDetailsHtml = utr ? `
    <div style="background:#fffdf9;border:1px solid #e2dacd;border-radius:6px;padding:1rem;margin:1.2rem 0">
      <p style="margin:0 0 .4rem;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:#8a8377">Payment Details</p>
      <p style="margin:0 0 .3rem;font-size:.9rem;color:#29251f">Method: <strong>Personal UPI</strong></p>
      <p style="margin:0 0 .3rem;font-size:.9rem;color:#29251f">UTR / Reference: <code style="background:#f4eee2;padding:2px 6px;border-radius:4px;font-size:.85rem">${utr}</code></p>
      <p style="margin:0;font-size:.85rem;color:#b77b00;font-weight:600">Status: Verification Pending</p>
    </div>` : (paymentMethod === "MERCHANT_UPI" ? `
    <div style="background:#edf7ee;border:1px solid #c3e6cb;border-radius:6px;padding:1rem;margin:1.2rem 0">
      <p style="margin:0;font-size:.9rem;color:#155724;font-weight:600">Payment: Verified &amp; Paid ✓</p>
    </div>` : "");

  return send(to, `Order #${orderNumber} placed — AURELIA`, `
    <div style="font-family:Georgia,serif;max-width:560px;color:#29251f">
      <span style="display:inline-block;background:#6b7c5c;color:white;font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;padding:.25rem .6rem;border-radius:3px;margin-bottom:1rem">Order Received</span>
      <h1 style="font-size:1.8rem;margin:0 0 .6rem">Thank you for your order.</h1>
      <p style="color:#706b62;line-height:1.7;margin:0 0 1.2rem">
        Your order <strong>#${orderNumber}</strong> has been placed. ${utr ? "Our team is verifying your payment details and will confirm dispatch shortly." : "We are preparing your items."}
      </p>

      ${paymentDetailsHtml}

      <h2 style="font-size:1.1rem;margin:1.5rem 0 .6rem;border-bottom:1px solid #ded7cc;padding-bottom:.4rem">Items in your order</h2>
      <ul style="color:#706b62;line-height:1.8;padding-left:1.2rem;margin:0 0 1rem">
        ${itemsHtml}
      </ul>

      <p style="font-size:1.15rem;font-weight:600;margin:1rem 0;color:#29251f">Total Amount: ${total}</p>

      ${addressHtml}

      <div style="margin-top:1.8rem">
        <a href="${siteUrl()}/account/orders" style="display:inline-block;padding:.85rem 1.6rem;background:#29251f;color:white;text-decoration:none;font-size:.8rem;letter-spacing:.13em;text-transform:uppercase;border-radius:4px">View Order in Account</a>
      </div>
    </div>`);
}

const emailService = {
  sendWelcomeEmail,
  sendOtpEmail,
  sendOrderConfirmationEmail,
  sendOrderPlacedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendShippingEmail,
  sendRestockEmail,
  sendOrderStatusEmail,
  sendPaymentSubmittedEmail,
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
};

export default emailService;
