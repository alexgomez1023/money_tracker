import { verifyAccessToken } from "../services/Token.js";

import { HttpError } from "../errors.js";

// Expects "Authorization: Bearer <access token>" and sets req.userId
export function requireAuth(req, res, next) {
  if (process.env.DEV === "true") {
    req.userId = process.env.DEV_USER_ID;

    return next();
  }

  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    throw new HttpError(401, "Access token is required");
  }

  try {
    req.userId = verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    throw new HttpError(401, "Invalid or expired access token");
  }

  next();
}
