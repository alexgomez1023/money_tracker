import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getAccounts, getTransactions } from "../services/Plaid.js";
import { answerFinancialQuestion } from "../services/financeChatGemini.js";

const router = Router();

router.post("/finance-chat", requireAuth, async (req, res, next) => {
  try {
    const question = req.body?.message;

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 1000
    ) {
      return res.status(400).json({
        error: "Please enter a question of 1–1000 characters.",
      });
    }

    // Don't fetch Plaid data or call Gemini while disabled.
    if (process.env.GEMINI_FINANCE_CHAT_ENABLED !== "true") {
      return res.json({
        reply:
          "Gemini Flash is connected in the code but is disabled " +
          "until we verify Google Cloud billing.",
        source: "disabled",
      });
    }

    const { transactions } = await getTransactions(req.userId);

    const accounts = await getAccounts(req.userId);

    const result = await answerFinancialQuestion(question.trim(), transactions, {
      budgets: req.body?.budgets,
      savingsGoals: req.body?.savingsGoals,
      accounts,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
