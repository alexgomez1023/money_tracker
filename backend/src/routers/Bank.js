
import { Router } from "express";
import { plaidClient } from "../services/Plaid.js";

const router = Router();

/**
 * Creates a Plaid Link token to connect a bank account.
 */
router.post("/plaid/link-token", async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: "hacknc-demo-user",
      },
      client_name: "Money Tracker",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
    });

    res.json({
      link_token: response.data.link_token,
    });
  } catch (error) {
    console.error(
      "Plaid link-token error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Failed to create Plaid link token",
    });
  }
});

/**
 * Exchanges a Plaid public token for an access token.
 */
router.post("/plaid/exchange", async (req, res) => {
  try {
    const { public_token } = req.body ?? {};

    if (
      typeof public_token !== "string" ||
      !public_token.trim()
    ) {
      return res.status(400).json({
        error: "A valid public_token is required",
      });
    }

    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = response.data;

    // Temporarily store the connection for Sandbox testing.
    req.app.locals.plaidDemoConnection = {
      accessToken: access_token,
      itemId: item_id,
    };

    res.json({
      success: true,
      item_id,
    });
  } catch (error) {
    console.error(
      "Plaid exchange error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Failed to connect bank account",
    });
  }
});

/**
 * Lists connected Plaid Items.
 */
router.get("/plaid/items", (req, res) => {
  res.send("GET /plaid/items");
});

/**
 * Disconnects a Plaid Item.
 */
router.delete("/plaid/items/:id", (req, res) => {
  res.send("DELETE /plaid/items/:id");
});

/**
 * Retrieves connected bank accounts and balances.
 */
router.get("/accounts", async (req, res) => {
  try {
    // Get the access token stored during bank connection.
    const connection = req.app.locals.plaidDemoConnection;

    if (!connection?.accessToken) {
      return res.status(400).json({
        error: "No bank connected. Connect a bank first.",
      });
    }

    // Fetch account details from Plaid.
    const response = await plaidClient.accountsGet({
      access_token: connection.accessToken,
    });

    // Return account information without exposing the access token.
    const accounts = response.data.accounts.map((account) => ({
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
    }));

    res.json({ accounts });
  } catch (error) {
    console.error(
      "Plaid accounts error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Failed to retrieve bank accounts",
    });
  }
});

/**
 * Retrieves an account's balance.
 */
router.get("/accounts/:id/balance", (req, res) => {
  res.send("GET /accounts/:id/balance");
});


/**
 * Retrieves recent transactions from the connected Sandbox bank.
 */
router.get("/transactions", async (req, res) => {
  try {
    const connection = req.app.locals.plaidDemoConnection;

    if (!connection?.accessToken) {
      return res.status(400).json({
        error: "No bank connected. Connect a bank first.",
      });
    }

    // Retrieve up to 100 transactions from the last 30 days.
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const response = await plaidClient.transactionsGet({
      access_token: connection.accessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      options: {
        count: 100,
        offset: 0,
      },
    });

    const transactions = response.data.transactions.map((transaction) => ({
      transaction_id: transaction.transaction_id,
      account_id: transaction.account_id,
      name: transaction.name,
      merchant_name: transaction.merchant_name,
      amount: transaction.amount,
      date: transaction.date,
      pending: transaction.pending,
      category: transaction.category,
      personal_finance_category: transaction.personal_finance_category,
    }));

    res.json({
      transactions,
      total_transactions: response.data.total_transactions,
    });
  } catch (error) {
    console.error(
      "Plaid transactions error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Failed to retrieve transactions",
    });
  }
});


/**
 * Retrieves a transaction summary.
 */
router.get("/transactions/summary", (req, res) => {
  res.send("GET /transactions/summary");
});

export default router;
