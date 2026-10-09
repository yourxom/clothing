import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/returns — customer requests a return for a delivered order
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { orderId, reason } = (body as Record<string, unknown>) ?? {};
  const cleanReason = String(reason ?? "").trim().slice(0, 2000);

  if (!orderId) return NextResponse.json({ error: "Order is required." }, { status: 422 });
  if (cleanReason.length < 10) {
    return NextResponse.json({ error: "Please provide a reason (at least 10 characters)." }, { status: 422 });
  }

  const order = await db.order.findUnique({
    where: { id: String(orderId) },
    select: { id: true, userId: true, orderNumber: true, status: true },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Returns can only be requested for delivered orders." }, { status: 409 });
  }

  // Prevent duplicate open requests
  const existing = await db.returnRequest.findFirst({
    where: { orderId: order.id, status: { in: ["REQUESTED", "APPROVED", "RECEIVED"] } },
  });
  if (existing) {
    return NextResponse.json({ error: "A return request for this order is already in progress." }, { status: 409 });
  }

  const returnRequest = await db.returnRequest.create({
    data: {
      orderId:     order.id,
      userId:      session.user.id,
      orderNumber: order.orderNumber,
      reason:      cleanReason,
      status:      "REQUESTED",
    },
  });

  return NextResponse.json({ ok: true, returnRequest }, { status: 201 });
}
