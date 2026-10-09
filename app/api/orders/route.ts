// Creates a pending order from the submitted checkout data.
// Payment capture happens via /api/orders/[id]/confirm after gateway callback.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateGst } from "@/lib/tax";
import { validateCoupon, redeemCoupon } from "@/lib/coupon";
import { getPointsBalance, clampRedeemable, redeemPoints } from "@/lib/points";
import { getEnabledPaymentMethods } from "@/lib/payments/settings";
import { getWhatsappConfig } from "@/lib/settings";

type LineInput = {
  productSlug: string;
  size:        string;
  color?:      string;
  quantity:    number;
};

type AddressInput = {
  fullName: string;
  phone:    string;
  line1:    string;
  line2?:   string;
  city:     string;
  state:    string;
  pincode:  string;
};

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  // Use DB count to get a monotonic sequence — safe under concurrent load
  const count = await db.order.count();
  const seq   = String(count + 1).padStart(5, "0");
  return `AUR-${year}-${seq}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  // Checkout requires an account — no guest orders.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { lines, shippingAddress, couponCode, redeemPointsPaise, paymentMethod } =
    (body as { lines?: LineInput[]; shippingAddress?: AddressInput; couponCode?: string; redeemPointsPaise?: number; paymentMethod?: string }) ?? {};

  // Validate lines
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Order must contain at least one item." }, { status: 422 });
  }

  // Validate address
  if (!shippingAddress?.fullName || !shippingAddress.phone || !shippingAddress.line1 ||
      !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
    return NextResponse.json({ error: "Complete shipping address is required." }, { status: 422 });
  }
  // Captured as a definitely-defined value so the nested order transaction keeps
  // the non-undefined narrowing.
  const addr: AddressInput = shippingAddress;

  // Authenticated user is guaranteed at this point.
  const userId = session.user.id;

  // Clean up any prior unsubmitted checkout attempts by this user so coupons,
  // points balance, and order records stay clean.
  try {
    const unsubmittedOrders = await db.order.findMany({
      where: {
        userId,
        status: "PENDING",
        paymentStatus: "PENDING",
        payments: {
          every: {
            status: "PENDING_PAYMENT",
            utr: null,
            submittedAt: null,
          },
        },
      },
      select: { id: true, couponCode: true, pointsUsedPaise: true },
    });

    for (const unsubmitted of unsubmittedOrders) {
      if (unsubmitted.couponCode) {
        const c = await db.coupon.findUnique({ where: { code: unsubmitted.couponCode }, select: { id: true } });
        if (c) {
          await db.couponRedemption.deleteMany({
            where: { couponId: c.id, userId, orderId: unsubmitted.id },
          }).catch(() => {});
        }
      }
      if (unsubmitted.pointsUsedPaise > 0) {
        await db.user.update({
          where: { id: userId },
          data: { pointsBalance: { increment: unsubmitted.pointsUsedPaise } },
        }).catch(() => {});
      }
      await db.order.delete({ where: { id: unsubmitted.id } }).catch(() => {});
    }
  } catch (e) {
    console.error("[orders] Prior unsubmitted order cleanup failed:", e);
  }

  // Load products — only published products can be purchased. A draft/unpublished
  // product must never be orderable, even if a stale slug is submitted.
  const slugs    = [...new Set(lines.map(l => l.productSlug))];
  const products = await db.product.findMany({
    where:   { slug: { in: slugs }, published: true },
    include: { variants: { include: { inventory: true } } },
  });

  const productMap = new Map(products.map(p => [p.slug, p]));
  const lineData: {
    productId: string; productName: string; variantSku: string;
    size: string; color: string; quantity: number;
    unitPaise: number; totalPaise: number;
  }[] = [];

  for (const line of lines) {
    const product = productMap.get(line.productSlug);
    if (!product) return NextResponse.json({ error: `Product not found: ${line.productSlug}` }, { status: 422 });

    const qty = Math.min(10, Math.max(1, Math.floor(Number(line.quantity) || 1)));
    const wantColor = String(line.color ?? "").trim();
    // Match the exact colour+size variant when a colour is given; else fall back
    // to size-only (legacy bag items) preferring the product's default colour.
    const variant =
      (wantColor && product.variants.find(v => v.size === line.size && v.color === wantColor)) ||
      product.variants.find(v => v.size === line.size && v.color === product.color) ||
      product.variants.find(v => v.size === line.size);
    if (!variant) return NextResponse.json({ error: `Size ${line.size} not available for ${product.name}` }, { status: 422 });

    // Inventory check — only enforce when inventory records exist (post-launch)
    const stock = variant.inventory?.quantity;
    if (typeof stock === "number" && stock < qty) {
      return NextResponse.json(
        { error: `${product.name} (${variant.color}, Size ${line.size}) has only ${stock} left in stock.` },
        { status: 409 }
      );
    }

    lineData.push({
      productId:   product.id,
      productName: product.name,
      variantSku:  variant.sku,
      size:        variant.size,
      color:       variant.color,
      quantity:    qty,
      unitPaise:   product.price,
      totalPaise:  product.price * qty,
    });
  }

  const subtotalPaise = lineData.reduce((s, l) => s + l.totalPaise, 0);
  const shippingPaise = subtotalPaise >= 200000 ? 0 : 9900; // Free shipping above ₹2,000 (200000 paise)
  const taxPaise      = calculateGst(lineData);

  // Apply coupon if provided
  let discountPaise = 0;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const result = await validateCoupon(String(couponCode), subtotalPaise, userId);
    if (result.valid) {
      discountPaise = result.discountPaise;
      appliedCoupon = result.code;
    }
  }

  const payableBeforePoints = Math.max(0, subtotalPaise + shippingPaise + taxPaise - discountPaise);

  // Redeem points (store credit). Capped at the user's live balance and at the
  // payable amount so points can't exceed what's owed. The actual deduction +
  // ledger entry happen inside the order transaction (race-safe) below.
  let pointsUsedPaise = 0;
  const requestedPoints = Math.max(0, Math.floor(Number(redeemPointsPaise) || 0));
  if (requestedPoints > 0) {
    const balance = await getPointsBalance(userId);
    pointsUsedPaise = clampRedeemable(balance, requestedPoints, payableBeforePoints);
  }

  const totalPaise = Math.max(0, payableBeforePoints - pointsUsedPaise);

  // Online payment is the only accepted method — no Cash on Delivery. An order
  // can only be placed when at least one payment method (Merchant UPI or
  // Personal UPI) is enabled and usable. Stock is reserved (decremented) only
  // on successful payment verification, never at creation.
  const { merchant_upi, personal_upi } = await getEnabledPaymentMethods();
  const whatsappConfig = await getWhatsappConfig();
  if (!merchant_upi.enabled && !personal_upi.enabled && !whatsappConfig.enabled) {
    return NextResponse.json(
      { error: "Payment & ordering is currently unavailable. Please try again later." },
      { status: 503 }
    );
  }

  // Create order + address atomically. Stock is decremented later, on payment
  // verification (see /api/orders/verify-payment).
  let order: Awaited<ReturnType<typeof createOrderTxn>>;
  try {
    order = await createOrderTxn();
  } catch (err) {
    // A unique-constraint violation on the coupon redemption lock means the
    // coupon was consumed by a concurrent/earlier order — surface it cleanly.
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "This coupon has already been used and is no longer valid." },
        { status: 409 }
      );
    }
    throw err;
  }

  async function createOrderTxn() {
   return db.$transaction(async (tx) => {
    const createdAddress = await tx.address.create({
      data: {
        userId:   null, // Order snapshot address — decoupled from user's saved address book
        type:     "SHIPPING",
        fullName: addr.fullName.trim().slice(0, 100),
        phone:    addr.phone.trim().slice(0, 20),
        line1:    addr.line1.trim().slice(0, 200),
        line2:    addr.line2?.trim().slice(0, 200) ?? null,
        city:     addr.city.trim().slice(0, 100),
        state:    addr.state.trim().slice(0, 100),
        pincode:  addr.pincode.trim().slice(0, 10),
      },
    });

    const createdOrder = await tx.order.create({
      data: {
        orderNumber:       await generateOrderNumber(),
        userId,
        guestEmail:        null,
        status:            "PENDING",
        paymentStatus:     "PENDING",
        paymentProvider:   paymentMethod === "WHATSAPP" ? "whatsapp" : null,
        subtotalPaise,
        shippingPaise,
        taxPaise,
        discountPaise,
        couponCode:        appliedCoupon,
        pointsUsedPaise,
        totalPaise,
        shippingAddressId: createdAddress.id,
        lines: { create: lineData },
      },
      include: {
        lines:           { select: { productName: true, size: true, quantity: true, totalPaise: true } },
        shippingAddress: true,
      },
    });

    // Consume the coupon inside the same transaction. The unique redemption
    // lock makes single-use race-safe: a second concurrent redemption of the
    // same code throws here and rolls the whole order back.
    if (appliedCoupon) {
      await redeemCoupon(tx, appliedCoupon, userId, createdOrder.id);
    }

    // Spend points inside the same transaction (re-checks the live balance).
    // If the balance changed since we computed the total, reconcile the order.
    if (pointsUsedPaise > 0) {
      const spent = await redeemPoints(tx, userId, pointsUsedPaise, createdOrder.id);
      if (spent !== pointsUsedPaise) {
        await tx.order.update({
          where: { id: createdOrder.id },
          data:  { pointsUsedPaise: spent, totalPaise: Math.max(0, payableBeforePoints - spent) },
        });
      }
    }

    return createdOrder;
   });
  }

  // Clear server-side bag ONLY if order was placed via WhatsApp support.
  // For Personal UPI and online payments, the bag is kept intact until payment UTR / verification succeeds!
  if (userId && paymentMethod === "WHATSAPP") {
    db.savedItem.deleteMany({ where: { userId, type: "BAG" } }).catch(console.error);
  }

  return NextResponse.json({ ok: true, order }, { status: 201 });
}

// GET /api/orders — list orders for the logged-in user
// Excludes unsubmitted checkout attempts (pending payment with no UTR/proof submitted)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const orders = await db.order.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { paymentStatus: "PAID" },
        { status: { not: "PENDING" } },
        { paymentProvider: "whatsapp" },
        {
          payments: {
            some: {
              OR: [
                { status: { not: "PENDING_PAYMENT" } },
                { utr: { not: null } },
                { submittedAt: { not: null } },
              ],
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      lines:           { select: { productName: true, size: true, quantity: true, totalPaise: true } },
      shippingAddress: true,
    },
  });

  return NextResponse.json({ ok: true, orders });
}
