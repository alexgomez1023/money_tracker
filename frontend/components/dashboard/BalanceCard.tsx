
"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <section className="rounded-3xl bg-primary p-6 text-white shadow-md md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-100">
          <Icon name="wallet" size={18} />
          <span className="text-sm font-medium">
            Total Balance
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowBalance(!showBalance)}
          aria-label={
            showBalance ? "Hide balance" : "Show balance"
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-100 hover:bg-white/10"
        >
          <Icon name={showBalance ? "eye" : "eyeOff"} />
        </button>
      </div>

      <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
        {showBalance ? "$5,240.00" : "••••••"}
      </h2>

      <p className="mt-2 text-xs text-blue-100">
        Combined account balance
      </p>

      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
        <div>
          <p className="text-xs text-blue-100">
            Monthly Income
          </p>
          <p className="mt-2 text-lg font-semibold">
            {showBalance ? "+$2,450.00" : "••••"}
          </p>
        </div>

        <div>
          <p className="text-xs text-blue-100">
            Monthly Spending
          </p>
          <p className="mt-2 text-lg font-semibold">
            {showBalance ? "-$625.00" : "••••"}
          </p>
        </div>
      </div>
    </section>
  );
}
