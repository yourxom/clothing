import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

// Lightweight user lookup for the admin "personal coupon" picker.
// GET /api/admin/users/search?q=<name|email|phone>
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const isSuperAdmin = (session.user as { role?: string } | undefined)?.role === "superadmin";
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ ok: true, users: [] });

  const users = await db.user.findMany({
    where: {
      ...(isSuperAdmin ? {} : { role: { not: "superadmin" } }),
      OR: [
        { name:  { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q.replace(/\D/g, "") || "\u0000" } },
      ],
    },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Hide the phone-only placeholder email from the label.
  const shaped = users.map((u) => ({
    id:    u.id,
    name:  u.name,
    email: u.email.endsWith("@phone.aurelia.local") ? null : u.email,
    phone: u.phone,
  }));

  return NextResponse.json({ ok: true, users: shaped });
}
