
import { prisma } from "../db.js";

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

  for (const offer of offers) {
    const offerName = offer.name.toLowerCase().trim();

    // Prefer exact or partial merchant-name matches.
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

    // Plaid's categories and offer categories use different names.
    const categoryMappings = {
      shopping: ["general_merchandise", "general_services"],
      food: ["food_and_drink"],
      dining: ["food_and_drink"],
      transportation: ["transportation", "travel"],
      entertainment: ["entertainment"],
      travel: ["travel"],
    };

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
        : `This matches one of your recent spending categories.`,
      matchType: merchantMatch ? "merchant" : "category",
      score: merchantMatch
        ? 1000 + matchedSpending
        : 100 + categoryAmount,
    });
  }

  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, 6);
}
