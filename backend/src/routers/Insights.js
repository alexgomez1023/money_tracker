import { Router } from "express";
import { plaidClient } from "../services/Plaid.js";
import { generateFinancialInsight } from "../services/financialInsights.js";

const router = Router();

router.get("/insights", async (req, res, next) => {
  try {
    const connection = req.app.locals.plaidDemoConnection;

    if (!connection?.accessToken) {
      return res.status(400).json({
        error: "Connect a bank to see financial insights.",
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const response = await plaidClient.transactionsGet({
      access_token: connection.accessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      options: { count: 100, offset: 0 },
    });

    const result = await generateFinancialInsight(
      response.data.transactions
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;