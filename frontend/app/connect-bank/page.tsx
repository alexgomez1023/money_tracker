import Link from "next/link";

import ConnectBankButton from "@/components/plaid/ConnectBankButton";
import BankAccounts from "@/components/plaid/BankAccounts";
import BankTransactions from "@/components/plaid/BankTransactions";

export default function ConnectBankPage() {
  return (
    <main className="min-h-screen bg-[#F3F6FB] text-[#102F55]">
      {/* TOP NAVIGATION */}
      <header className="border-b border-[#E1E7EF] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102F55] text-lg font-bold text-white transition-all duration-300 group-hover:bg-[#C62035]">
              B
            </div>

            <div>
              <p className="text-sm font-bold text-[#102F55]">
                BankChecks to BankTexts
              </p>
              <p className="text-xs text-[#64748B]">
                Smart Financial Management
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-[#DCE3EC] px-5 py-2.5 text-sm font-semibold text-[#102F55] transition-all duration-200 hover:border-[#C62035] hover:bg-[#C62035] hover:text-white"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8">
        {/* NAVY HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#102F55] via-[#174A82] to-[#2466A1] p-8 text-white shadow-lg sm:p-10">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 right-24 h-56 w-56 rounded-full bg-[#C62035]/30 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5366]" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                BANKING & ACCOUNTS
              </p>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your connected finances
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Take control of your financial picture. Connect your accounts,
              monitor transactions, and make smarter decisions with all your
              banking information in one place.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white">
                Account Overview
              </span>
              <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white">
                Transaction History
              </span>
              <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white">
                Smart Insights
              </span>
            </div>
          </div>
        </section>

        {/* CONNECT BANK */}
        <section className="group mb-8 overflow-hidden rounded-2xl border border-[#DFE6EF] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C62035]/50 hover:shadow-xl">
          <div className="h-1.5 bg-gradient-to-r from-[#C62035] via-[#E54758] to-[#174A82]" />

          <div className="flex flex-col gap-6 p-7 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDEDEF] text-[#C62035] transition-all duration-300 group-hover:bg-[#C62035] group-hover:text-white">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m3 10 9-7 9 7" />
                  <path d="M4 10h16" />
                  <path d="M6 10v8" />
                  <path d="M10 10v8" />
                  <path d="M14 10v8" />
                  <path d="M18 10v8" />
                  <path d="M3 21h18" />
                </svg>
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#C62035]">
                GET STARTED
              </p>

              <h2 className="text-2xl font-bold text-[#102F55]">
                Link a bank account
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-[#64748B]">
                Bring your accounts together and keep your financial activity up
                to date. Connect through Plaid Sandbox to explore your banking
                dashboard.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs text-[#64748B]">
                <span className="text-[#C62035]">●</span>
                Powered by Plaid Sandbox
              </div>
            </div>

            {/* EXISTING WORKING PLAID BUTTON */}
            <div className="shrink-0 rounded-2xl bg-[#F3F6FB] p-5 transition-colors duration-300 group-hover:bg-[#FDEDEF]">
              <ConnectBankButton />
            </div>
          </div>
        </section>

        {/* ACCOUNTS + TRANSACTIONS */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* ACCOUNTS */}
          <section className="group min-w-0 overflow-hidden rounded-2xl border border-[#DFE6EF] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C62035]/50 hover:shadow-xl lg:col-span-2">
            <div className="h-1 bg-[#174A82] transition-colors duration-300 group-hover:bg-[#C62035]" />

            <div className="border-b border-[#EDF0F4] p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#C62035]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                  YOUR ACCOUNTS
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#102F55] transition-colors duration-300 group-hover:text-[#C62035]">
                Connected Accounts
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                Your linked financial institutions
              </p>
            </div>

            <div className="p-6">
              <BankAccounts />
            </div>
          </section>

          {/* TRANSACTIONS */}
          <section className="group min-w-0 overflow-hidden rounded-2xl border border-[#DFE6EF] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C62035]/50 hover:shadow-xl lg:col-span-3">
            <div className="h-1 bg-[#174A82] transition-colors duration-300 group-hover:bg-[#C62035]" />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF0F4] p-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#C62035]" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                    FINANCIAL ACTIVITY
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[#102F55] transition-colors duration-300 group-hover:text-[#C62035]">
                  Recent Transactions
                </h2>

                <p className="mt-2 text-sm text-[#64748B]">
                  Review your latest account activity
                </p>
              </div>

              <Link
                href="/transactions"
                className="rounded-lg border border-[#DCE3EC] px-4 py-2 text-sm font-semibold text-[#174A82] transition-all duration-200 hover:border-[#C62035] hover:bg-[#C62035] hover:text-white"
              >
                View all →
              </Link>
            </div>

            <div className="p-6">
              <BankTransactions />
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#DFE6EF] pt-6">
          <p className="text-xs text-[#94A3B8]">
            BankChecks to BankTexts · Smarter financial decisions
          </p>

          <Link
            href="/"
            className="text-sm font-semibold text-[#174A82] transition-colors hover:text-[#C62035]"
          >
            Return to Dashboard →
          </Link>
        </footer>
      </div>
    </main>
  );
}
