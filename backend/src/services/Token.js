import crypto from "node:crypto";

import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set");
}

export function generateAccessToken(userId) {
  return jwt.sign({}, jwtSecret, {
    subject: userId,
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

// Returns the user id, throws if the token is invalid or expired
export function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret).sub;
}

export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("base64url");
}

// Refresh tokens are random, so a plain SHA-256 is enough and lets us look the session up by hash
export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
