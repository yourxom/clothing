// Creates a Razorpay order for a pending AURELIA order.
// Frontend calls this after /api/orders to get a Razorpay order_id for payment.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payment gateway not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env" },
      { status: 503 }
    );
  }

  const session = await auth();
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { orderId } = (body as Record<string, unknown>) ?? {};
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required." }, { status: 422 });
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Verify ownership
  const isOwner  = session?.user?.id && order.userId === session.user.id;
  const isGuest  = !order.userId;
  if (!isOwner && !isGuest) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Call Razorpay Orders API
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount:   order.totalPaise,       // already in paise
      currency: order.currency,
      receipt:  order.orderNumber,
      notes:    { aur_order_id: order.id },
    }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.json().catch(() => ({}));
    console.error("[razorpay] Order creation failed:", err);
    return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
  }

  const rzpOrder = await rzpRes.json() as { id: string; amount: number; currency: string };

  // Store Razorpay order reference on our order
  await db.order.update({
    where: { id: orderId },
    data:  { paymentProvider: "razorpay", paymentReference: rzpOrder.id },
  });

  return NextResponse.json({
    ok: true,
    razorpayOrderId: rzpOrder.id,
    amount:          rzpOrder.amount,
    currency:        rzpOrder.currency,
    keyId,
  });
}
