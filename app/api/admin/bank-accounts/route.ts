// Admin: list all bank payment accounts (GET) and create a new one (POST).
// All secrets are encrypted before storage; only masked previews are returned.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  listBankAccounts, createBankAccount,
  type CreateBankAccountInput,
} from "@/lib/payments/bank-account-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const accounts = await listBankAccounts();
  return NextResponse.json({ ok: true, accounts });
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  // Validate required fields
  if (!b.provider || !["AXIS","ICICI","HDFC","KOTAK","BOB"].includes(String(b.provider))) {
    return NextResponse.json({ error: "provider must be AXIS, ICICI, HDFC, KOTAK, or BOB." }, { status: 422 });
  }
  if (!b.displayName || typeof b.displayName !== "string" || !b.displayName.trim()) {
    return NextResponse.json({ error: "displayName is required." }, { status: 422 });
  }
  if (!b.merchantVpa || typeof b.merchantVpa !== "string") {
    return NextResponse.json({ error: "merchantVpa is required (e.g. business@axis)." }, { status: 422 });
  }
  if (!/^[\w.+-]{2,256}@[\w.-]{2,64}$/.test(String(b.merchantVpa).trim())) {
    return NextResponse.json({ error: "merchantVpa must be a valid UPI ID (e.g. business@axis)." }, { status: 422 });
  }

  const input: CreateBankAccountInput = {
    provider:       b.provider as CreateBankAccountInput["provider"],
    displayName:    String(b.displayName),
    merchantVpa:    String(b.merchantVpa),
    merchantName:   String(b.merchantName ?? b.displayName),
    environment:    b.environment === "production" ? "production" : "test",
    isActive:       Boolean(b.isActive),
    isDefault:      Boolean(b.isDefault),
    callbackUrl:    b.callbackUrl  ? String(b.callbackUrl)  : undefined,
    webhookUrl:     b.webhookUrl   ? String(b.webhookUrl)   : undefined,
    notes:          b.notes        ? String(b.notes)        : undefined,
    apiKey:         b.apiKey       ? String(b.apiKey)       : undefined,
    apiSecret:      b.apiSecret    ? String(b.apiSecret)    : undefined,
    webhookSecret:  b.webhookSecret ? String(b.webhookSecret) : undefined,
    merchantId:     b.merchantId   ? String(b.merchantId)   : undefined,
    additionalCreds: b.additionalCreds
      ? (b.additionalCreds as Record<string, string>)
      : undefined,
  };

  const account = await createBankAccount(input, session.user?.id ?? "unknown");
  return NextResponse.json({ ok: true, account }, { status: 201 });
}
