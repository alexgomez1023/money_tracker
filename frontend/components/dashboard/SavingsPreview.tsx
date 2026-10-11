
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  fetchSavingsBalance,
  formatMoney,
  getSavingsGoals,
  getTotalAllocated,
  type SavingsGoal,
} from "@/lib/plaid-savings";
import Skeleton from "@/components/ui/Skeleton";
import BankErrorNotice from "@/components/ui/BankErrorNotice";
import {
  getBankErrorReason,
  type BankErrorReason,
} from "@/lib/bank-data";

export default function SavingsPreview() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BankErrorReason | "">("");

  // Synchronize savings goals across pages.
  useEffect(() => {
    function refreshGoals() {
      setGoals(getSavingsGoals());
    }

    refreshGoals();

    window.addEventListener("storage", refreshGoals);
    window.addEventListener("savings-updated", refreshGoals);
    window.addEventListener("pageshow", refreshGoals);

    return () => {
      window.removeEventListener("storage", refreshGoals);
      window.removeEventListener("savings-updated", refreshGoals);
      window.removeEventListener("pageshow", refreshGoals);
    };
  }, []);

  // Retrieve the connected Plaid savings balance.
  useEffect(() => {
    async function loadBalance() {
      try {
        const amount = await fetchSavingsBalance();
        setBalance(amount);
      } catch (err) {
        setError(getBankErrorReason(err));
      } finally {
        setLoading(false);
      }
    }

    loadBalance();
  }, []);

  const totalAllocated = getTotalAllocated(goals);

  const totalTarget = goals.reduce(
    (sum, goal) => sum + goal.target,
    0
  );

  const progress =
    totalTarget > 0
      ? Math.min((totalAllocated / totalTarget) * 100, 100)
      : 0;

  const available = Math.max(0, balance - totalAllocated);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Financial Goals
          </p>

          <h2 className="mt-2 text-lg font-bold text-primary">
            Savings Progress
          </h2>

          <p className="mt-1 text-xs text-muted">
            {goals.length} active savings goal
            {goals.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-blue text-secondary">
          <Icon name="target" size={21} />
        </div>
      </div>

      {/* Plaid Savings Balance */}
      <div className="mt-5 rounded-xl bg-surface-blue p-4">
        <p className="text-xs font-medium text-muted">
          Connected Savings Balance
        </p>

        <p className="mt-2 text-lg font-bold text-primary">
          {loading
            ? <Skeleton className="h-7 w-28 !bg-white" />
            : error
              ? "Unavailable"
              : formatMoney(balance)}
        </p>

        <p className="mt-1 text-xs text-muted">
          Balance from your connected savings accounts
        </p>
      </div>

      {error && (
        <BankErrorNotice reason={error} className="mt-4" />
      )}

      {/* Goal Progress */}
      <div className="mt-6 flex items-end justify-between gap-2">
        <div>
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            {formatMoney(totalAllocated)}
          </span>

          <span className="ml-2 text-sm text-muted">
            of {formatMoney(totalTarget)}
          </span>
        </div>

        <span className="text-sm font-semibold text-secondary">
          {loading ? (
            <Skeleton className="h-4 w-10" />
          ) : error ? (
            "N/A"
          ) : (
            `${Math.round(progress)}%`
          )}
        </span>
      </div>

      <div
        className="mt-4 h-3 overflow-hidden rounded-full bg-surface-blue"
        role="progressbar"
        aria-valuenow={loading || error ? 0 : progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall savings goal progress"
      >
        <div
          className="h-full rounded-full bg-secondary"
          style={{
            width: loading || error ? "0%" : `${progress}%`,
          }}
        />
      </div>

      <p className="mt-3 text-xs text-muted">
        {loading ? (
          <Skeleton className="h-3 w-40" />
        ) : error
          ? "Savings balance unavailable"
          : `${formatMoney(available)} available to allocate`}
      </p>

      <Link
        href="/savings"
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
      >
        View savings goals
        <Icon name="arrowRight" size={16} />
      </Link>
    </Card>
  );
}
