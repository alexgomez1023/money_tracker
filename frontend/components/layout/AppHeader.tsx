import AccountButton from "@/components/layout/AccountButton";

export default function AppHeader() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <p className="text-sm text-muted">Your financial overview</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
          Dashboard
        </h1>
      </div>

      <AccountButton />
    </header>
  );
}
