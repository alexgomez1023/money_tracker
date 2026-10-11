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

const DEFAULT_CATEGORY = "other";

// Words that point to a category. Each one is matched as a whole word, so "mac" does not match "pharmacy".
const CATEGORY_KEYWORDS = {
  tech: [
    "mac", "macbook", "ipad", "iphone", "apple", "laptop", "laptops",
    "computer", "computers", "software", "developer", "developers", "cloud",
    "hosting", "domain", "domains", "api", "code", "coding", "app", "apps",
    "tech", "microsoft", "github", "adobe", "samsung", "dell", "lenovo", "hp",
    "ai", "vpn", "server", "servers", "database",
  ],
  entertainment: [
    "music", "streaming", "movie", "movies", "tv", "video", "game", "games",
    "gaming", "spotify", "hulu", "netflix", "podcast", "podcasts",
    "audiobooks", "concerts", "tickets",
  ],
  food: [
    "food", "meal", "meals", "coffee", "pizza", "restaurant", "restaurants",
    "grocery", "groceries", "delivery", "drink", "drinks", "burger", "snacks",
  ],
  shopping: [
    "clothing", "clothes", "fashion", "shoes", "apparel", "sneakers",
    "sportswear", "beauty", "makeup", "skincare", "furniture", "jewelry",
    "accessories", "nike", "adidas",
  ],
  travel: [
    "travel", "flight", "flights", "hotel", "hotels", "airline", "airlines",
    "train", "bus", "rail", "car rental", "rides", "trip", "trips", "luggage",
  ],
  education: [
    "course", "courses", "learning", "textbook", "textbooks", "study",
    "tutoring", "language", "languages", "certification", "exam", "exams",
    "classes", "education", "research", "writing",
  ],
  health: [
    "fitness", "gym", "health", "wellness", "meditation", "therapy",
    "workout", "vitamins", "glasses", "contacts", "sleep",
  ],
  finance: [
    "bank", "banking", "credit", "invest", "investing", "insurance", "budget",
    "tax", "taxes", "loan", "loans", "finance",
  ],
};

// Lowercases the text and turns everything that isn't a letter or digit into a space
function toWords(text) {
  let words = " ";

  for (const char of text.toLowerCase()) {
    const isLetter = char >= "a" && char <= "z";
    const isDigit = char >= "0" && char <= "9";

    words += isLetter || isDigit ? char : " ";
  }

  return words + " ";
}

// Picks the category with the most keyword hits in the offer's name, offer text and description
function getCategory(object) {
  const text = toWords(
    `${object.name} ${object.offer} ${object.description ?? ""}`,
  );

  let best = DEFAULT_CATEGORY;
  let bestHits = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let hits = 0;

    for (const keyword of keywords) {
      if (text.includes(` ${keyword} `)) {
        hits++;
      }
    }

    if (hits > bestHits) {
      best = category;
      bestHits = hits;
    }
  }

  return best;
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

// Returns every offer, or only the ones in the given category
export async function getOffers(category) {
  const where = category ? { category } : {};

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        offer: true,
        description: true,
        category: true,
      },
    }),
    prisma.offer.count({ where }),
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
