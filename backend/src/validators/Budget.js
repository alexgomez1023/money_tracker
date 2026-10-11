import { asObject, finish } from "./Auth.js";

import { BUDGET_CATEGORIES } from "../services/Budgets.js";

const LIMIT_MAX = 1000000;

// Expects { budgets: [{ category, limit }] } with at least one budget
export function validateUpdateBudgets(body) {
  const input = asObject(body);
  const errors = {};
  const budgets = [];

  if (!Array.isArray(input.budgets) || input.budgets.length === 0) {
    errors.budgets = "Provide at least one budget to update";

    return finish(budgets, errors);
  }

  const seen = [];

  for (const item of input.budgets) {
    const { category, limit } = asObject(item);

    if (!BUDGET_CATEGORIES.includes(category)) {
      errors.budgets = `Category must be one of: ${BUDGET_CATEGORIES.join(", ")}`;
      break;
    }

    if (seen.includes(category)) {
      errors.budgets = `${category} is listed more than once`;
      break;
    }

    if (
      typeof limit !== "number" ||
      !Number.isFinite(limit) ||
      limit <= 0 ||
      limit > LIMIT_MAX
    ) {
      errors.budgets = `The limit for ${category} must be greater than 0 and at most ${LIMIT_MAX}`;
      break;
    }

    seen.push(category);

    // Stored to the cent
    budgets.push({ category, limit: Math.round(limit * 100) / 100 });
  }

  return finish(budgets, errors);
}
