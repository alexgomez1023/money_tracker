
"use client";

import Button from "@/components/ui/Button";
import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import BankErrorNotice from "@/components/ui/BankErrorNotice";
import {
  getAccounts,
  getBankErrorReason,
  type BankErrorReason,
} from "@/lib/bank-data";
import { formatMoney } from "@/lib/format";

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
  const [error, setError] = useState<BankErrorReason | "">("");

  // Retrieve connected bank accounts from our backend.
  const loadAccounts = useCallback(async (fresh = false) => {
    setLoading(true);
    setError("");

    try {
      const data = await getAccounts<BankAccount>(fresh);
      setAccounts(data.accounts ?? []);
    } catch (err) {
      setError(getBankErrorReason(err));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load accounts when the page opens.
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Some accounts report no balance, or no currency.
  const formatBalance = (amount: number | null, currency: string | null) => {
    if (amount === null) return "N/A";

    return formatMoney(amount, currency || "USD");
  };

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-primary">
          Your accounts
        </h2>

        <Button
          type="button"
          onClick={() => loadAccounts(true)}
          disabled={loading}
          variant="secondary"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Card key={index}>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-3 h-5 w-40" />
              <Skeleton className="mt-5 h-8 w-32" />
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card>
          <BankErrorNotice
            reason={error}
            onRetry={() => loadAccounts(true)}
          />
        </Card>
      )}

      {!loading && !error && accounts.length === 0 && (
        <Card>
          <p className="text-sm text-muted">
            No bank accounts found.
          </p>
        </Card>
      )}

      {!loading && accounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <Card key={account.account_id}>
              <p className="text-xs font-medium capitalize text-muted">
                {account.subtype || account.type}
                {account.mask ? ` ••••${account.mask}` : ""}
              </p>

              <h3 className="mt-1 text-base font-semibold text-foreground">
                {account.name}
              </h3>

              <p className="mt-4 font-display text-2xl font-bold tracking-tight text-primary">
                {formatBalance(
                  account.balances.current,
                  account.balances.iso_currency_code
                )}
              </p>

              <p className="mt-1 text-xs text-muted">
                {account.type === "credit"
                  ? "Outstanding balance"
                  : "Current balance"}
              </p>

              {account.type !== "credit" && (
                <p className="mt-3 text-sm text-foreground">
                  Available:{" "}
                  {formatBalance(
                    account.balances.available,
                    account.balances.iso_currency_code
                  )}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
