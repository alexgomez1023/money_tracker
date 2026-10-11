
import { formatPhone, splitPhone } from "@/lib/phone";

interface PhoneDisplayProps {
  value: string;
  // "onPrimary" is for the navy cards, "onSurface" for white cards.
  tone?: "onPrimary" | "onSurface";
  size?: "large" | "small";
}

// Shows a phone number in the same boxes as the phone input: country code, area code, three digits, four digits.
export default function PhoneDisplay({
  value,
  tone = "onSurface",
  size = "small",
}: PhoneDisplayProps) {
  const parts = splitPhone(value);

  const textSize =
    size === "large" ? "text-xl font-bold" : "text-sm font-semibold";

  const padding = size === "large" ? "px-3 py-2" : "px-3 py-3";

  const boxClass =
    tone === "onPrimary"
      ? "bg-white/15 text-white"
      : "border border-border-custom bg-background text-foreground";

  const codeClass =
    tone === "onPrimary"
      ? "bg-white/30 text-white"
      : "border border-border-custom bg-surface-blue text-primary";

  const dashClass =
    tone === "onPrimary" ? "text-white/60" : "text-muted";

  // Numbers that aren't +1 don't fit the boxes, so they are shown as plain text.
  if (!parts) {
    return (
      <span className={`block ${textSize}`}>
        {value}
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={formatPhone(value)}
      className={`flex flex-wrap items-center gap-2 ${textSize}`}
    >
      <span
        aria-hidden="true"
        className={`rounded-xl ${padding} ${codeClass}`}
      >
        {parts.countryCode}
      </span>

      {parts.segments.map((segment, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="flex items-center gap-2"
        >
          {index > 0 && (
            <span className={dashClass}>–</span>
          )}

          <span
            className={`rounded-xl ${padding} tracking-widest ${boxClass}`}
          >
            {segment}
          </span>
        </span>
      ))}
    </span>
  );
}
