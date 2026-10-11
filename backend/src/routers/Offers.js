import { Router } from "express";

import { prisma } from "../db.js";
import { syncOffers } from "../services/Offers.js";
import { getOffers } from "../services/Offers.js";

const router = Router();

// GET /offers?category=shopping
router.get("/", async (req, res) => {
  const category =
    typeof req.query.category === "string" ? req.query.category.trim() : "";

  const [offers, total] = await getOffers(category);

  res.json({ offers, total });
});

router.get("/:id", async (req, res) => {
  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, offer: true, description: true },
  });

  if (!offer) {
    return res.status(404).json({ error: "Offer not found" });
  }

  res.json(offer);
});

// Re-pulls offers from studentoffers.co into the database
router.post("/sync", async (req, res) => {
  const result = await syncOffers();
  res.json(result);
});

export default router;
