import { NextResponse } from "next/server";
import { getWhatsappConfig } from "@/lib/settings";

// GET /api/whatsapp — public config for the floating WhatsApp button.
// Returns only what the client needs; never exposes other settings.
export async function GET() {
  const config = await getWhatsappConfig();
  return NextResponse.json({
    enabled: config.enabled,
    // Only expose the number/message when enabled
    number:  config.enabled ? config.number  : "",
    message: config.enabled ? config.message : "",
  });
}
