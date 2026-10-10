
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  getSavingsGoals,
  initialSavingsGoals,
  type SavingsGoal,
} from "@/lib/savings-storage";

export default function SavingsPreview() {
  const [goals, setGoals] =
    useState<SavingsGoal[]>(initialSavingsGoals);

  useEffect(() => {
    function refreshSavings() {
      setGoals(getSavingsGoals());
    }

    refreshSavings();

    window.addEventListener("storage", refreshSavings);
    window.addEventListener("savings-updated", refreshSavings);
    window.addEventListener("pageshow", refreshSavings);

    return () => {
      window.removeEventListener("storage", refreshSavings);
      window.removeEventListener("savings-updated", refreshSavings);
      window.removeEventListener("pageshow", refreshSavings);
    };
  }, []);

  const totalSaved = goals.reduce(
    (sum, goal) => sum + goal.saved,
    0
  );

  const totalTarget = goals.reduce(
    (sum, goal) => sum + goal.target,
    0
  );

  const progress =
    totalTarget > 0
      ? Math.min((totalSaved / totalTarget) * 100, 100)
      : 0;

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

      <div className="mt-6 flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl font-bold text-primary">
            ${totalSaved.toLocaleString()}
          </span>

          <span className="ml-2 text-sm text-muted">
            of ${totalTarget.toLocaleString()}
          </span>
        </div>

        <span className="text-sm font-semibold text-secondary">
          {Math.round(progress)}%
        </span>
      </div>

      <div
        className="mt-4 h-3 overflow-hidden rounded-full bg-surface-blue"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall savings progress"
      >
        <div
          className="h-full rounded-full bg-secondary"
          style={{ width: `${progress}%` }}
        />
      </div>

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
