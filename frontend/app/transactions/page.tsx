
"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { getTransactions } from "@/lib/bank-data";

type PlaidTransaction = {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  pending: boolean;
  personal_finance_category: {
    primary: string;
  } | null;
  category: string[] | null;
};

const excludedCategories = [
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "LOAN_PAYMENTS",
];

function getCategory(transaction: PlaidTransaction) {
  const primary = transaction.personal_finance_category?.primary;

  if (primary) {
    return primary
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  }

  return transaction.category?.[0] ?? "Other";
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load transactions from Plaid.
  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await getTransactions<PlaidTransaction>();
        setTransactions(data.transactions ?? []);
      } catch {
        setError("Unable to load transactions. Connect a bank first.");
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  // Create filters from Plaid categories.
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(transactions.map(getCategory))).sort(),
    ],
    [transactions]
  );

  // Filter by merchant and category.
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const name =
        transaction.merchant_name || transaction.name;

      const category = getCategory(transaction);

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [transactions, search, selectedCategory]);

  // Calculate totals without counting transfers as spending.
  const { totalIncome, totalExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      if (transaction.pending) continue;

      const category =
        transaction.personal_finance_category?.primary ?? "";

      if (excludedCategories.includes(category)) continue;

      if (transaction.amount < 0) {
        income += Math.abs(transaction.amount);
      } else {
        expenses += transaction.amount;
      }
    }

    return {
      totalIncome: income,
      totalExpenses: expenses,
    };
  }, [transactions]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        {/* Page header */}
        <header className="mb-8">
          <p className="text-sm text-muted">
            Financial Activity
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
            Transactions
          </h1>

          <p className="mt-2 text-sm text-muted">
            Track and organize your spending in one place.
          </p>
        </header>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-medium text-muted">
              Total Income
            </p>

            <p className="mt-3 text-xl font-bold text-secondary sm:text-2xl">
              +${totalIncome.toFixed(2)}
            </p>
          </Card>

          <Card>
            <p className="text-xs font-medium text-muted">
              Total Expenses
            </p>

            <p className="mt-3 text-xl font-bold text-primary sm:text-2xl">
              -${totalExpenses.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Search and filters */}
        <Card>
          <h2 className="text-lg font-bold text-primary">
            Activity — Search: {search || "empty"} — Category: {selectedCategory}
          </h2>

          <p className="mt-1 text-sm text-muted">
            Search by merchant or category.
          </p>

          <div className="mt-5">
            <label
              htmlFor="transaction-search"
              className="mb-2 block text-xs font-semibold text-foreground"
            >
              Search transactions
            </label>

            <input
              id="transaction-search"
              type="search"
              placeholder="Search transactions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-border-custom bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          {/* Category filters */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border-custom bg-white text-foreground hover:border-secondary"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Transaction results */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">
              Activity
            </h2>

            <span className="text-xs text-muted">
              {filteredTransactions.length} transactions
            </span>
          </div>

          <Card className="!p-0">
            {loading ? (
              <SkeletonRows count={6} />
            ) : error ? (
              <p className="p-5 text-sm text-muted">
                {error}
              </p>
            ) : filteredTransactions.length > 0 ? (
              <div className="divide-y divide-border-custom">
                {filteredTransactions.map((transaction) => {
                  const isExpense = transaction.amount > 0;

                  return (
                    <div
                      key={transaction.transaction_id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                          <Icon name="wallet" size={20} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {transaction.merchant_name || transaction.name}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {getCategory(transaction)} · {transaction.date}
                            {transaction.pending ? " · Pending" : ""}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`shrink-0 text-sm font-semibold ${
                          isExpense
                            ? "text-foreground"
                            : "text-secondary"
                        }`}
                      >
                        {isExpense ? "-" : "+"}$
                        {Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <p className="font-semibold text-primary">
                  No transactions found
                </p>

                <p className="mt-2 text-sm text-muted">
                  Try another search or category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                  }}
                  className="mt-4 text-sm font-semibold text-secondary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </Card>
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          Plaid Sandbox transactions · Last 30 days, up to 100 transactions
        </p>
      </div>
    </main>
  );
}
