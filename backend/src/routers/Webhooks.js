import { Router } from "express";

const router = Router();

router.post("/plaid", (req, res) => {
  res.send("POST /webhooks/plaid");
});

router.post("/spectrum", (req, res) => {
  res.send("POST /webhooks/spectrum");
});

export default router;
