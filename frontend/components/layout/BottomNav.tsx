"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { navigation } from "@/lib/mock-data";

export default function BottomNav() {
  const pathname = usePathname();

  // The login and signup pages have no navigation.
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-custom bg-white/95 px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-lg backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navigation.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-surface-blue text-primary"
                  : "text-muted hover:text-secondary"
              }`}
            >
              <Icon name={item.icon} size={21} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
