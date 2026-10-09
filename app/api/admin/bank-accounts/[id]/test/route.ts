// Tests connectivity/credentials for a bank account by calling the provider's
// isConfigured() check and optionally a lightweight API health call.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getBankAccountCredentials, recordTestResult } from "@/lib/payments/bank-account-service";
import { getMerchantProvider } from "@/lib/payments/provider-registry";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;

  const config = await getBankAccountCredentials(id);
  if (!config) return NextResponse.json({ error: "Account not found or inactive." }, { status: 404 });

  const provider = await getMerchantProvider(id);
  if (!provider) {
    await recordTestResult(id, false, "Provider could not be instantiated — check credentials.");
    return NextResponse.json({ ok: false, message: "Provider could not be instantiated. Ensure all required credentials are set." });
  }

  if (!provider.isConfigured()) {
    const msg = "Credentials incomplete — API key, API secret, and Merchant ID are all required.";
    await recordTestResult(id, false, msg);
    return NextResponse.json({ ok: false, message: msg });
  }

  // Try a lightweight status query (with a fake reference — bank will return "not found" which is fine).
  // This confirms the credentials are accepted by the bank's API.
  // TODO: Some banks have a dedicated health/ping endpoint — use that instead if available.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (provider as any).queryTransactionStatus?.("HEALTH-CHECK-TEST");
    const msg = result?.rawResponse?.message ?? "Connection attempted.";
    // A "not found" or "pending" response means credentials were accepted — that's a pass.
    const ok = result !== undefined;
    await recordTestResult(id, ok, ok ? "Connection successful." : msg);
    return NextResponse.json({ ok, message: ok ? "Credentials configured correctly. Bank API reachable." : msg });
  } catch (err) {
    const msg = (err as Error).message ?? "Unknown error during test.";
    await recordTestResult(id, false, msg);
    return NextResponse.json({ ok: false, message: msg });
  }
}
