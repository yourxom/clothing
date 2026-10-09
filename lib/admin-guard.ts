import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

const ADMIN_ROLES = ["admin", "superadmin"];

/** Returns the session if the user is an admin or superadmin, else null. */
export async function requireAdmin(): Promise<Session | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return session?.user && role && ADMIN_ROLES.includes(role) ? session : null;
}

/** Returns the session only for superadmins (highest privilege). */
export async function requireSuperAdmin(): Promise<Session | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return session?.user && role === "superadmin" ? session : null;
}

export function isAdminRole(role: string | undefined | null): boolean {
  return Boolean(role && ADMIN_ROLES.includes(role));
}
