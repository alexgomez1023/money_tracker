"use client";

import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Input from "@/components/ui/Input";
import { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import DiscoveredOffers from "@/components/dashboard/DiscoveredOffers";
import { getSavedDealIds, saveSavedDealIds } from "@/lib/deal-storage";
import { showToast } from "@/lib/toast";

type Offer = {
  id: string;
  name: string;
  offer: string;
  description: string;
  category: string;
};

const categoryColors = ["#0076A8", "#24826B", "#D22E3A", "#7554A3"];

// How many offers one page shows.
const PAGE_SIZE = 12;

export default function DealsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [savedDealIds, setSavedDealIds] = useState<string[]>([]);

  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [page, setPage] = useState(1);

  // The top of the offer list, scrolled back into view when the page changes.
  const listRef = useRef<HTMLDivElement>(null);

  const [deals, setDeals] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Raised by the Retry button to load the offers again.
  const [attempt, setAttempt] = useState(0);

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
  }, [attempt]);

  // Create filters from the offer categories.
  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(deals.map((deal) => deal.category)))];
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
        selectedCategory === "All" || deal.category === selectedCategory;

      const matchesSaved = !showSavedOnly || savedDealIds.includes(deal.id);

      return matchesSearch && matchesCategory && matchesSaved;
    });
  }, [deals, search, selectedCategory, savedDealIds, showSavedOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / PAGE_SIZE));

  // Removing a saved offer can leave fewer pages than the one being viewed.
  const currentPage = Math.min(page, totalPages);

  const pageDeals = filteredDeals.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function goToPage(nextPage: number) {
    setPage(nextPage);

    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Saved offers are kept in this browser, so they are still there after a reload.
  useEffect(() => {
    function loadSaved() {
      setSavedDealIds(getSavedDealIds());
    }

    loadSaved();
  }, []);

  function toggleSaved(dealId: string) {
    const updated = savedDealIds.includes(dealId)
      ? savedDealIds.filter((id) => id !== dealId)
      : [...savedDealIds, dealId];

    setSavedDealIds(updated);

    saveSavedDealIds(updated);

    showToast(updated.includes(dealId) ? "Offer saved." : "Offer removed.");
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory("All");
    setShowSavedOnly(false);
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        {/* Page Header */}
        <header className="mb-8">
          <p className="text-sm text-muted">Smart Savings</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
            Deals & Offers
          </h1>

          <p className="mt-2 text-sm text-muted">
            Explore merchant offers, compare potential savings, and bookmark
            your favorites.
          </p>
        </header>

        <DiscoveredOffers />
        {/* Search and Filters */}
        <Card>
          <label
            htmlFor="deal-search"
            className="mb-2 block text-sm font-semibold text-primary"
          >
            Search Deals
          </label>

          <Input
            id="deal-search"
            type="search"
            placeholder="Search merchants or offers..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          {/* Category Filters */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = selectedCategory === category;

              return (
                <Chip
                  key={category}
                  active={active}
                  onClick={() => {
                    setSelectedCategory(category);
                    setPage(1);
                  }}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Chip>
              );
            })}
          </div>
        </Card>

        {/* All / Saved Tabs */}
        <div
          ref={listRef}
          className="mt-8 flex scroll-mt-4 items-center justify-between gap-3"
        >
          <div className="flex gap-2">
            <Button
              variant={showSavedOnly ? "soft" : "primary"}
              onClick={() => {
                setShowSavedOnly(false);
                setPage(1);
              }}
              aria-pressed={!showSavedOnly}
            >
              All Deals
            </Button>

            <Button
              variant={showSavedOnly ? "primary" : "soft"}
              onClick={() => {
                setShowSavedOnly(true);
                setPage(1);
              }}
              aria-pressed={showSavedOnly}
            >
              Saved ({savedDealIds.length})
            </Button>
          </div>

          <p className="text-xs text-muted">{filteredDeals.length} offers</p>
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
            <div className="py-10 text-center">
              <p className="text-sm text-muted">{error}</p>

              <Button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setAttempt(attempt + 1);
                }}
                variant="secondary"
                size="sm"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </Card>
        ) : filteredDeals.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {pageDeals.map((deal) => {
              const isSaved = savedDealIds.includes(deal.id);

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
                    className="mt-5 font-display text-2xl font-bold tracking-tight"
                    style={{ color }}
                  >
                    {deal.offer}
                  </p>

                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted">
                    {deal.description}
                  </p>

                  <div className="mt-5 border-t border-border-custom pt-4">
                    <Button
                      variant={isSaved ? "primary" : "secondary"}
                      size="lg"
                      fullWidth
                      onClick={() => toggleSaved(deal.id)}
                      aria-pressed={isSaved}
                    >
                      {isSaved ? "Saved - Remove Offer" : "Save Offer"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="mt-5">
            <div className="py-10 text-center">
              <h3 className="font-bold text-primary">No offers found</h3>

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

        {/* Pages */}
        {!loading && !error && totalPages > 1 && (
          <nav
            aria-label="Offer pages"
            className="mt-6 flex items-center justify-between gap-3"
          >
            <Button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
            >
              Previous
            </Button>

            <p className="text-xs text-muted">
              Page {currentPage} of {totalPages}
            </p>

            <Button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
            >
              Next
            </Button>
          </nav>
        )}

        {/* Source Notice */}
        <p className="mt-8 text-center text-xs leading-relaxed text-muted">
          Student offers sourced from studentoffers.co. Availability and terms
          are set by each merchant.
        </p>
      </div>
    </main>
  );
}
