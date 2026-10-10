
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";

type PlaidTransaction = {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  personal_finance_category: {
    primary: string;
  } | null;
};

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError("Connect a bank to view transactions.");
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary">
          Recent Transactions
        </h2>

        <Link
          href="/transactions"
          className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:text-primary"
        >
          View all
          <Icon name="arrowRight" size={15} />
        </Link>
      </div>

      <Card className="!p-0">
        {loading && (
          <p className="p-5 text-sm text-muted">
            Loading transactions...
          </p>
        )}

        {error && (
          <p className="p-5 text-sm text-muted">
            {error}
          </p>
        )}

        {!loading && !error && transactions.length === 0 && (
          <p className="p-5 text-sm text-muted">
            No transactions found.
          </p>
        )}

        {!loading && !error && (
          <div className="divide-y divide-border-custom">
            {transactions.slice(0, 5).map((transaction) => {
              const isExpense = transaction.amount > 0;

              const category =
                transaction.personal_finance_category?.primary
                  ?.replaceAll("_", " ")
                  .toLowerCase() ?? "Other";

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

                      <p className="mt-1 text-xs capitalize text-muted">
                        {category} · {transaction.date}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      isExpense ? "text-foreground" : "text-secondary"
                    }`}
                  >
                    {isExpense ? "-" : "+"}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
