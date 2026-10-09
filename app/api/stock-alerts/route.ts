import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEmail } from "@/lib/email-guard";

// POST /api/stock-alerts — register interest in a product/size restock
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  const email = String(b.email ?? "").trim().toLowerCase();
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return NextResponse.json({ error: emailCheck.error }, { status: 422 });
  }

  const productSlug = String(b.productSlug ?? "").trim();
  if (!productSlug) return NextResponse.json({ error: "Product is required." }, { status: 422 });

  const product = await db.product.findUnique({
    where: { slug: productSlug }, select: { name: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const size = b.size ? String(b.size).trim().slice(0, 20) : null;

  // Upsert — same email+product+size shouldn't create duplicates
  await db.stockAlert.upsert({
    where: {
      email_productSlug_size: { email, productSlug, size: size ?? "" },
    },
    update: { notified: false },
    create: { email, productSlug, productName: product.name, size: size ?? "" },
  });

  return NextResponse.json({
    ok: true,
    message: "You'll be notified by email when this is back in stock.",
  });
}
