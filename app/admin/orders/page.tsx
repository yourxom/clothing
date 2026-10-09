import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = { title: "Orders — Admin" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ status?: string; q?: string }>;
};

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

export default async function AdminOrdersPage(props: Props) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const rawStatus = searchParams?.status;
  const rawQuery = searchParams?.q;
  const activeTab = (rawStatus ?? "ALL").toUpperCase();
  const searchQuery = rawQuery?.trim().toLowerCase() ?? "";

  // Fetch all orders with customer details and latest payment info
  const allOrders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { lines: true } },
      user: { select: { name: true, email: true, phone: true } },
      shippingAddress: { select: { fullName: true, phone: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Calculate counts per tab
  const counts: Record<string, number> = {
    ALL: allOrders.length,
    PENDING: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  for (const o of allOrders) {
    if (counts[o.status] !== undefined) {
      counts[o.status]++;
    }
  }

  // Filter orders according to active tab and search query
  const filteredOrders = allOrders.filter(o => {
    if (activeTab !== "ALL" && o.status !== activeTab) {
      return false;
    }
    if (searchQuery) {
      const matchOrder = o.orderNumber.toLowerCase().includes(searchQuery);
      const matchName = (o.shippingAddress?.fullName ?? o.user?.name ?? "").toLowerCase().includes(searchQuery);
      const matchEmail = (o.user?.email ?? o.guestEmail ?? "").toLowerCase().includes(searchQuery);
      const matchPhone = (o.shippingAddress?.phone ?? o.user?.phone ?? "").toLowerCase().includes(searchQuery);
      const matchUtr = (o.payments[0]?.utr ?? "").toLowerCase().includes(searchQuery);
      if (!matchOrder && !matchName && !matchEmail && !matchPhone && !matchUtr) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="admin-heading" style={{ margin: 0 }}>
            Orders <span className="admin-count">({filteredOrders.length})</span>
          </h1>
          <p style={{ margin: ".3rem 0 0", fontSize: ".82rem", color: "var(--muted)" }}>
            Manage and track all customer purchases, statuses, and payment receipts.
          </p>
        </div>

        {/* Search Input Form */}
        <form method="GET" style={{ display: "flex", gap: ".5rem" }}>
          {activeTab !== "ALL" && <input type="hidden" name="status" value={activeTab} />}
          <input
            type="search"
            name="q"
            defaultValue={rawQuery ?? ""}
            placeholder="Search order #, customer, phone, UTR…"
            className="admin-input"
            style={{ width: "260px", padding: ".45rem .8rem", fontSize: ".8rem" }}
          />
          <button type="submit" className="button" style={{ minHeight: "36px", padding: ".4rem .9rem", fontSize: ".72rem" }}>
            Search
          </button>
          {rawQuery && (
            <Link
              href={activeTab !== "ALL" ? `/admin/orders?status=${activeTab}` : "/admin/orders"}
              className="button button-outline"
              style={{ minHeight: "36px", padding: ".4rem .7rem", fontSize: ".72rem" }}
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1.25rem", borderBottom: "1px solid var(--line)", paddingBottom: ".75rem" }}>
        {STATUS_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          const href = tab.key === "ALL"
            ? (rawQuery ? `/admin/orders?q=${encodeURIComponent(rawQuery)}` : "/admin/orders")
            : (rawQuery ? `/admin/orders?status=${tab.key}&q=${encodeURIComponent(rawQuery)}` : `/admin/orders?status=${tab.key}`);

          return (
            <Link
              key={tab.key}
              href={href}
              style={{
                fontSize: ".78rem",
                padding: ".35rem .75rem",
                borderRadius: "99px",
                textDecoration: "none",
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "var(--ink)" : "#f0ece4",
                color: isActive ? "#fff" : "var(--ink)",
                display: "inline-flex",
                alignItems: "center",
                gap: ".35rem",
                transition: "all .15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span style={{ fontSize: ".7rem", opacity: isActive ? 0.9 : 0.65 }}>({count})</span>
            </Link>
          );
        })}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Order Status</th>
              <th>Payment Info</th>
              <th>Total</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--muted)" }}>
                  No orders found matching the filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map(o => {
                const latestPayment = o.payments[0] ?? null;
                const payerName = (latestPayment as { payerName?: string | null })?.payerName;
                const customerName = o.shippingAddress?.fullName ?? o.user?.name ?? "Guest";
                const customerContact = o.shippingAddress?.phone ?? o.user?.phone ?? o.user?.email ?? o.guestEmail ?? "";

                let paymentBadgeClass = "status--pending";
                let paymentLabel: string = o.paymentStatus;
                if (o.paymentStatus === "PAID" || latestPayment?.status === "PAID") {
                  paymentBadgeClass = "status--confirmed";
                  paymentLabel = "PAID";
                } else if (latestPayment?.status === "UNDER_REVIEW") {
                  paymentBadgeClass = "status--pending";
                  paymentLabel = "UNDER REVIEW";
                } else if (o.paymentStatus === "FAILED" || latestPayment?.status === "REJECTED") {
                  paymentBadgeClass = "status--cancelled";
                  paymentLabel = "FAILED";
                }

                const methodLabel = latestPayment?.paymentMethod === "PERSONAL_UPI"
                  ? "Direct UPI"
                  : latestPayment?.paymentMethod === "MERCHANT_UPI"
                  ? "UPI Gateway"
                  : o.paymentProvider === "whatsapp"
                  ? "WhatsApp"
                  : o.paymentProvider ?? "UPI";

                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="admin-table-link" style={{ fontWeight: 600 }}>
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td style={{ fontSize: ".8rem" }}>
                      <div style={{ fontWeight: 500 }}>{customerName}</div>
                      {customerContact && (
                        <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>{customerContact}</div>
                      )}
                    </td>
                    <td>{o._count.lines}</td>
                    <td>
                      <span className={`account-order-status status--${o.status.toLowerCase()}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: ".2rem" }}>
                        <span className={`account-order-status ${paymentBadgeClass}`} style={{ alignSelf: "flex-start" }}>
                          {paymentLabel}
                        </span>
                        <span style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                          {methodLabel}
                          {payerName && ` · Paid by ${payerName}`}
                          {latestPayment?.utr && ` · Ref: ${latestPayment.utr}`}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatPrice(o.totalPaise / 100)}</td>
                    <td className="muted" style={{ fontSize: ".78rem" }}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="admin-table-link">
                        View ↗
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
