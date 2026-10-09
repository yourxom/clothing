import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/db-health — verifies MySQL connectivity and returns table counts.
// Protected to non-sensitive data only; never exposes credentials or schema details.
export async function GET() {
  const start = Date.now();

  try {
    const [categories, products, users, orders, newsletter, contacts] = await Promise.all([
      db.category.count(),
      db.product.count(),
      db.user.count(),
      db.order.count(),
      db.newsletterSubscriber.count(),
      db.contactMessage.count(),
    ]);

    return NextResponse.json({
      status:   "ok",
      latencyMs: Date.now() - start,
      database: {
        connected:  true,
        provider:   "mysql",
        tables: {
          categories,
          products,
          users,
          orders,
          newsletterSubscribers: newsletter,
          contactMessages:        contacts,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[db-health] Connection failed:", error);
    return NextResponse.json(
      {
        status:    "error",
        latencyMs: Date.now() - start,
        database:  { connected: false },
        message:   "Database connection failed. Check DATABASE_URL and MySQL service.",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
