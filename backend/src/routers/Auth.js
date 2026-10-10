import { Router } from "express";

import {
  loginUser,
  logoutUser,
  refreshToken,
  signupUser,
} from "../services/Auth.js";
import {
  validateLogin,
  validateRefreshToken,
  validateSignup,
} from "../validators/Auth.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const response = await signupUser(validateSignup(req.body));

  res.status(201).json(response);
});

router.post("/login", async (req, res) => {
  const response = await loginUser(validateLogin(req.body));

  res.json(response);
});

router.post("/refresh", async (req, res) => {
  const response = await refreshToken(validateRefreshToken(req.body));

  res.json(response);
});

router.post("/logout", async (req, res) => {
  await logoutUser(validateRefreshToken(req.body));

  res.status(204).end();
});

export default router;
