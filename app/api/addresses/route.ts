import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ ok: true, addresses });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { fullName, phone, line1, line2, city, state, pincode, isDefault } =
    (body as Record<string, unknown>) ?? {};

  if (!fullName || !phone || !line1 || !city || !state || !pincode) {
    return NextResponse.json({ error: "All required address fields must be provided." }, { status: 422 });
  }

  // If marking as default, unset other defaults first
  if (isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data:  { isDefault: false },
    });
  }

  const address = await db.address.create({
    data: {
      userId:   session.user.id,
      type:     "SHIPPING",
      fullName: String(fullName).trim().slice(0, 100),
      phone:    String(phone).trim().slice(0, 20),
      line1:    String(line1).trim().slice(0, 200),
      line2:    line2 ? String(line2).trim().slice(0, 200) : null,
      city:     String(city).trim().slice(0, 100),
      state:    String(state).trim().slice(0, 100),
      pincode:  String(pincode).trim().slice(0, 10),
      isDefault: Boolean(isDefault),
    },
  });

  return NextResponse.json({ ok: true, address }, { status: 201 });
}
