import { Router } from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { deleteUser, getUser, updateUser } from "../services/User.js";
import { validateUpdateUser } from "../validators/User.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = await getUser(req.userId);

  res.json({ user });
});

router.patch("/", requireAuth, async (req, res) => {
  const user = await updateUser(req.userId, validateUpdateUser(req.body));

  res.json({ user });
});

router.delete("/", requireAuth, async (req, res) => {
  await deleteUser(req.userId);

  res.status(204).end();
});

router.post("/welcome", (req, res) => {});

export default router;
