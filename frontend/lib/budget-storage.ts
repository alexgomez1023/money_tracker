export type Budget = {
  category: string;
  spent: number;
  limit: number;
  color: string;
};

export const initialBudgets: Budget[] = [
  { category: "Food & Drink", spent: 320, limit: 400, color: "#0076A8" },
  { category: "Shopping", spent: 210, limit: 300, color: "#D22E3A" },
  { category: "Transportation", spent: 95, limit: 200, color: "#8ECDE7" },
  { category: "Other", spent: 0, limit: 300, color: "#64748B" },
];

const STORAGE_KEY = "money-tracker-budgets";

export function getBudgets(): Budget[] {
  if (typeof window === "undefined") return initialBudgets;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialBudgets;
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length !== initialBudgets.length) {
      return initialBudgets;
    }
    const valid = initialBudgets.every((base) =>
      parsed.some((item) =>
        item !== null && typeof item === "object" &&
        item.category === base.category &&
        typeof item.limit === "number" &&
        Number.isFinite(item.limit) && item.limit > 0
      )
    );
    if (!valid) return initialBudgets;
    // Keep sample spending and colors consistent; persist editable limits only.
    return initialBudgets.map((base) => ({
      ...base,
      limit: (parsed as Budget[]).find((item) => item.category === base.category)!.limit,
    }));
  } catch {
    return initialBudgets;
  }
}

export function saveBudgets(budgets: Budget[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
    window.dispatchEvent(new Event("budgets-updated"));
  } catch {
    // In private browsing or restricted environments, changes remain in page state.
  }
}
