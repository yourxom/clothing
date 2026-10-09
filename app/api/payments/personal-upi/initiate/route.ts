// Creates a Personal UPI payment attempt for a given order and returns the
// UPI QR + payment details needed to show the payment page.
// Amount is taken from the server-side Order record — never from the request.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPersonalUpiPayment } from "@/lib/payments/payment-service";

export async function POST(request: NextRequest) {
  const session = await auth();

  let body: { orderId?: string };
  try { body = await request.json(); } catch { body = {}; }
  const { orderId } = body;
  if (!orderId) return NextResponse.json({ error: "orderId is required." }, { status: 400 });

  // Fetch the order — the amount comes from here, never from the request body.
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, totalPaise: true, currency: true, userId: true, paymentStatus: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Authorization: logged-in users can only pay their own orders; guests are
  // allowed if no userId is set on the order (guest checkout path).
  if (order.userId && session?.user?.id && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Don't create a new payment attempt for an already-paid order.
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
  }

  const result = await createPersonalUpiPayment({
    id: order.id,
    orderNumber: order.orderNumber,
    totalPaise: order.totalPaise,
    currency: order.currency,
    userId: order.userId,
  });

  return NextResponse.json({
    ok: true,
    paymentId:   result.payment.id,
    upiId:       result.upiId,
    accountName: result.accountName,
    bankName:    result.bankName,
    instructions: result.instructions,
    qrImageUrl:  result.qrImageUrl,
    amountPaise: result.amountPaise,
    orderNumber: order.orderNumber,
  });
}
