
const NORTH_AMERICA_CODE = "+1";
const NORTH_AMERICA_DIGITS = 10;

export type PhoneParts = {
  countryCode: string;
  // Area code, next three digits, last four.
  segments: string[];
};

function digitsOnly(text: string) {
  let digits = "";

  for (const char of text) {
    if (char >= "0" && char <= "9") {
      digits += char;
    }
  }

  return digits;
}

// Splits a +1 number such as "+15551234567" into its parts. Returns null for anything else.
export function splitPhone(value: string): PhoneParts | null {
  let digits = digitsOnly(value);

  if (
    digits.length === NORTH_AMERICA_DIGITS + 1 &&
    digits.startsWith("1")
  ) {
    digits = digits.slice(1);
  }

  if (digits.length !== NORTH_AMERICA_DIGITS) {
    return null;
  }

  return {
    countryCode: NORTH_AMERICA_CODE,
    segments: [
      digits.slice(0, 3),
      digits.slice(3, 6),
      digits.slice(6),
    ],
  };
}

// "+15551234567" becomes "+1 555-123-4567". Other numbers are returned as they are.
export function formatPhone(value: string) {
  const parts = splitPhone(value);

  if (!parts) {
    return value;
  }

  return `${parts.countryCode} ${parts.segments.join("-")}`;
}
