import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { sendWelcomeEmail } from "@/lib/email";

// POST /api/admin/test-email  { "to": "test@example.com" }
// Sends a test welcome email so you can verify Gmail SMTP is working.
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { to } = await request.json().catch(() => ({})) as { to?: string };
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Provide a valid 'to' email address." }, { status: 422 });
  }

  const result = await sendWelcomeEmail(to, "Test User");
  if ((result as { dev?: boolean }).dev) {
    return NextResponse.json({ ok: false, error: "No email provider configured — add BREVO_API_KEY to .env then restart the server." }, { status: 503 });
  }
  if (!(result as { ok?: boolean }).ok) {
    return NextResponse.json({ ok: false, error: (result as { error?: unknown }).error ?? "Send failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: `Test email sent to ${to} via Brevo ✓` });
}
