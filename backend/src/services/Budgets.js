import { prisma } from "../db.js";

// Keys are the BudgetCategory enum values stored in the database.
// The label is the name the API and the app use for that category.
const CATEGORIES = {
  foodAndDrink: { label: "Food & Drink", defaultLimit: 400 },
  shopping: { label: "Shopping", defaultLimit: 300 },
  transportation: { label: "Transportation", defaultLimit: 200 },
  other: { label: "Other", defaultLimit: 300 },
};

export const BUDGET_CATEGORIES = Object.values(CATEGORIES).map(
  (category) => category.label,
);

// "Food & Drink" -> "foodAndDrink"
function toEnumValue(label) {
  for (const [value, category] of Object.entries(CATEGORIES)) {
    if (category.label === label) {
      return value;
    }
  }
}

// Returns one budget per category, in a fixed order. A category with no saved row uses its default limit.
export async function getBudgets(userId) {
  const saved = await prisma.budget.findMany({ where: { userId } });

  const limits = {};
  for (const budget of saved) {
    limits[budget.category] = Number(budget.monthlyLimit);
  }

  return Object.entries(CATEGORIES).map(([value, category]) => ({
    category: category.label,
    limit: limits[value] ?? category.defaultLimit,
  }));
}

// Saves the given limits and leaves the other categories as they are
export async function updateBudgets(userId, budgets) {
  await prisma.$transaction(
    budgets.map(({ category: label, limit }) => {
      const category = toEnumValue(label);

      return prisma.budget.upsert({
        where: { userId_category: { userId, category } },
        create: { userId, category, monthlyLimit: limit },
        update: { monthlyLimit: limit },
      });
    }),
  );

  return getBudgets(userId);
}
