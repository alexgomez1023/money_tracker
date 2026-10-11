import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "danger"
  | "dangerOutline";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary:
    "border border-border-custom bg-white text-primary hover:bg-surface-blue",
  soft: "bg-surface-blue text-primary hover:bg-border-custom",
  danger: "bg-accent text-white hover:opacity-90",
  dangerOutline:
    "border border-accent bg-white text-accent hover:bg-accent hover:text-white",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

interface ButtonStyle {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

// The classes for a button. Links that should look like buttons use this directly.
export function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonStyle = {}) {
  const width = fullWidth ? "w-full" : "";

  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${width} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle;

export default function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
