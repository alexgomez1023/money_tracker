"use client";



import { useEffect, useState } from "react";
import { getBudgets, saveBudgets, initialBudgets, type Budget } from "@/lib/budget-storage";

import Card from "@/components/ui/Card";








export default function BudgetsPage() {

  const [budgets, setBudgets] = useState(initialBudgets);

  useEffect(() => {
    setBudgets(getBudgets());
  }, []);

  const [editing, setEditing] = useState<string | null>(null);

  const [newLimit, setNewLimit] = useState("");



  const totalBudget = budgets.reduce(

    (sum, budget) => sum + budget.limit,

    0

  );



  const totalSpent = budgets.reduce(

    (sum, budget) => sum + budget.spent,

    0

  );



  const remaining = totalBudget - totalSpent;



  function startEditing(budget: Budget) {

    setEditing(budget.category);

    setNewLimit(budget.limit.toString());

  }



  function saveBudget(category: string) {

    const value = Number(newLimit);



    if (!Number.isFinite(value) || value <= 0) {

      alert("Please enter a budget greater than $0.");

      return;

    }



    const updated = budgets.map((budget) =>
      budget.category === category
        ? { ...budget, limit: value }
        : budget
    );
    saveBudgets(updated);
    setBudgets(updated);



    setEditing(null);

    setNewLimit("");

  }



  return (

    <main className="min-h-screen bg-background text-foreground">

      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">



        {/* Page Header */}

        <header className="mb-8">

          <p className="text-sm text-muted">

            Your Finances

          </p>



          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">

            Monthly Budgets

          </h1>



          <p className="mt-2 text-sm text-muted">

            Set spending limits and stay on track.

          </p>

        </header>



        {/* Summary Cards */}

        <div className="mb-6 grid grid-cols-2 gap-4">

          <Card>

            <p className="text-xs font-medium text-muted">

              Total Budget

            </p>



            <p className="mt-3 text-xl font-bold text-primary sm:text-2xl">

              ${totalBudget.toFixed(2)}

            </p>

          </Card>



          <Card>

            <p className="text-xs font-medium text-muted">

              Remaining

            </p>



            <p

              className={`mt-3 text-xl font-bold sm:text-2xl ${

                remaining < 0

                  ? "text-accent"

                  : "text-secondary"

              }`}

            >

              {remaining < 0 ? "-" : ""}$

              {Math.abs(remaining).toFixed(2)}

            </p>

          </Card>

        </div>



        {/* Overall Progress */}

        <Card>

          <div className="flex items-center justify-between gap-3">

            <h2 className="font-bold text-primary">

              Overall Spending

            </h2>



            <span className="text-sm font-semibold text-muted">

              ${totalSpent.toFixed(2)} spent

            </span>

          </div>



          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-blue">

            <div

              className={`h-full rounded-full transition-all ${

                remaining < 0

                  ? "bg-accent"

                  : "bg-secondary"

              }`}

              style={{

                width: `${

                  totalBudget > 0

                    ? Math.min(

                        (totalSpent / totalBudget) * 100,

                        100

                      )

                    : 0

                }%`,

              }}

            />

          </div>



          <p className="mt-3 text-xs text-muted">

            {totalBudget > 0

              ? `${Math.round(

                  (totalSpent / totalBudget) * 100

                )}% of your monthly budget used`

              : "No budget set"}

          </p>

        </Card>



        {/* Budget Categories */}

        <section className="mt-8">

          <h2 className="mb-4 text-lg font-bold text-primary">

            Category Budgets

          </h2>



          <div className="space-y-4">

            {budgets.map((budget) => {

              const percentage =

                (budget.spent / budget.limit) * 100;



              const overBudget = percentage > 100;

              const nearLimit =

                percentage >= 80 && !overBudget;



              return (

                <Card key={budget.category}>

                  <div className="flex items-center justify-between gap-3">

                    <div>

                      <h3 className="font-semibold text-foreground">

                        {budget.category}

                      </h3>



                      <p className="mt-1 text-xs text-muted">

                        ${budget.spent.toFixed(2)} spent

                      </p>

                    </div>



                    <button

                      type="button"

                      onClick={() => startEditing(budget)}

                      className="rounded-lg border border-border-custom px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-blue"

                    >

                      Edit Budget

                    </button>

                  </div>



                  <div className="mt-5 flex items-center justify-between text-sm">

                    <span className="text-muted">

                      Monthly Limit

                    </span>



                    <span className="font-semibold text-foreground">

                      ${budget.limit.toFixed(2)}

                    </span>

                  </div>



                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-blue">

                    <div

                      className="h-full rounded-full transition-all"

                      style={{

                        width: `${Math.min(

                          percentage,

                          100

                        )}%`,

                        backgroundColor: overBudget

                          ? "#D22E3A"

                          : nearLimit

                          ? "#E59A30"

                          : budget.color,

                      }}

                    />

                  </div>



                  <div className="mt-3 flex items-center justify-between gap-3">

                    <p className="text-xs text-muted">

                      {Math.round(percentage)}% used

                    </p>



                    {overBudget ? (

                      <p className="text-xs font-semibold text-accent">

                        Over budget

                      </p>

                    ) : nearLimit ? (

                      <p className="text-xs font-semibold text-amber-600">

                        Approaching limit

                      </p>

                    ) : (

                      <p className="text-xs font-medium text-secondary">

                        On track

                      </p>

                    )}

                  </div>



                  {/* Edit Budget Form */}

                  {editing === budget.category && (

                    <div className="mt-5 rounded-xl bg-surface-blue p-4">

                      <label

                        htmlFor={`budget-${budget.category}`}

                        className="mb-2 block text-sm font-semibold text-primary"

                      >

                        New Monthly Limit ($)

                      </label>



                      <input

                        id={`budget-${budget.category}`}

                        type="number"

                        min="0.01"

                        step="0.01"

                        value={newLimit}

                        onChange={(event) =>

                          setNewLimit(event.target.value)

                        }

                        className="w-full rounded-lg border border-border-custom bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-secondary"

                      />



                      <div className="mt-3 flex gap-2">

                        <button

                          type="button"

                          onClick={() =>

                            saveBudget(budget.category)

                          }

                          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"

                        >

                          Save

                        </button>



                        <button

                          type="button"

                          onClick={() => setEditing(null)}

                          className="rounded-lg border border-border-custom bg-white px-4 py-2 text-sm font-semibold text-foreground"

                        >

                          Cancel

                        </button>

                      </div>

                    </div>

                  )}

                </Card>

              );

            })}

          </div>

        </section>



        {/* Financial Insight */}

        <section className="mt-8">

          <div className="rounded-2xl border border-border-custom bg-surface-blue p-5">

            <p className="text-sm font-bold text-primary">

              Budget Insight

            </p>



            <p className="mt-2 text-sm leading-relaxed text-foreground">

              {budgets.some(

                (budget) => budget.spent > budget.limit

              )

                ? "One or more categories are over budget. Review your spending and adjust your limits if needed."

                : budgets.some(

                    (budget) =>

                      budget.spent / budget.limit >= 0.8

                  )

                ? "You're approaching a spending limit. Review your recent purchases to stay on track."

                : "You're currently within your budget limits. Keep tracking your spending to maintain your progress."}

            </p>

          </div>

        </section>



        <p className="mt-6 text-center text-xs text-muted">

          Demo budgets — changes are saved in this browser.

        </p>

      </div>

    </main>

  );

}
