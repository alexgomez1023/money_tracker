
"use client";

import { useCallback, useEffect, useState } from "react";

type BankAccount = {
  account_id: string;
  name: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
  };
};

export default function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Retrieve connected bank accounts from our backend.
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/accounts", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not retrieve bank accounts");
      }

      const data = await response.json();
      setAccounts(data.accounts);
    } catch {
      setError("Unable to load accounts. Connect a bank first.");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load accounts when the page opens.
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Format balances as currency.
  const formatMoney = (amount: number | null, currency: string | null) => {
    if (amount === null) return "N/A";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Bank Accounts</h2>

        <button
          type="button"
          onClick={loadAccounts}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading accounts...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && accounts.length === 0 && (
        <p>No bank accounts found.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((account) => (
          <div
            key={account.account_id}
            className="rounded-xl border p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">
              {account.subtype || account.type}
              {account.mask ? ` ••••${account.mask}` : ""}
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              {account.name}
            </h3>

            <p className="mt-3 text-2xl font-bold">
              {formatMoney(
                account.balances.current,
                account.balances.iso_currency_code
              )}
            </p>

            <p className="text-sm text-gray-500">
              {account.type === "credit"
                ? "Outstanding balance"
                : "Current balance"}
            </p>

            {account.type !== "credit" && (
              <p className="mt-2 text-sm">
                Available:{" "}
                {formatMoney(
                  account.balances.available,
                  account.balances.iso_currency_code
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
