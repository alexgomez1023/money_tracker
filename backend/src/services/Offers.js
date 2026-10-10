import { syncUserTransactions } from "./Plaid.js";

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
      category: getCategory(o),
    }));
}

function getCategory(object) {
  return "N/A";
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
    prisma.offer.count(),
  ]);

  return [offers, total];
}

// Finds offers whose name contains the given name, plus names that sound close to it (typos like "spotfy")
export async function returnOffers(name) {
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

const OFFERS_JOB_INTERVAL_MS = 60 * 60 * 1000;

// Refreshes the offer list and each user's transactions, then looks up offers for the merchants
// on transactions we saved within the last job interval
export async function findOffersForUsers() {
  const since = new Date(Date.now() - OFFERS_JOB_INTERVAL_MS);

  try {
    await syncOffers();
  } catch (err) {
    console.error("Offers sync failed, using saved offers:", err.message);
  }

  const users = await prisma.user.findMany({
    where: { plaidItems: { some: {} } },
    select: { id: true },
  });

  const results = [];

  for (const user of users) {
    try {
      await syncUserTransactions(user.id);
    } catch (err) {
      console.error(
        `Transaction sync failed for ${user.id}, using saved transactions:`,
        err.response?.data?.error_message ?? err.message,
      );
    }

    const merchants = await prisma.transaction.findMany({
      where: {
        account: { item: { userId: user.id } },
        merchantName: { not: null },
        createdAt: { gte: since },
      },
      distinct: ["merchantName"],
      select: { merchantName: true },
    });

    for (const { merchantName } of merchants) {
      const offers = await returnOffers(merchantName);

      if (offers.length > 0) {
        results.push({ userId: user.id, merchantName, offers });
      }
    }
  }

  return results;
}

export async function runOffersJob() {
  console.log("Running Cron Job...");
  try {
    const results = await findOffersForUsers();

    for (const { userId, merchantName, offers } of results) {
      console.log(
        `Offers for ${userId} at ${merchantName}:`,
        offers.map((o) => o.name),
      );
    }
  } catch (err) {
    console.error("Offers job failed:", err);
  }
}

// Runs the offer lookup at startup, then once an hour for as long as the server is up
export function startOffersJob() {
  runOffersJob();

  setInterval(runOffersJob, OFFERS_JOB_INTERVAL_MS);
}
