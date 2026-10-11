
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  initialBudgets,
  loadBudgets,
  onBudgetsUpdated,
  type Budget,
} from "@/lib/budget-storage";
import Skeleton from "@/components/ui/Skeleton";
import BankErrorNotice from "@/components/ui/BankErrorNotice";
import {
  getBankErrorReason,
  getTransactions,
  type BankErrorReason,
} from "@/lib/bank-data";
import { getCurrentMonth } from "@/lib/plaid-spending";
import { formatMoney } from "@/lib/format";

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
  const [month, setMonth] = useState("");
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [budgetsLoading, setBudgetsLoading] = useState(true);

  // Everything stays a skeleton until both have arrived, so the numbers appear together.
  const loading = transactionsLoading || budgetsLoading;
  const [error, setError] = useState<BankErrorReason | "">("");

  // Load budget limits from the user's account, and again whenever they are saved.
  useEffect(() => {
    async function refresh() {
      setBudgets(await loadBudgets());
      setBudgetsLoading(false);
    }

    refresh();

    return onBudgetsUpdated(refresh);
  }, []);

  // Load Plaid transactions.
  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await getTransactions<PlaidTransaction>();
        setMonth(getCurrentMonth());
        setTransactions(data.transactions ?? []);
      } catch (err) {
        setError(getBankErrorReason(err));
      } finally {
        setTransactionsLoading(false);
      }
    }

    loadTransactions();
  }, []);

  // Calculate spending for the current month.
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
            This month by category
          </p>
        </div>

        <span className="font-display text-2xl font-bold tracking-tight text-primary">
          {loading ? (
            <Skeleton className="h-6 w-24" />
          ) : error ? (
            "N/A"
          ) : (
            formatMoney(total)
          )}
        </span>
      </div>

      {error && (
        <BankErrorNotice reason={error} className="mt-3" />
      )}

      <div className="mt-4 rounded-xl bg-surface-blue p-4">
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted">
            Monthly budget
          </span>

          <span className="font-semibold text-primary">
            {loading ? (
              <Skeleton className="h-4 w-16 !bg-white" />
            ) : (
              formatMoney(totalLimit)
            )}
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
            {loading ? (
              <Skeleton className="h-4 w-16 !bg-white" />
            ) : error ? (
              "N/A"
            ) : (
              formatMoney(remaining)
            )}
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
                  {loading ? (
                    <Skeleton className="mt-1 h-3 w-20" />
                  ) : (
                    `Limit: ${formatMoney(item.limit)}`
                  )}
                </p>
              </div>
            </div>

            <span className="text-sm font-semibold">
              {loading ? (
                <Skeleton className="h-4 w-14" />
              ) : error ? (
                "N/A"
              ) : (
                formatMoney(item.spent)
              )}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/budgets"
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
      >
        View and edit budgets
        <Icon name="arrowRight" size={16} />
      </Link>
    </Card>
  );
}
