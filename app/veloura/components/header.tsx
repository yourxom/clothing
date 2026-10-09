"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { usePreviewStore } from "@/components/preview-store";

const NAV = [
  { label: "Women", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Kurtas", href: "/collections/kurtas" },
  { label: "Dresses", href: "/collections/dresses" },
  { label: "Sarees", href: "/collections/sarees" },
  { label: "Sale", href: "/shop?sale=1", sale: true },
];

type MenuIconName =
  | "home" | "orders" | "shop" | "address" | "profile"
  | "help" | "account" | "new" | "search" | "track" | "sale" | "signout"
  | "coupons" | "refer" | "saved" | "admin";

type DrawerItem = { label: string; href: string; icon: MenuIconName; sale?: boolean };

const LOGGED_OUT_MENU: DrawerItem[] = [
  { label: "My Account",   href: "/login",            icon: "account" },
  { label: "Shop",         href: "/shop",             icon: "shop" },
  { label: "New Arrivals", href: "/shop?sort=newest",  icon: "new" },
  { label: "Search",       href: "/search",           icon: "search" },
  { label: "Track Order",  href: "/account/orders",   icon: "track" },
  { label: "Sale",         href: "/shop?sale=1",       icon: "sale", sale: true },
];

const LOGGED_IN_MENU: DrawerItem[] = [
  { label: "Home",               href: "/account",          icon: "home" },
  { label: "My Orders",          href: "/account/orders",   icon: "orders" },
  { label: "My Coupons",         href: "/account/coupons",  icon: "coupons" },
  { label: "Refer & Earn",       href: "/account/refer",    icon: "refer" },
  { label: "Shop",               href: "/shop",             icon: "shop" },
  { label: "Saved Styles",       href: "/wishlist",         icon: "saved" },
  { label: "Addresses",          href: "/account/addresses", icon: "address" },
  { label: "Profile & Password", href: "/account/profile",  icon: "profile" },
  { label: "Help & Support",     href: "/help",             icon: "help" },
];

function MenuIcon({ name }: { name: MenuIconName }) {
  const p = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "home":    return <svg {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
    case "orders":  return <svg {...p}><path d="M6 7h12l1 14H5z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
    case "shop":    return <svg {...p}><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 13h6" /></svg>;
    case "address": return <svg {...p}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "profile": return <svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case "help":    return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4 2c0 1.5-2 2-2 3" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></svg>;
    case "account": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;
    case "new":     return <svg {...p}><path d="M12 3l2.2 5.5L20 9l-4 3.5L17 19l-5-3-5 3 1-6.5L4 9l5.8-.5z" /></svg>;
    case "search":  return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
    case "track":   return <svg {...p}><rect x="2" y="7" width="13" height="10" rx="1.5" /><path d="M15 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="18" cy="18" r="1.6" /></svg>;
    case "sale":    return <svg {...p}><path d="M20 12l-8 8-9-9V4h7z" /><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" /></svg>;
    case "coupons": return <svg {...p}><path d="M3 9a2 2 0 0 0 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" /><path d="M12 7v10" strokeDasharray="2 2" /></svg>;
    case "refer":   return <svg {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8" /><path d="M12 8v12" /><path d="M12 8S10 3 7.5 4.5 10 8 12 8zM12 8s2-5 4.5-3.5S14 8 12 8z" /></svg>;
    case "saved":   return <svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>;
    case "admin":   return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9.5 12l1.8 1.8L15 10" /></svg>;
    case "signout": return <svg {...p}><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h10" /></svg>;
  }
}

function Leaf() {
  return (
    <svg className="vl-logo__icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 2C7 6 5 11 6 18c5 1 10-1 14-6-3 1-6 1-9-1 3-1 5-3 6-6-3 2-6 2-9 0 2-1 3-2 4-3z" />
    </svg>
  );
}

function Icon({ name }: { name: "search" | "user" | "heart" | "bag" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, "aria-hidden": true } as const;
  switch (name) {
    case "search": return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
    case "user": return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;
    case "heart": return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>;
    case "bag": return <svg {...common}><path d="M6 7h12l1 14H5z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
  }
}

export function AnnouncementBar() {
  return (
    <div className="vl-promo" role="region" aria-label="Store announcements">
      <div className="vl-promo__inner">
        <button className="vl-promo__arrow" aria-label="Previous announcement" type="button">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        {/* On desktop these sit centred; on mobile the track auto-scrolls
            (marquee) so every message is readable without being cut off. */}
        <div className="vl-promo__msgs">
          <PromoMessages />
          {/* Duplicate set for a seamless mobile marquee loop (hidden on desktop). */}
          <span className="vl-promo__loop" aria-hidden="true"><PromoMessages /></span>
        </div>
        <button className="vl-promo__arrow" aria-label="Next announcement" type="button">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}

function PromoMessages() {
  return (
    <>
      <span className="vl-promo__msg">Free Shipping on Orders Above ₹1999</span>
      <span className="vl-promo__sep" aria-hidden="true">|</span>
      <span className="vl-promo__msg">Easy Returns</span>
      <span className="vl-promo__sep" aria-hidden="true">|</span>
      <span className="vl-promo__msg">Extra 10% Off on Prepaid Orders</span>
      <span className="vl-promo__sep" aria-hidden="true">|</span>
    </>
  );
}

export function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: session } = useSession();
  const { ready, state } = usePreviewStore();

  const wishlistCount = ready ? state.wishlist.length : 0;
  const bagCount = ready ? state.bag.reduce((s, i) => s + i.quantity, 0) : 0;
  const isLoggedIn = Boolean(session?.user);
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the drawer is open so the page behind it stays put.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header className={`vl-header${scrolled ? " vl-header--scrolled" : ""}`}>
      <div className="vl-container vl-header__row">
        <button
          type="button"
          className="vl-menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="vl-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
          </svg>
        </button>

        <Link className="vl-logo" href="/" aria-label="AURELIA home">
          <Leaf />
          AURELIA
        </Link>

        <nav className="vl-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className={n.sale ? "vl-nav--sale" : ""}>{n.label}</Link>
          ))}
        </nav>

        <div className="vl-header__actions">
          <form className="vl-search" onSubmit={submitSearch} role="search">
            <button type="submit" className="vl-search__btn" aria-label="Search">
              <Icon name="search" />
            </button>
            <input
              type="search"
              placeholder="Search for products..."
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          {isAdmin && (
            <Link className="vl-admin-link" href="/admin" aria-label="Admin dashboard">Admin</Link>
          )}
          <Link className="vl-icon-btn" href={isLoggedIn ? "/account" : "/login"} aria-label={isLoggedIn ? "My account" : "Sign in"}>
            <Icon name="user" />
          </Link>
          <Link className="vl-icon-btn" href="/wishlist" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}>
            <Icon name="heart" />
            {wishlistCount > 0 && <span className="vl-cart-badge" aria-hidden="true">{wishlistCount}</span>}
          </Link>
          <Link className="vl-icon-btn" href="/bag" aria-label={`Shopping bag${bagCount ? `, ${bagCount} items` : ""}`}>
            <Icon name="bag" />
            {bagCount > 0 && <span className="vl-cart-badge" aria-hidden="true">{bagCount}</span>}
          </Link>
        </div>
      </div>

      {/* Backdrop — click to close the drawer */}
      <div
        className={`vl-menu-backdrop${open ? " vl-open" : ""}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      <nav
        id="vl-mobile-menu"
        className={`vl-mobile-menu${open ? " vl-open" : ""}`}
        aria-label="Mobile"
      >
        {/* Branded drawer header with close button */}
        <div className="vl-drawer__head">
          <Link href="/" className="vl-drawer__brand" onClick={() => setOpen(false)}>
            <Leaf />
            AURELIA
          </Link>
          <button
            type="button"
            className="vl-drawer__close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="vl-drawer__items">
          {(isLoggedIn
            ? (isAdmin
                ? [{ label: "Admin Dashboard", href: "/admin", icon: "admin" as const }, ...LOGGED_IN_MENU]
                : LOGGED_IN_MENU)
            : LOGGED_OUT_MENU
          ).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`vl-drawer__item${item.sale ? " vl-drawer__item--sale" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="vl-drawer__icon"><MenuIcon name={item.icon} /></span>
              <span className="vl-drawer__label">{item.label}</span>
              <svg className="vl-drawer__chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </Link>
          ))}

          {isLoggedIn && (
            <button
              type="button"
              className="vl-drawer__item vl-drawer__signout"
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
            >
              <span className="vl-drawer__icon"><MenuIcon name="signout" /></span>
              <span className="vl-drawer__label">Sign out</span>
            </button>
          )}
        </div>

        <p className="vl-drawer__foot">Modern fashion, thoughtfully made.</p>
      </nav>
    </header>
  );
}
