
"use client";

import { useRef, useState } from "react";
import CountryCodeSelect, {
  type Country,
} from "@/components/auth/CountryCodeSelect";

const COUNTRIES: Country[] = [
  { code: "+1", name: "United States / Canada" },
  { code: "+44", name: "United Kingdom" },
  { code: "+52", name: "Mexico" },
  { code: "+61", name: "Australia" },
  { code: "+91", name: "India" },
];

// +1 numbers are split into area code, next three digits, and last four.
const SEGMENT_LENGTHS = [3, 3, 4];
const SEGMENT_LABELS = [
  "Area code",
  "Next three digits",
  "Last four digits",
];
const SEGMENT_AUTOCOMPLETE = [
  "tel-area-code",
  "tel-local-prefix",
  "tel-local-suffix",
];

const SEGMENTED_CODE = "+1";
const SEGMENTED_DIGITS = 10;

// Other countries use one box, since their numbers aren't grouped the same way.
const OTHER_MIN_DIGITS = 6;
const OTHER_MAX_DIGITS = 14;

function digitsOnly(text: string) {
  let digits = "";

  for (const char of text) {
    if (char >= "0" && char <= "9") {
      digits += char;
    }
  }

  return digits;
}

// Returns a message if the number from PhoneField is incomplete, otherwise "".
export function getPhoneError(value: string) {
  // Longest code first, so "+1" is only matched when nothing longer fits.
  const country = [...COUNTRIES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((item) => value.startsWith(item.code));

  const digits = value.length - (country?.code.length ?? 0);

  if (country?.code === SEGMENTED_CODE) {
    return digits === SEGMENTED_DIGITS
      ? ""
      : "Enter all 10 digits of your phone number.";
  }

  return digits >= OTHER_MIN_DIGITS
    ? ""
    : "Enter your full phone number.";
}

interface PhoneFieldProps {
  id: string;
  label: string;
  // Called with the full number, e.g. "+15551234567".
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

export default function PhoneField({
  id,
  label,
  onChange,
  hint,
  error,
}: PhoneFieldProps) {
  const [countryCode, setCountryCode] = useState(SEGMENTED_CODE);
  const [segments, setSegments] = useState(["", "", ""]);
  const [otherNumber, setOtherNumber] = useState("");

  const segmentInputs = useRef<(HTMLInputElement | null)[]>([]);

  const segmented = countryCode === SEGMENTED_CODE;

  const boxClass = `w-full min-w-0 rounded-xl border bg-white py-3 text-sm text-foreground outline-none transition focus:ring-2 ${
    error
      ? "border-accent focus:border-accent focus:ring-accent/20"
      : "border-border-custom focus:border-secondary focus:ring-secondary/20"
  }`;

  function handleCountryChange(code: string) {
    setCountryCode(code);

    onChange(
      code +
        (code === SEGMENTED_CODE ? segments.join("") : otherNumber)
    );
  }

  function handleSegmentChange(index: number, text: string) {
    let digits = digitsOnly(text);

    // A pasted full number may start with the country code, e.g. "1 (555) 123-4567".
    if (
      index === 0 &&
      digits.length === SEGMENTED_DIGITS + 1 &&
      digits.startsWith("1")
    ) {
      digits = digits.slice(1);
    }

    const next = [...segments];

    if (digits.length <= SEGMENT_LENGTHS[index]) {
      next[index] = digits;
    } else {
      // Typed or pasted past the end of this box, so the rest spills into the boxes after it.
      let rest = digits;

      for (let i = index; i < next.length; i++) {
        next[i] = rest.slice(0, SEGMENT_LENGTHS[i]);
        rest = rest.slice(SEGMENT_LENGTHS[i]);
      }
    }

    setSegments(next);
    onChange(countryCode + next.join(""));

    // Move on to the first box that still needs digits.
    if (next[index].length === SEGMENT_LENGTHS[index]) {
      let target = index + 1;

      while (
        target < next.length - 1 &&
        next[target].length === SEGMENT_LENGTHS[target]
      ) {
        target++;
      }

      segmentInputs.current[target]?.focus();
    }
  }

  function handleSegmentKeyDown(index: number, key: string) {
    // Backspace in an empty box steps back to the previous one.
    if (key === "Backspace" && segments[index] === "" && index > 0) {
      segmentInputs.current[index - 1]?.focus();
    }
  }

  function handleOtherChange(text: string) {
    const digits = digitsOnly(text).slice(0, OTHER_MAX_DIGITS);

    setOtherNumber(digits);
    onChange(countryCode + digits);
  }

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-primary">
        {label}
      </legend>

      <div className="flex items-center gap-2">
        <CountryCodeSelect
          id={`${id}-country`}
          countries={COUNTRIES}
          value={countryCode}
          onChange={handleCountryChange}
          invalid={!!error}
        />

        {segmented ? (
          SEGMENT_LENGTHS.map((length, index) => (
            <div
              key={index}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="text-sm font-semibold text-muted"
                >
                  –
                </span>
              )}

              <input
                id={`${id}-${index}`}
                ref={(element) => {
                  segmentInputs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                aria-label={SEGMENT_LABELS[index]}
                aria-invalid={error ? true : undefined}
                autoComplete={SEGMENT_AUTOCOMPLETE[index]}
                placeholder={"0".repeat(length)}
                value={segments[index]}
                onChange={(event) =>
                  handleSegmentChange(index, event.target.value)
                }
                onKeyDown={(event) =>
                  handleSegmentKeyDown(index, event.key)
                }
                className={`${boxClass} px-1 text-center tracking-widest`}
              />
            </div>
          ))
        ) : (
          <input
            id={`${id}-number`}
            type="text"
            inputMode="numeric"
            aria-label="Phone number"
            aria-invalid={error ? true : undefined}
            autoComplete="tel-national"
            value={otherNumber}
            onChange={(event) =>
              handleOtherChange(event.target.value)
            }
            className={`${boxClass} px-4`}
          />
        )}
      </div>

      {(error || hint) && (
        <p
          className={`mt-2 text-xs ${
            error ? "text-accent" : "text-muted"
          }`}
        >
          {error || hint}
        </p>
      )}
    </fieldset>
  );
}
