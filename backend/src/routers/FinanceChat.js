import { Router } from "express";
import { plaidClient } from "../services/Plaid.js";
import { answerFinancialQuestion } from "../services/financeChatGemini.js";

const router = Router();

router.post("/finance-chat", async (req, res, next) => {
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

    const connection = req.app.locals.plaidDemoConnection;

    if (!connection?.accessToken) {
      return res.status(400).json({
        error: "Connect your bank before using the assistant.",
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const response = await plaidClient.transactionsGet({
      access_token: connection.accessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      options: {
        count: 100,
        offset: 0,
      },
    });

    const accountsResponse = await plaidClient.accountsGet({
  access_token: connection.accessToken,
});

const result = await answerFinancialQuestion(
  question.trim(),
  response.data.transactions,
  {
    budgets: req.body?.budgets,
    savingsGoals: req.body?.savingsGoals,
    accounts: accountsResponse.data.accounts,
  }
);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;