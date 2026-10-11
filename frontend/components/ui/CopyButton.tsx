
"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

// How long the checkmark stays before the copy icon comes back.
const COPIED_MS = 2000;

interface CopyButtonProps {
  value: string;
  label: string;
}

// An icon button for the navy cards that copies a value to the clipboard.
export default function CopyButton({
  value,
  label,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Clipboard access was blocked, so the icon stays as it is.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
    >
      <Icon name={copied ? "check" : "copy"} size={20} />

      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
