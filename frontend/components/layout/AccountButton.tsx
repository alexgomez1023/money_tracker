
"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useSession } from "@/lib/auth";

// The profile icon. Opens settings, and offers a log in link when signed out.
export default function AccountButton() {
  const session = useSession();

  return (
    <div className="flex items-center gap-3">
      {!session && (
        <Link
          href="/login"
          className="text-sm font-semibold text-secondary hover:text-primary"
        >
          Log in
        </Link>
      )}

      <Link
        href="/settings"
        aria-label="Settings"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border-custom bg-surface-blue font-bold text-primary transition hover:border-secondary"
      >
        {session ? (
          session.user.name.charAt(0).toUpperCase()
        ) : (
          <Icon name="user" size={21} />
        )}
      </Link>
    </div>
  );
}
