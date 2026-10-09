// Customer submits their UTR + optional screenshot after paying via Personal UPI.
// Sets payment status to UNDER_REVIEW — NEVER to PAID.
// Rate-limited (5 attempts per IP per minute) to prevent spam/abuse.
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitPersonalUpiPayment } from "@/lib/payments/payment-service";
import { sendOrderPlacedEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const MAX_SS_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_SS  = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const EXT_MAP: Record<string, string> = { "image/jpeg":"jpg","image/jpg":"jpg","image/png":"png","image/webp":"webp" };

export async function POST(request: NextRequest) {
  // Rate-limit: max 5 submissions per IP per 60s
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
           ?? request.headers.get("x-real-ip") ?? "unknown";
  const { allowed } = rateLimit(`personal-upi-submit:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait and try again." }, { status: 429 });
  }

  const session = await auth();

  // Parse as multipart (screenshot is optional) or JSON (UTR only).
  let paymentId: string | null = null;
  let utr: string | null = null;
  let payerName: string | null = null;
  let screenshotUrl: string | null = null;

  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    let fd: FormData;
    try { fd = await request.formData(); } catch {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }
    paymentId = (fd.get("paymentId") as string | null)?.trim() ?? null;
    utr       = (fd.get("utr")       as string | null)?.trim() ?? null;
    payerName = (fd.get("payerName") as string | null)?.trim() ?? null;

    const file = fd.get("screenshot") as File | null;
    if (file && file.size > 0) {
      if (!ALLOWED_SS.has(file.type)) {
        return NextResponse.json({ error: "Screenshot must be JPG, PNG or WebP." }, { status: 422 });
      }
      if (file.size > MAX_SS_SIZE) {
        return NextResponse.json({ error: "Screenshot is too large (max 5 MB)." }, { status: 422 });
      }
      const ext      = EXT_MAP[file.type] ?? "jpg";
      const fileName = `proof-${paymentId ?? "unknown"}-${Date.now()}.${ext}`;
      const folder   = path.join(process.cwd(), "public", "payment-proofs");
      await mkdir(folder, { recursive: true });
      const bytes = await file.arrayBuffer();
      await writeFile(path.join(folder, fileName), Buffer.from(bytes));
      screenshotUrl = `/payment-proofs/${fileName}`;
    }
  } else {
    let body: { paymentId?: string; utr?: string; payerName?: string };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }
    paymentId = body.paymentId?.trim() ?? null;
    utr       = body.utr?.trim() ?? null;
    payerName = body.payerName?.trim() ?? null;
  }

  if (!paymentId || !utr) {
    return NextResponse.json({ error: "paymentId and utr are required." }, { status: 400 });
  }
  if (!payerName) {
    return NextResponse.json({ error: "Name on bank / UPI account is required." }, { status: 422 });
  }
  if (utr.replace(/[^A-Z0-9]/gi, "").length < 6) {
    return NextResponse.json({ error: "Please enter a valid UTR / transaction reference." }, { status: 422 });
  }

  // Verify this payment belongs to the requesting user (or is a guest order).
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          lines: { select: { productName: true, size: true, quantity: true, totalPaise: true } },
          shippingAddress: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  if (payment.paymentMethod !== "PERSONAL_UPI") {
    return NextResponse.json({ error: "Invalid payment method for this endpoint." }, { status: 400 });
  }
  if (payment.status !== "PENDING_PAYMENT") {
    return NextResponse.json({
      error: payment.status === "UNDER_REVIEW"
        ? "Your payment details have already been submitted and are under review."
        : "This payment cannot accept further submissions.",
    }, { status: 409 });
  }
  if (payment.order.userId && session?.user?.id && payment.order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const updated = await submitPersonalUpiPayment(paymentId, { utr, payerName, screenshotUrl });

  // Clear the user's cart now that payment UTR has been submitted successfully
  if (payment.userId) {
    await db.savedItem.deleteMany({ where: { userId: payment.userId, type: "BAG" } }).catch(console.error);
  }

  // Send Order Placed confirmation email with full details
  const email = payment.order.user?.email ?? payment.order.guestEmail ?? session?.user?.email;
  if (email) {
    await sendOrderPlacedEmail({
      to: email,
      orderNumber: payment.order.orderNumber,
      totalPaise: payment.order.totalPaise,
      lines: payment.order.lines.map(l => ({
        productName: l.productName,
        size: l.size,
        quantity: l.quantity,
        totalPaise: l.totalPaise,
      })),
      shippingAddress: payment.order.shippingAddress ? {
        fullName: payment.order.shippingAddress.fullName,
        phone: payment.order.shippingAddress.phone,
        line1: payment.order.shippingAddress.line1,
        line2: payment.order.shippingAddress.line2,
        city: payment.order.shippingAddress.city,
        state: payment.order.shippingAddress.state,
        pincode: payment.order.shippingAddress.pincode,
      } : null,
      paymentMethod: "PERSONAL_UPI",
      utr,
    }).catch(err => console.error("[payments] Failed to send order placed email:", err));
  }

  return NextResponse.json({
    ok: true,
    status:    updated.status,
    orderNumber: payment.order.orderNumber,
    possibleDuplicate: updated.possibleDuplicate,
  });
}
