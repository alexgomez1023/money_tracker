
import type { ReactNode } from "react";

// Names of all icons available in our application
export type IconName =
  | "home"
  | "activity"
  | "budget"
  | "deals"
  | "assistant"
  | "wallet"
  | "eye"
  | "eyeOff"
  | "arrowRight"
  | "sparkles"
  | "target"
  | "user"
  | "coffee"
  | "shopping"
  | "income"
  | "food"
  | "copy"
  | "check";

// Properties accepted by the Icon component
interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export default function Icon({
  name,
  size = 20,
  className = "",
}: IconProps) {
  // SVG paths that draw each icon
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9" />
        <path d="M9 21v-7h6v7" />
      </>
    ),

    activity: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),

    budget: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l7 5" />
      </>
    ),

    deals: (
      <>
        <path d="M20 13 12 21 3 12V4h8z" />
        <circle cx="7.5" cy="8.5" r="1" />
      </>
    ),

    assistant: (
      <path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
    ),

    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <path d="M3 9h18M16 15h2" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),

    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 5.1A11 11 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3.2 3.8" />
        <path d="M6.2 6.2C3.5 8.1 2 12 2 12s4 7 10 7a10 10 0 0 0 4-.8" />
      </>
    ),

    arrowRight: (
      <path d="M5 12h14m-6-6 6 6-6 6" />
    ),

    sparkles: (
      <path d="m12 3 2 7 7 2-7 2-2 7-7-2 7-2z" />
    ),

    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-5 3-8 8-8s8 3 8 8" />
      </>
    ),

    coffee: (
      <>
        <path d="M4 7h13v8a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" />
        <path d="M17 9h2a3 3 0 0 1 0 6h-2M8 3v2M13 3v2" />
      </>
    ),

    shopping: (
      <>
        <path d="M4 8h16l-1 13H5z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),

    income: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12m3-9c0-2-6-2-6 0s6 2 6 4-6 2-6 0" />
      </>
    ),

    food: (
      <>
        <path d="M4 3v8m4-8v8M4 7h4M6 11v10" />
        <path d="M17 3c-3 3-3 8 0 10v8" />
      </>
    ),

    copy: (
      <>
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
      </>
    ),

    check: (
      <>
        <path d="m5 12 5 5 9-10" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
