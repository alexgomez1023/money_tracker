"use client";

import Link from "next/link";
import type { BankErrorReason } from "@/lib/bank-data";

const MESSAGES: Record<BankErrorReason, string> = {
  signedOut: "Log in to see your accounts.",
  noBank: "Connect a bank to see your accounts.",
  unavailable: "We couldn't reach the server.",
};

interface BankErrorNoticeProps {
  reason: BankErrorReason;
  // Called by the Retry button. Without it, Retry reloads the page.
  onRetry?: () => void;
  // "onPrimary" is for the navy cards, "onSurface" for white cards.
  tone?: "onPrimary" | "onSurface";
  className?: string;
}

// Explains why bank data is missing and offers the one action that fixes it.
export default function BankErrorNotice({
  reason,
  onRetry,
  tone = "onSurface",
  className = "",
}: BankErrorNoticeProps) {
  const textClass =
    tone === "onPrimary" ? "text-blue-100" : "text-muted";

  const actionClass =
    tone === "onPrimary"
      ? "bg-white/15 text-white hover:bg-white/25"
      : "border border-border-custom bg-white text-primary hover:bg-surface-blue";

  const buttonClass = `shrink-0 rounded-xl px-4 py-2 text-xs font-semibold ${actionClass}`;

  function handleRetry() {
    if (onRetry) {
      onRetry();
      return;
    }

    window.location.reload();
  }

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-3 ${className}`}
    >
      <p className={`text-sm ${textClass}`}>
        {MESSAGES[reason]}
      </p>

      {reason === "signedOut" && (
        <Link href="/login" className={buttonClass}>
          Log in
        </Link>
      )}

      {reason === "noBank" && (
        <Link href="/connect-bank" className={buttonClass}>
          Connect bank
        </Link>
      )}

      {reason === "unavailable" && (
        <button
          type="button"
          onClick={handleRetry}
          className={buttonClass}
        >
          Retry
        </button>
      )}
    </div>
  );
}
