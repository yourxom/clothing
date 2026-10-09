import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";
import { ProductMedia } from "@/components/product-media";
import type { Tone } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "My Account — AURELIA",
  description: "Your AURELIA account overview — orders, saved styles, and profile.",
};
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, recentOrders, wishlistItems, bagItems] = await Promise.all([
    db.user.findUnique({
      where:  { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true, orderNumber: true, status: true,
        totalPaise: true, createdAt: true,
        _count: { select: { lines: true } },
        lines:  { select: { productName: true, size: true }, take: 1 },
      },
    }),
    db.savedItem.findMany({
      where:   { userId, type: "WISHLIST" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        product: {
          select: {
            slug: true, name: true, color: true, price: true, tone: true, mrp: true,
            images: { select: { url: true }, take: 1, orderBy: { isPrimary: "desc" } },
          },
        },
      },
    }),
    db.savedItem.findMany({
      where:   { userId, type: "BAG" },
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            slug: true, name: true, price: true, tone: true,
            images: { select: { url: true }, take: 1, orderBy: { isPrimary: "desc" } },
          },
        },
      },
    }),
  ]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";
  // DB prices are in paise; convert to rupees for display with formatPrice.
  const bagTotal = bagItems.reduce((s, i) => s + i.quantity * i.product.price, 0) / 100;

  const STATUS_COLOR: Record<string, string> = {
    PENDING: "#b77b00", CONFIRMED: "#3a7d44", PROCESSING: "#3a7d44",
    SHIPPED: "#1a6aab", DELIVERED: "#3a7d44", CANCELLED: "#8b3344", REFUNDED: "#8b3344",
  };
  const STATUS_BG: Record<string, string> = {
    PENDING: "#fef8ec", CONFIRMED: "#edf7ee", PROCESSING: "#edf7ee",
    SHIPPED: "#e8f2fb", DELIVERED: "#edf7ee", CANCELLED: "#fdf0f0", REFUNDED: "#fdf0f0",
  };

  return (
    <div className="acct-page">
      {/* Welcome banner */}
      <div className="acct-welcome">
        <div>
          <h1 className="acct-welcome-title serif">
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back."}
          </h1>
          <p className="acct-welcome-sub">Member since {memberSince}</p>
        </div>
        <Link href="/shop" className="button">Continue shopping</Link>
      </div>

      {/* ── Recent orders ─────────────────────────────────────────── */}
      <section className="acct-section" aria-labelledby="acct-orders-h">
        <div className="acct-section-head">
          <h2 id="acct-orders-h" className="acct-section-title">Recent orders</h2>
          {recentOrders.length > 0 && (
            <Link href="/account/orders" className="acct-see-all">View all orders →</Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="acct-empty">
            <ShoppingBagIcon />
            <p>You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="button button-outline" style={{ marginTop: ".8rem" }}>
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="acct-orders-list">
            {recentOrders.map(order => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="acct-order-card">
                <div className="acct-order-card-left">
                  <div className="acct-order-icon" aria-hidden="true">
                    <ShoppingBagIcon size={20} />
                  </div>
                  <div>
                    <p className="acct-order-number">{order.orderNumber}</p>
                    <p className="acct-order-desc">
                      {order.lines[0]?.productName ?? "—"}
                      {order._count.lines > 1 && ` +${order._count.lines - 1} more`}
                    </p>
                    <p className="acct-order-date">
                      {new Date(order.createdAt).toLocaleDateString("en-IN",
                        { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="acct-order-card-right">
                  <p className="acct-order-total">{formatPrice(order.totalPaise / 100)}</p>
                  <span
                    className="acct-order-badge"
                    style={{ color: STATUS_COLOR[order.status] ?? "#706b62",
                             background: STATUS_BG[order.status] ?? "#f5f5f5" }}
                  >
                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Saved styles ──────────────────────────────────────────── */}
      <section className="acct-section" aria-labelledby="acct-wishlist-h">
        <div className="acct-section-head">
          <h2 id="acct-wishlist-h" className="acct-section-title">Saved styles</h2>
          {wishlistItems.length > 0 && (
            <Link href="/wishlist" className="acct-see-all">View all →</Link>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="acct-empty">
            <HeartIcon />
            <p>No saved styles yet. Heart any product to save it here.</p>
            <Link href="/shop" className="button button-outline" style={{ marginTop: ".8rem" }}>
              Browse collection
            </Link>
          </div>
        ) : (
          <div className="acct-wishlist-grid">
            {wishlistItems.map(item => (
              <Link key={item.id} href={`/products/${item.product.slug}`} className="acct-product-card">
                <div className="acct-product-art">
                  <ProductMedia
                    src={item.product.images?.[0]?.url}
                    alt={item.product.name}
                    tone={item.product.tone as Tone}
                  />
                </div>
                <div className="acct-product-info">
                  <p className="acct-product-name">{item.product.name}</p>
                  <p className="acct-product-color">{item.product.color}</p>
                  <div className="acct-product-price">
                    <span className="acct-price-current">{formatPrice(item.product.price / 100)}</span>
                    <span className="acct-price-original">{formatPrice(item.product.mrp / 100)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Bag summary ───────────────────────────────────────────── */}
      {bagItems.length > 0 && (
        <section className="acct-section" aria-labelledby="acct-bag-h">
          <div className="acct-section-head">
            <h2 id="acct-bag-h" className="acct-section-title">Your bag</h2>
            <Link href="/bag" className="acct-see-all">View bag →</Link>
          </div>
          <div className="acct-bag-list">
            {bagItems.map(item => (
              <div key={item.id} className="acct-bag-item">
                <div className="acct-bag-art">
                  <ProductMedia
                    src={item.product.images?.[0]?.url}
                    alt={item.product.name}
                    tone={item.product.tone as Tone}
                  />
                </div>
                <div className="acct-bag-info">
                  <p className="acct-product-name">{item.product.name}</p>
                  <p className="acct-order-date">Size: {item.size} · Qty: {item.quantity}</p>
                </div>
                <p className="acct-price-current">{formatPrice(item.product.price * item.quantity / 100)}</p>
              </div>
            ))}
            <div className="acct-bag-footer">
              <span>Indicative total</span>
              <strong>{formatPrice(bagTotal)}</strong>
            </div>
          </div>
          <Link href="/checkout" className="button" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Proceed to checkout
          </Link>
        </section>
      )}

      {/* ── Account overview cards ─────────────────────────────────── */}
      <div className="acct-overview-cards">
        <Link href="/account/profile" className="acct-overview-card">
          <div className="acct-overview-card-icon" aria-hidden="true">👤</div>
          <div>
            <p className="acct-overview-card-title">Profile details</p>
            <p className="acct-overview-card-sub">Name, email, password</p>
          </div>
        </Link>
        <Link href="/account/addresses" className="acct-overview-card">
          <div className="acct-overview-card-icon" aria-hidden="true">📍</div>
          <div>
            <p className="acct-overview-card-title">Saved addresses</p>
            <p className="acct-overview-card-sub">Manage delivery addresses</p>
          </div>
        </Link>
        <Link href="/account/orders" className="acct-overview-card">
          <div className="acct-overview-card-icon" aria-hidden="true">📦</div>
          <div>
            <p className="acct-overview-card-title">All orders</p>
            <p className="acct-overview-card-sub">Track &amp; manage orders</p>
          </div>
        </Link>
        <Link href="/help" className="acct-overview-card">
          <div className="acct-overview-card-icon" aria-hidden="true">💬</div>
          <div>
            <p className="acct-overview-card-title">Help &amp; support</p>
            <p className="acct-overview-card-sub">Returns, queries, FAQs</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Inline icon components to avoid extra dependencies
function ShoppingBagIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  );
}
