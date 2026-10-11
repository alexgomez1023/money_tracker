"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { navigation } from "@/lib/mock-data";
import BottomNav from "./BottomNav";

type NavItem = {
  label: string;
  icon: IconName;
  href: string;
};

// Pages only the desktop sidebar has room for. On phones they are reached from the dashboard and the profile icon.
const secondaryNavigation: NavItem[] = [
  { label: "Savings", icon: "target", href: "/savings" },
  { label: "Connect Bank", icon: "wallet", href: "/connect-bank" },
  { label: "Settings", icon: "user", href: "/settings" },
];

interface SidebarLinkProps {
  item: NavItem;
  active: boolean;
}

function SidebarLink({ item, active }: SidebarLinkProps) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
        active
          ? "bg-surface-blue font-semibold text-primary"
          : "font-medium text-muted hover:bg-background hover:text-primary"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary"
        />
      )}

      <Icon name={item.icon} size={20} />
      <span>{item.label}</span>
    </Link>
  );
}

interface AppShellProps {
  children: ReactNode;
}

// The app's navigation: a left sidebar on desktop and a bottom tab bar on phones and tablets.
export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // The login and signup pages have no navigation.
  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border-custom bg-white px-4 py-6 lg:flex">
        <Link
          href="/"
          className="px-3 font-display text-xl font-bold tracking-tight text-primary"
        >
          Money Tracker
        </Link>

        <nav
          aria-label="Main navigation"
          className="mt-8 flex flex-1 flex-col gap-1"
        >
          {navigation.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={pathname === item.href}
            />
          ))}

          <div className="my-3 border-t border-border-custom" />

          {secondaryNavigation.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </nav>
      </aside>

      <div className="lg:pl-60">{children}</div>

      <BottomNav />
    </>
  );
}
