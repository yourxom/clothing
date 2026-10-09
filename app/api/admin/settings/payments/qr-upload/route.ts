// Uploads a static UPI QR image for Personal UPI (used when the admin opts
// out of dynamic QR generation and provides their own QR code image instead).
// Mirrors the validated upload pattern in app/api/admin/upload/route.ts.
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/admin-guard";

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB — a QR image is small
const ALLOWED  = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return NextResponse.json({ error: "No file provided." }, { status: 422 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Only JPG, PNG and WebP are allowed." }, { status: 422 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File is too large (max 4 MB)." }, { status: 422 });

  const ext = EXT_MAP[file.type] ?? "jpg";
  const fileName = `upi-qr-${Date.now()}.${ext}`;
  const folder = path.join(process.cwd(), "public", "payment-settings");
  const filePath = path.join(folder, fileName);
  const publicUrl = `/payment-settings/${fileName}`;

  await mkdir(folder, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return NextResponse.json({ ok: true, url: publicUrl }, { status: 201 });
}
