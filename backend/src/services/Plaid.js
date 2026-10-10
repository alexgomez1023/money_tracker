import crypto from "node:crypto";

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import { prisma } from "../db.js";
import { HttpError } from "../errors.js";

const TRANSACTION_DAYS = 30;
const TRANSACTION_LIMIT = 100;

// Plaid's error code for a bank login that has expired
const LOGIN_REQUIRED_ERROR = "ITEM_LOGIN_REQUIRED";

const tokenSecret = process.env.PLAID_TOKEN_SECRET;

if (!tokenSecret) {
  throw new Error("PLAID_TOKEN_SECRET is not set");
}

// AES-256 needs a 32 byte key, so hash whatever length the secret is
const tokenKey = crypto.createHash("sha256").update(tokenSecret).digest();

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Stored as "iv.tag.ciphertext", each part base64
function encryptToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", tokenKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64"))
    .join(".");
}

function decryptToken(value) {
  const [iv, tag, encrypted] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64"));

  const decipher = crypto.createDecipheriv("aes-256-gcm", tokenKey, iv);

  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

// Runs a Plaid request with the item's access token, and flags the item if the bank login expired
async function callPlaid(item, request) {
  try {
    return await request(decryptToken(item.accessTokenEncrypted));
  } catch (err) {
    if (err.response?.data?.error_code === LOGIN_REQUIRED_ERROR) {
      await prisma.plaidItem.update({
        where: { id: item.id },
        data: { status: "needsReauth" },
      });
    }

    throw err;
  }
}

async function getUserItems(userId) {
  const items = await prisma.plaidItem.findMany({ where: { userId } });

  if (items.length === 0) {
    throw new HttpError(400, "No bank connected. Connect a bank first.");
  }

  return items;
}

async function saveAccounts(itemId, plaidAccounts) {
  const balanceFetchedAt = new Date();

  await prisma.$transaction(
    plaidAccounts.map((account) => {
      const fields = {
        name: account.name,
        currentBalance: account.balances.current,
        availableBalance: account.balances.available,
        balanceFetchedAt,
      };

      return prisma.account.upsert({
        where: { plaidAccountId: account.account_id },
        create: { itemId, plaidAccountId: account.account_id, ...fields },
        update: fields,
      });
    }),
  );
}

async function saveTransactions(itemId, plaidTransactions) {
  const accounts = await prisma.account.findMany({
    where: { itemId },
    select: { id: true, plaidAccountId: true },
  });

  const accountIds = {};
  for (const account of accounts) {
    accountIds[account.plaidAccountId] = account.id;
  }

  const known = plaidTransactions.filter((t) => accountIds[t.account_id]);

  await prisma.$transaction(
    known.map((t) => {
      const fields = {
        accountId: accountIds[t.account_id],
        amount: t.amount,
        date: new Date(t.date),
        merchantName: t.merchant_name ?? t.name,
        category: t.personal_finance_category?.primary ?? null,
        pending: t.pending,
      };

      return prisma.transaction.upsert({
        where: { plaidTransactionId: t.transaction_id },
        create: { plaidTransactionId: t.transaction_id, ...fields },
        update: fields,
      });
    }),
  );
}

// Pulls everything that changed since the item's saved cursor into our database
async function syncTransactions(item) {
  let cursor = item.syncCursor ?? undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await callPlaid(item, (access_token) =>
      plaidClient.transactionsSync({ access_token, cursor }),
    );

    const { accounts, added, modified, removed } = response.data;

    await saveAccounts(item.id, accounts);

    await saveTransactions(item.id, [...added, ...modified]);

    await prisma.transaction.deleteMany({
      where: {
        plaidTransactionId: { in: removed.map((t) => t.transaction_id) },
        account: { itemId: item.id },
      },
    });

    cursor = response.data.next_cursor;
    hasMore = response.data.has_more;
  }

  await prisma.plaidItem.update({
    where: { id: item.id },
    data: { syncCursor: cursor },
  });
}

