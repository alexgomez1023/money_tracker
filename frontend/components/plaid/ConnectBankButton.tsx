
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function ConnectBankButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Get a Link token from our backend.
  useEffect(() => {
    async function getLinkToken() {
      try {
        const response = await fetch("/api/plaid/link-token", {
          method: "POST",
        });

        if (!response.ok) throw new Error("Failed to get link token");

        const data = await response.json();
        setLinkToken(data.link_token);
      } catch {
        setMessage("Could not initialize Plaid.");
      }
    }

    getLinkToken();
  }, []);

  // Exchange the public token after connecting a bank.
  const onSuccess = useCallback(async (publicToken: string | null) => {
  // Make sure Plaid returned a token.
  if (!publicToken) {
    setMessage("No public token received from Plaid.");
    return;
  }
    setMessage("Connecting bank...");

    try {
      const response = await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) throw new Error("Exchange failed");

      setMessage("Bank connected successfully!");
    } catch {
      setMessage("Bank connection failed.");
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => open()}
        disabled={!ready}
        className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {ready ? "Connect Bank" : "Loading Plaid..."}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
