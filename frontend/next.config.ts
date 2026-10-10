
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

  // Forward bank requests to the Express backend.
  async rewrites() {
    return [
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
    ];
  },
};

export default nextConfig;
