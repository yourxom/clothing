import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your AURELIA account password.",
};

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" className="container auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="eyebrow">Account access</span>
          <h1 className="serif">Forgot your password?</h1>
          <p>Enter your email and we&apos;ll send a reset link if an account exists.</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
