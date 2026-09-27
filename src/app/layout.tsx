import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CapitalNest — Personal Finance Portfolio",
  description: "Your complete personal finance and investment portfolio management system. Track expenses, income, investments, loans, budgets, and goals in one place.",
  keywords: "personal finance, expense tracker, investment portfolio, budget manager, net worth",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
