"use client";

import Button from "@/components/ui/Button";
import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { authFetch } from "@/lib/auth";
import { clearBankData } from "@/lib/bank-data";
import { showToast } from "@/lib/toast";

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
      setMessage("Unable to start the bank connection. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getLinkToken();
  }, [getLinkToken]);

  const onSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) {
      showToast(
        "The bank connection did not finish. Please try again.",
        "error",
      );
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
      setMessage("");

      showToast("Bank connected.");

      // Refresh bank-related components that listen for this event.
      window.dispatchEvent(new Event("bank-connected"));
    } catch (error) {
      console.error("Plaid exchange error:", error);
      setMessage("");

      showToast("Bank connection failed. Please try again.", "error");
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={() => open()}
        disabled={!ready || loading || connected}
        size="lg"
      >
        {connected
          ? "Bank Connected"
          : loading || (!ready && linkToken)
            ? "Loading..."
            : !linkToken
              ? "Unavailable"
              : "Connect Bank"}
      </Button>

      {!linkToken && !loading && (
        <button
          type="button"
          onClick={() => void getLinkToken()}
          className="ml-3 text-sm font-semibold text-secondary hover:underline"
        >
          Retry
        </button>
      )}

      {message && (
        <p className="text-sm text-muted" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
