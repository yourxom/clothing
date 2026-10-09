"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Search, UserRound, Heart, ShoppingBag, LogOut } from "lucide-react";
import { AnnouncementBar } from "./announcement-bar";
import { usePreviewStore } from "./preview-store";

const women = [
  { label: "Kurtas",        href: "/collections/kurtas" },
  { label: "Kurta Sets",    href: "/collections/kurta-sets" },
  { label: "Tops & Shirts", href: "/collections/tops-shirts" },
  { label: "Suits",         href: "/collections/suits" },
  { label: "Dresses",       href: "/collections/dresses" },
  { label: "Sarees",        href: "/collections/sarees" },
  { label: "Lehengas",      href: "/collections/lehengas" },
  { label: "Bottom Wear",   href: "/collections/bottom-wear" },
  { label: "Co-ords",       href: "/collections/co-ord-sets" },
  { label: "Dupattas",      href: "/collections/dupattas" },
];

const collections = [
  { label: "All styles",    href: "/shop" },
  { label: "Festive edit",  href: "/shop?occasion=festive" },
  { label: "Wedding edit",  href: "/shop?occasion=wedding" },
  { label: "Workwear edit", href: "/shop?occasion=workwear" },
  { label: "Casual edit",   href: "/shop?occasion=casual" },
];

function NavMenu({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="mega-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
      >
        {label}
      </button>
      {open && (
        <div className="mega-menu" role="menu">
          {items.map(item => (
            <Link key={item.label} href={item.href} role="menuitem" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname                = usePathname();
  const { data: session }       = useSession();
  const { ready, state, comparison } = usePreviewStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const wishlistCount = ready ? state.wishlist.length : 0;
  const bagCount      = ready ? state.bag.reduce((s, i) => s + i.quantity, 0) : 0;
  const compareCount  = ready ? comparison.length : 0;
  const isLoggedIn    = Boolean(session?.user);
  const userName      = session?.user?.name ?? session?.user?.email ?? null;
  const userRole      = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin       = userRole === "admin" || userRole === "superadmin";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`}>
      <AnnouncementBar />

      <div className="container nav-row">
        {/* Mobile toggle */}
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Brand */}
        <Link className="brand" href="/" aria-label="AURELIA home" style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="24"
            height="24"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path fill="#c85b5b" d="M 7 2 C 2 7 1 15 1.5 26 C 2 29 4 30 7 30 C 13 30 19 26 29 18 C 21 18 15.5 16 12.5 14.5 C 17 11 20.5 7.5 24 3.5 C 17 5.5 11.5 4 7 2 Z" />
          </svg>
          <span>AURELIA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-links" aria-label="Main navigation">
          <NavMenu label="Women" items={women} />
          <Link href="/shop"    className={isActive("/shop")    ? "nav-active" : ""}>Shop All</Link>
          <NavMenu label="Collections" items={collections} />
          <Link href="/journal" className={isActive("/journal") ? "nav-active" : ""}>Journal</Link>
          <Link href="/about"   className={isActive("/about")   ? "nav-active" : ""}>Our Story</Link>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          {/* Search */}
          <Link className="icon-btn" href="/search" aria-label="Search">
            <Search size={20} />
          </Link>

          {/* Admin link — only for admin/superadmin */}
          {isAdmin && (
            <Link className="nav-admin-link" href="/admin" aria-label="Admin dashboard">
              Admin
            </Link>
          )}

          {/* Account — shows real state */}
          {isLoggedIn ? (
            <div className="nav-account-wrap">
              <Link className="icon-btn" href="/account"
                aria-label={`My account — ${userName}`} title={userName ?? "My account"}>
                <UserRound size={20} />
                <span className="nav-account-dot" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <Link className="icon-btn icon-btn--dim" href="/login"
              aria-label="Sign in to your account" title="Sign in">
              <UserRound size={20} />
            </Link>
          )}

          {/* Wishlist */}
          <Link className="icon-btn" href="/wishlist"
            aria-label={`Saved styles${wishlistCount > 0 ? ` (${wishlistCount})` : ""}`}>
            <Heart size={20} />
            {wishlistCount > 0 && <span className="nav-badge" aria-hidden="true">{wishlistCount}</span>}
          </Link>

          {/* Compare */}
          {compareCount > 0 && (
            <Link className="icon-btn" href="/compare"
              aria-label={`Compare ${compareCount} styles`}>
              <span className="nav-compare-label">Compare</span>
              <span className="nav-badge" aria-hidden="true">{compareCount}</span>
            </Link>
          )}

          {/* Bag */}
          <Link className="icon-btn" href="/bag"
            aria-label={`Bag — ${bagCount} item${bagCount !== 1 ? "s" : ""}`}>
            <ShoppingBag size={20} />
            {bagCount > 0 && <span className="nav-badge" aria-hidden="true">{bagCount}</span>}
          </Link>

          {/* Sign out (only when logged in, desktop) */}
          {isLoggedIn && (
            <button
              className="icon-btn icon-btn--dim"
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="mobile-nav container" id="mobile-navigation" aria-label="Mobile navigation">
          <Link href="/shop"     onClick={() => setMenuOpen(false)}>Shop All</Link>
          {women.map(item => (
            <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/journal"  onClick={() => setMenuOpen(false)}>Journal</Link>
          <Link href="/about"    onClick={() => setMenuOpen(false)}>Our Story</Link>
          <Link href="/stores"   onClick={() => setMenuOpen(false)}>Stores</Link>
          <Link href="/search"   onClick={() => setMenuOpen(false)}>Search</Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ fontWeight: 700, color: "var(--accent)" }}>
              Admin Dashboard
            </Link>
          )}
          {isLoggedIn ? (
            <Link href="/account" onClick={() => setMenuOpen(false)}>My Account</Link>
          ) : (
            <Link href="/login"   onClick={() => setMenuOpen(false)}>Sign in</Link>
          )}
          <Link href="/wishlist" onClick={() => setMenuOpen(false)}>
            Saved styles{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
          </Link>
          <Link href="/bag"      onClick={() => setMenuOpen(false)}>
            Bag{bagCount > 0 ? ` (${bagCount})` : ""}
          </Link>
          {compareCount > 0 && (
            <Link href="/compare" onClick={() => setMenuOpen(false)}>Compare ({compareCount})</Link>
          )}
          <Link href="/help"     onClick={() => setMenuOpen(false)}>Help & FAQ</Link>
          <Link href="/contact"  onClick={() => setMenuOpen(false)}>Contact</Link>
          {isLoggedIn && (
            <button type="button" className="mobile-nav-signout"
              onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}>
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
