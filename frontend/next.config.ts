
import type { NextConfig } from "next";

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
        destination: "http://localhost:3001/auth/:path*",
      },
      {
        source: "/api/budgets",
        destination: "http://localhost:3001/budgets",
      },
      {
        source: "/api/me",
        destination: "http://localhost:3001/me",
      },
      {
        source: "/api/plaid/:path*",
        destination: "http://localhost:3001/plaid/:path*",
      },
      {
        source: "/api/accounts",
        destination: "http://localhost:3001/accounts",
      },
      {
        source: "/api/transactions",
        destination: "http://localhost:3001/transactions",
      },
      {
        source: "/api/insights",
        destination: "http://localhost:3001/insights",
      },
      {
        source: "/api/finance-chat",
        destination: "http://localhost:3001/finance-chat",
      },
      {
        source: "/api/offers",
        destination: "http://localhost:3001/offers",
      },
      {
        source: "/api/offers/:path*",
        destination: "http://localhost:3001/offers/:path*",
      },
    ];
  },
};

export default nextConfig;
