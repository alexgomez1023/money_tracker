
import ConnectBankButton from "@/components/plaid/ConnectBankButton";
import BankAccounts from "@/components/plaid/BankAccounts";
import BankTransactions from "@/components/plaid/BankTransactions";

// Test page for Plaid accounts and transactions.
export default function ConnectBankPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">
        Connect Your Bank
      </h1>

      <p className="mb-6">
        Connect a test bank using Plaid Sandbox.
      </p>

      <ConnectBankButton />

      <BankAccounts />

      <BankTransactions />
    </main>
  );
}
