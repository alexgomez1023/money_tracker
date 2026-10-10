
import type { Budget } from "@/lib/budget-storage";

export type SpendingTransaction = {
  amount: number;
  date: string;
  pending?: boolean;
  personal_finance_category?: {
    primary: string;
  } | null;
};

// Calculate monthly spending from Plaid transactions.
export function calculatePlaidBudgets(
  budgets: Budget[],
  transactions: SpendingTransaction[]
): Budget[] {
  const now = new Date();

  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const spending: Record<string, number> = {
    "Food & Drink": 0,
    Shopping: 0,
    Transportation: 0,
    Other: 0,
  };

  for (const transaction of transactions) {
    // Only count completed expenses this month.
    if (transaction.pending || transaction.amount <= 0) continue;
    if (!transaction.date.startsWith(currentMonth)) continue;

    const primary =
      transaction.personal_finance_category?.primary ?? "";

    // Exclude transfers and loan payments.
    if (
      primary.startsWith("TRANSFER") ||
      primary === "LOAN_PAYMENTS"
    ) {
      continue;
    }

    let category = "Other";

    if (primary === "FOOD_AND_DRINK") {
      category = "Food & Drink";
    } else if (
      primary === "GENERAL_MERCHANDISE" ||
      primary === "GENERAL_SERVICES" ||
      primary === "ENTERTAINMENT"
    ) {
      category = "Shopping";
    } else if (
      primary === "TRANSPORTATION" ||
      primary === "TRAVEL"
    ) {
      category = "Transportation";
    }

    spending[category] += transaction.amount;
  }

  // Preserve each budget's editable limit and color.
  return budgets.map((budget) => ({
    ...budget,
    spent: spending[budget.category] ?? 0,
  }));
}
