
"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

type Offer = {
  id: string;
  name: string;
  offer: string;
  description: string;
  category: string;
};

const categoryColors = [
  "#0076A8",
  "#24826B",
  "#D22E3A",
  "#7554A3",
];

export default function DealsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [savedDealIds, setSavedDealIds] = useState<string[]>(
    []
  );

  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [deals, setDeals] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load offers from our backend.
  useEffect(() => {
    async function loadOffers() {
      try {
        const response = await fetch("/api/offers", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load offers");
        }

        const data = await response.json();
        setDeals(data.offers ?? []);
      } catch {
        setError("Unable to load offers. Try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, []);

  // Create filters from the offer categories.
  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(deals.map((deal) => deal.category))
      ),
    ];
  }, [deals]);

  function getColor(category: string) {
    const index = Math.max(categories.indexOf(category) - 1, 0);

    return categoryColors[index % categoryColors.length];
  }

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        deal.name.toLowerCase().includes(query) ||
        deal.offer.toLowerCase().includes(query) ||
        deal.description.toLowerCase().includes(query) ||
        deal.category.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        deal.category === selectedCategory;

      const matchesSaved =
        !showSavedOnly || savedDealIds.includes(deal.id);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSaved
      );
    });
  }, [deals, search, selectedCategory, savedDealIds, showSavedOnly]);

  function toggleSaved(dealId: string) {
    setSavedDealIds((current) =>
      current.includes(dealId)
        ? current.filter((id) => id !== dealId)
        : [...current, dealId]
    );
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory("All");
    setShowSavedOnly(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">

        {/* Page Header */}
        <header className="mb-8">
          <p className="text-sm text-muted">
            Smart Savings
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
            Deals & Offers
          </h1>

          <p className="mt-2 text-sm text-muted">
            Discover offers that could help you save.
          </p>
        </header>

        {/* Featured Banner */}
        <div className="mb-6 rounded-2xl bg-primary p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
            Discover Savings
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Find savings that fit your life
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Explore merchant offers, compare potential
            savings, and bookmark your favorites.
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <label
            htmlFor="deal-search"
            className="mb-2 block text-sm font-semibold text-primary"
          >
            Search Deals
          </label>

          <input
            id="deal-search"
            type="search"
            placeholder="Search merchants or offers..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="w-full rounded-xl border border-border-custom bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />

          {/* Category Filters */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => {
              const active =
                selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border-custom bg-white text-foreground hover:border-secondary"
                  }`}
                >
                  {category.charAt(0).toUpperCase() +
                    category.slice(1)}
                </button>
              );
            })}
          </div>
        </Card>

        {/* All / Saved Tabs */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSavedOnly(false)}
              aria-pressed={!showSavedOnly}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                !showSavedOnly
                  ? "bg-primary text-white"
                  : "bg-surface-blue text-primary"
              }`}
            >
              All Deals
            </button>

            <button
              type="button"
              onClick={() => setShowSavedOnly(true)}
              aria-pressed={showSavedOnly}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                showSavedOnly
                  ? "bg-primary text-white"
                  : "bg-surface-blue text-primary"
              }`}
            >
              Saved ({savedDealIds.length})
            </button>
          </div>

          <p className="text-xs text-muted">
            {filteredDeals.length} offers
          </p>
        </div>

        {/* Deals Grid */}
        {loading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Card key={index}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-3 h-5 w-36" />
                  </div>

                  <Skeleton className="h-11 w-11 !rounded-xl" />
                </div>

                <Skeleton className="mt-5 h-8 w-44" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-5 h-11 w-full !rounded-xl" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="mt-5">
            <p className="py-10 text-center text-sm text-muted">
              {error}
            </p>
          </Card>
        ) : filteredDeals.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {filteredDeals.map((deal) => {
              const isSaved =
                savedDealIds.includes(deal.id);

              const color = getColor(deal.category);

              return (
                <Card key={deal.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {deal.category}
                      </p>

                      <h3 className="mt-2 text-base font-bold text-primary">
                        {deal.name}
                      </h3>
                    </div>

                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
                      style={{
                        backgroundColor: color,
                      }}
                      aria-hidden="true"
                    >
                      {deal.category.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <p
                    className="mt-5 text-2xl font-bold"
                    style={{ color }}
                  >
                    {deal.offer}
                  </p>

                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted">
                    {deal.description}
                  </p>

                  <div className="mt-5 border-t border-border-custom pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        toggleSaved(deal.id)
                      }
                      aria-pressed={isSaved}
                      className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        isSaved
                          ? "border-primary bg-primary text-white"
                          : "border-border-custom bg-white text-primary hover:bg-surface-blue"
                      }`}
                    >
                      {isSaved
                        ? "Saved — Remove Offer"
                        : "Save Offer"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="mt-5">
            <div className="py-10 text-center">
              <h3 className="font-bold text-primary">
                No offers found
              </h3>

              <p className="mt-2 text-sm text-muted">
                Try another search, category, or view.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-secondary hover:underline"
              >
                Clear Filters
              </button>
            </div>
          </Card>
        )}

        {/* Source Notice */}
        <p className="mt-8 text-center text-xs leading-relaxed text-muted">
          Student offers sourced from studentoffers.co.
          Availability and terms are set by each merchant.
        </p>
      </div>
    </main>
  );
}
