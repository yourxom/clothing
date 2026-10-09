import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, normalizeIdentifier, type Channel } from "@/lib/otp";

// Verifies a code for an auth flow. On success the OTP is marked verified; the
// register/reset routes then confirm+consume it before performing the action.
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { identifier, channel, code } = (body as Record<string, unknown>) ?? {};
  const chan: Channel = channel === "phone" ? "phone" : "email";
  const cleanId = normalizeIdentifier(String(identifier ?? ""), chan);

  const result = await verifyOtp(cleanId, chan, String(code ?? ""));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, verified: true });
}
