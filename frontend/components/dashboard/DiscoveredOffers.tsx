
"use client";

import { useEffect, useState } from "react";

import Card from "@/components/ui/Card";
import { authFetch, useSession } from "@/lib/auth";

type DiscoveredOffer = {
  name: string;
  offer: string;
  description: string;
  url: string;
  eligibility: string;
  reason: string;
};

export default function DiscoveredOffers() {
  const session = useSession();

  const [offers, setOffers] = useState<DiscoveredOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!session) {
      setOffers([]);
      setLoading(false);
      return;
    }

    async function loadOffers() {
      setLoading(true);
      setError("");

      try {
        const response = await authFetch("/api/offers/discover", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to discover offers");
        }

        const data = await response.json();

        if (!cancelled) {
          setOffers(data.offers ?? []);
        }
      } catch (err) {
        console.error("Discovered offers error:", err);

        if (!cancelled) {
          setError("Unable to discover discounts right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOffers();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  return (
    <section className="mb-8">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Smart Savings
        </p>

        <h2 className="mt-1 text-xl font-bold text-primary">
          AI-Discovered Student Discounts
        </h2>

        <p className="mt-2 text-sm text-muted">
          Potential student discounts discovered using Google Search,
          based on merchants in your transaction history.
        </p>
      </div>

      {!session ? (
        <Card>
          <p className="text-sm text-muted">
            Sign in to discover discounts based on your spending.
          </p>
        </Card>
      ) : loading ? (
        <Card>
          <p className="text-sm text-muted">
            Searching for student discounts...
          </p>
        </Card>
      ) : error ? (
        <Card>
          <p className="text-sm text-muted">{error}</p>
        </Card>
      ) : offers.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            No discounts discovered yet. Connect your bank to get
            personalized recommendations.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer, index) => (
            <Card key={`${offer.name}-${index}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-primary">
                  {offer.name}
                </h3>

                <span className="rounded-full bg-surface-blue px-2 py-1 text-xs font-semibold text-primary">
                  AI Suggested
                </span>
              </div>

              <p className="mt-4 text-lg font-bold text-secondary">
                {offer.offer}
              </p>

              <p className="mt-2 text-sm text-muted">
                {offer.description}
              </p>

              <p className="mt-3 text-sm text-muted">
                {offer.reason}
              </p>

              {offer.eligibility && (
                <p className="mt-3 text-xs text-muted">
                  <strong>Eligibility:</strong> {offer.eligibility}
                </p>
              )}

              {offer.url && (
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-block rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  View Discount
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        AI-generated suggestions. Check the merchant's official
        website for current pricing, eligibility, and terms.
      </p>
    </section>
  );
}
