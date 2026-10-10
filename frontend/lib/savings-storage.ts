export type SavingsGoal = {
  id: number;
  name: string;
  saved: number;
  target: number;
};

export const initialSavingsGoals: SavingsGoal[] = [
  { id: 1, name: "Emergency Fund", saved: 1500, target: 3000 },
];

const STORAGE_KEY = "money-tracker-savings";

export function getSavingsGoals(): SavingsGoal[] {
  if (typeof window === "undefined") return initialSavingsGoals;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialSavingsGoals;
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return initialSavingsGoals;
    return parsed.filter(
      (goal): goal is SavingsGoal =>
        typeof goal === "object" && goal !== null &&
        typeof goal.id === "number" &&
        typeof goal.name === "string" &&
        typeof goal.saved === "number" && Number.isFinite(goal.saved) && goal.saved >= 0 &&
        typeof goal.target === "number" && Number.isFinite(goal.target) && goal.target > 0
    );
  } catch {
    return initialSavingsGoals;
  }
}

export function saveSavingsGoals(goals: SavingsGoal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  window.dispatchEvent(new Event("savings-updated"));
}
