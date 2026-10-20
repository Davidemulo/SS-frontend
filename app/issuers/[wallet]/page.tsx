"use client";
import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";
import { BlacklistBanner } from "@/components/invoices/BlacklistBanner";

export default function IssuerProfilePage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = use(params);
  const { data: invoices } = useQuery({
    queryKey: ["issuer-invoices", wallet],
    queryFn: () => invoicesApi.byIssuer(wallet),
  });
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <BlacklistBanner wallet={wallet} />
      <h1 className="break-all text-2xl font-bold">Issuer {wallet}</h1>
      <ul className="divide-y rounded-lg border">
        {invoices?.map((i) => (
          <li key={i.id} className="p-3 hover:bg-neutral-50">
            <Link href={`/invoices/${i.id}`}>{i.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
