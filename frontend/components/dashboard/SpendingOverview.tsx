"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { getBudgets, initialBudgets, type Budget } from "@/lib/budget-storage";

export default function SpendingOverview() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);

  useEffect(() => {
    function refresh() { setBudgets(getBudgets()); }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("budgets-updated", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("budgets-updated", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);

  const total = budgets.reduce((sum, item) => sum + item.spent, 0);
  const totalLimit = budgets.reduce((sum, item) => sum + item.limit, 0);
  const remaining = totalLimit - total;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary">Spending Overview</h2>
          <p className="mt-1 text-xs text-muted">Monthly breakdown · demo spending</p>
        </div>
        <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
      </div>

      <div className="mt-4 rounded-xl bg-surface-blue p-4">
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted">Monthly budget</span>
          <span className="font-semibold text-primary">${totalLimit.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3 text-sm">
          <span className="text-muted">Remaining</span>
          <span className={`font-semibold ${remaining < 0 ? "text-accent" : "text-secondary"}`}>
            {remaining < 0 ? "-" : ""}${Math.abs(remaining).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100"
        role="img" aria-label="Spending breakdown by category">
        {budgets.map((item) => (
          <div key={item.category} style={{
            width: `${total > 0 ? (item.spent / total) * 100 : 0}%`,
            backgroundColor: item.color,
          }} />
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {budgets.map((item) => (
          <div key={item.category} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm text-foreground">{item.category}</p>
                <p className="text-xs text-muted">Limit: ${item.limit.toFixed(2)}</p>
              </div>
            </div>
            <span className="text-sm font-semibold">${item.spent.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <Link href="/budgets" className="mt-5 inline-block text-sm font-semibold text-secondary hover:text-primary">
        View and edit budgets →
      </Link>
    </Card>
  );
}
