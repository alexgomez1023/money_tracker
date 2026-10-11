import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  // Filter chips pass true or false. Leave it out for a chip that is just a shortcut.
  active?: boolean;
};

// A pill button, used for filters and suggested prompts.
export default function Chip({
  active,
  className = "",
  type = "button",
  ...props
}: ChipProps) {
  const tone = active
    ? "border-primary bg-primary text-white"
    : "border-border-custom bg-white text-foreground hover:border-secondary hover:bg-surface-blue";

  return (
    <button
      type={type}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-xs font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${tone} ${className}`}
      {...props}
    />
  );
}
