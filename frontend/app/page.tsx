import Link from "next/link";

import AppHeader from "@/components/layout/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import AIInsight from "@/components/dashboard/AIInsight";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SavingsPreview from "@/components/dashboard/SavingsPreview";
import PersonalizedOffers from "@/components/dashboard/PersonalizedOffers";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        <AppHeader />

        {/* 1. TOTAL BALANCE */}
        <section className="mb-6 mt-4">
          <BalanceCard />
        </section>

        {/* 2. SAVINGS AND CONNECT BANK */}
        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <SavingsPreview />

          <Card className="flex flex-col justify-center">
            <h2 className="text-lg font-bold text-primary">
              Connect your bank
            </h2>

            <p className="mt-1 text-sm text-muted">
              Sync your balances and transactions.
            </p>

            <Link
              href="/connect-bank"
              className={buttonClass({
                size: "lg",
                className: "mt-5 w-fit",
              })}
            >
              Connect Bank
            </Link>
          </Card>
        </section>

        {/* 3. SPENDING AND FINANCIAL INSIGHTS */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <SpendingOverview />
            <RecentTransactions />
          </div>

          <div className="space-y-6">
            <AIInsight />
            <PersonalizedOffers />
          </div>
        </section>
      </div>
    </main>
  );
}
