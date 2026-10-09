import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupon";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const code = String((body as Record<string, unknown>)?.code ?? "");
  const subtotalPaise = Math.max(0, Math.floor(Number((body as Record<string, unknown>)?.subtotalPaise) || 0));

  // Include the signed-in user so owned (welcome/personal) coupons validate
  // against their account.
  const session = await auth();
  const userId = session?.user?.id;

  const result = await validateCoupon(code, subtotalPaise, userId);
  if (!result.valid) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    code: result.code,
    discountPaise: result.discountPaise,
    description: result.description,
  });
}
