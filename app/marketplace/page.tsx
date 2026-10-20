"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { poolsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function MarketplacePage() {
  const [tab, setTab] = useState<"invoices" | "pools">("invoices");
  const { data: pools } = useQuery({ queryKey: ["pools"], queryFn: poolsApi.list, enabled: tab === "pools" });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Marketplace</h1>
      <div role="tablist" className="flex gap-2">
        {(["invoices", "pools"] as const).map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("rounded-full border px-4 py-1.5 text-sm capitalize", tab === t && "bg-black text-white")}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "pools" && (
        <ul id="pool-list" className="grid gap-4 md:grid-cols-2">
          {pools?.map((p) => (
            <li key={p.id}>
              <Link href={`/pools/${p.id}`} className="block rounded-lg border p-4 transition hover:shadow-md">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  TVL {p.tvl.toLocaleString()} · {p.weighted_yield.toFixed(2)}% · {p.invoice_count} invoices
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
