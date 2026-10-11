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

        {/* 1. TOTAL BALANCE — FIRST */}
        <section className="mb-6 mt-4">
          <BalanceCard />
        </section>

        {/* 2. SAVINGS AND CONNECT BANK */}
        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <SavingsPreview />

          <div className="flex flex-col justify-center rounded-2xl border border-[#DCE6F1] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
              BANK CONNECTIONS
            </p>

            <h2 className="mt-3 text-xl font-bold text-[#102F55]">
              Connect your bank
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#64748B]">
              Securely connect your accounts to sync balances, track spending,
              and unlock personalized financial insights.
            </p>

            <Link
              href="/connect-bank"
              className="mt-6 inline-flex w-fit items-center justify-center rounded-xl bg-[#174A82] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#10365F]"
            >
              Connect Bank →
            </Link>

            <p className="mt-3 text-xs text-[#64748B]">
              Secure bank connectivity powered by Plaid.
            </p>
          </div>
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
