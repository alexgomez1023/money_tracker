
import type { NextConfig } from "next";

// Set in frontend/.env
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["152.23.50.105"],

  experimental: {
    agentFeedback: true,
  },

  cacheComponents: true,
  partialPrefetching: true,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Forward API requests to the Express backend.
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_URL}/auth/:path*`,
      },
      {
        source: "/api/budgets",
        destination: `${BACKEND_URL}/budgets`,
      },
      {
        source: "/api/me",
        destination: `${BACKEND_URL}/me`,
      },
      {
        source: "/api/plaid/:path*",
        destination: `${BACKEND_URL}/plaid/:path*`,
      },
      {
        source: "/api/accounts",
        destination: `${BACKEND_URL}/accounts`,
      },
      {
        source: "/api/transactions",
        destination: `${BACKEND_URL}/transactions`,
      },
      {
        source: "/api/insights",
        destination: `${BACKEND_URL}/insights`,
      },
      {
        source: "/api/finance-chat",
        destination: `${BACKEND_URL}/finance-chat`,
      },
      {
        source: "/api/offers",
        destination: `${BACKEND_URL}/offers`,
      },
      {
        source: "/api/offers/:path*",
        destination: `${BACKEND_URL}/offers/:path*`,
      },
    ];
  },
};

export default nextConfig;
