// Fills the Offer table from studentoffers.co.
// Run from backend/: npm run sync:offers
import { prisma } from "../src/db.js";
import { syncOffers } from "../src/services/Offers.js";

try {
  const { synced } = await syncOffers();
  console.log(`Synced ${synced} offers`);
} catch (err) {
  console.error("Offer sync failed:", err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
