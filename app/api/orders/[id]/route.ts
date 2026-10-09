import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { restoreOrderStock } from "@/lib/order-stock";

type Props = { params: Promise<{ id: string }> };

// GET /api/orders/[id] — fetch a single order
export async function GET(_: NextRequest, { params }: Props) {
  const session = await auth();
  const { id }  = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      lines:           true,
      shippingAddress: true,
      billingAddress:  true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Only the order owner or an admin may view it
  const isOwner = session?.user?.id && order.userId === session.user.id;
  const isGuest = !order.userId; // guest order — accessible via confirmation page token (future)
  if (!isOwner && !isGuest) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  return NextResponse.json({ ok: true, order });
}

// PATCH /api/orders/[id] — confirm payment (called after gateway webhook)
export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { paymentReference, paymentProvider } =
    (body as Record<string, unknown>) ?? {};

  const order = await db.order.update({
    where: { id },
    data:  {
      paymentStatus:    "PAID",
      status:           "CONFIRMED",
      paymentReference: String(paymentReference ?? "").slice(0, 200),
      paymentProvider:  String(paymentProvider  ?? "").slice(0, 50),
    },
  });

  return NextResponse.json({ ok: true, order });
}

// DELETE /api/orders/[id] — user cancels their own PENDING order
export async function DELETE(_: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true, userId: true, status: true, paymentStatus: true, paymentProvider: true,
      createdAt: true,
      lines: { select: { variantSku: true, quantity: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.userId !== session.user.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Only PENDING orders can be cancelled by the user
  if (order.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending orders can be cancelled. Contact support for shipped orders." },
      { status: 409 }
    );
  }

  // Cancellation is only allowed within 24 hours of placing the order.
  const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(order.createdAt).getTime();
  if (elapsed > CANCEL_WINDOW_MS) {
    return NextResponse.json(
      { error: "The 24-hour cancellation window has passed. Please contact support for help with this order." },
      { status: 409 }
    );
  }

  // Stock was reserved at creation for COD, or on payment for paid orders.
  const stockWasReserved = order.paymentProvider === "cod" || order.paymentStatus === "PAID";

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
    if (stockWasReserved) await restoreOrderStock(tx, order.lines);
    return result;
  });

  return NextResponse.json({ ok: true, order: updated });
}
