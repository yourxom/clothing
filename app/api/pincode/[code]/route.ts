import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ code: string }> };

// GET /api/pincode/560001 — resolves an Indian PIN code to city + state
// Uses the free India Post API. Cached for 24h.
export async function GET(_: NextRequest, { params }: Props) {
  const { code } = await params;
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Invalid PIN code." }, { status: 422 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("upstream error");
    const data = await res.json() as Array<{
      Status: string;
      PostOffice?: Array<{ Name: string; District: string; State: string; Block?: string }>;
    }>;

    const entry = data?.[0];
    if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) {
      return NextResponse.json({ ok: false, error: "PIN code not found." }, { status: 404 });
    }

    const po = entry.PostOffice[0];
    // District is the most reliable "city" field from India Post
    const city  = po.District;
    const state = po.State;
    // Offer nearby localities so the user can refine the city if needed
    const areas = Array.from(new Set(entry.PostOffice.map(p => p.Name))).slice(0, 15);

    return NextResponse.json({ ok: true, city, state, areas });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not look up PIN code. Enter city manually." }, { status: 502 });
  }
}
