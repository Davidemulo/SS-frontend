"use client";

import { KycTierUpgrade } from "@/components/investor/KycTierUpgrade";

export default function KycUpgradePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Upgrade your KYC tier</h1>
      <p className="mt-2 text-muted-foreground">
        Raise your investment limits by completing the next level of identity
        verification.
      </p>
      <div className="mt-6">
        <KycTierUpgrade />
      </div>
    </main>
  );
}
