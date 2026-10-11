import ConnectBankButton from "@/components/plaid/ConnectBankButton";
import BankAccounts from "@/components/plaid/BankAccounts";
import BankTransactions from "@/components/plaid/BankTransactions";
import AccountButton from "@/components/layout/AccountButton";
import Card from "@/components/ui/Card";

export default function ConnectBankPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8">
        {/* Page Header */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              Banking
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
              Connect your bank
            </h1>

            <p className="mt-2 text-sm text-muted">
              Link an account to sync balances and transactions.
            </p>
          </div>

          <AccountButton />
        </header>

        {/* Connect Bank */}
        <Card>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-lg font-bold text-primary">
                Link a bank account
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted">
                Your balances, spending and budgets update from the accounts
                you connect here.
              </p>

              <p className="mt-3 text-xs text-muted">
                Secure bank connectivity powered by Plaid.
              </p>
            </div>

            <div className="shrink-0">
              <ConnectBankButton />
            </div>
          </div>
        </Card>

        <BankAccounts />

        <BankTransactions />
      </div>
    </main>
  );
}
