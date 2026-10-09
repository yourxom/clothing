import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { productSlug, rating, title, body: reviewBody } = (body as Record<string, unknown>) ?? {};

  const ratingNum = Number(rating);
  if (!productSlug || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Valid product and rating (1–5) are required." }, { status: 422 });
  }
  const cleanBody = String(reviewBody ?? "").trim().slice(0, 2000);
  if (cleanBody.length < 10) {
    return NextResponse.json({ error: "Review must be at least 10 characters." }, { status: 422 });
  }

  const product = await db.product.findUnique({ where: { slug: String(productSlug) }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  // Check if user already reviewed this product
  const existing = await db.review.findUnique({
    where: { productId_userId: { productId: product.id, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "You have already reviewed this product." }, { status: 409 });

  // Check if user purchased it (verified review)
  const purchased = await db.orderLine.findFirst({
    where: { productId: product.id, order: { userId: session.user.id, paymentStatus: "PAID" } },
  });

  const review = await db.review.create({
    data: {
      productId: product.id,
      userId:    session.user.id,
      rating:    ratingNum,
      title:     title ? String(title).trim().slice(0, 100) : null,
      body:      cleanBody,
      verified:  Boolean(purchased),
      approved:  false, // admin must approve
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({
    ok: true,
    review,
    message: "Thank you for your review. It will appear once approved.",
  }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("product") ?? "";
  if (!slug) return NextResponse.json({ error: "product param required." }, { status: 400 });

  const product = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const reviews = await db.review.findMany({
    where:   { productId: product.id, approved: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, rating: true, title: true, body: true,
      verified: true, createdAt: true,
      user: { select: { name: true } },
    },
  });

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  // Has the current logged-in user already reviewed this product?
  const session = await auth();
  let hasReviewed = false;
  let canReview   = false;
  if (session?.user?.id) {
    const existing = await db.review.findUnique({
      where: { productId_userId: { productId: product.id, userId: session.user.id } },
      select: { id: true },
    });
    hasReviewed = Boolean(existing);
    canReview   = !existing;
  }

  return NextResponse.json({
    ok: true, reviews, count: reviews.length, averageRating: avg,
    hasReviewed, canReview,
  });
}
