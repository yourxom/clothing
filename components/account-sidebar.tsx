"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { User, ShoppingBag, Heart, MapPin, Lock, HelpCircle, LogOut, ChevronRight, Ticket, Gift } from "lucide-react";

type Props = {
  user:  { name: string | null; email: string; phone?: string | null };
  stats: { orders: number; wishlist: number; addresses: number };
};

// Phone-only accounts store a placeholder email — never show it to the user.
function displayContact(email: string, phone?: string | null): string {
  if (email && !email.endsWith("@phone.aurelia.local")) return email;
  if (phone) return `+91 ${phone}`;
  return "";
}

const navItems = [
  { href: "/account",            label: "Overview",         icon: User },
  { href: "/account/orders",     label: "My Orders",        icon: ShoppingBag },
  { href: "/account/coupons",    label: "My Coupons",       icon: Ticket },
  { href: "/account/refer",      label: "Refer & Earn",     icon: Gift },
  { href: "/wishlist",           label: "Saved Styles",     icon: Heart },
  { href: "/account/addresses",  label: "Addresses",        icon: MapPin },
  { href: "/account/profile",    label: "Profile & Password", icon: Lock },
  { href: "/help",               label: "Help & Support",   icon: HelpCircle },
];

export function AccountSidebar({ user, stats }: Props) {
  const pathname = usePathname();

  const contact = displayContact(user.email, user.phone);
  const initials = user.name?.trim()
    ? user.name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : ((contact || user.email)?.[0]?.toUpperCase() ?? "A");

  return (
    <aside className="acct-sidebar">
      {/* User identity */}
      <div className="acct-sidebar-user">
        <div className="acct-avatar" aria-hidden="true">{initials}</div>
        <div className="acct-sidebar-identity">
          <p className="acct-sidebar-name">{user.name ?? "My Account"}</p>
          <p className="acct-sidebar-email">{contact}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="acct-sidebar-stats">
        <div className="acct-stat">
          <span className="acct-stat-num">{stats.orders}</span>
          <span className="acct-stat-lbl">Orders</span>
        </div>
        <div className="acct-stat-divider" />
        <div className="acct-stat">
          <span className="acct-stat-num">{stats.wishlist}</span>
          <span className="acct-stat-lbl">Saved</span>
        </div>
        <div className="acct-stat-divider" />
        <div className="acct-stat">
          <span className="acct-stat-num">{stats.addresses}</span>
          <span className="acct-stat-lbl">Addresses</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="acct-nav" aria-label="Account navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`acct-nav-item${active ? " acct-nav-item--active" : ""}`}
              aria-current={active ? "page" : undefined}>
              <Icon size={18} className="acct-nav-icon" aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight size={15} className="acct-nav-chevron" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <button
        type="button"
        className="acct-signout"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut size={17} aria-hidden="true" />
        <span>Sign out</span>
      </button>
    </aside>
  );
}
