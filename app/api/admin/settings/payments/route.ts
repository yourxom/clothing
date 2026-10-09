// Admin Payment Settings — GET current config (secrets masked), PATCH to update.
// Secrets are encrypted at rest (lib/payments/crypto.ts) and are NEVER returned
// to the frontend in decrypted form — only hasApiKey/hasApiSecret booleans and
// masked previews.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/payments/settings";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const settings = await getPaymentSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  // Basic validation on a few fields with real constraints.
  if (b.defaultMethod !== undefined && b.defaultMethod !== "MERCHANT_UPI" && b.defaultMethod !== "PERSONAL_UPI") {
    return NextResponse.json({ error: "defaultMethod must be MERCHANT_UPI or PERSONAL_UPI." }, { status: 422 });
  }
  if (b.merchantEnvironment !== undefined && b.merchantEnvironment !== "test" && b.merchantEnvironment !== "production") {
    return NextResponse.json({ error: "merchantEnvironment must be test or production." }, { status: 422 });
  }
  if (typeof b.personalUpiId === "string" && b.personalUpiId.trim()) {
    // Basic VPA shape check: name@bank
    if (!/^[\w.+-]{2,256}@[\w.-]{2,64}$/.test(b.personalUpiId.trim())) {
      return NextResponse.json({ error: "Enter a valid UPI ID, e.g. name@bank." }, { status: 422 });
    }
  }
  if (typeof b.merchantVpa === "string" && b.merchantVpa.trim() &&
      !/^[\w.+-]{2,256}@[\w.-]{2,64}$/.test(b.merchantVpa.trim())) {
    return NextResponse.json({ error: "Enter a valid merchant UPI ID / VPA." }, { status: 422 });
  }

  const settings = await updatePaymentSettings(b as Parameters<typeof updatePaymentSettings>[0]);

  // Audit trail: PaymentEvent is keyed to an individual Payment row (its
  // paymentId FK is required), so a global settings change doesn't fit there.
  // Log it to the server console instead — sufficient for a single-admin
  // store; swap for a dedicated AdminActionLog table if multi-admin auditing
  // of settings changes becomes a requirement.
  console.log(`[payments] Settings updated by admin ${session.user?.id ?? "unknown"} at ${new Date().toISOString()}`);

  return NextResponse.json({ ok: true, settings });
}
