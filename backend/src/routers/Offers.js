import { Router } from "express";

import { prisma } from "../db.js";
import { syncOffers } from "../services/Offers.js";

const router = Router();

// GET /offers?q=spotify&limit=20&offset=0
router.get("/", async (req, res) => {
  const { q } = req.query;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { offer: { contains: q } },
          { description: { contains: q } },
        ],
      }
    : {};

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
      select: { id: true, name: true, offer: true, description: true },
    }),
    prisma.offer.count({ where }),
  ]);

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
