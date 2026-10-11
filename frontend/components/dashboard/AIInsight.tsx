"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function AIInsight() {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsight() {
      try {
        const response = await fetch("/api/insights");

        if (!response.ok) {
          throw new Error("Failed to load insights");
        }

        const data = await response.json();
        setInsight(data.insight);
      } catch {
        setInsight(
          "Connect your bank to see personalized spending insights."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInsight();
  }, []);

  return (
    <section className="rounded-2xl border border-[#D6E9F5] bg-surface-blue p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-secondary">
          <Icon name="sparkles" size={21} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Smart Insights
          </p>
          <h2 className="text-base font-bold text-primary">
            Your AI Financial Assistant
          </h2>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-foreground">
        {loading
          ? "Analyzing your recent spending..."
          : insight}
      </p>

      <Link
        href="/assistant"
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
      >
        Explore recommendations
        <Icon name="arrowRight" size={16} />
      </Link>
    </section>
  );
}