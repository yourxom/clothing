import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AdminUserActions } from "@/components/admin-user-actions";

export const metadata: Metadata = { title: "Users — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  const currentRole = (session?.user as { role?: string } | undefined)?.role;
  const isSuperAdmin = currentRole === "superadmin";

  // Superadmin sees all accounts (admins, superadmins, and all customers).
  // Standard admin sees all customers and admins, but NEVER superadmin accounts.
  const users = await db.user.findMany({
    where: isSuperAdmin ? {} : { role: { not: "superadmin" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      emailVerified: true, phoneVerified: true, createdAt: true,
      _count: { select: { orders: true, savedItems: true } },
    },
  });

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>
          Users <span className="admin-count">({users.length})</span>
        </h1>
        {isSuperAdmin && (
          <span style={{ fontSize: "0.78rem", color: "var(--muted)", background: "var(--canvas)", padding: "0.25rem 0.65rem", borderRadius: "4px" }}>
            Viewing as Superadmin (All accounts)
          </span>
        )}
      </div>
      {users.length === 0 ? (
        <p className="notice">No registered users yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Email / Phone</th><th>Verified</th>
                <th>Role</th><th>Orders</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isPhoneAccount = u.email.endsWith("@phone.aurelia.local");
                const contact = isPhoneAccount
                  ? (u.phone ? `+91 ${u.phone}` : "Phone account")
                  : u.email;
                const isVerified = Boolean(u.emailVerified || u.phoneVerified);

                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name ?? <span className="muted">—</span>}</strong>
                      {isPhoneAccount && u.phone && (
                        <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>Mobile user</div>
                      )}
                    </td>
                    <td style={{ fontSize: ".82rem" }}>{contact}</td>
                    <td>
                      <span style={{ color: isVerified ? "#3a7d44" : "#b77b00",
                                     fontSize: ".72rem", fontWeight: 700 }}>
                        {isVerified ? "✓ Verified" : "⚠ Pending"}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-role-badge${u.role === "admin" || u.role === "superadmin"
                        ? " admin-role-badge--admin" : ""}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u._count.orders}</td>
                    <td className="muted" style={{ fontSize: ".78rem" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-IN",
                        { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <AdminUserActions userId={u.id} currentRole={u.role} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
