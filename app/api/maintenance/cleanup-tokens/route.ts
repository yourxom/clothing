// Deletes expired/used password-reset and email-verify tokens.
// Call periodically via a cron (e.g. Vercel Cron, GitHub Action) with the
// x-cleanup-secret header matching CLEANUP_SECRET in .env.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function runCleanup(request: NextRequest) {
  const secret = process.env.CLEANUP_SECRET;
  // Accept either our custom header or Vercel Cron's Authorization: Bearer <secret>
  if (secret) {
    const custom = request.headers.get("x-cleanup-secret");
    const bearer = request.headers.get("authorization");
    const ok = custom === secret || bearer === `Bearer ${secret}`;
    if (!ok) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Cleanup secret not configured." }, { status: 503 });
  }

  const now = new Date();
  const [resetDeleted, verifyDeleted] = await Promise.all([
    db.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
    db.emailVerifyToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    deleted: {
      passwordResetTokens: resetDeleted.count,
      emailVerifyTokens:   verifyDeleted.count,
    },
  });
}

export async function GET(request: NextRequest)  { return runCleanup(request); }
export async function POST(request: NextRequest) { return runCleanup(request); }
