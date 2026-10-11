
import AppHeader from "@/components/layout/AppHeader";

import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import AIInsight from "@/components/dashboard/AIInsight";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SavingsPreview from "@/components/dashboard/SavingsPreview";
import PersonalizedOffers from "@/components/dashboard/PersonalizedOffers";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        <AppHeader />


<div className="mb-6 mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[#DCE6F1] bg-white p-5 shadow-sm">
  <div>
    <h2 className="font-bold text-[#102F55]">
      Connect your bank
    </h2>
    <p className="mt-1 text-sm text-[#64748B]">
      Securely link your accounts to unlock your financial dashboard.
    </p>
  </div>

  <Link
    href="/connect-bank"
    className="shrink-0 rounded-xl bg-[#174A82] px-5 py-3 text-sm font-semibold text-white hover:bg-[#10365F]"
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
