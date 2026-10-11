
import Link from "next/link";

import AppHeader from "@/components/layout/AppHeader";

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

        {/* Connect bank action */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DCE6F1] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-[#102F55]">
              Manage your bank connections
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Connect a bank to sync balances, transactions,
              and personalized insights.
            </p>
          </div>

          <Link
            href="/connect-bank"
            className="inline-flex items-center justify-center rounded-xl bg-[#174A82] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10365F]"
          >
            Connect Bank →
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <BalanceCard />
            <SpendingOverview />
          </div>

          <div className="space-y-6">
            <AIInsight />
            <RecentTransactions />
            <SavingsPreview />
            <PersonalizedOffers />
          </div>
        </div>
      </div>
    </main>
  );
}
