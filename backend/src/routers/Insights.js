import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getTransactions } from "../services/Plaid.js";
import { generateFinancialInsight } from "../services/financialInsights.js";

const router = Router();

router.get("/insights", requireAuth, async (req, res, next) => {
  try {
    const { transactions } = await getTransactions(req.userId);

    const result = await generateFinancialInsight(transactions);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
