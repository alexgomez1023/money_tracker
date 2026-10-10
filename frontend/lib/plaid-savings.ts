
export type SavingsGoal = {
  id: number;
  name: string;
  target: number;
  allocated: number;
};

export type PlaidAccount = {
  account_id: string;
  name: string;
  type: string;
  subtype: string | null;
  balances: {
    current: number | null;
    available: number | null;
  };
};

const STORAGE_KEY = "money-tracker-plaid-savings-goals";

export function getSavingsGoals(): SavingsGoal[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (goal): goal is SavingsGoal =>
        goal !== null &&
        typeof goal === "object" &&
        typeof goal.id === "number" &&
        typeof goal.name === "string" &&
        typeof goal.target === "number" &&
        Number.isFinite(goal.target) &&
        goal.target > 0 &&
        typeof goal.allocated === "number" &&
        Number.isFinite(goal.allocated) &&
        goal.allocated >= 0
    );
  } catch {
    return [];
  }
}

export function saveSavingsGoals(goals: SavingsGoal[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(goals)
  );

  window.dispatchEvent(new Event("savings-updated"));
}

export function getSavingsBalance(accounts: PlaidAccount[]) {
  return accounts
    .filter(
      (account) =>
        account.subtype?.toLowerCase() === "savings"
    )
    .reduce(
      (sum, account) =>
        sum + (account.balances.current ?? 0),
      0
    );
}

export async function fetchSavingsBalance(): Promise<number> {
  const response = await fetch("/api/accounts", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load Plaid accounts");
  }

  const data = await response.json();

  const accounts: PlaidAccount[] = Array.isArray(data)
    ? data
    : data.accounts ?? [];

  return getSavingsBalance(accounts);
}

export function getTotalAllocated(goals: SavingsGoal[]) {
  return goals.reduce(
    (sum, goal) => sum + goal.allocated,
    0
  );
}

export function formatMoney(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
