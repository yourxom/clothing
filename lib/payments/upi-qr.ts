// Generates a standard UPI deep-link URI and a QR code image from it.
// The URI MUST be built only from server-trusted data (payee VPA from admin
// settings, amount from the server-calculated order total) — never from
// frontend input — so a customer can never alter the amount or payee.
import QRCode from "qrcode";

export type UpiLinkInput = {
  payeeVpa:    string; // e.g. example@upi — from admin settings, trusted
  payeeName:   string; // e.g. "AURELIA" or configured account holder name
  amountPaise: number; // server-calculated order total, in paise
  orderNumber: string; // used as the transaction note/reference
};

/** Builds a standard `upi://pay?...` URI. All inputs must already be server-trusted. */
export function buildUpiPaymentUri({ payeeVpa, payeeName, amountPaise, orderNumber }: UpiLinkInput): string {
  const amountRupees = (amountPaise / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: payeeVpa,
    pn: payeeName,
    am: amountRupees,
    cu: "INR",
    tn: `Order ${orderNumber}`,
  });
  return `upi://pay?${params.toString()}`;
}

/** Renders a UPI URI as a PNG data URL (data:image/png;base64,...) for inline <img> display. */
export async function generateUpiQrDataUrl(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
}
