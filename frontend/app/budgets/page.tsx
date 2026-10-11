
"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useEffect, useState } from "react";
import {
  loadBudgets,
  onBudgetsUpdated,
  saveBudgetLimits,
  initialBudgets,
  type Budget,
} from "@/lib/budget-storage";
import {
  calculatePlaidBudgets,
  getCurrentMonth,
  type SpendingTransaction,
} from "@/lib/plaid-spending";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import BankErrorNotice from "@/components/ui/BankErrorNotice";
import {
  getBankErrorReason,
  getTransactions,
  type BankErrorReason,
} from "@/lib/bank-data";
import { formatMoney } from "@/lib/format";
import { showToast } from "@/lib/toast";

// One color per budget state, the same for every category.
const STATUS_COLORS = {
  onTrack: "var(--secondary)",
  nearLimit: "var(--warning)",
  overBudget: "var(--accent)",
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [transactions, setTransactions] = useState<SpendingTransaction[]>([]);
  const [month, setMonth] = useState("");
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [budgetsLoading, setBudgetsLoading] = useState(true);

  // Everything stays a skeleton until both have arrived, so the numbers appear together.
  const loading = transactionsLoading || budgetsLoading;
  const [error, setError] = useState<BankErrorReason | "">("");

  const [editing, setEditing] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [limitError, setLimitError] = useState("");

  // Load budget limits from the user's account, and again whenever they are saved.
  useEffect(() => {
    async function refreshBudgets() {
      setBudgets(await loadBudgets());
      setBudgetsLoading(false);
    }

    refreshBudgets();

    return onBudgetsUpdated(refreshBudgets);
  }, []);

  // Load transactions from Plaid.
  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await getTransactions<SpendingTransaction>();

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

  // Combine Plaid spending with saved budget limits.
  const liveBudgets = calculatePlaidBudgets(budgets, transactions, month);

  const totalBudget = liveBudgets.reduce(
    (sum, budget) => sum + budget.limit,
    0
  );

  const totalSpent = liveBudgets.reduce(
    (sum, budget) => sum + budget.spent,
    0
  );

  const remaining = totalBudget - totalSpent;

  // Start editing a monthly limit.
  function startEditing(budget: Budget) {
    setEditing(budget.category);
    setNewLimit(budget.limit.toString());
    setLimitError("");
  }

  // Save a new monthly limit.
  async function saveBudget(category: string) {
    const value = Number(newLimit);

    if (!Number.isFinite(value) || value <= 0) {
      setLimitError("Enter a budget greater than $0.");
      return;
    }

    setLimitError("");

    const updated = budgets.map((budget) =>
      budget.category === category
        ? { ...budget, limit: value }
        : budget
    );

    const previous = budgets;

    setBudgets(updated);

    setEditing(null);
    setNewLimit("");

    const saved = await saveBudgetLimits(updated);

    if (!saved) {
      setBudgets(previous);

      showToast("Your budget couldn't be saved. Please try again.", "error");
      return;
    }

    showToast(`${category} budget saved.`);
  }

  const hasOverspending = liveBudgets.some(
    (budget) => budget.spent > budget.limit
  );

  const approachingLimit = liveBudgets.some(
    (budget) => budget.spent / budget.limit >= 0.8
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        {/* Page Header */}
        <header className="mb-8">
          <p className="text-sm text-muted">
            Your Finances
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
            Monthly Budgets
          </h1>

          <p className="mt-2 text-sm text-muted">
            Set spending limits and stay on track.
          </p>
        </header>

        {error && (
          <BankErrorNotice reason={error} className="mb-4" />
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-medium text-muted">
              Total Budget
            </p>

            <p className="mt-3 font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                formatMoney(totalBudget)
              )}
            </p>
          </Card>

          <Card>
            <p className="text-xs font-medium text-muted">
              Remaining
            </p>

            <p
              className={`mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl ${
                remaining < 0
                  ? "text-accent"
                  : "text-secondary"
              }`}
            >
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : error ? (
                "N/A"
              ) : (
                formatMoney(remaining)
              )}
            </p>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-primary">
              Overall Spending
            </h2>

            <span className="font-display text-lg font-bold text-primary">
              {loading ? (
                <Skeleton className="h-6 w-28" />
              ) : error ? (
                "N/A"
              ) : (
                `${formatMoney(totalSpent)} spent`
              )}
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-blue">
            <div
              className={`h-full rounded-full transition-all ${
                remaining < 0
                  ? "bg-accent"
                  : "bg-secondary"
              }`}
              style={{
                width: `${
                  !loading && !error && totalBudget > 0
                    ? Math.min(
                        (totalSpent / totalBudget) * 100,
                        100
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <p className="mt-3 text-xs text-muted">
            {loading ? (
              <Skeleton className="h-3 w-48" />
            ) : error
              ? "Waiting for spending data"
              : totalBudget > 0
                ? `${Math.round(
                    (totalSpent / totalBudget) * 100
                  )}% of your monthly budget used`
                : "No budget set"}
          </p>
        </Card>

        {/* Budget Categories */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-primary">
            Category Budgets
          </h2>

          <div className="space-y-4">
            {liveBudgets.map((budget) => {
              const percentage =
                (budget.spent / budget.limit) * 100;

              const overBudget = percentage > 100;

              const nearLimit =
                percentage >= 80 && !overBudget;

              const statusColor = overBudget
                ? STATUS_COLORS.overBudget
                : nearLimit
                  ? STATUS_COLORS.nearLimit
                  : STATUS_COLORS.onTrack;

              return (
                <Card key={budget.category}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-primary">
                        {budget.category}
                      </h3>

                      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                        {loading ? (
                          <Skeleton className="h-7 w-24" />
                        ) : error ? (
                          "Unavailable"
                        ) : (
                          <>
                            {formatMoney(budget.spent)}

                            <span className="ml-2 font-sans text-xs font-medium tracking-normal text-muted">
                              spent
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => startEditing(budget)}
                      disabled={budgetsLoading}
                      variant="secondary"
                      size="sm"
                    >
                      Edit Budget
                    </Button>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-muted">
                      Monthly Limit
                    </span>

                    <span className="font-semibold text-foreground">
                      {loading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        formatMoney(budget.limit)
                      )}
                    </span>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-blue">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${
                          !loading && !error
                            ? Math.min(percentage, 100)
                            : 0
                        }%`,
                        backgroundColor: statusColor,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted">
                      {loading ? (
                        <Skeleton className="h-3 w-14" />
                      ) : error ? (
                        "N/A"
                      ) : (
                        `${Math.round(percentage)}% used`
                      )}
                    </p>

                    {!loading && !error && (
                      <p
                        className="text-xs font-semibold"
                        style={{ color: statusColor }}
                      >
                        {overBudget
                          ? "Over budget"
                          : nearLimit
                            ? "Approaching limit"
                            : "On track"}
                      </p>
                    )}
                  </div>

                  {/* Edit Budget Form */}
                  {editing === budget.category && (
                    <div className="mt-5 rounded-xl bg-surface-blue p-4">
                      <label
                        htmlFor={`budget-${budget.category}`}
                        className="mb-2 block text-sm font-semibold text-primary"
                      >
                        New Monthly Limit ($)
                      </label>

                      <Input
                        id={`budget-${budget.category}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newLimit}
                        onChange={(event) =>
                          setNewLimit(event.target.value)
                        }
                      />

                      {limitError && (
                        <p role="alert" className="mt-2 text-sm text-accent">
                          {limitError}
                        </p>
                      )}

                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            saveBudget(budget.category)
                          }
                          variant="primary"
                        >
                          Save
                        </Button>

                        <Button
                          type="button"
                          onClick={() => setEditing(null)}
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Financial Insight */}
        <section className="mt-8">
          <div className="rounded-2xl border border-border-custom bg-surface-blue p-5">
            <p className="text-base font-bold text-primary">
              Budget Insight
            </p>

            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-full !bg-white" />
                  <Skeleton className="mt-2 h-4 w-2/3 !bg-white" />
                </>
              ) : error
                ? "Connect your bank to view spending insights."
                : hasOverspending
                  ? "One or more categories are over budget. Review your spending and adjust your limits if needed."
                  : approachingLimit
                    ? "You're approaching a spending limit. Review your recent purchases to stay on track."
                    : "You're currently within your budget limits. Keep tracking your spending to maintain your progress."}
            </p>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          Spending comes from your connected bank. Budget limits are saved to your account.
        </p>
      </div>
    </main>
  );
}
