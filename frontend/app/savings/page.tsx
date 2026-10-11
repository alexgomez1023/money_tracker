
"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
import Skeleton from "@/components/ui/Skeleton";
import { showToast } from "@/lib/toast";
import BankErrorNotice from "@/components/ui/BankErrorNotice";
import {
  getBankErrorReason,
  type BankErrorReason,
} from "@/lib/bank-data";

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BankErrorReason | "">("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");

  const [allocatingGoal, setAllocatingGoal] = useState<number | null>(null);
  const [allocationAmount, setAllocationAmount] = useState("");

  // Inline messages shown next to the form they belong to.
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [allocationError, setAllocationError] = useState("");

  // The goal waiting for its delete to be confirmed.
  const [deletingGoal, setDeletingGoal] = useState<number | null>(null);

  // Load saved goals and the connected savings balance.
  useEffect(() => {
    setGoals(getSavingsGoals());

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
      setCreateError("Enter a goal name.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      setCreateError("Enter a target greater than $0.");
      return;
    }

    setCreateError("");

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

    showToast("Goal created.");
  }

  function startEditing(goal: SavingsGoal) {
    setEditingGoal(goal.id);
    setEditName(goal.name);
    setEditTarget(goal.target.toString());
    setAllocatingGoal(null);
    setDeletingGoal(null);
    setEditError("");
  }

  function saveEditedGoal(id: number) {
    const target = Number(editTarget);

    if (!editName.trim()) {
      setEditError("Enter a goal name.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      setEditError("Enter a target greater than $0.");
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
    setEditError("");

    showToast("Goal saved.");
  }

  // Allocate existing savings without moving money.
  function allocateMoney(id: number) {
    if (loading || error) return;

    const amount = Number(allocationAmount);
    const goal = goals.find((item) => item.id === id);

    if (!goal) return;

    if (!Number.isFinite(amount) || amount < 0) {
      setAllocationError("Enter an amount of $0 or more.");
      return;
    }

    const maximum = Math.max(
      0,
      balance - (totalAllocated - goal.allocated)
    );

    if (amount > maximum) {
      setAllocationError(
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
    setAllocationError("");

    showToast("Allocation saved.");
  }

  function deleteGoal(id: number) {
    updateGoals(goals.filter((goal) => goal.id !== id));
    setEditingGoal(null);
    setAllocatingGoal(null);
    setDeletingGoal(null);

    showToast("Goal deleted.");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        {/* Page Header */}
        <header className="mb-8">
          <p className="text-sm text-muted">
            Your Financial Future
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
            Savings Goals
          </h1>

          <p className="mt-2 text-sm text-muted">
            Plan your goals using your connected savings balance.
          </p>
        </header>

        {error && (
          <BankErrorNotice reason={error} className="mb-5" />
        )}

        {/* Savings Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-medium text-muted">
              Connected Savings
            </p>

            <p className="mt-3 font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {loading ? (
                <Skeleton className="h-7 w-28" />
              ) : error ? (
                "N/A"
              ) : (
                formatMoney(balance)
              )}
            </p>
          </Card>

          <Card>
            <p className="text-xs font-medium text-muted">
              Available to Allocate
            </p>

            <p className="mt-3 font-display text-2xl font-bold tracking-tight text-secondary sm:text-3xl">
              {loading ? (
                <Skeleton className="h-7 w-28" />
              ) : error ? (
                "N/A"
              ) : (
                formatMoney(available)
              )}
            </p>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">
              Overall Goal Progress
            </h2>

            <span className="text-sm font-semibold text-secondary">
              {loading ? (
                <Skeleton className="h-4 w-10" />
              ) : error ? (
                "N/A"
              ) : (
                `${Math.round(overallProgress)}%`
              )}
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
            {loading ? (
              <Skeleton className="h-3 w-56" />
            ) : error
              ? "Waiting for connected account data"
              : `${formatMoney(totalAllocated)} allocated toward ${formatMoney(totalTarget)} in goals`}
          </p>
        </Card>

        {/* Create Goal */}
        <Button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          size="lg"
          fullWidth
          className="mb-6"
        >
          {showCreateForm
            ? "Cancel New Goal"
            : "+ Create New Savings Goal"}
        </Button>

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

                <Input
                  id="goal-name"
                  type="text"
                  placeholder="e.g. Summer Vacation"
                  value={newGoalName}
                  onChange={(event) =>
                    setNewGoalName(event.target.value)
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="goal-target"
                  className="mb-2 block text-sm font-medium"
                >
                  Target Amount ($)
                </label>

                <Input
                  id="goal-target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 2000"
                  value={newGoalTarget}
                  onChange={(event) =>
                    setNewGoalTarget(event.target.value)
                  }
                />
              </div>

              {createError && (
                <p role="alert" className="text-sm text-accent">
                  {createError}
                </p>
              )}

              <Button
                type="button"
                onClick={createGoal}
                size="lg"
                fullWidth
              >
                Save Goal
              </Button>
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
                        <Button
                          type="button"
                          onClick={() => startEditing(goal)}
                          variant="secondary"
                          size="sm"
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          onClick={() => {
                            setDeletingGoal(goal.id);
                            setEditingGoal(null);
                            setAllocatingGoal(null);
                          }}
                          variant="dangerOutline"
                          size="sm"
                        >
                          Delete
                        </Button>
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

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                        {formatMoney(goal.allocated)}
                      </p>

                      <p className="text-xs text-muted">
                        of {formatMoney(goal.target)}
                      </p>
                    </div>

                    {/* Allocation Control */}
                    <Button
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
                        setDeletingGoal(null);
                        setAllocationError("");
                      }}
                      variant="soft"
                      size="lg"
                      fullWidth
                      className="mt-5"
                    >
                      Allocate Savings
                    </Button>

                    {allocatingGoal === goal.id && (
                      <div className="mt-4 rounded-xl border border-border-custom p-4">
                        <label
                          htmlFor={`allocate-${goal.id}`}
                          className="mb-2 block text-sm font-medium"
                        >
                          Total Amount Allocated ($)
                        </label>

                        <Input
                          id={`allocate-${goal.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={allocationAmount}
                          onChange={(event) =>
                            setAllocationAmount(event.target.value)
                          }
                        />

                        {allocationError && (
                          <p role="alert" className="mt-2 text-sm text-accent">
                            {allocationError}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-muted">
                          Allocation only. No money is transferred.
                        </p>

                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            onClick={() => allocateMoney(goal.id)}
                            variant="primary"
                          >
                            Save Allocation
                          </Button>

                          <Button
                            type="button"
                            onClick={() => setAllocatingGoal(null)}
                            variant="secondary"
                          >
                            Cancel
                          </Button>
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

                          <Input
                            id={`edit-name-${goal.id}`}
                            type="text"
                            value={editName}
                            onChange={(event) =>
                              setEditName(event.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-target-${goal.id}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Target Amount ($)
                          </label>

                          <Input
                            id={`edit-target-${goal.id}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editTarget}
                            onChange={(event) =>
                              setEditTarget(event.target.value)
                            }
                          />
                        </div>

                        {editError && (
                          <p role="alert" className="text-sm text-accent">
                            {editError}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => saveEditedGoal(goal.id)}
                            variant="primary"
                          >
                            Save Changes
                          </Button>

                          <Button
                            type="button"
                            onClick={() => setEditingGoal(null)}
                            variant="secondary"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Delete Confirmation */}
                    {deletingGoal === goal.id && (
                      <div className="mt-4 rounded-xl border border-border-custom p-4">
                        <p className="text-sm text-foreground">
                          Delete this savings goal?
                        </p>

                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            onClick={() => setDeletingGoal(null)}
                            variant="secondary"
                          >
                            Cancel
                          </Button>

                          <Button
                            type="button"
                            onClick={() => deleteGoal(goal.id)}
                            variant="danger"
                          >
                            Yes, Delete
                          </Button>
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
          <h2 className="text-base font-bold text-primary">
            Savings Insight
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {loading ? (
              <>
                <Skeleton className="h-4 w-full !bg-white" />
                <Skeleton className="mt-2 h-4 w-2/3 !bg-white" />
              </>
            ) : error
              ? "Connect your savings account to view your progress."
              : totalAllocated > balance
                ? "Your allocations exceed your current savings balance. Review your goal allocations."
                : goals.length === 0
                  ? "Create a savings goal to start planning."
                  : `${formatMoney(available)} of your connected savings balance is available to allocate.`}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Balances come from your connected bank. Goal allocations are saved in this browser.
          No money is transferred.
        </p>
      </div>
    </main>
  );
}
