
import { Router } from "express";

import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { syncOffers, getOffers } from "../services/Offers.js";
import { getPersonalizedOffers } from "../services/PersonalizedOffers.js";

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
