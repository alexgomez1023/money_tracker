
import AppHeader from "@/components/layout/AppHeader";

import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import AIInsight from "@/components/dashboard/AIInsight";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SavingsPreview from "@/components/dashboard/SavingsPreview";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        <AppHeader />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <BalanceCard />
            <SpendingOverview />
          </div>

          <div className="space-y-6">
            <AIInsight />
            <RecentTransactions />
            <SavingsPreview />
          </div>
        </div>
      </div>
    </main>
  );
}
