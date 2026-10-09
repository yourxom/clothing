import { NextResponse, type NextRequest } from "next/server";

// Capture a referral code from `?ref=CODE` into a cookie so it survives the
// signup journey (including the Google OAuth round-trip). The signup form and
// the Google sign-in callback both read `aurelia_ref`.
export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.next();

  const clean = ref.trim().toUpperCase().slice(0, 20);
  const res = NextResponse.next();
  if (clean) {
    res.cookies.set("aurelia_ref", clean, {
      httpOnly: false,        // the signup form (client) also reads it
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }
  return res;
}

export const config = {
  // Run on page routes only — skip Next internals, API, and static assets.
  matcher: ["/((?!_next/|api/|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|css|js)$).*)"],
};
