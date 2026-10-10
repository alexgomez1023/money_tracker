
"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import {
  fetchSavingsBalance,
  formatMoney,
  getSavingsGoals,
  getTotalAllocated,
  saveSavingsGoals,
  type SavingsGoal,
} from "@/lib/plaid-savings";

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");

  const [allocatingGoal, setAllocatingGoal] = useState<number | null>(null);
  const [allocationAmount, setAllocationAmount] = useState("");

  // Load saved goals and the connected savings balance.
  useEffect(() => {
    setGoals(getSavingsGoals());

    async function loadBalance() {
      try {
        const amount = await fetchSavingsBalance();
        setBalance(amount);
      } catch {
        setError("Unable to load savings balance. Connect your bank first.");
      } finally {
        setLoading(false);
      }
    }

    loadBalance();
  }, []);

  const totalAllocated = getTotalAllocated(goals);
  const available = Math.max(0, balance - totalAllocated);
  const totalTarget = goals.reduce(
    (sum, goal) => sum + goal.target,
    0
  );

  const overallProgress =
    totalTarget > 0
      ? Math.min((totalAllocated / totalTarget) * 100, 100)
      : 0;

  // Save changes to goal definitions and allocations.
  function updateGoals(updated: SavingsGoal[]) {
    setGoals(updated);
    saveSavingsGoals(updated);
  }

  function createGoal() {
    const target = Number(newGoalTarget);

    if (!newGoalName.trim()) {
      alert("Please enter a goal name.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      alert("Please enter a target greater than $0.");
      return;
    }

    const newGoal: SavingsGoal = {
      id: Date.now(),
      name: newGoalName.trim(),
      target,
      allocated: 0,
    };

    updateGoals([...goals, newGoal]);
    setNewGoalName("");
    setNewGoalTarget("");
    setShowCreateForm(false);
  }

  function startEditing(goal: SavingsGoal) {
    setEditingGoal(goal.id);
    setEditName(goal.name);
    setEditTarget(goal.target.toString());
    setAllocatingGoal(null);
  }

  function saveEditedGoal(id: number) {
    const target = Number(editTarget);

    if (!editName.trim()) {
      alert("Please enter a goal name.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      alert("Please enter a target greater than $0.");
      return;
    }

    updateGoals(
      goals.map((goal) =>
        goal.id === id
          ? { ...goal, name: editName.trim(), target }
          : goal
      )
    );

    setEditingGoal(null);
  }

  // Allocate existing savings without moving money.
  function allocateMoney(id: number) {
    if (loading || error) return;

    const amount = Number(allocationAmount);
    const goal = goals.find((item) => item.id === id);

    if (!goal) return;

    if (!Number.isFinite(amount) || amount < 0) {
      alert("Please enter a valid allocation.");
      return;
    }

    const maximum = Math.max(
      0,
      balance - (totalAllocated - goal.allocated)
    );

    if (amount > maximum) {
      alert(
        `You can allocate up to ${formatMoney(maximum)} to this goal.`
      );
      return;
    }

    updateGoals(
      goals.map((item) =>
        item.id === id
          ? { ...item, allocated: amount }
          : item
      )
    );

    setAllocatingGoal(null);
    setAllocationAmount("");
  }

  function deleteGoal(id: number) {
    if (!window.confirm("Delete this savings goal?")) return;

    updateGoals(goals.filter((goal) => goal.id !== id));
    setEditingGoal(null);
    setAllocatingGoal(null);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        {/* Page Header */}
        <header className="mb-8">
          <p className="text-sm text-muted">
            Your Financial Future
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
            Savings Goals
          </h1>

          <p className="mt-2 text-sm text-muted">
            Plan your goals using your connected savings balance.
          </p>
        </header>

        {error && (
          <p className="mb-5 text-sm text-accent">{error}</p>
        )}

        {/* Savings Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-medium text-muted">
              Connected Savings
            </p>

            <p className="mt-3 text-xl font-bold text-primary sm:text-2xl">
              {loading || error ? "—" : formatMoney(balance)}
            </p>
          </Card>

          <Card>
            <p className="text-xs font-medium text-muted">
              Available to Allocate
            </p>

            <p className="mt-3 text-xl font-bold text-secondary sm:text-2xl">
              {loading || error ? "—" : formatMoney(available)}
            </p>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-primary">
              Overall Goal Progress
            </h2>

            <span className="text-sm font-semibold text-secondary">
              {loading || error ? "—" : `${Math.round(overallProgress)}%`}
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-blue">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{
                width: loading || error ? "0%" : `${overallProgress}%`,
              }}
            />
          </div>

          <p className="mt-3 text-xs text-muted">
            {loading || error
              ? "Waiting for connected account data"
              : `${formatMoney(totalAllocated)} allocated toward ${formatMoney(totalTarget)} in goals`}
          </p>
        </Card>

        {/* Create Goal */}
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mb-6 w-full rounded-xl bg-primary px-5 py-4 text-sm font-semibold text-white transition hover:bg-secondary"
        >
          {showCreateForm
            ? "Cancel New Goal"
            : "+ Create New Savings Goal"}
        </button>

        {showCreateForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-bold text-primary">
              Create a Savings Goal
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="goal-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Goal Name
                </label>

                <input
                  id="goal-name"
                  type="text"
                  placeholder="e.g. Summer Vacation"
                  value={newGoalName}
                  onChange={(event) =>
                    setNewGoalName(event.target.value)
                  }
                  className="w-full rounded-xl border border-border-custom bg-white px-4 py-3 text-sm outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label
                  htmlFor="goal-target"
                  className="mb-2 block text-sm font-medium"
                >
                  Target Amount ($)
                </label>

                <input
                  id="goal-target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 2000"
                  value={newGoalTarget}
                  onChange={(event) =>
                    setNewGoalTarget(event.target.value)
                  }
                  className="w-full rounded-xl border border-border-custom bg-white px-4 py-3 text-sm outline-none focus:border-secondary"
                />
              </div>

              <button
                type="button"
                onClick={createGoal}
                className="w-full rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white hover:bg-primary"
              >
                Save Goal
              </button>
            </div>
          </Card>
        )}

        {/* Goal Cards */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-primary">
            Your Goals
          </h2>

          {goals.length === 0 ? (
            <Card>
              <p className="font-semibold text-primary">
                No savings goals yet
              </p>

              <p className="mt-2 text-sm text-muted">
                Create your first goal to start planning.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const percentage =
                  (goal.allocated / goal.target) * 100;

                const complete = goal.allocated >= goal.target;

                return (
                  <Card key={goal.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-primary">
                          {goal.name}
                        </h3>

                        <p className="mt-1 text-xs text-muted">
                          {complete
                            ? "Goal reached"
                            : `${Math.round(percentage)}% complete`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(goal)}
                          className="rounded-lg border border-border-custom px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-blue"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          className="rounded-lg border border-border-custom px-3 py-2 text-xs font-semibold text-accent"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-blue">
                      <div
                        className={`h-full rounded-full transition-all ${
                          complete ? "bg-secondary" : "bg-primary"
                        }`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {formatMoney(goal.allocated)}
                      </p>

                      <p className="text-xs text-muted">
                        of {formatMoney(goal.target)}
                      </p>
                    </div>

                    {/* Allocation Control */}
                    <button
                      type="button"
                      disabled={loading || !!error}
                      onClick={() => {
                        setAllocatingGoal(
                          allocatingGoal === goal.id
                            ? null
                            : goal.id
                        );
                        setAllocationAmount(
                          goal.allocated.toString()
                        );
                        setEditingGoal(null);
                      }}
                      className="mt-5 w-full rounded-xl bg-surface-blue px-4 py-3 text-sm font-semibold text-primary hover:bg-border-custom disabled:opacity-50"
                    >
                      Allocate Savings
                    </button>

                    {allocatingGoal === goal.id && (
                      <div className="mt-4 rounded-xl border border-border-custom p-4">
                        <label
                          htmlFor={`allocate-${goal.id}`}
                          className="mb-2 block text-sm font-medium"
                        >
                          Total Amount Allocated ($)
                        </label>

                        <input
                          id={`allocate-${goal.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={allocationAmount}
                          onChange={(event) =>
                            setAllocationAmount(event.target.value)
                          }
                          className="w-full rounded-lg border border-border-custom bg-white px-3 py-3 text-sm outline-none focus:border-secondary"
                        />

                        <p className="mt-2 text-xs text-muted">
                          Allocation only. No money is transferred.
                        </p>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => allocateMoney(goal.id)}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                          >
                            Save Allocation
                          </button>

                          <button
                            type="button"
                            onClick={() => setAllocatingGoal(null)}
                            className="rounded-lg border border-border-custom px-4 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Edit Goal Form */}
                    {editingGoal === goal.id && (
                      <div className="mt-4 space-y-4 rounded-xl bg-surface-blue p-4">
                        <div>
                          <label
                            htmlFor={`edit-name-${goal.id}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Goal Name
                          </label>

                          <input
                            id={`edit-name-${goal.id}`}
                            type="text"
                            value={editName}
                            onChange={(event) =>
                              setEditName(event.target.value)
                            }
                            className="w-full rounded-lg border border-border-custom bg-white px-3 py-3 text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-target-${goal.id}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Target Amount ($)
                          </label>

                          <input
                            id={`edit-target-${goal.id}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editTarget}
                            onChange={(event) =>
                              setEditTarget(event.target.value)
                            }
                            className="w-full rounded-lg border border-border-custom bg-white px-3 py-3 text-sm"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEditedGoal(goal.id)}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                          >
                            Save Changes
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingGoal(null)}
                            className="rounded-lg border border-border-custom bg-white px-4 py-2 text-sm"
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
          )}
        </section>

        {/* Savings Insight */}
        <div className="mt-8 rounded-2xl border border-border-custom bg-surface-blue p-5">
          <h2 className="text-sm font-bold text-primary">
            Savings Insight
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {loading || error
              ? "Connect your savings account to view your progress."
              : totalAllocated > balance
                ? "Your allocations exceed your current savings balance. Review your goal allocations."
                : goals.length === 0
                  ? "Create a savings goal to start planning."
                  : `${formatMoney(available)} of your connected savings balance is available to allocate.`}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Balances from Plaid Sandbox. Goal allocations are saved in this browser.
          No money is transferred.
        </p>
      </div>
    </main>
  );
}
