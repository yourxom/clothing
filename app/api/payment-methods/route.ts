// Public endpoint — returns which payment methods are currently enabled.
// Never returns secrets, API keys, or provider credentials.
// Checkout fetches this on mount to decide which options to offer.
import { NextResponse } from "next/server";
import { getEnabledPaymentMethods } from "@/lib/payments/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const methods = await getEnabledPaymentMethods();
  return NextResponse.json(methods);
}
