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
      }),
    ),
  );

  return { synced: offers.length };
}

export async function getOffers() {
  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, offer: true, description: true },
    }),
    prisma.offer.count({ where }),
  ]);

  return [offers, total];
}

// Finds offers whose name contains the given name, plus names that sound close to it (typos like "spotfy")
export async function returnOffers(name, product, price) {
  const search = (name ?? "").trim();

  if (search === "") {
    return [];
  }

  const contains = "%" + search + "%";

  const offers = await prisma.$queryRaw`
    SELECT id, externalId, name, offer, description, updatedAt, createdAt
    FROM Offer
    WHERE name LIKE ${contains}
      OR SOUNDEX(name) LIKE CONCAT(TRIM(TRAILING '0' FROM SOUNDEX(${search})), '%')
    ORDER BY
      CASE
        WHEN name = ${search} THEN 0
        WHEN name LIKE ${contains} THEN 1
        ELSE 2
      END,
      name ASC
    LIMIT 20
  `;

  return offers;
}
