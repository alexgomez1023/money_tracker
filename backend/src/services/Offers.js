import { prisma } from "../db.js";

const OFFERS_URL = "https://www.studentoffers.co/api/offers";

// Pulls the full offer list and keeps only the fields we store
export async function fetchStudentOffers() {
  const res = await fetch(OFFERS_URL);
  if (!res.ok) {
    throw new Error(`studentoffers.co responded ${res.status}`);
  }

  const data = await res.json();

  return data
    .filter((o) => o.id && o.name && o.offer)
    .map((o) => ({
      externalId: o.id,
      name: o.name,
      offer: o.offer,
      description: o.description ?? "",
    }));
}

// Inserts new offers and updates existing ones (matched on externalId), so it is safe to rerun
export async function syncOffers() {
  const offers = await fetchStudentOffers();

  await prisma.$transaction(
    offers.map(({ externalId, ...fields }) =>
      prisma.offer.upsert({
        where: { externalId },
        create: { externalId, ...fields },
        update: fields,
      })
    )
  );

  return { synced: offers.length };
}
