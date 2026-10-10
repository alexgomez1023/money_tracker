import { prisma } from "../src/db.js";
import { generateHash } from "../src/services/Password.js";
import {
  connectBank,
  plaidClient,
  syncUserTransactions,
} from "../src/services/Plaid.js";

const TEST_USER = {
  name: "Test User",
  phone: "+15555550100",
  email: "test@example.com",
  password: "testpass123",
};

// Plaid Sandbox's "First Platypus Bank"
const SANDBOX_INSTITUTION_ID = "ins_109508";

// Sandbox transactions take a few seconds to show up after linking
const SYNC_ATTEMPTS = 6;
const SYNC_WAIT_MS = 5000;

// Merchants that have a match in the Offer table, so the offers job has something to find
const TEST_TRANSACTION_PREFIX = "seed-";
const TEST_TRANSACTIONS = [
  { merchantName: "Spotify", amount: 11.99, category: "ENTERTAINMENT" },
  { merchantName: "Nike", amount: 84.5, category: "GENERAL_MERCHANDISE" },
  { merchantName: "Starbucks", amount: 6.25, category: "FOOD_AND_DRINK" },
  { merchantName: "Hulu", amount: 9.99, category: "ENTERTAINMENT" },
  { merchantName: "Adobe", amount: 19.99, category: "GENERAL_SERVICES" },
];

// Deletes and recreates the test transactions, so every run stamps them as just added
async function addTestTransactions(userId) {
  const account = await prisma.account.findFirst({
    where: { item: { userId } },
  });

  await prisma.transaction.deleteMany({
    where: {
      plaidTransactionId: { startsWith: TEST_TRANSACTION_PREFIX },
      account: { item: { userId } },
    },
  });

  await prisma.transaction.createMany({
    data: TEST_TRANSACTIONS.map((transaction, index) => ({
      accountId: account.id,
      plaidTransactionId: `${TEST_TRANSACTION_PREFIX}${userId}-${index}`,
      date: new Date(),
      ...transaction,
    })),
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function countTransactions(userId) {
  return prisma.transaction.count({
    where: { account: { item: { userId } } },
  });
}

try {
  const user = await prisma.user.upsert({
    where: { phone: TEST_USER.phone },
    create: {
      name: TEST_USER.name,
      phone: TEST_USER.phone,
      email: TEST_USER.email,
      passwordHash: await generateHash(TEST_USER.password),
    },
    update: {},
  });

  const linked = await prisma.plaidItem.count({ where: { userId: user.id } });

  if (linked === 0) {
    const response = await plaidClient.sandboxPublicTokenCreate({
      institution_id: SANDBOX_INSTITUTION_ID,
      initial_products: ["transactions"],
    });

    await connectBank(user.id, response.data.public_token);
  }

  for (let attempt = 0; attempt < SYNC_ATTEMPTS; attempt++) {
    if ((await countTransactions(user.id)) > 0) {
      break;
    }

    await wait(SYNC_WAIT_MS);

    await syncUserTransactions(user.id);
  }

  await addTestTransactions(user.id);

  const accounts = await prisma.account.count({
    where: { item: { userId: user.id } },
  });

  console.log(`Test user ${user.id}`);
  console.log(`Login: ${TEST_USER.phone} / ${TEST_USER.password}`);
  console.log(
    `Accounts: ${accounts}, transactions: ${await countTransactions(user.id)}`,
  );
} catch (err) {
  console.error("Seeding failed:", err.response?.data ?? err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
