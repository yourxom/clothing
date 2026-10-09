import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailHandler } from "@/components/verify-email-handler";

export const metadata: Metadata = {
  title: "Verify your email — AURELIA",
  description: "Verify your AURELIA account email address.",
};

export default function VerifyEmailPage() {
  return (
    <main id="main-content" className="container auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="eyebrow">Account setup</span>
          <h1 className="serif">Verify your email.</h1>
        </div>
        <Suspense fallback={<p className="muted">Verifying…</p>}>
          <VerifyEmailHandler />
        </Suspense>
      </div>
    </main>
  );
}
