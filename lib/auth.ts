import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

const prisma = new PrismaClient();

// Build providers list — Google only added when env keys are present
const providers: NextAuthConfig["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  // NextAuth v5 (beta) rejects OAuth/credentials callbacks with UntrustedHost
  // outside Vercel unless we opt in. Required for Google sign-in to work locally
  // and on non-Vercel hosts.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    signIn:  "/login",
    signOut: "/",
    error:   "/login",
  },
  callbacks: {
    // For Google sign-in: ensure a User row exists and is verified
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          const created = await prisma.user.create({
            data: {
              email,
              name:          user.name ?? null,
              emailVerified: new Date(),  // Google emails are pre-verified
              role:          "customer",
            },
          });
          // Send welcome email to brand-new Google users
          const { sendWelcomeEmail } = await import("@/lib/email");
          sendWelcomeEmail(email, user.name ?? null).catch(err => {
            console.error("[google auth] Welcome email delivery failed:", err);
          });

          // Grant the Rs 100 welcome coupon to brand-new Google accounts.
          const { grantWelcomeCoupon } = await import("@/lib/welcome-coupon");
          grantWelcomeCoupon(created.id).catch(console.error);

          // Assign a referral code, and capture who referred them from the
          // `aurelia_ref` cookie (set when they arrived via a referral link).
          const { ensureReferralCode, resolveReferrer } = await import("@/lib/referral");
          ensureReferralCode(created.id).catch(console.error);
          try {
            const { cookies } = await import("next/headers");
            const refCode = (await cookies()).get("aurelia_ref")?.value;
            if (refCode) {
              const referrerId = await resolveReferrer(refCode, created.id);
              if (referrerId) {
                await prisma.user.update({ where: { id: created.id }, data: { referredById: referrerId } });
              }
            }
          } catch { /* cookies unavailable in this context — skip */ }
        } else if (!existing.emailVerified) {
          await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        // NOTE: for OAuth (Google), user.id is the *provider* profile id, NOT
        // our DB cuid. We keep email as the stable key and resolve the real DB
        // id/role below, so never trust user.id directly here.
        token.role  = (user as { role?: string }).role ?? "customer";
        token.email = user.email ?? token.email;
      }
      // Resolve the canonical DB id + role by email. Email is the stable key
      // across both credentials and Google sign-in. Runs when the DB id is
      // missing/unresolved or on an explicit session update. This guarantees
      // session.user.id always points to a real User row.
      if (token.email && (!token.id || !token.role || trigger === "update")) {
        const dbUser = await prisma.user.findUnique({
          where:  { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) { token.id = dbUser.id; token.role = dbUser.role; }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  providers: [
    ...providers,
    Credentials({
      name: "Email/Phone & Password",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password:   { label: "Password",       type: "password" },
      },
      async authorize(credentials) {
        // Accept either `identifier` (email or phone) or legacy `email` field.
        const c = (credentials ?? {}) as Record<string, unknown>;
        const rawId    = String(c.identifier ?? c.email ?? "").trim();
        const password = String(c.password ?? "");
        if (!rawId || !password) return null;

        // Decide whether the identifier is a phone (10 digits) or an email.
        const digits  = rawId.replace(/\D/g, "");
        const isPhone = /^\d{10}$/.test(digits);

        // Rate limit login attempts: 8 per identifier per 15 minutes
        const rlKey = isPhone ? `login:phone:${digits}` : `login:${rawId.toLowerCase()}`;
        const rl = rateLimit(rlKey, 8, 15 * 60 * 1000);
        if (!rl.allowed) return null;

        const user = isPhone
          ? await prisma.user.findUnique({ where: { phone: digits } })
          : await prisma.user.findUnique({ where: { email: rawId.toLowerCase() } });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
