"use client";

import { TransactionHistory } from "@/components/transactions/TransactionHistory";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function TransactionsPage() {
  usePageTitle("Transaction History");

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground mt-1">
          Every transaction your wallet made on the platform, with a link to verify it on the Stellar network.
        </p>
      </div>
      <TransactionHistory />
    </main>
  );
}
