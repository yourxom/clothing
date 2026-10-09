import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile-form";
import { PasswordChangeForm } from "@/components/password-change-form";

export const metadata: Metadata = { title: "Profile & Password — AURELIA" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { name: true, email: true, phone: true, passwordHash: true },
  });

  return (
    <div className="acct-page">
      <div className="acct-page-header">
        <h1 className="acct-page-title serif">Profile &amp; Settings</h1>
        <p className="acct-page-sub">Manage your personal details and password</p>
      </div>

      <div className="acct-profile-grid">
        {/* Personal details */}
        <div className="acct-form-card">
          <div className="acct-form-card-header">
            <span className="acct-form-card-icon" aria-hidden="true">👤</span>
            <div>
              <h2 className="acct-form-card-title">Personal details</h2>
              <p className="acct-form-card-sub">Your name, email and phone number</p>
            </div>
          </div>
          <ProfileForm user={{
            name:  user?.name  ?? null,
            email: user?.email ?? "",
            phone: user?.phone ?? null,
          }} />
        </div>

        {/* Password */}
        <div className="acct-form-card">
          <div className="acct-form-card-header">
            <span className="acct-form-card-icon" aria-hidden="true">🔒</span>
            <div>
              <h2 className="acct-form-card-title">Change password</h2>
              <p className="acct-form-card-sub">Keep your account secure</p>
            </div>
          </div>
          {user?.passwordHash ? (
            <PasswordChangeForm />
          ) : (
            <p className="notice">No password set — this account uses social login.</p>
          )}
        </div>
      </div>
    </div>
  );
}
