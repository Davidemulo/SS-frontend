"use client";
import { useEffect, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { portfolioApi, ratingsApi, type Invoice } from "@/lib/api";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { RatingModal } from "@/components/invoices/Rating";

export default function InvestorDashboardPage() {
  const { address } = useStellarWallet();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<Invoice | null>(null);

  const { data: holdings } = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => portfolioApi.holdings(address!),
    enabled: !!address,
  });
  const settled = holdings?.filter((h) => h.invoice.status === "settled") ?? [];
  const ratings = useQueries({
    queries: settled.map((h) => ({
      queryKey: ["ratings", h.invoice.id, address],
      queryFn: () => ratingsApi.summary(h.invoice.id, address!),
      enabled: !!address,
    })),
  });

  const unrated = settled.find(
    (h, i) => ratings[i]?.isSuccess && ratings[i].data?.wallet_rating == null && !dismissed.includes(h.invoice.id)
  );
  useEffect(() => {
    if (!prompt && unrated) setPrompt(unrated.invoice);
  }, [prompt, unrated]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Portfolio</h1>
      {prompt && address && (
        <RatingModal
          key={prompt.id}
          invoice={prompt}
          wallet={address}
          open
          onClose={() => {
            setDismissed((d) => [...d, prompt.id]);
            setPrompt(null);
          }}
        />
      )}
    </main>
  );
}