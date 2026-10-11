import { GoogleGenAI } from "@google/genai";
import { prisma } from "../db.js";

// Use Gemini to rank real offers and explain recommendations.
async function personalizeWithGemini(
  recommendations,
  merchantSpending,
  categorySpending,
) {
  if (process.env.GEMINI_OFFERS_ENABLED !== "true") {
    return recommendations.slice(0, 6).map((offer) => ({
      ...offer,
      aiSource: "disabled",
    }));
  }

  if (recommendations.length === 0) {
    return [];
  }
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || "global",
    });

    const spendingSummary = {
      merchants: [...merchantSpending.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([merchant, amount]) => ({
          merchant,
          amount: Number(amount.toFixed(2)),
        })),
      categories: [...categorySpending.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([category, amount]) => ({
          category,
          amount: Number(amount.toFixed(2)),
        })),
    };

    const candidates = recommendations.map((offer) => ({
      id: offer.id,
      name: offer.name,
      offer: offer.offer,
      category: offer.category,
      matchType: offer.matchType,
    }));

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: `
You recommend relevant discounts based on recent spending.

Choose up to 6 offers from the candidate list, ranked by relevance.
For each offer, return its exact id and a short personalized reason.

Rules:
- Recommend ONLY offers supplied in the candidate list.
- Never invent discounts or merchants.
- Do not imply the user must spend money.
- Do not promise that a discount is guaranteed.
- Return ONLY a JSON array of objects with "id" and "reason".

Recent spending:
${JSON.stringify(spendingSummary)} 

Candidate offers:
${JSON.stringify(candidates)}
      `,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "[]");

    if (!Array.isArray(parsed)) {
      throw new Error("Gemini did not return a JSON array.");
    }

    const offersById = new Map(
      recommendations.map((offer) => [String(offer.id), offer]),
    );

    const selected = [];
    const seen = new Set();

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;

      const id = String(item.id);
      const original = offersById.get(id);

      if (!original || seen.has(id)) continue;

      seen.add(id);

      selected.push({
        ...original,
        reason:
          typeof item.reason === "string" && item.reason.trim()
            ? item.reason.trim().slice(0, 240)
            : original.reason,
      });

      if (selected.length === 6) break;
    }

    if (selected.length === 0) {
      throw new Error("Gemini selected no valid offers.");
    }

    console.log("[PersonalizedOffers] Gemini recommendations generated.");

    console.log(
      "[PersonalizedOffers] AI selected:",
      selected.map((offer) => ({
        name: offer.name,
        reason: offer.reason,
      })),
    );
    return selected.map((offer) => ({
      ...offer,
      aiSource: "gemini",
    }));
  } catch (error) {
    console.error("[PersonalizedOffers] Gemini failed:", error.message);
    console.log("[PersonalizedOffers] Using rule-based recommendations.");

    return recommendations.slice(0, 6).map((offer) => ({
      ...offer,
      aiSource: "fallback",
      aiError: error.message,
    }));
  }
}

// Find relevant discounts using the user's recent spending.
export async function getPersonalizedOffers(userId) {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const transactions = await prisma.transaction.findMany({
    where: {
      account: { item: { userId } },
      date: { gte: since },
      pending: false,
      amount: { gt: 0 },
    },
    select: {
      merchantName: true,
      category: true,
      amount: true,
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  // Count spending by merchant and category.
  const merchantSpending = new Map();
  const categorySpending = new Map();

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    const merchant = transaction.merchantName?.trim().toLowerCase();

    if (merchant) {
      merchantSpending.set(
        merchant,
        (merchantSpending.get(merchant) ?? 0) + amount,
      );
    }

    if (transaction.category) {
      const category = transaction.category.toLowerCase();

      categorySpending.set(
        category,
        (categorySpending.get(category) ?? 0) + amount,
      );
    }
  }

  const offers = await prisma.offer.findMany({
    select: {
      id: true,
      name: true,
      offer: true,
      description: true,
      category: true,
    },
  });

  const recommendations = [];

  const categoryMappings = {
    shopping: ["general_merchandise", "general_services"],
    food: ["food_and_drink"],
    dining: ["food_and_drink"],
    transportation: ["transportation", "travel"],
    entertainment: ["entertainment"],
    travel: ["travel"],
  };

  for (const offer of offers) {
    const offerName = offer.name.toLowerCase().trim();

    let merchantMatch = null;
    let matchedSpending = 0;

    for (const [merchant, spending] of merchantSpending) {
      if (
        merchant === offerName ||
        (merchant.length >= 4 && offerName.includes(merchant)) ||
        (offerName.length >= 4 && merchant.includes(offerName))
      ) {
        merchantMatch = merchant;
        matchedSpending = Math.max(matchedSpending, spending);
      }
    }

    const relatedCategories =
      categoryMappings[offer.category.toLowerCase()] ?? [];

    const categoryAmount = relatedCategories.reduce(
      (sum, category) => sum + (categorySpending.get(category) ?? 0),
      0,
    );

    if (!merchantMatch && categoryAmount === 0) {
      continue;
    }

    recommendations.push({
      ...offer,
      reason: merchantMatch
        ? `You've recently spent money at ${offer.name}.`
        : "This matches one of your recent spending categories.",
      matchType: merchantMatch ? "merchant" : "category",
      score: merchantMatch ? 1000 + matchedSpending : 100 + categoryAmount,
    });
  }

  recommendations.sort((a, b) => b.score - a.score);

  // Let Gemini choose the best six from twelve candidates.
  return await personalizeWithGemini(
    recommendations.slice(0, 12),
    merchantSpending,
    categorySpending,
  );
}
