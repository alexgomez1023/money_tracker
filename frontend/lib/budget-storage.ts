import { authFetch } from "@/lib/auth";

export type Budget = {
  category: string;
  spent: number;
  limit: number;
  color: string;
};

// The four categories with their default limits. Spending is filled in from transactions.
export const initialBudgets: Budget[] = [
  { category: "Food & Drink", spent: 0, limit: 400, color: "#0076A8" },
  { category: "Shopping", spent: 0, limit: 300, color: "#D22E3A" },
  { category: "Transportation", spent: 0, limit: 200, color: "#8ECDE7" },
  { category: "Other", spent: 0, limit: 300, color: "#64748B" },
];

const BUDGETS_EVENT = "budgets-updated";

type SavedBudget = {
  category: string;
  limit: number;
};

// Loads the user's limits from their account. Nothing is kept in the browser.
// Returns the default limits when signed out or when the request fails.
export async function loadBudgets(): Promise<Budget[]> {
  try {
    const response = await authFetch("/api/budgets", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load budgets");
    }

    const data = await response.json();
    const saved: SavedBudget[] = data.budgets ?? [];

    return initialBudgets.map((base) => ({
      ...base,
      limit:
        saved.find((item) => item.category === base.category)?.limit ??
        base.limit,
    }));
  } catch {
    return initialBudgets;
  }
}

// Saves the limits to the user's account and tells the other budget views to reload.
// Returns false if the backend did not accept them.
export async function saveBudgetLimits(budgets: Budget[]) {
  try {
    const response = await authFetch("/api/budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgets: budgets.map((budget) => ({
          category: budget.category,
          limit: budget.limit,
        })),
      }),
    });

    if (response.ok) {
      window.dispatchEvent(new Event(BUDGETS_EVENT));
    }

    return response.ok;
  } catch {
    return false;
  }
}

// Calls the listener whenever saved limits change. Returns a function that stops listening.
export function onBudgetsUpdated(listener: () => void) {
  window.addEventListener(BUDGETS_EVENT, listener);

  return () => window.removeEventListener(BUDGETS_EVENT, listener);
}
