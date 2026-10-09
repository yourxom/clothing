import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your AURELIA account.",
};

export default function ResetPasswordPage() {
  return (
    <main id="main-content" className="container auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="eyebrow">Account access</span>
          <h1 className="serif">Set a new password.</h1>
          <p>Choose a strong password of at least 8 characters.</p>
        </div>
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
