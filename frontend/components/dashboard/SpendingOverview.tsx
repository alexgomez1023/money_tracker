
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import {
  getBudgets,
  initialBudgets,
  type Budget,
} from "@/lib/budget-storage";

type PlaidTransaction = {
  amount: number;
  date: string;
  pending: boolean;
  personal_finance_category: {
    primary: string;
  } | null;
};

function getBudgetCategory(primary: string): string {
  if (primary === "FOOD_AND_DRINK") {
    return "Food & Drink";
  }

  if (primary === "GENERAL_MERCHANDISE" ||
      primary === "GENERAL_SERVICES" ||
      primary === "ENTERTAINMENT") {
    return "Shopping";
  }

  if (primary === "TRANSPORTATION" ||
      primary === "TRAVEL") {
    return "Transportation";
  }

  return "Other";
}

export default function SpendingOverview() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Keep editable budget limits synchronized.
  useEffect(() => {
    function refresh() {
      setBudgets(getBudgets());
    }

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("budgets-updated", refresh);
    window.addEventListener("pageshow", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("budgets-updated", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);

  // Load Plaid transactions.
  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch("/api/transactions", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load transactions");
        }

        const data = await response.json();
        setTransactions(data.transactions ?? []);
      } catch {
        setError("Connect a bank to view spending.");
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  // Calculate spending for the current month.
  const now = new Date();
  const month = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const spendingByCategory: Record<string, number> = {
    "Food & Drink": 0,
    Shopping: 0,
    Transportation: 0,
    Other: 0,
  };

  for (const transaction of transactions) {
    if (transaction.pending || transaction.amount <= 0) {
      continue;
    }

    if (!transaction.date.startsWith(month)) {
      continue;
    }

    const primary =
      transaction.personal_finance_category?.primary ?? "";

    // Skip transfers and payments.
    if (
      primary.startsWith("TRANSFER") ||
      primary === "LOAN_PAYMENTS"
    ) {
      continue;
    }

    const category = getBudgetCategory(primary);

    spendingByCategory[category] += transaction.amount;
  }

  // Use Plaid spending while preserving editable limits.
  const liveBudgets = budgets.map((budget) => ({
    ...budget,
    spent: spendingByCategory[budget.category] ?? 0,
  }));

  const total = liveBudgets.reduce(
    (sum, item) => sum + item.spent,
    0
  );

  const totalLimit = liveBudgets.reduce(
    (sum, item) => sum + item.limit,
    0
  );

  const remaining = totalLimit - total;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary">
            Spending Overview
          </h2>

          <p className="mt-1 text-xs text-muted">
            Monthly breakdown · Plaid Sandbox
          </p>
        </div>

        <span className="text-lg font-bold text-primary">
          {loading ? "Loading..." : error ? "—" : `$${total.toFixed(2)}`}
        </span>
      </div>

      {error && (
        <p className="mt-3 text-xs text-accent">
          {error}
        </p>
      )}

      <div className="mt-4 rounded-xl bg-surface-blue p-4">
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted">
            Monthly budget
          </span>

          <span className="font-semibold text-primary">
            ${totalLimit.toFixed(2)}
          </span>
        </div>

        <div className="mt-2 flex justify-between gap-3 text-sm">
          <span className="text-muted">
            Remaining
          </span>

          <span
            className={`font-semibold ${
              remaining < 0 ? "text-accent" : "text-secondary"
            }`}
          >
            {loading || error
              ? "—"
              : `${remaining < 0 ? "-" : ""}$${Math.abs(remaining).toFixed(2)}`}
          </span>
        </div>
      </div>

      <div
        className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label="Spending breakdown by category"
      >
        {!loading && !error && liveBudgets.map((item) => (
          <div
            key={item.category}
            style={{
              width: `${total > 0 ? (item.spent / total) * 100 : 0}%`,
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {liveBudgets.map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />

              <div>
                <p className="text-sm text-foreground">
                  {item.category}
                </p>

                <p className="text-xs text-muted">
                  Limit: ${item.limit.toFixed(2)}
                </p>
              </div>
            </div>

            <span className="text-sm font-semibold">
              {loading || error ? "—" : `$${item.spent.toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/budgets"
        className="mt-5 inline-block text-sm font-semibold text-secondary hover:text-primary"
      >
        View and edit budgets →
      </Link>
    </Card>
  );
}
