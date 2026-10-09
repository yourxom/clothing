// Creates a Merchant UPI payment session for a given order.
// Works with any configured bank (Axis, ICICI, HDFC, Kotak, BoB) or Razorpay.
// Amount comes ONLY from the server-side Order record — never from the request.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createMerchantPayment } from "@/lib/payments/payment-service";

export async function POST(request: NextRequest) {
  const session = await auth();

  let body: { orderId?: string; bankAccountId?: string } = {};
  try { body = await request.json(); } catch { body = {}; }

  const { orderId, bankAccountId } = body;
  if (!orderId) return NextResponse.json({ error: "orderId is required." }, { status: 400 });

  // Fetch order — amount comes from DB, not the request body.
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, totalPaise: true, currency: true, userId: true,
              paymentStatus: true, user: { select: { name: true, email: true, phone: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (order.userId && session?.user?.id && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Order already paid." }, { status: 409 });
  }

  try {
    const result = await createMerchantPayment(
      { id: order.id, orderNumber: order.orderNumber, totalPaise: order.totalPaise,
        currency: order.currency, userId: order.userId },
      { name: order.user?.name ?? undefined, email: order.user?.email ?? undefined,
        phone: order.user?.phone ?? undefined },
      bankAccountId ?? null
    );

    return NextResponse.json({
      ok:              true,
      paymentId:       result.payment.id,
      merchantReference: result.merchantReference,
      expiresAt:       result.payment.expiresAt,
      clientConfig:    result.clientConfig, // provider, upiUri, qrDataUrl, etc. — no secrets
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
