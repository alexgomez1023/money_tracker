
import type { ReactNode } from "react";
import BottomNav from "@/components/layout/BottomNav";

import "./globals.css";
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
