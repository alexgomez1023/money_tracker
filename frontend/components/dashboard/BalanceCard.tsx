
"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import BankErrorNotice from "@/components/ui/BankErrorNotice";
import {
  getAccounts,
  getBankErrorReason,
  getTransactions,
  type BankErrorReason,
} from "@/lib/bank-data";
import { formatMoney } from "@/lib/format";

type PlaidAccount = {
  account_id: string;
  name: string;
  type: string;
  subtype: string | null;
  balances: {
    current: number | null;
    available: number | null;
  };
};

type PlaidTransaction = {
  amount: number;
  date: string;
  pending: boolean;
  personal_finance_category: {
    primary: string;
  } | null;
};

export default function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BankErrorReason | "">("");

  useEffect(() => {
    async function loadFinances() {
      try {
        // Get account balances and transactions.
        const [accountsData, transactionsData] =
          await Promise.all([
            getAccounts<PlaidAccount>(),
            getTransactions<PlaidTransaction>(),
          ]);

        const accounts: PlaidAccount[] = accountsData.accounts ?? [];
        const transactions: PlaidTransaction[] =
          transactionsData.transactions ?? [];

        // Include cash accounts, not credit card debt.
        const cashAccounts = accounts.filter(
          (account) => account.type === "depository"
        );

        const balance = cashAccounts.reduce(
          (sum, account) => sum + (account.balances.current ?? 0),
          0
        );

        setTotalBalance(balance);

        // Use the current calendar month.
        const now = new Date();
        const month = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

        const monthlyTransactions = transactions.filter(
          (transaction) =>
            transaction.date.startsWith(month) && !transaction.pending
        );

        let income = 0;
        let spending = 0;

        for (const transaction of monthlyTransactions) {
          const category =
            transaction.personal_finance_category?.primary ?? "";

          // Exclude transfers and loan payments.
          if (
            category.startsWith("TRANSFER") ||
            category === "LOAN_PAYMENTS"
          ) {
            continue;
          }

          if (transaction.amount < 0) {
            income += Math.abs(transaction.amount);
          } else {
            spending += transaction.amount;
          }
        }

        setMonthlyIncome(income);
        setMonthlySpending(spending);
      } catch (err) {
        setError(getBankErrorReason(err));
      } finally {
        setLoading(false);
      }
    }

    loadFinances();
  }, []);

  const hidden = "••••••";

  return (
    <section className="rounded-2xl bg-primary p-6 text-white shadow-md md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-100">
          <Icon name="wallet" size={18} />
          <span className="text-sm font-medium">
            Total Balance
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowBalance(!showBalance)}
          aria-label={showBalance ? "Hide balance" : "Show balance"}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-100 hover:bg-white/10"
        >
          <Icon name={showBalance ? "eye" : "eyeOff"} />
        </button>
      </div>

      <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
        {loading
          ? <Skeleton className="h-10 w-56 !bg-white/20 md:h-12" />
          : error
          ? "Unavailable"
          : showBalance
          ? formatMoney(totalBalance ?? 0)
          : hidden}
      </h2>

      <p className="mt-2 text-xs text-blue-100">
        Combined checking and savings balance
      </p>

      {error && (
        <BankErrorNotice reason={error} tone="onPrimary" className="mt-4" />
      )}

      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
        <div>
          <p className="text-xs text-blue-100">
            Monthly Income
          </p>
          <p className="mt-2 text-lg font-semibold">
            {loading
              ? <Skeleton className="h-7 w-24 !bg-white/20" />
              : error
              ? "N/A"
              : showBalance
              ? `+${formatMoney(monthlyIncome)}`
              : hidden}
          </p>
        </div>

        <div>
          <p className="text-xs text-blue-100">
            Monthly Spending
          </p>
          <p className="mt-2 text-lg font-semibold">
            {loading
              ? <Skeleton className="h-7 w-24 !bg-white/20" />
              : error
              ? "N/A"
              : showBalance
              ? `-${formatMoney(monthlySpending)}`
              : hidden}
          </p>
        </div>
      </div>
    </section>
  );
}
