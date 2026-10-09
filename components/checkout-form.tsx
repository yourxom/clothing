"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog";
import { usePreviewStore } from "./preview-store";
import { AureliaLogo } from "./aurelia-logo";

type CartLine = { product: Product; size: string; color?: string; quantity: number };

type SavedAddress = {
  id: string; fullName: string; phone: string;
  line1: string; line2: string | null;
  city: string; state: string; pincode: string; isDefault: boolean;
};

type DeliveryInfo = { minDays: number; maxDays: number; from: string; to: string };

type PaymentMethods = {
  merchant_upi: { enabled: boolean; name: string };
  personal_upi: { enabled: boolean; name: string };
  defaultMethod: "MERCHANT_UPI" | "PERSONAL_UPI";
};

type Props = {
  lines:          CartLine[];
  savedAddresses?: SavedAddress[];
  userEmail?:     string;
  userName?:      string;
  delivery?:      DeliveryInfo;
  pointsBalancePaise?: number;
};

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

type Step = "address" | "verify" | "review" | "placing" | "personal-upi" | "whatsapp-success";

export function CheckoutForm({ lines, savedAddresses = [], userEmail, userName, delivery, pointsBalancePaise = 0 }: Props) {
  const router  = useRouter();
  const { clearBag } = usePreviewStore();
  const [step,       setStep]       = useState<Step>("address");
  const [error,      setError]      = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [address, setAddress] = useState(() => {
    if (savedAddresses.length > 0) {
      const a = savedAddresses[0];
      return {
        fullName: a.fullName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? "",
        city: a.city,
        state: a.state,
        pincode: a.pincode,
      };
    }
    return {
      fullName: userName ?? "", phone: "", line1: "", line2: "",
      city: "", state: "", pincode: "",
    };
  });

  // Payment methods (fetched from server — no secrets exposed)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"MERCHANT_UPI" | "PERSONAL_UPI" | "WHATSAPP">("PERSONAL_UPI");

  // WhatsApp support order state
  const [whatsappConfig, setWhatsappConfig] = useState<{ enabled: boolean; number: string } | null>(null);
  const [whatsappOrderData, setWhatsappOrderData] = useState<{
    orderNumber: string;
    amountRs: string;
    whatsappUrl: string;
  } | null>(null);

  // Personal UPI payment state
  const [personalUpiData, setPersonalUpiData] = useState<{
    paymentId: string; upiId: string; accountName: string; bankName: string;
    instructions: string; qrImageUrl: string | null; amountPaise: number; orderNumber: string;
  } | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [payerNameInput, setPayerNameInput] = useState(userName ?? "");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then(r => r.json())
      .then((data: PaymentMethods) => {
        setPaymentMethods(data);
        setSelectedMethod(data.defaultMethod);
      })
      .catch(() => setPaymentMethods(null));

    fetch("/api/whatsapp")
      .then(r => r.json())
      .then((data: { enabled?: boolean; number?: string }) => {
        if (data.enabled && data.number) setWhatsappConfig({ enabled: true, number: data.number });
      })
      .catch(() => setWhatsappConfig(null));
  }, []);

  // PIN lookup
  const [pinLookup, setPinLookup] = useState<"idle"|"loading"|"done"|"error">("idle");
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  // OTP verification (Email only)
  const contactEmail = userEmail ?? guestEmail;
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");

  // Coupon
  const [couponInput,   setCouponInput]   = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number } | null>(null);
  const [couponMsg,     setCouponMsg]     = useState("");
  const [couponChecking, setCouponChecking] = useState(false);

  // Points / store credit (all values below in rupees; balance comes in paise)
  const pointsBalance = Math.floor(pointsBalancePaise / 100);
  const [usePoints,   setUsePoints]   = useState(false);

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
  const shipping = subtotal >= 2000 ? 0 : 99;
  const tax = lines.reduce((s, l) => {
    const rate = l.product.price > 1000 ? 0.12 : 0.05;
    return s + Math.round(l.product.price * l.quantity * rate);
  }, 0);
  const discount = appliedCoupon ? Math.round(appliedCoupon.discountPaise / 100) : 0;
  const payableBeforePoints = Math.max(0, subtotal + shipping + tax - discount);
  const pointsUsed = usePoints ? Math.min(pointsBalance, payableBeforePoints) : 0;
  const total    = Math.max(0, payableBeforePoints - pointsUsed);

  const merchantEnabled = Boolean(paymentMethods?.merchant_upi?.enabled);
  const personalEnabled = Boolean(paymentMethods?.personal_upi?.enabled);
  const whatsappEnabled = Boolean(whatsappConfig?.enabled && whatsappConfig?.number);
  const anyPaymentEnabled = merchantEnabled || personalEnabled || whatsappEnabled;

  // ── PIN → city/state autofill ──────────────────────────────────
  async function lookupPin(pin: string) {
    if (!/^\d{6}$/.test(pin)) return;
    setPinLookup("loading");
    try {
      const res  = await fetch(`/api/pincode/${pin}`);
      const json = await res.json() as { ok?: boolean; city?: string; state?: string; areas?: string[]; error?: string };
      if (json.ok && json.city && json.state) {
        setAddress(prev => ({ ...prev, city: json.city!, state: json.state! }));
        setCityOptions(json.areas ?? []);
        setPinLookup("done");
      } else {
        setPinLookup("error");
      }
    } catch {
      setPinLookup("error");
    }
  }

  // ── Coupon ──────────────────────────────────────────────────────
  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponChecking(true); setCouponMsg("");
    try {
      const res  = await fetch("/api/coupons/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotalPaise: subtotal * 100 }),
      });
      const json = await res.json() as { ok?: boolean; code?: string; discountPaise?: number; error?: string };
      if (json.ok && json.code) {
        setAppliedCoupon({ code: json.code, discountPaise: json.discountPaise ?? 0 });
        setCouponMsg(`Coupon "${json.code}" applied.`);
      } else {
        setAppliedCoupon(null);
        setCouponMsg(json.error ?? "Invalid coupon.");
      }
    } catch {
      setCouponMsg("Could not validate coupon. Try again.");
    } finally {
      setCouponChecking(false);
    }
  }
  function removeCoupon() { setAppliedCoupon(null); setCouponInput(""); setCouponMsg(""); }

  function handleAddressChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // ── Email OTP send / verify ─────────────────────────────────────
  async function sendOtp(_channel: "email" = "email") {
    setOtpBusy(true); setOtpMsg("");
    try {
      const res  = await fetch("/api/checkout/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: contactEmail, channel: "email" }),
      });
      const json = await res.json() as { ok?: boolean; message?: string; error?: string };
      if (res.ok && json.ok) {
        setEmailOtpSent(true);
        setOtpMsg(json.message ?? "Code sent to your email.");
      } else {
        setOtpMsg(json.error ?? "Could not send code.");
      }
    } catch {
      setOtpMsg("Network error. Try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function verifyOtp(_channel: "email" = "email") {
    setOtpBusy(true); setOtpMsg("");
    try {
      const res  = await fetch("/api/checkout/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: contactEmail, channel: "email", code: emailCode }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setEmailVerified(true);
        setOtpMsg("Email verified ✓");
      } else {
        setOtpMsg(json.error ?? "Verification failed.");
      }
    } catch {
      setOtpMsg("Network error. Try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  // ── Place order ─────────────────────────────────────────────────
  async function placeOrder() {
    setStep("placing"); setError("");
    try {
      // 1. Create the order server-side (amount computed on server).
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map(l => ({ productSlug: l.product.slug, size: l.size, color: l.color, quantity: l.quantity })),
          shippingAddress: address,
          guestEmail: userEmail ?? guestEmail ?? undefined,
          couponCode: appliedCoupon?.code,
          redeemPointsPaise: pointsUsed * 100,
          paymentMethod: selectedMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Could not place order. Please try again.");
        setStep("review"); return;
      }
      const newOrderId = (json as { order: { id: string } }).order.id;
      setCreatedOrderId(newOrderId);

      // 2. Branch on selected payment method.
      if (selectedMethod === "WHATSAPP") {
        const orderNumber = (json as { order: { orderNumber: string } }).order.orderNumber;
        const amountFormatted = formatPrice(total);

        // Record a pending payment tracking attempt for admin review
        try {
          await fetch("/api/payments/personal-upi/initiate", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: newOrderId }),
          });
        } catch {}

        clearBag();

        const waLines = lines
          .map(l => `• ${l.quantity}x ${l.product.name} (Size: ${l.size}) - ${formatPrice(l.product.price * l.quantity)}`)
          .join("\n");

        const waMessage = [
          `Hi AURELIA Support! 👋`,
          `I would like to place and complete payment for my order via WhatsApp Support:`,
          ``,
          `🛍️ *Order ID:* #${orderNumber}`,
          `💰 *Total Amount:* ${amountFormatted}`,
          `👤 *Customer Name:* ${address.fullName}`,
          `📞 *Phone:* ${address.phone}`,
          `📍 *Delivery Address:*`,
          `${address.line1}${address.line2 ? `, ${address.line2}` : ""}, ${address.city}, ${address.state} – ${address.pincode}`,
          ``,
          `📦 *Order Items:*`,
          waLines,
          ``,
          `Please assist me with completing payment and confirming my order. Thank you!`,
        ].join("\n");

        const waUrl = `https://wa.me/${whatsappConfig?.number ?? ""}?text=${encodeURIComponent(waMessage)}`;

        setWhatsappOrderData({
          orderNumber,
          amountRs: amountFormatted,
          whatsappUrl: waUrl,
        });

        if (typeof window !== "undefined" && whatsappConfig?.number) {
          window.open(waUrl, "_blank", "noopener,noreferrer");
        }

        setStep("whatsapp-success");
        return;
      }

      if (selectedMethod === "PERSONAL_UPI") {
        // Initiate Personal UPI payment — server generates QR + payment record.
        const upiRes  = await fetch("/api/payments/personal-upi/initiate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: newOrderId }),
        });
        const upiJson = await upiRes.json() as {
          ok?: boolean; paymentId?: string; upiId?: string; accountName?: string;
          bankName?: string; instructions?: string; qrImageUrl?: string | null;
          amountPaise?: number; orderNumber?: string; error?: string;
        };
        if (!upiRes.ok || !upiJson.ok) {
          setError(upiJson.error ?? "Could not initiate payment. Please try again.");
          setStep("review"); return;
        }
        setPersonalUpiData({
          paymentId:   upiJson.paymentId!,
          upiId:       upiJson.upiId!,
          accountName: upiJson.accountName ?? "AURELIA",
          bankName:    upiJson.bankName ?? "",
          instructions: upiJson.instructions ?? "",
          qrImageUrl:  upiJson.qrImageUrl ?? null,
          amountPaise: upiJson.amountPaise!,
          orderNumber: upiJson.orderNumber!,
        });
        setStep("personal-upi");
        return;
      }

      // Merchant UPI (Razorpay) path.
      if (selectedMethod === "MERCHANT_UPI") {
        const rzpRes  = await fetch("/api/orders/razorpay", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: newOrderId }),
        });
        const rzpJson = await rzpRes.json() as {
          ok?: boolean; razorpayOrderId?: string; amount?: number; currency?: string; keyId?: string; error?: string;
        };
        if (!rzpRes.ok || !rzpJson.ok) {
          setError(rzpJson.error ?? "Payment gateway error. Please try again.");
          setStep("review"); return;
        }
        await new Promise<void>((resolve, reject) => {
          if (document.getElementById("rzp-script")) { resolve(); return; }
          const s = document.createElement("script");
          s.id = "rzp-script"; s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve(); s.onerror = () => reject(new Error("SDK load failed"));
          document.body.appendChild(s);
        });
        const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open(): void } }).Razorpay({
          key: rzpJson.keyId, amount: rzpJson.amount, currency: rzpJson.currency ?? "INR",
          order_id: rzpJson.razorpayOrderId, name: "AURELIA", description: "AURELIA Order",
          prefill: { email: contactEmail, name: address.fullName, contact: address.phone },
          theme: { color: "#6b7c5c" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verifyRes = await fetch("/api/orders/verify-payment", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: newOrderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            if (verifyRes.ok) {
              clearBag();
              router.push(`/checkout/confirmation/${newOrderId}`);
            } else {
              setError("Payment verification failed. Contact support with your order number.");
              setStep("review");
            }
          },
        });
        rzp.open();
        setStep("review");
        return;
      }

      setError("No payment method selected."); setStep("review");
    } catch {
      setError("Network error. Please try again."); setStep("review");
    }
  }

  // ── Personal UPI: submit UTR + optional screenshot ───────────────
  async function submitUpiPayment() {
    if (!personalUpiData || !utrInput.trim()) {
      setSubmitMsg("Please enter your UTR / transaction reference number."); return;
    }
    if (!payerNameInput.trim()) {
      setSubmitMsg("Please enter the name on the bank / UPI account from which payment was made."); return;
    }
    setSubmitting(true); setSubmitMsg("");
    try {
      const fd = new FormData();
      fd.append("paymentId", personalUpiData.paymentId);
      fd.append("utr", utrInput.trim());
      fd.append("payerName", payerNameInput.trim());
      if (screenshotFile) fd.append("screenshot", screenshotFile);

      const res  = await fetch("/api/payments/personal-upi/submit", { method: "POST", body: fd });
      const json = await res.json() as { ok?: boolean; possibleDuplicate?: boolean; error?: string };
      if (res.ok && json.ok) {
        setSubmitted(true);
        clearBag();
      } else {
        setSubmitMsg(json.error ?? "Could not submit payment. Try again.");
      }
    } catch {
      setSubmitMsg("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function validateAddress(): boolean {
    if (!address.fullName || !address.phone || !address.line1 ||
        !address.city || !address.state || !address.pincode) {
      setError("Please fill in all required fields."); return false;
    }
    if (!userEmail && (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))) {
      setError("Please enter a valid email address."); return false;
    }
    if (!/^\d{10}$/.test(address.phone.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit phone number."); return false;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      setError("Please enter a valid 6-digit PIN code."); return false;
    }
    return true;
  }

  // ══════════════════════════ STEP 1: ADDRESS ══════════════════════════
  if (step === "address") {
    return (
      <div className="checkout-layout">
        <div className="checkout-form-col">
          <h2 className="serif checkout-step-title">Delivery address</h2>

          {savedAddresses.length > 0 && (
            <div className="checkout-saved-addresses">
              <p className="checkout-saved-label">Deliver to a saved address:</p>
              <div className="checkout-saved-list">
                {savedAddresses.map(addr => {
                  const isSelected =
                    address.fullName.trim() === addr.fullName.trim() &&
                    address.phone.trim() === addr.phone.trim() &&
                    address.line1.trim() === addr.line1.trim() &&
                    address.pincode.trim() === addr.pincode.trim();

                  return (
                    <button key={addr.id} type="button" className={`checkout-saved-card ${isSelected ? "checkout-saved-card--selected" : ""}`}
                      style={isSelected ? { borderColor: "var(--accent, #333)", background: "#f7f3ee" } : undefined}
                      onClick={() => setAddress({
                        fullName: addr.fullName, phone: addr.phone,
                        line1: addr.line1, line2: addr.line2 ?? "",
                        city: addr.city, state: addr.state, pincode: addr.pincode,
                      })}>
                      {addr.isDefault && <span className="addrbook-default-tag" style={{ fontSize:".6rem", marginBottom:".3rem" }}>Default</span>}
                      <p style={{ fontWeight:600, margin:0, fontSize:".82rem" }}>{addr.fullName}</p>
                      <p style={{ margin:".15rem 0 0", fontSize:".77rem", color:"var(--muted)" }}>
                        {addr.line1}, {addr.city} — {addr.pincode}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="checkout-saved-or">Or enter a new address:</p>
            </div>
          )}

          {!userEmail && (
            <div className="contact-field">
              <label htmlFor="co-email">Email address *</label>
              <input id="co-email" name="email" type="email" required
                placeholder="you@example.com" autoComplete="email"
                value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
            </div>
          )}

          <div className="checkout-name-row">
            <div className="contact-field">
              <label htmlFor="co-name">Full name *</label>
              <input id="co-name" name="fullName" type="text" required
                value={address.fullName} onChange={handleAddressChange}
                autoComplete="name" maxLength={100} />
            </div>
            <div className="contact-field">
              <label htmlFor="co-phone">Phone *</label>
              <input id="co-phone" name="phone" type="tel" required
                value={address.phone} onChange={handleAddressChange}
                autoComplete="tel" maxLength={10} placeholder="10-digit mobile" />
            </div>
          </div>

          <div className="contact-field">
            <label htmlFor="co-line1">Address line 1 *</label>
            <input id="co-line1" name="line1" type="text" required
              value={address.line1} onChange={handleAddressChange}
              autoComplete="address-line1" maxLength={200}
              placeholder="House / Flat no., Building, Street" />
          </div>

          <div className="contact-field">
            <label htmlFor="co-line2">Address line 2</label>
            <input id="co-line2" name="line2" type="text"
              value={address.line2} onChange={handleAddressChange}
              autoComplete="address-line2" maxLength={200}
              placeholder="Area, Landmark (optional)" />
          </div>

          {/* PIN first so it can auto-fill city/state */}
          <div className="checkout-city-row">
            <div className="contact-field">
              <label htmlFor="co-pincode">PIN code *</label>
              <input id="co-pincode" name="pincode" type="text" required
                value={address.pincode}
                onChange={e => {
                  handleAddressChange(e);
                  const v = e.target.value.replace(/\D/g, "");
                  if (v.length === 6) lookupPin(v);
                  else setPinLookup("idle");
                }}
                autoComplete="postal-code" maxLength={6} pattern="\d{6}"
                placeholder="6-digit PIN" />
              {pinLookup === "loading" && <span className="pin-hint">Looking up…</span>}
              {pinLookup === "done"    && <span className="pin-hint pin-hint--ok">✓ City &amp; state filled from PIN</span>}
              {pinLookup === "error"   && <span className="pin-hint pin-hint--err">Couldn&apos;t find PIN — enter city manually</span>}
            </div>
            <div className="contact-field">
              <label htmlFor="co-city">City / District *</label>
              {cityOptions.length > 1 ? (
                <select id="co-city" name="city" required value={address.city} onChange={handleAddressChange}>
                  <option value="">Select area</option>
                  {/* District as primary option, plus post-office areas */}
                  {address.city && !cityOptions.includes(address.city) && (
                    <option value={address.city}>{address.city}</option>
                  )}
                  {cityOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              ) : (
                <input id="co-city" name="city" type="text" required
                  value={address.city} onChange={handleAddressChange}
                  autoComplete="address-level2" maxLength={100} />
              )}
            </div>
          </div>

          <div className="contact-field">
            <label htmlFor="co-state">State *</label>
            <select id="co-state" name="state" required value={address.state} onChange={handleAddressChange}>
              <option value="">Select state</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button type="button" className="button" style={{ marginTop: "1rem", width: "100%" }}
            onClick={() => { if (validateAddress()) { setError(""); setStep("verify"); } }}>
            Continue to verification
          </button>
          {error && <p className="contact-field-error" role="alert">{error}</p>}
        </div>

        <OrderSummary lines={lines} subtotal={subtotal} shipping={shipping} tax={tax}
          discount={discount} couponCode={appliedCoupon?.code} pointsUsed={pointsUsed} total={total} delivery={delivery} />
      </div>
    );
  }

  // ══════════════════════════ STEP 2: VERIFY ══════════════════════════
  if (step === "verify") {
    return (
      <div className="checkout-layout">
        <div className="checkout-form-col">
          <h2 className="serif checkout-step-title">Verify your email</h2>
          <p className="checkout-verify-intro">
            For your security, please verify your email address before placing the order.
          </p>

          {/* Email verification */}
          <div className={`verify-block${emailVerified ? " verify-block--done" : ""}`}>
            <div className="verify-block-head">
              <span>Email · {contactEmail}</span>
              {emailVerified && <span className="verify-badge">✓ Verified</span>}
            </div>
            {!emailVerified && (
              <>
                {!emailOtpSent ? (
                  <button type="button" className="button button-outline verify-send-btn"
                    disabled={otpBusy} onClick={() => sendOtp("email")}>
                    {otpBusy ? "Sending…" : "Send code to email"}
                  </button>
                ) : (
                  <div className="verify-code-row">
                    <input type="text" inputMode="numeric" maxLength={6}
                      value={emailCode} onChange={e => setEmailCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit code" className="verify-code-input" />
                    <button type="button" className="button" disabled={otpBusy || emailCode.length !== 6}
                      onClick={() => verifyOtp("email")}>Verify</button>
                    <button type="button" className="verify-resend" disabled={otpBusy}
                      onClick={() => sendOtp("email")}>Resend</button>
                  </div>
                )}
              </>
            )}
          </div>

          {otpMsg && <p className="verify-msg" role="status">{otpMsg}</p>}

          <button type="button" className="button" style={{ marginTop: "1.2rem", width: "100%" }}
            disabled={!emailVerified}
            onClick={() => setStep("review")}>
            {emailVerified ? "Continue to review" : "Verify email to continue"}
          </button>
          <button type="button" className="button button-outline"
            style={{ marginTop: ".6rem", width: "100%" }}
            onClick={() => setStep("address")}>Back</button>
        </div>

        <OrderSummary lines={lines} subtotal={subtotal} shipping={shipping} tax={tax}
          discount={discount} couponCode={appliedCoupon?.code} pointsUsed={pointsUsed} total={total} delivery={delivery} />
      </div>
    );
  }

  // ══════════════════════════ STEP 3: REVIEW ══════════════════════════
  if (step === "review") {
    return (
      <div className="checkout-layout">
        <div className="checkout-form-col">
          <h2 className="serif checkout-step-title">Review &amp; place order</h2>

          <div className="checkout-review-address">
            <h3>Delivering to</h3>
            <p>{address.fullName} · {address.phone} · <span style={{ color: "var(--muted)" }}>{contactEmail}</span></p>
            <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
            <p>{address.city}, {address.state} – {address.pincode}</p>
            <button type="button" className="text-link" onClick={() => setStep("address")}
              style={{ marginTop: ".5rem", display: "inline-block" }}>Edit address</button>
          </div>

          <div className="checkout-coupon">
            <label htmlFor="coupon-code" className="checkout-coupon-label">Have a coupon code?</label>
            {appliedCoupon ? (
              <div className="checkout-coupon-applied">
                <span>✓ <strong>{appliedCoupon.code}</strong> applied</span>
                <button type="button" onClick={removeCoupon} className="checkout-coupon-remove">Remove</button>
              </div>
            ) : (
              <div className="checkout-coupon-row">
                <input id="coupon-code" type="text" value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code" maxLength={40} className="checkout-coupon-input" />
                <button type="button" onClick={applyCoupon} disabled={couponChecking}
                  className="button button-outline checkout-coupon-btn">
                  {couponChecking ? "…" : "Apply"}
                </button>
              </div>
            )}
            {couponMsg && <p className={appliedCoupon ? "checkout-coupon-ok" : "checkout-coupon-err"}>{couponMsg}</p>}
          </div>

          {/* Points / store credit */}
          {pointsBalance > 0 && (
            <div className="checkout-coupon checkout-points">
              <label className="checkout-coupon-label" htmlFor="use-points">Your points</label>
              <label className="checkout-points-row" htmlFor="use-points">
                <input id="use-points" type="checkbox" checked={usePoints}
                  onChange={e => setUsePoints(e.target.checked)} />
                <span>
                  Redeem <strong>{formatPrice(Math.min(pointsBalance, payableBeforePoints))}</strong> from your
                  balance of {formatPrice(pointsBalance)} points
                </span>
              </label>
              {usePoints && pointsUsed > 0 && (
                <p className="checkout-coupon-ok">−{formatPrice(pointsUsed)} applied as store credit.</p>
              )}
            </div>
          )}

          {/* ── Payment method selection ───────────────────────── */}
          {(paymentMethods || whatsappEnabled) && anyPaymentEnabled && (
            <div className="checkout-payment-methods">
              <h3 className="checkout-payment-heading">Payment method</h3>
              {merchantEnabled && (
                <label className={`checkout-payment-option${selectedMethod === "MERCHANT_UPI" ? " checkout-payment-option--selected" : ""}`}>
                  <input type="radio" name="paymentMethod" value="MERCHANT_UPI"
                    checked={selectedMethod === "MERCHANT_UPI"}
                    onChange={() => setSelectedMethod("MERCHANT_UPI")} />
                  <span className="checkout-payment-label">
                    <span className="checkout-payment-name">
                      {paymentMethods?.merchant_upi?.name || "UPI — Instant Confirmation"}
                    </span>
                    <span className="checkout-payment-desc">Automatic payment confirmation via secure gateway</span>
                  </span>
                </label>
              )}
              {personalEnabled && (
                <label className={`checkout-payment-option${selectedMethod === "PERSONAL_UPI" ? " checkout-payment-option--selected" : ""}`}>
                  <input type="radio" name="paymentMethod" value="PERSONAL_UPI"
                    checked={selectedMethod === "PERSONAL_UPI"}
                    onChange={() => setSelectedMethod("PERSONAL_UPI")} />
                  <span className="checkout-payment-label">
                    <span className="checkout-payment-name">
                      {paymentMethods?.personal_upi?.name || "Direct UPI"}
                    </span>
                    <span className="checkout-payment-desc">Pay directly via UPI — manually verified by our team</span>
                  </span>
                </label>
              )}
              {whatsappEnabled && (
                <label className={`checkout-payment-option checkout-payment-option--whatsapp${selectedMethod === "WHATSAPP" ? " checkout-payment-option--selected" : ""}`}>
                  <input type="radio" name="paymentMethod" value="WHATSAPP"
                    checked={selectedMethod === "WHATSAPP"}
                    onChange={() => setSelectedMethod("WHATSAPP")} />
                  <span className="checkout-payment-label">
                    <span className="checkout-payment-name" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <svg viewBox="0 0 32 32" width="18" height="18" fill="#25D366" aria-hidden="true" style={{ flexShrink: 0 }}>
                        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.05 9.38L1.05 31.3l6.114-1.955A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.312 22.598c-.386 1.09-1.92 1.996-3.144 2.26-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826 0-2.296 1.166-3.424 1.636-3.904.386-.394.844-.574 1.322-.574.154 0 .294.008.42.014.386.016.58.038.834.646.316.762 1.088 2.658 1.18 2.844.094.186.156.404.032.65-.116.246-.218.354-.404.57-.186.216-.362.382-.548.614-.17.216-.362.45-.148.822.214.364.95 1.564 2.038 2.532 1.404 1.25 2.542 1.638 2.95 1.808.304.126.666.096.888-.144.282-.31.63-.822.984-1.328.252-.362.57-.408.9-.284.336.116 2.124 1.002 2.49 1.184.366.184.61.272.7.424.09.156.09.898-.296 1.99Z"/>
                      </svg>
                      <span>Order via WhatsApp Support</span>
                      <span className="checkout-payment-badge">Assisted</span>
                    </span>
                    <span className="checkout-payment-desc">Chat directly with our support team to confirm items, get payment assistance, and complete your order</span>
                  </span>
                </label>
              )}
            </div>
          )}

          {!anyPaymentEnabled && (
            <div className="notice notice--warn" style={{ marginTop: "1rem" }}>
              Ordering and payment is currently unavailable. Please check back shortly.
            </div>
          )}

          {error && <p className="contact-field-error" role="alert">{error}</p>}

          <button type="button" className="button" style={{ marginTop: "1.5rem", width: "100%" }}
            disabled={!anyPaymentEnabled}
            onClick={placeOrder}>
            {anyPaymentEnabled
              ? (selectedMethod === "WHATSAPP"
                  ? <>Order via WhatsApp Support · {formatPrice(total)}</>
                  : selectedMethod === "PERSONAL_UPI"
                  ? <>Continue to payment · {formatPrice(total)}</>
                  : <>Pay securely · {formatPrice(total)}</>)
              : <>Payment unavailable</>}
          </button>
          <button type="button" className="button button-outline"
            style={{ marginTop: ".6rem", width: "100%" }}
            onClick={() => setStep("verify")}>Back</button>
        </div>

        <OrderSummary lines={lines} subtotal={subtotal} shipping={shipping} tax={tax}
          discount={discount} couponCode={appliedCoupon?.code} pointsUsed={pointsUsed} total={total} delivery={delivery} />
      </div>
    );
  }

  // ══════════════════════════ PLACING ══════════════════════════
  if (step === "placing") {
    return (
      <div className="checkout-placing">
        <div className="checkout-placing-spinner" aria-hidden="true" />
        <p>Placing your order…</p>
      </div>
    );
  }

  // ══════════════════════ PERSONAL UPI PAYMENT ═════════════════
  if (step === "personal-upi" && personalUpiData) {
    const amountRs = (personalUpiData.amountPaise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

    if (submitted) {
      return (
        <div className="payment-page">
          <div className="payment-success-card payment-success-card--pending">
            <div className="payment-success-icon" aria-hidden="true">⏳</div>
            <span className="eyebrow" style={{ color: "#b45309", marginBottom: "0.4rem", display: "inline-block" }}>Verification Underway</span>
            <h1 className="payment-success-title">Payment Submitted Successfully</h1>
            <p className="payment-success-sub">
              Your payment reference has been received. Our team will verify your UTR against our bank statement (usually within 15–30 minutes) and send you a confirmation email.
            </p>
            <table className="payment-detail-table">
              <tbody>
                <tr><td>Order Number</td><td><strong>#{personalUpiData.orderNumber}</strong></td></tr>
                <tr><td>Amount Paid</td><td><strong>{amountRs}</strong></td></tr>
                <tr><td>UTR / Transaction Ref</td><td><strong style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.06em" }}>{utrInput.toUpperCase()}</strong></td></tr>
                <tr><td>Current Status</td><td><span className="payment-status payment-status--under-review">Under Review</span></td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" className="button" onClick={() => router.push("/account/orders")}>
                View My Orders
              </button>
              <button type="button" className="button button-outline" onClick={() => router.push("/shop")}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Parse instruction text into clean, individual numbered steps
    const rawInstructions = personalUpiData.instructions?.trim() || "";
    const parsedSteps = (() => {
      if (!rawInstructions) return [];
      const numbered = rawInstructions.split(/(?=(?:^|\s+)[1-9]\.\s+)/)
        .map(s => s.trim().replace(/^[1-9]\.\s*/, ""))
        .filter(Boolean);
      if (numbered.length > 1) return numbered;
      const lines = rawInstructions.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
      return lines.length > 0 ? lines : [rawInstructions];
    })();

    const handleCopyUpi = () => {
      navigator.clipboard.writeText(personalUpiData.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    };

    return (
      <div className="payment-page">
        {/* Progress tracker */}
        <div className="payment-progress-bar" aria-hidden="true">
          <div className="payment-progress-step">
            <span className="payment-progress-num">✓</span>
            <span>Delivery Address</span>
          </div>
          <div className="payment-progress-divider" />
          <div className="payment-progress-step is-active">
            <span className="payment-progress-num">2</span>
            <span>Scan & Pay (UPI)</span>
          </div>
          <div className="payment-progress-divider" />
          <div className="payment-progress-step">
            <span className="payment-progress-num">3</span>
            <span>Verification & Confirmation</span>
          </div>
        </div>

        <div className="payment-grid">
          {/* ── Left Column: QR Code & Payment Details ── */}
          <div className="payment-card">
            <div className="payment-card-header">
              <div className="payment-brand-badge">
                <AureliaLogo size={20} />
                <span>AURELIA UPI</span>
              </div>
              <span className="payment-status-badge">
                ● Awaiting Payment
              </span>
            </div>

            <div className="payment-amount-block">
              <p className="payment-amount-label">Exact Amount to Pay</p>
              <p className="payment-amount">{amountRs}</p>
              <p className="payment-amount-note">Order #{personalUpiData.orderNumber} · Do not alter this amount</p>
            </div>

            {/* QR code */}
            {personalUpiData.qrImageUrl && (
              <div className="payment-qr-block">
                <div className="payment-qr-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={personalUpiData.qrImageUrl}
                    alt="UPI QR code — scan to pay"
                    className="payment-qr-img"
                    width={210}
                    height={210}
                  />
                </div>
                <p className="payment-qr-caption">Scan with any UPI application</p>
                <div className="payment-qr-apps">
                  <span className="payment-app-pill">Google Pay</span>
                  <span className="payment-app-pill">PhonePe</span>
                  <span className="payment-app-pill">Paytm</span>
                  <span className="payment-app-pill">BHIM</span>
                  <span className="payment-app-pill">Cred</span>
                </div>
              </div>
            )}

            {/* UPI ID Row */}
            <div className="payment-upi-section">
              <div className="payment-upi-label-row">
                <span className="payment-upi-label">Or Pay Directly via UPI ID</span>
                {personalUpiData.accountName && (
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    Account: <strong>{personalUpiData.accountName}</strong>
                  </span>
                )}
              </div>
              <div className="payment-upi-box">
                <span className="payment-upi-id">{personalUpiData.upiId}</span>
                <button
                  type="button"
                  className={`payment-copy-btn${copied ? " is-copied" : ""}`}
                  onClick={handleCopyUpi}
                  aria-label="Copy UPI ID"
                >
                  {copied ? "✓ Copied" : "Copy ID"}
                </button>
              </div>
              {personalUpiData.bankName && (
                <div className="payment-bank-info">
                  <span>🏛 Bank / Gateway:</span>
                  <strong>{personalUpiData.bankName}</strong>
                </div>
              )}
            </div>

            {/* Structured Step Instructions */}
            {parsedSteps.length > 0 && (
              <div className="payment-instructions-card">
                <div className="payment-instructions-heading">
                  <span>📋</span>
                  <span>Payment Instructions</span>
                </div>
                <ol className="payment-step-list">
                  {parsedSteps.map((stepText, idx) => (
                    <li key={idx} className="payment-step-item">
                      <span className="payment-step-num">{idx + 1}</span>
                      <span className="payment-step-text">{stepText}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {whatsappConfig?.enabled && (
              <div className="payment-whatsapp-assist">
                <div className="payment-whatsapp-assist__info">
                  <strong>Need help or prefer paying via WhatsApp?</strong>
                  <p>Our executive can assist you with payment, QR scanning, or verifying your order directly over chat.</p>
                </div>
                <button
                  type="button"
                  className="payment-whatsapp-btn"
                  onClick={() => {
                    const msg = [
                      `Hi AURELIA Support! 👋`,
                      `I'm on the payment page for Order #${personalUpiData.orderNumber} (Amount: ${amountRs}).`,
                      ``,
                      `Customer: ${address.fullName} (${address.phone})`,
                      ``,
                      `I need help completing payment / verifying via WhatsApp.`,
                    ].join("\n");
                    window.open(`https://wa.me/${whatsappConfig.number}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
                  }}
                >
                  <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.05 9.38L1.05 31.3l6.114-1.955A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.312 22.598c-.386 1.09-1.92 1.996-3.144 2.26-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826 0-2.296 1.166-3.424 1.636-3.904.386-.394.844-.574 1.322-.574.154 0 .294.008.42.014.386.016.58.038.834.646.316.762 1.088 2.658 1.18 2.844.094.186.156.404.032.65-.116.246-.218.354-.404.57-.186.216-.362.382-.548.614-.17.216-.362.45-.148.822.214.364.95 1.564 2.038 2.532 1.404 1.25 2.542 1.638 2.95 1.808.304.126.666.096.888-.144.282-.31.63-.822.984-1.328.252-.362.57-.408.9-.284.336.116 2.124 1.002 2.49 1.184.366.184.61.272.7.424.09.156.09.898-.296 1.99Z"/>
                  </svg>
                  <span>Pay via WhatsApp</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Right Column: UTR Reference Submission Form ── */}
          <div className="payment-card">
            <h2 className="payment-submit-heading">Confirm Your Payment</h2>
            <p className="payment-submit-sub">
              After paying in your UPI app, submit your transaction reference number (UTR) below to verify and complete your order.
            </p>

            <form onSubmit={e => { e.preventDefault(); submitUpiPayment(); }}>
              <div className="contact-field" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="utr-input" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 600 }}>12-Digit UTR / UPI Reference Number *</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Required</span>
                </label>
                <input
                  id="utr-input"
                  type="text"
                  value={utrInput}
                  onChange={e => setUtrInput(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                  placeholder="e.g. 428109384721"
                  maxLength={50}
                  className="payment-utr-input"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
                <span className="admin-settings-hint" style={{ marginTop: "0.45rem", display: "block", textAlign: "left" }}>
                  💡 Find this 12-digit number on your UPI app payment receipt or transaction history (labelled as <em>UPI Ref No.</em>, <em>UTR</em>, or <em>Transaction ID</em>).
                </span>
              </div>

              <div className="contact-field" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="payer-name-input" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 600 }}>Name on Bank / UPI Account *</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Required</span>
                </label>
                <input
                  id="payer-name-input"
                  type="text"
                  value={payerNameInput}
                  onChange={e => setPayerNameInput(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  maxLength={100}
                  className="payment-utr-input"
                  autoComplete="name"
                  spellCheck={false}
                  required
                />
                <span className="admin-settings-hint" style={{ marginTop: "0.45rem", display: "block", textAlign: "left" }}>
                  💡 Enter the account holder&apos;s name as shown in your UPI app / bank statement.
                </span>
              </div>

              <div className="contact-field" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="screenshot-input" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 600 }}>Payment Screenshot (Optional)</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Speeds up verification</span>
                </label>
                <input
                  id="screenshot-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={e => setScreenshotFile(e.target.files?.[0] ?? null)}
                  className="payment-utr-input"
                  style={{ fontSize: "0.85rem", padding: "0.6rem 0.8rem", cursor: "pointer" }}
                />
                <span className="admin-settings-hint" style={{ marginTop: "0.35rem", display: "block", textAlign: "left" }}>
                  Upload receipt screenshot (JPG, PNG, WebP · max 5 MB).
                </span>
              </div>

              {submitMsg && (
                <p className="contact-field-error" role="alert" style={{ marginBottom: "1rem", textAlign: "left" }}>{submitMsg}</p>
              )}

              <div className="payment-warning">
                <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>🛡️</span>
                <span>
                  <strong>Manual Verification:</strong> Your items are reserved immediately. Our team checks your UTR against our bank statement within 15–30 minutes, after which dispatch begins.
                </span>
              </div>

              <button
                type="submit"
                className="payment-btn-submit"
                disabled={submitting || !utrInput.trim()}
              >
                {submitting ? "Submitting for Verification…" : "Submit Payment for Verification →"}
              </button>

              <div className="payment-trust-badge">
                <span>🔒 256-Bit Encrypted</span>
                <span>•</span>
                <span>⚡ 15–30m Verification</span>
                <span>•</span>
                <span>📦 Prompt Dispatch</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════ WHATSAPP ORDER SUCCESS ═════════════════
  if (step === "whatsapp-success" && whatsappOrderData) {
    return (
      <div className="payment-page">
        <div className="payment-success-card payment-success-card--whatsapp">
          <div className="payment-success-icon" aria-hidden="true" style={{ color: "#25D366" }}>
            <svg viewBox="0 0 32 32" width="60" height="60" fill="#25D366" aria-hidden="true" style={{ margin: "0 auto", display: "block" }}>
              <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.05 9.38L1.05 31.3l6.114-1.955A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.312 22.598c-.386 1.09-1.92 1.996-3.144 2.26-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826 0-2.296 1.166-3.424 1.636-3.904.386-.394.844-.574 1.322-.574.154 0 .294.008.42.014.386.016.58.038.834.646.316.762 1.088 2.658 1.18 2.844.094.186.156.404.032.65-.116.246-.218.354-.404.57-.186.216-.362.382-.548.614-.17.216-.362.45-.148.822.214.364.95 1.564 2.038 2.532 1.404 1.25 2.542 1.638 2.95 1.808.304.126.666.096.888-.144.282-.31.63-.822.984-1.328.252-.362.57-.408.9-.284.336.116 2.124 1.002 2.49 1.184.366.184.61.272.7.424.09.156.09.898-.296 1.99Z"/>
            </svg>
          </div>
          <span className="eyebrow" style={{ color: "#166534", marginBottom: "0.4rem", display: "inline-block" }}>
            Order Created · WhatsApp Support
          </span>
          <h1 className="payment-success-title">Order Placed via WhatsApp Support</h1>
          <p className="payment-success-sub">
            Your order has been recorded in our system. A WhatsApp conversation has been initiated with our support team at{" "}
            <strong>+{whatsappConfig?.number}</strong> to assist you in completing your payment and finalizing your delivery.
          </p>
          <table className="payment-detail-table">
            <tbody>
              <tr><td>Order Number</td><td><strong>#{whatsappOrderData.orderNumber}</strong></td></tr>
              <tr><td>Total Amount</td><td><strong>{whatsappOrderData.amountRs}</strong></td></tr>
              <tr><td>Customer Name</td><td><strong>{address.fullName}</strong></td></tr>
              <tr><td>Contact Phone</td><td><strong>{address.phone}</strong></td></tr>
              <tr><td>Delivery Location</td><td><span>{address.city}, {address.state} – {address.pincode}</span></td></tr>
              <tr><td>Payment Status</td><td><span className="payment-status payment-status--under-review">Awaiting Payment</span></td></tr>
            </tbody>
          </table>

          <div style={{ marginTop: "1.8rem", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
            <a
              href={whatsappOrderData.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="payment-whatsapp-btn"
              style={{ width: "min(340px, 100%)", justifyContent: "center", padding: "0.85rem 1.25rem", fontSize: "0.92rem" }}
            >
              💬 Open WhatsApp Chat
            </a>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}>
              <button type="button" className="button button-outline" onClick={() => router.push("/account/orders")}>
                View My Orders
              </button>
              <button type="button" className="button button-outline" onClick={() => router.push("/shop")}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function OrderSummary({
  lines, subtotal, shipping, tax, discount = 0, couponCode, pointsUsed = 0, total, delivery,
}: {
  lines: CartLine[]; subtotal: number; shipping: number; tax: number;
  discount?: number; couponCode?: string; pointsUsed?: number; total: number; delivery?: DeliveryInfo;
}) {
  return (
    <aside className="checkout-summary">
      <h2 className="serif checkout-step-title">Order summary</h2>
      <div className="checkout-summary-lines">
        {lines.map((l, i) => (
          <div key={i} className="checkout-summary-line">
            <div>
              <span className="checkout-summary-name">{l.product.name}</span>
              <span className="checkout-summary-meta">{l.color ? `${l.color} · ` : ""}Size {l.size} · Qty {l.quantity}</span>
            </div>
            <span>{formatPrice(l.product.price * l.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="checkout-summary-totals">
        <div><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div><span>Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
        <div><span>GST</span><span>{formatPrice(tax)}</span></div>
        {discount > 0 && (
          <div className="checkout-summary-discount">
            <span>Discount{couponCode ? ` (${couponCode})` : ""}</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}
        {pointsUsed > 0 && (
          <div className="checkout-summary-discount">
            <span>Points redeemed</span>
            <span>−{formatPrice(pointsUsed)}</span>
          </div>
        )}
        <div className="checkout-summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
      </div>
      {delivery && (
        <div className="checkout-delivery-estimate">
          <span className="checkout-delivery-icon" aria-hidden="true">🚚</span>
          <div>
            <strong>Expected delivery</strong>
            <span>{delivery.from} – {delivery.to}</span>
            <span className="checkout-delivery-note">({delivery.minDays}–{delivery.maxDays} business days)</span>
          </div>
        </div>
      )}
      <p className="catalog-card-disclaimer">
        Inclusive of GST. Free shipping on orders above ₹2,000.
      </p>
    </aside>
  );
}
