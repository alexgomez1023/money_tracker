
"use client";

import { useCallback, useEffect, useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import { getTransactions } from "@/lib/bank-data";

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
  const [error, setError] = useState("");

  // Fetch transactions from our Express backend.
  const loadTransactions = useCallback(async (fresh = false) => {
    setLoading(true);
    setError("");

    try {
      const data = await getTransactions<BankTransaction>(fresh);
      setTransactions(data.transactions ?? []);
    } catch {
      setError("Unable to load transactions. Connect a bank first.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Format a transaction amount as US dollars.
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));

  // Turn Plaid category codes into readable labels.
  const formatCategory = (transaction: BankTransaction) => {
    const category = transaction.personal_finance_category?.primary;

    if (category) {
      return category.replaceAll("_", " ").toLowerCase();
    }

    return transaction.category?.[0] ?? "Other";
  };

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Recent Transactions</h2>

        <button
          type="button"
          onClick={() => loadTransactions(true)}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-3 rounded-xl border p-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && transactions.length === 0 && (
        <p>No transactions found.</p>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.transaction_id}
                  className="border-b last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {transaction.merchant_name || transaction.name}

                    {transaction.pending && (
                      <span className="ml-2 text-xs text-gray-500">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 capitalize text-gray-600">
                    {formatCategory(transaction)}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {transaction.date}
                  </td>

                  <td className="px-4 py-3 text-right font-semibold">
                    {transaction.amount < 0 ? "-" : "+"}
                    {formatMoney(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
