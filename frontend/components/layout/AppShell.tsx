
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import Icon, { type IconName } from "@/components/ui/Icon";
import { navigation } from "@/lib/mock-data";
import { useSession } from "@/lib/auth";
import BottomNav from "./BottomNav";

type NavItem = {
  label: string;
  icon: IconName;
  href: string;
};

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

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  // Wait until the browser has mounted before checking localStorage.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPage =
    pathname === "/login" || pathname === "/signup";

  // Redirect visitors who are not signed in.
  useEffect(() => {
    if (!mounted) return;

    if (!session && !isPublicPage) {
      router.replace("/login");
    }
  }, [mounted, session, isPublicPage, router]);

  // Login and signup pages never show dashboard navigation.
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Prevent protected content from appearing while checking login.
  if (!mounted || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">
          Checking your session...
        </p>
      </main>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border-custom bg-white px-4 py-6 lg:flex">
        <Link
          href="/"
          className="px-3 font-display text-xl font-bold tracking-tight text-primary"
        >
          B2B
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

      {/* Dashboard content */}
      <div className="lg:pl-60">{children}</div>

      {/* Mobile navigation */}
      <BottomNav />
    </>
  );
}