// Syncs every bank the user has linked, does nothing if they have none
export async function syncUserTransactions(userId) {
  const items = await prisma.plaidItem.findMany({ where: { userId } });

  for (const item of items) {
    await syncTransactions(item);
  }
}

export async function createLinkToken(userId) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Money Tracker",
    products: ["transactions"],
    country_codes: ["US"],
    language: "en",
  });

  return response.data.link_token;
}

// Saves the bank connection for the user, then pulls its accounts and transactions
export async function connectBank(userId, publicToken) {
  const exchange = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const { access_token, item_id } = exchange.data;

  const itemResponse = await plaidClient.itemGet({ access_token });

  const fields = {
    accessTokenEncrypted: encryptToken(access_token),
    institutionName: itemResponse.data.item.institution_name ?? null,
    status: "active",
  };

  const item = await prisma.plaidItem.upsert({
    where: { plaidItemId: item_id },
    create: { userId, plaidItemId: item_id, ...fields },
    update: fields,
  });

  const accountsResponse = await plaidClient.accountsGet({ access_token });

  await saveAccounts(item.id, accountsResponse.data.accounts);

  await syncTransactions(item);

  return item;
}

export async function listItems(userId) {
  return prisma.plaidItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, institutionName: true, status: true, createdAt: true },
  });
}

// Unlinks the bank at Plaid and deletes its accounts and transactions
export async function removeItem(userId, id) {
  const item = await prisma.plaidItem.findFirst({ where: { id, userId } });

  if (!item) {
    throw new HttpError(404, "Bank connection not found");
  }

  await callPlaid(item, (access_token) =>
    plaidClient.itemRemove({ access_token }),
  );

  await prisma.plaidItem.delete({ where: { id: item.id } });
}

// Fetches accounts from Plaid, saves the balances, and returns them without the access token
export async function getAccounts(userId) {
  const items = await getUserItems(userId);
  const accounts = [];

  for (const item of items) {
    const response = await callPlaid(item, (access_token) =>
      plaidClient.accountsGet({ access_token }),
    );

    await saveAccounts(item.id, response.data.accounts);

    for (const account of response.data.accounts) {
      accounts.push({
        account_id: account.account_id,
        name: account.name,
        official_name: account.official_name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        balances: {
          available: account.balances.available,
          current: account.balances.current,
          iso_currency_code: account.balances.iso_currency_code,
        },
      });
    }
  }

  return accounts;
}

// Takes Plaid's account_id, the same id GET /accounts returns
export async function getAccountBalance(userId, plaidAccountId) {
  const account = await prisma.account.findFirst({
    where: { plaidAccountId, item: { userId } },
    include: { item: true },
  });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  const response = await callPlaid(account.item, (access_token) =>
    plaidClient.accountsBalanceGet({
      access_token,
      options: { account_ids: [plaidAccountId] },
    }),
  );

  await saveAccounts(account.itemId, response.data.accounts);

  const { balances } = response.data.accounts[0];

  return {
    account_id: plaidAccountId,
    available: balances.available,
    current: balances.current,
    iso_currency_code: balances.iso_currency_code,
  };
}

// Syncs with Plaid, then reads the last 30 days back out of our database
export async function getTransactions(userId) {
  const items = await getUserItems(userId);

  for (const item of items) {
    await syncTransactions(item);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - TRANSACTION_DAYS);

  const where = {
    account: { item: { userId } },
    date: { gte: startDate },
  };

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: TRANSACTION_LIMIT,
      include: { account: { select: { plaidAccountId: true } } },
    }),
    prisma.transaction.count({ where }),
  ]);

  const transactions = rows.map((row) => ({
    transaction_id: row.plaidTransactionId,
    account_id: row.account.plaidAccountId,
    name: row.merchantName,
    merchant_name: row.merchantName,
    amount: Number(row.amount),
    date: row.date.toISOString().split("T")[0],
    pending: row.pending,
    category: null,
    personal_finance_category: row.category ? { primary: row.category } : null,
  }));

  return { transactions, total };
}
