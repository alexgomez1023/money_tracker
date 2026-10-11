"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { authFetch } from "@/lib/auth";
import { clearBankData } from "@/lib/bank-data";

export default function ConnectBankButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const getLinkToken = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await authFetch("/api/plaid/link-token", {
        method: "POST",
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          `Plaid initialization failed (${response.status}): ${details}`,
        );
      }

      const data = await response.json();

      if (!data.link_token) {
        throw new Error("Backend did not return a link token.");
      }

      setLinkToken(data.link_token);
    } catch (error) {
      console.error("Plaid link token error:", error);
      setMessage("Unable to initialize Plaid. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getLinkToken();
  }, [getLinkToken]);

  const onSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) {
      setMessage("No public token received from Plaid.");
      return;
    }
    setMessage("Connecting your bank...");

    try {
      const response = await authFetch("/api/plaid/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_token: publicToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      clearBankData();
      setConnected(true);
      setMessage("Bank connected successfully!");

      // Refresh bank-related components that listen for this event.
      window.dispatchEvent(new Event("bank-connected"));
    } catch (error) {
      console.error("Plaid exchange error:", error);
      setMessage("Bank connection failed. Please try again.");
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
        disabled={!ready || loading || connected}
        className="rounded-xl bg-[#174A82] px-6 py-3 font-semibold text-white transition hover:bg-[#10365F] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {connected
          ? "Bank Connected"
          : loading || (!ready && linkToken)
            ? "Loading Plaid..."
            : !linkToken
              ? "Plaid Unavailable"
              : "Connect Bank →"}
      </button>

      {!linkToken && !loading && (
        <button
          type="button"
          onClick={() => void getLinkToken()}
          className="ml-3 text-sm font-semibold text-[#174A82] underline"
        >
          Retry
        </button>
      )}

      {message && (
        <p className="text-sm text-[#475569]" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
