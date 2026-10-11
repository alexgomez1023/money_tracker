import { Router } from "express";

import { HttpError } from "../errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  connectBank,
  createLinkToken,
  getAccountBalance,
  getAccounts,
  getTransactions,
  listItems,
  removeItem,
} from "../services/Plaid.js";

const router = Router();

/**
 * Creates a Plaid Link token to connect a bank account.
 */
router.post("/plaid/link-token", requireAuth, async (req, res) => {
  const link_token = await createLinkToken(req.userId);

  res.json({ link_token });
});

/**
 * Exchanges a Plaid public token and saves the bank connection.
 */
router.post("/plaid/exchange", requireAuth, async (req, res) => {
  const { public_token } = req.body ?? {};

  if (typeof public_token !== "string" || !public_token.trim()) {
    throw new HttpError(400, "A valid public_token is required");
  }

  const item = await connectBank(req.userId, public_token);

  res.json({ success: true, item_id: item.id });
});

/**
 * Lists connected Plaid Items.
 */
router.get("/plaid/items", requireAuth, async (req, res) => {
  const items = await listItems(req.userId);

  res.json({ items });
});

/**
 * Disconnects a Plaid Item.
 */
router.delete("/plaid/items/:id", requireAuth, async (req, res) => {
  await removeItem(req.userId, req.params.id);

  res.status(204).end();
});

/**
 * Retrieves connected bank accounts and balances.
 */
router.get("/accounts", requireAuth, async (req, res) => {
  const accounts = await getAccounts(req.userId);

  res.json({ accounts });
});

/**
 * Retrieves an account's balance.
 */
router.get("/accounts/:id/balance", requireAuth, async (req, res) => {
  const balance = await getAccountBalance(req.userId, req.params.id);

  res.json({ balance });
});

/**
 * Retrieves recent transactions from the connected bank.
 */
router.get("/transactions", requireAuth, async (req, res) => {
  const { transactions, total } = await getTransactions(req.userId);

  res.json({ transactions, total_transactions: total });
});

/**
 * Retrieves a transaction summary.
 */
router.get("/transactions/summary", (req, res) => {
  res.send("GET /transactions/summary");
});

export default router;
