import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth-forms";
import { AureliaLogo } from "@/components/aurelia-logo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AURELIA account.",
};

// Only allow same-site relative paths as a redirect target (prevents open redirects).
function safeCallback(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/account";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const callbackUrl = safeCallback((await searchParams).callbackUrl);
  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <main id="main-content" className="container auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            <AureliaLogo size={48} />
          </div>
          <span className="eyebrow">Welcome back</span>
          <h1 className="serif">Sign in to AURELIA.</h1>
          <p>Access your saved styles, order history, and more.</p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
