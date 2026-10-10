import { Router } from "express";

const router = Router();

router.post("/plaid/link-token", (req, res) => {
  res.send("POST /plaid/link-token");
});

router.post("/plaid/exchange", (req, res) => {
  res.send("POST /plaid/exchange");
});

router.get("/plaid/items", (req, res) => {
  res.send("GET /plaid/items");
});

router.delete("/plaid/items/:id", (req, res) => {
  res.send("DELETE /plaid/items/:id");
});

router.get("/accounts", (req, res) => {
  res.send("GET /accounts");
});

router.get("/accounts/:id/balance", (req, res) => {
  res.send("GET /accounts/:id/balance");
});

router.get("/transactions", (req, res) => {
  res.send("GET /transactions");
});

router.get("/transactions/summary", (req, res) => {
  res.send("GET /transactions/summary");
});

export default router;
