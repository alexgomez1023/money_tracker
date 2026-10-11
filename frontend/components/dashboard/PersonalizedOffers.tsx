
"use client";

import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import Link from "next/link";

import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { authFetch, useSession } from "@/lib/auth";

type Offer = {
  id: string;
  name: string;
  offer: string;
  description: string;
  category: string;
  reason: string;
  matchType: "merchant" | "category";
};

export default function PersonalizedOffers() {
  const session = useSession();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Raised by the Retry button to load the offers again.
  const [attempt, setAttempt] = useState(0);

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
        const response = await authFetch("/api/offers/personalized", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load personalized offers");
        }

        const data = await response.json();

        if (!cancelled) {
          setOffers(data.offers ?? []);
        }
      } catch (err) {
        console.error("Personalized offers error:", err);

        if (!cancelled) {
          setError("Unable to load personalized offers.");
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
  }, [session?.user.id, attempt]);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Smart Savings
          </p>

          <h2 className="mt-1 text-lg font-bold text-primary">
            Personalized Offers
          </h2>
        </div>

        <Link
          href="/deals"
          className="text-sm font-semibold text-secondary hover:underline"
        >
          View all
        </Link>
      </div>

      {!session ? (
        <p className="mt-5 text-sm text-muted">
          Sign in to discover discounts based on your spending.
        </p>
      ) : loading ? (
        <div
          className="mt-5 space-y-4"
          aria-label="Finding offers for you"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border-custom p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 !rounded-full" />
              </div>

              <Skeleton className="mt-3 h-6 w-44" />
              <Skeleton className="mt-3 h-4 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            {error}
          </p>

          <Button
            type="button"
            onClick={() => setAttempt(attempt + 1)}
            variant="secondary"
            size="sm"
          >
            Retry
          </Button>
        </div>
      ) : offers.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          No personalized offers yet. Connect your bank and
          make transactions to discover relevant discounts.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {offers.slice(0, 3).map((offer) => (
            <div
              key={offer.id}
              className="rounded-xl border border-border-custom p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-primary">
                  {offer.name}
                </h3>

                <span className="rounded-full bg-surface-blue px-2 py-1 text-xs font-semibold text-primary">
                  {offer.matchType === "merchant"
                    ? "Your merchant"
                    : "For you"}
                </span>
              </div>

              <p className="mt-2 text-lg font-bold text-secondary">
                {offer.offer}
              </p>

              <p className="mt-2 text-sm text-muted">
                {offer.reason}
              </p>

              {offer.description && (
                <p className="mt-2 text-xs text-muted">
                  {offer.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
