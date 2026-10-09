"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Users, MessageSquare,
  Mail, Star, Package, Boxes, ArrowLeft, Ticket, RotateCcw,
  Settings, Gift, Wallet, Building2, GitMerge
} from "lucide-react";

const navItems = [
  { href: "/admin",                  label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/orders",           label: "Orders",        icon: ShoppingBag },
  { href: "/admin/payments",         label: "Payments",      icon: Wallet },
  { href: "/admin/payment-accounts", label: "Bank Accounts", icon: Building2 },
  { href: "/admin/reconciliation",   label: "Reconciliation",icon: GitMerge },
  { href: "/admin/products",         label: "Products",      icon: Package },
  { href: "/admin/inventory",        label: "Inventory",     icon: Boxes },
  { href: "/admin/coupons",          label: "Coupons",       icon: Ticket },
  { href: "/admin/referrals",        label: "Referrals",     icon: Gift },
  { href: "/admin/returns",          label: "Returns",       icon: RotateCcw },
  { href: "/admin/users",            label: "Users",         icon: Users },
  { href: "/admin/contacts",         label: "Messages",      icon: MessageSquare },
  { href: "/admin/newsletter",       label: "Newsletter",    icon: Mail },
  { href: "/admin/reviews",          label: "Reviews",       icon: Star },
  { href: "/admin/settings",         label: "Settings",      icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-inner">
        <div className="admin-brand">
          <Link href="/admin">
            AURELIA <span>Admin</span>
          </Link>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const exact  = href === "/admin";
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`admin-nav-link${active ? " admin-nav-link--active" : ""}`}
                aria-current={active ? "page" : undefined}>
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-nav-footer">
          <Link href="/" className="admin-back-link">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </div>
    </aside>
  );
}
