import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth-forms";
import { AureliaLogo } from "@/components/aurelia-logo";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your AURELIA account to save styles and track orders.",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <main id="main-content" className="container auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            <AureliaLogo size={48} />
          </div>
          <span className="eyebrow">Join AURELIA</span>
          <h1 className="serif">Create your account.</h1>
          <p>Save styles, track orders, and be first to know when we launch.</p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
