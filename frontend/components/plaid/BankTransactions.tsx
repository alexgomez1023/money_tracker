
"use client";

import Button from "@/components/ui/Button";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { SkeletonRows } from "@/components/ui/Skeleton";
import BankErrorNotice from "@/components/ui/BankErrorNotice";
import {
  getBankErrorReason,
  getTransactions,
  type BankErrorReason,
} from "@/lib/bank-data";
import { formatCategory, formatDate, formatMoney } from "@/lib/format";

// How many transactions this preview shows. The full list is on the Transactions page.
const PREVIEW_COUNT = 8;

type BankTransaction = {
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  pending: boolean;
  category: string[] | null;
  personal_finance_category: {
    primary: string;
    detailed: string;
  } | null;
};

export default function BankTransactions() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BankErrorReason | "">("");

  // Fetch transactions from our Express backend.
  const loadTransactions = useCallback(async (fresh = false) => {
    setLoading(true);
    setError("");

    try {
      const data = await getTransactions<BankTransaction>(fresh);
      setTransactions(data.transactions ?? []);
    } catch (err) {
      setError(getBankErrorReason(err));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Turn Plaid category codes into readable labels.
  const getCategory = (transaction: BankTransaction) => {
    const category = transaction.personal_finance_category?.primary;

    if (category) {
      return formatCategory(category);
    }

    return transaction.category?.[0] ?? "Other";
  };

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-primary">
          Recent transactions
        </h2>

        <div className="flex items-center gap-4">
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:text-primary"
          >
            View all
            <Icon name="arrowRight" size={15} />
          </Link>

          <Button
            type="button"
            onClick={() => loadTransactions(true)}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      <Card className="!p-0">
        {loading && <SkeletonRows count={5} />}

        {error && (
          <BankErrorNotice
            reason={error}
            onRetry={() => loadTransactions(true)}
            className="p-5"
          />
        )}

        {!loading && !error && transactions.length === 0 && (
          <p className="p-5 text-sm text-muted">
            No transactions found.
          </p>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="divide-y divide-border-custom">
            {transactions.slice(0, PREVIEW_COUNT).map((transaction) => {
              // Plaid reports money leaving the account as a positive amount.
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
                        {getCategory(transaction)} · {formatDate(transaction.date)}
                        {transaction.pending ? " · Pending" : ""}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      isExpense ? "text-foreground" : "text-secondary"
                    }`}
                  >
                    {isExpense ? "-" : "+"}
                    {formatMoney(Math.abs(transaction.amount))}
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
