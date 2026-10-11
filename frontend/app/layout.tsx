import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Outfit } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import Toaster from "@/components/ui/Toaster";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Headings and headline numbers. Body text stays in Geist.
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Money Tracker",
  description:
    "Track your balances, budgets and savings goals, and find student offers that match your spending.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${outfit.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
