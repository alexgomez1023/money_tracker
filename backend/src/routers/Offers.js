
import { Router } from "express";

import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { syncOffers, getOffers } from "../services/Offers.js";
import { getPersonalizedOffers } from "../services/PersonalizedOffers.js";
import studentOffersScanner from "../services/DiscoverStudentOffers.cjs";

const { discoverStudentOffers } = studentOffersScanner;

const router = Router();

// GET /offers?category=shopping
// Returns all offers or filters by category.
router.get("/", async (req, res) => {
  const category =
    typeof req.query.category === "string"
      ? req.query.category.trim()
      : "";

  const [offers, total] = await getOffers(category);

  res.json({ offers, total });
});

// GET /offers/personalized
// Returns offers based on the signed-in user's spending.
router.get("/personalized", requireAuth, async (req, res) => {
  try {
    console.log("[TEST] Personalized offers endpoint reached");

    const offers = await getPersonalizedOffers(req.userId);

    res.json({
      offers,
      total: offers.length,
    });
  } catch (err) {
    console.error("Personalized offers failed:", err);

    res.status(500).json({
      error: "Unable to load personalized offers",
    });
  }
});


// GET /offers/discover
// Finds student discounts using Gemini, saves them, and caches them for 24 hours.
router.get("/discover", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Get merchants from the user's recent Plaid transactions.
    const transactions = await prisma.transaction.findMany({
      where: {
        account: {
          item: {
            userId,
          },
        },
        merchantName: {
          not: null,
        },
      },
      select: {
        merchantName: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    const merchants = [
      ...new Set(
        transactions
          .map((transaction) => transaction.merchantName?.trim())
          .filter(Boolean)
      ),
    ].slice(0, 5);

    if (merchants.length === 0) {
      return res.json({
        offers: [],
        total: 0,
        sources: [],
        message: "No merchant transactions found for this user.",
      });
    }

    // 2. Look for recently saved AI discounts.
    const savedOffers = await prisma.discoveredOffer.findMany({
      where: { userId },
      orderBy: { discoveredAt: "desc" },
    });

    const cacheDuration = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const cacheIsFresh =
      savedOffers.length > 0 &&
      savedOffers.every(
        (offer) =>
          now - new Date(offer.discoveredAt).getTime() < cacheDuration
      );

    if (cacheIsFresh) {
      console.log("[Offers] Returning cached AI discounts");

      return res.json({
        offers: savedOffers,
        total: savedOffers.length,
        sources: [],
        cached: true,
      });
    }

    // 3. Discover discounts using Gemini.
    console.log("[Offers] Discovering new student discounts");

    const result = await discoverStudentOffers(merchants);

    if (result.error) {
      // If Gemini fails, return previously saved discounts if available.
      if (savedOffers.length > 0) {
        return res.json({
          offers: savedOffers,
          total: savedOffers.length,
          sources: [],
          cached: true,
          stale: true,
        });
      }

      return res.status(502).json({
        error: "Unable to discover student offers",
      });
    }

    // 4. Save each discovered discount to MySQL.
    const discoveredOffers = Array.isArray(result.offers)
      ? result.offers
      : [];

    for (const offer of discoveredOffers) {
      if (!offer.name || !offer.offer || !offer.url) {
        continue;
      }

      await prisma.discoveredOffer.upsert({
        where: {
          userId_name_offer: {
            userId,
            name: offer.name,
            offer: offer.offer,
          },
        },
        update: {
          description: offer.description || "",
          url: offer.url,
          eligibility: offer.eligibility || "",
          reason: offer.reason || "",
          discoveredAt: new Date(),
        },
        create: {
          userId,
          name: offer.name,
          offer: offer.offer,
          description: offer.description || "",
          url: offer.url,
          eligibility: offer.eligibility || "",
          reason: offer.reason || "",
        },
      });
    }

    // 5. Read the saved offers from the database.
    const updatedOffers = await prisma.discoveredOffer.findMany({
      where: { userId },
      orderBy: { discoveredAt: "desc" },
    });

    console.log(
      `[Offers] Saved ${discoveredOffers.length} AI discounts to MySQL`
    );

    return res.json({
      offers: updatedOffers,
      total: updatedOffers.length,
      sources: result.sources || [],
      cached: false,
    });
  } catch (err) {
    console.error("Student offer discovery failed:", err);

    return res.status(500).json({
      error: "Unable to discover student offers",
    });
  }
});


// GET /offers/:id
// Returns details for one offer.
router.get("/:id", async (req, res) => {
  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      offer: true,
      description: true,
    },
  });

  if (!offer) {
    return res.status(404).json({
      error: "Offer not found",
    });
  }

  res.json(offer);
});

// POST /offers/sync
// Refreshes offers from studentoffers.co.
router.post("/sync", async (req, res) => {
  const result = await syncOffers();

  res.json(result);
});

export default router;
