

"use client";



import { useEffect, useState } from "react";
import { getSavingsGoals, saveSavingsGoals, initialSavingsGoals, type SavingsGoal } from "@/lib/savings-storage";

import Card from "@/components/ui/Card";







export default function SavingsPage() {

  const [goals, setGoals] = useState<SavingsGoal[]>(initialSavingsGoals);



  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newGoalName, setNewGoalName] = useState("");

  const [newGoalTarget, setNewGoalTarget] = useState("");



  const [addingToGoal, setAddingToGoal] = useState<number | null>(null);

  const [depositAmount, setDepositAmount] = useState("");



  const [editingGoal, setEditingGoal] = useState<number | null>(null);

  const [editName, setEditName] = useState("");

  const [editTarget, setEditTarget] = useState("");



  useEffect(() => {
    setGoals(getSavingsGoals());
  }, []);

  const totalSaved = goals.reduce(

    (sum, goal) => sum + goal.saved,

    0

  );



  const totalTarget = goals.reduce(

    (sum, goal) => sum + goal.target,

    0

  );



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

      saved: 0,

      target,

    };



    const updated = [...goals, newGoal];
    setGoals(updated);
    saveSavingsGoals(updated);



    setNewGoalName("");

    setNewGoalTarget("");

    setShowCreateForm(false);

  }



  function addMoney(goalId: number) {

    const amount = Number(depositAmount);



    if (!Number.isFinite(amount) || amount <= 0) {

      alert("Please enter an amount greater than $0.");

      return;

    }



    const updated = goals.map((goal) =>
      goal.id === goalId
        ? { ...goal, saved: goal.saved + amount }
        : goal
    );
    setGoals(updated);
    saveSavingsGoals(updated);

    setDepositAmount("");

    setAddingToGoal(null);

  }



  function startEditing(goal: SavingsGoal) {

    setEditingGoal(goal.id);

    setEditName(goal.name);

    setEditTarget(goal.target.toString());

    setAddingToGoal(null);

  }



  function saveEditedGoal(goalId: number) {

    const target = Number(editTarget);



    if (!editName.trim()) {

      alert("Please enter a goal name.");

      return;

    }



    if (!Number.isFinite(target) || target <= 0) {

      alert("Please enter a target greater than $0.");

      return;

    }



    const updated = goals.map((goal) =>
      goal.id === goalId
        ? { ...goal, name: editName.trim(), target }
        : goal
    );
    setGoals(updated);
    saveSavingsGoals(updated);

    setEditingGoal(null);

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

            Save for what matters most to you.

          </p>

        </header>



        {/* Summary Cards */}

        <div className="mb-6 grid grid-cols-2 gap-4">

          <Card>

            <p className="text-xs font-medium text-muted">

              Total Saved

            </p>



            <p className="mt-3 text-xl font-bold text-primary sm:text-2xl">

              ${totalSaved.toFixed(2)}

            </p>

          </Card>



          <Card>

            <p className="text-xs font-medium text-muted">

              Savings Target

            </p>



            <p className="mt-3 text-xl font-bold text-secondary sm:text-2xl">

              ${totalTarget.toFixed(2)}

            </p>

          </Card>

        </div>



        {/* Create Goal Button */}

        <button

          type="button"

          onClick={() => setShowCreateForm(!showCreateForm)}

          className="mb-6 w-full rounded-xl bg-primary px-5 py-4 text-sm font-semibold text-white transition hover:bg-secondary"

        >

          {showCreateForm

            ? "Cancel New Goal"

            : "+ Create New Savings Goal"}

        </button>



        {/* Create Goal Form */}

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



        {/* Savings Goals */}

        <section>

          <h2 className="mb-4 text-lg font-bold text-primary">

            Your Goals

          </h2>



          <div className="space-y-4">

            {goals.map((goal) => {

              const percentage =

                (goal.saved / goal.target) * 100;



              const complete = goal.saved >= goal.target;



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



                    <button

                      type="button"

                      onClick={() => startEditing(goal)}

                      className="rounded-lg border border-border-custom px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-blue"

                    >

                      Edit

                    </button>

                  </div>



                  {/* Progress Bar */}

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-blue">

                    <div

                      className={`h-full rounded-full transition-all ${

                        complete

                          ? "bg-secondary"

                          : "bg-primary"

                      }`}

                      style={{

                        width: `${Math.min(

                          percentage,

                          100

                        )}%`,

                      }}

                    />

                  </div>



                  <div className="mt-3 flex items-center justify-between gap-3">

                    <p className="text-sm font-semibold text-foreground">

                      ${goal.saved.toFixed(2)}

                    </p>



                    <p className="text-xs text-muted">

                      of ${goal.target.toFixed(2)}

                    </p>

                  </div>



                  {/* Add Money Button */}

                  <button

                    type="button"

                    onClick={() => {

                      setAddingToGoal(

                        addingToGoal === goal.id

                          ? null

                          : goal.id

                      );

                      setDepositAmount("");

                      setEditingGoal(null);

                    }}

                    className="mt-5 w-full rounded-xl bg-surface-blue px-4 py-3 text-sm font-semibold text-primary hover:bg-border-custom"

                  >

                    + Add Money

                  </button>



                  {/* Add Money Form */}

                  {addingToGoal === goal.id && (

                    <div className="mt-4 rounded-xl border border-border-custom p-4">

                      <label

                        htmlFor={`deposit-${goal.id}`}

                        className="mb-2 block text-sm font-medium"

                      >

                        Amount to Add ($)

                      </label>



                      <input

                        id={`deposit-${goal.id}`}

                        type="number"

                        min="0.01"

                        step="0.01"

                        placeholder="e.g. 50"

                        value={depositAmount}

                        onChange={(event) =>

                          setDepositAmount(event.target.value)

                        }

                        className="w-full rounded-lg border border-border-custom bg-white px-3 py-3 text-sm outline-none focus:border-secondary"

                      />



                      <div className="mt-3 flex gap-2">

                        <button

                          type="button"

                          onClick={() => addMoney(goal.id)}

                          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"

                        >

                          Add to Goal

                        </button>



                        <button

                          type="button"

                          onClick={() => setAddingToGoal(null)}

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

        </section>



        {/* Savings Insight */}

        <div className="mt-8 rounded-2xl border border-border-custom bg-surface-blue p-5">

          <h2 className="text-sm font-bold text-primary">

            Savings Insight

          </h2>



          <p className="mt-2 text-sm leading-relaxed text-foreground">

            {totalTarget > 0

              ? `You've saved ${Math.round(

                  (totalSaved / totalTarget) * 100

                )}% of your combined savings targets. Keep building toward your goals.`

              : "Create your first savings goal to start tracking your progress."}

          </p>

        </div>



        <p className="mt-6 text-center text-xs text-muted">

          Demo savings — changes are saved in this browser only. No real money is transferred.

        </p>

      </div>

    </main>

  );

}
