const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 1234.5 -> "$1,234.50". Pass a currency code for accounts that aren't in dollars.
export function formatMoney(amount: number, currency = "USD") {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency,
  });
}

// "2026-10-03" -> "Sat, Oct 3"
export function formatDay(date: string) {
  const parts = date.split("-");

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];

  if (!weekday) {
    return date;
  }

  return `${weekday}, ${formatDate(date)}`;
}

// "2026-10-03" -> "Oct 3"
export function formatDate(date: string) {
  const parts = date.split("-");

  const month = MONTHS[Number(parts[1]) - 1];
  const day = Number(parts[2]);

  if (!month || !Number.isFinite(day)) {
    return date;
  }

  return `${month} ${day}`;
}

// "FOOD_AND_DRINK" -> "Food & Drink"
export function formatCategory(category: string | null | undefined) {
  if (!category) {
    return "Other";
  }

  const words = category.split("_").map((word) => {
    if (word === "AND") {
      return "&";
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return words.join(" ");
}
