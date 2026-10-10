
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { transactions } from "@/lib/mock-data";

export default function RecentTransactions() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary">
          Recent Transactions
        </h2>

        <Link
          href="/transactions"
          className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:text-primary"
        >
          View all
          <Icon name="arrowRight" size={15} />
        </Link>
      </div>

      <Card className="!p-0">
        <div className="divide-y divide-border-custom">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                  <Icon
                    name={transaction.icon}
                    size={20}
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {transaction.name}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {transaction.category}
                  </p>
                </div>
              </div>

              <p
                className={`shrink-0 text-sm font-semibold ${
                  transaction.amount > 0
                    ? "text-secondary"
                    : "text-foreground"
                }`}
              >
                {transaction.amount > 0 ? "+" : "-"}$
                {Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
