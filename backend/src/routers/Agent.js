import { Router } from "express";

const router = Router();

router.post("/connect", (req, res) => {
  res.send("POST /agent/connect");
});

export default router;
