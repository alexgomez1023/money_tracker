import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("GET /me");
});

router.patch("/", (req, res) => {
  res.send("PATCH /me");
});

router.delete("/", (req, res) => {
  res.send("DELETE /me");
});

router.post("/phone", (req, res) => {
  res.send("POST /me/phone");
});

router.post("/phone/verify", (req, res) => {
  res.send("POST /me/phone/verify");
});

export default router;
