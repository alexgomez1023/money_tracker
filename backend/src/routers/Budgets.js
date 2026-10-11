import { Router } from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { getBudgets, updateBudgets } from "../services/Budgets.js";
import { validateUpdateBudgets } from "../validators/Budget.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const budgets = await getBudgets(req.userId);

  res.json({ budgets });
});

// PUT /budgets { budgets: [{ category: "Shopping", limit: 250 }] }
router.put("/", requireAuth, async (req, res) => {
  const budgets = await updateBudgets(
    req.userId,
    validateUpdateBudgets(req.body),
  );

  res.json({ budgets });
});

export default router;
