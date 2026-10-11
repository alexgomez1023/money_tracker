import { GoogleGenAI } from "@google/genai";

function summarizeTransactions(transactions) {
  const expenses = transactions.filter(
    (t) => !t.pending && t.amount > 0 &&
      !["TRANSFER_IN", "TRANSFER_OUT", "LOAN_PAYMENTS"].includes(
        t.personal_finance_category?.primary
      )
  );

  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

  const categories = {};

  for (const transaction of expenses) {
    const category =
      transaction.personal_finance_category?.primary || "OTHER";

    categories[category] =
      (categories[category] || 0) + transaction.amount;
  }

  return {
    transactionCount: expenses.length,
    totalSpent: Number(totalSpent.toFixed(2)),
    categories: Object.entries(categories)
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export async function generateFinancialInsight(transactions) {
  const summary = summarizeTransactions(transactions);

  if (summary.transactionCount === 0) {
    return {
      insight: "No recent spending transactions are available yet.",
      source: "none",
    };
  }

  // Keep paid Gemini requests disabled during initial setup.
  if (process.env.GEMINI_INSIGHTS_ENABLED !== "true") {
    const largest = summary.categories[0];

    return {
      insight:
        `You've spent $${summary.totalSpent.toFixed(2)} across ` +
        `${summary.transactionCount} recent transactions. ` +
        `Your largest spending category is ${largest.category.replaceAll("_", " ").toLowerCase()} ` +
        `at $${largest.amount.toFixed(2)}.`,
      source: "local-summary",
    };
  }

  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION || "global",
  });

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    contents:
      "Analyze this recent spending summary and provide one specific, " +
      "practical financial insight in 2 sentences. " +
      "Do not invent savings amounts or claim that spending is unusual " +
      "without historical data. Do not provide investment advice.\n\n" +
      JSON.stringify(summary),
  });

  return {
    insight: response.text?.trim() || "No insight was generated.",
    source: "gemini",
  };
}