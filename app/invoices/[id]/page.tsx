"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { invoicesApi, portfolioApi } from "@/lib/api";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlacklistBanner, useIssuerBlacklist } from "@/components/invoices/BlacklistBanner";
import { ExtensionProposalSection } from "@/components/invoices/ExtensionProposalSection";
import { AggregateRating } from "@/components/invoices/Rating";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address } = useStellarWallet();
  const { data: invoice, isLoading } = useQuery({ queryKey: ["invoice", id], queryFn: () => invoicesApi.get(id) });
  const { data: holdings } = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => portfolioApi.holdings(address!),
    enabled: !!address,
  });
  const { data: blacklist } = useIssuerBlacklist(invoice?.issuer_wallet);

  if (isLoading) return <main className="p-8">Loading…</main>;
  if (!invoice) return <main className="p-8">Invoice not found.</main>;

  const isHolder = !!holdings?.some((h) => h.invoice.id === invoice.id && h.amount > 0);
  const blacklisted = !!blacklist?.is_blacklisted;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <BlacklistBanner wallet={invoice.issuer_wallet} />
      <h1 className="text-3xl font-bold">{invoice.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Maturity status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <p>Maturity: {format(new Date(invoice.maturity_date), "PPP")}</p>
          <p className="capitalize">Status: {invoice.status}</p>
          <p>Amount: {invoice.amount.toLocaleString()}</p>
          <p>Yield: {invoice.yield}%</p>
        </CardContent>
      </Card>

      <ExtensionProposalSection invoice={invoice} wallet={address} isHolder={isHolder} />

      <span title={blacklisted ? "IssuerBlacklisted" : undefined} className="inline-block">
        <Button id="invest-button" disabled={blacklisted || invoice.status !== "open"}>
          Invest
        </Button>
      </span>

      <AggregateRating invoice={invoice} wallet={address} />
    </main>
  );
}
