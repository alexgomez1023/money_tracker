import { Router } from "express";

const router = Router();

router.post("/signup", (req, res) => {
  res.send("POST /auth/signup");
});

router.post("/login", (req, res) => {
  res.send("POST /auth/login");
});

router.post("/refresh", (req, res) => {
  res.send("POST /auth/refresh");
});

router.post("/logout", (req, res) => {
  res.send("POST /auth/logout");
});

export default router;
