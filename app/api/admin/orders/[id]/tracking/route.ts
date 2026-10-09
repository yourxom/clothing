import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendShippingEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/admin-guard";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { trackingNumber, trackingProvider, customerEmail, orderNumber } =
    (body as Record<string, unknown>) ?? {};

  const order = await db.order.update({
    where: { id },
    data:  {
      trackingNumber:   String(trackingNumber  ?? "").trim().slice(0, 100) || null,
      trackingProvider: String(trackingProvider ?? "").trim().slice(0, 50)  || null,
      status:           "SHIPPED",
    },
  });

  if (customerEmail && typeof customerEmail === "string" && orderNumber) {
    sendShippingEmail(
      customerEmail,
      String(orderNumber),
      order.trackingNumber,
      order.trackingProvider,
    ).catch(console.error);
  }

  return NextResponse.json({ ok: true, order });
}
