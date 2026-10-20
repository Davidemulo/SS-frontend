"use client";
import { use, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { poolsApi } from "@/lib/api";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address } = useStellarWallet();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const { data: pool, isLoading } = useQuery({ queryKey: ["pool", id], queryFn: () => poolsApi.get(id) });
  const amt = Number(amount) || 0;
  const m = useMutation({
    mutationFn: () => poolsApi.invest(id, { wallet: address!, amount: amt }),
    onSuccess: (r) => {
      toast({ title: "PoolInvestmentExecuted", description: `Tx ${r.tx_hash.slice(0, 10)}…` });
      setAmount("");
    },
  });

  if (isLoading) return <main className="p-8">Loading…</main>;
  if (!pool) return <main className="p-8">Pool not found.</main>;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">{pool.name}</h1>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["Total TVL", pool.tvl.toLocaleString()],
            ["Weighted avg. yield", `${pool.weighted_yield.toFixed(2)}%`],
            ["Invoices", pool.invoice_count],
          ].map(([k, v]) => (
            <Card key={k as string}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{k}</p>
                <p className="text-2xl font-semibold">{v}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <table id="pool-composition" className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Invoice</th>
                  <th>Sector</th>
                  <th>Weight</th>
                  <th>Yield</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pool.invoices.map((i) => (
                  <tr key={i.invoice_id} className="border-t">
                    <td className="py-2">{i.name}</td>
                    <td>{i.sector}</td>
                    <td>{i.weight.toFixed(2)}%</td>
                    <td>{i.yield.toFixed(2)}%</td>
                    <td className="capitalize">{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card id="pool-invest-panel">
          <CardHeader>
            <CardTitle>Invest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="pool-invest-amount">Amount</Label>
              <Input
                id="pool-invest-amount"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {amt > 0 && (
              <ul className="space-y-1 text-sm">
                {pool.invoices.map((i) => (
                  <li key={i.invoice_id} className="flex justify-between">
                    <span>{i.name}</span>
                    <span>{((amt * i.weight) / 100).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            {m.isError && <p className="text-sm text-red-600">Investment failed.</p>}
            <Button
              id="pool-invest-submit"
              className="w-full"
              disabled={!address || amt <= 0 || m.isPending}
              onClick={() => m.mutate()}
            >
              {m.isPending ? "Investing…" : address ? "Invest in pool" : "Connect wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
