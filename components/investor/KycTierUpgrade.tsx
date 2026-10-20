"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useKycTier } from "@/hooks/useKycTier";
import {
  KYC_TIER_META,
  KYC_TIER_ORDER,
  tierRank,
  type KycTier,
} from "@/lib/kycTier";
import { KycTierBadge } from "./KycTierBadge";
import { KycTierPanel } from "./KycTierPanel";

function limitLabel(limit: number | null): string {
  return limit === null ? "No limit" : `${limit.toLocaleString()} XLM`;
}

/**
 * KYC tier upgrade flow (#475).
 *
 * Shows the investor's current tier and limits, then the tiers above them with
 * the requirements and caps for each. The primary action hands off to the
 * document-submission onboarding route.
 */
export function KycTierUpgrade() {
  const { usage } = useKycTier();
  const currentTier: KycTier | null = usage?.tier ?? null;

  const availableTiers = KYC_TIER_ORDER.filter(
    (tier) => currentTier === null || tierRank(tier) > tierRank(currentTier),
  );

  return (
    <div className="space-y-8">
      <KycTierPanel />

      <section aria-labelledby="available-upgrades-heading">
        <h2 id="available-upgrades-heading" className="text-lg font-semibold">
          Available upgrades
        </h2>
        {availableTiers.length === 0 ? (
          <p
            className="mt-3 text-sm text-muted-foreground"
            data-testid="kyc-upgrade-none"
          >
            You&apos;re already on the highest KYC tier — there is nothing left
            to upgrade.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {availableTiers.map((tier) => {
              const meta = KYC_TIER_META[tier];
              return (
                <Card key={tier} data-testid={`kyc-upgrade-tier-${tier}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{meta.label}</CardTitle>
                      <KycTierBadge tier={tier} size="sm" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">{meta.description}</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        Per-invoice limit: {limitLabel(meta.limits.perInvoice)}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        Cumulative limit: {limitLabel(meta.limits.cumulative)}
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Requires: {meta.requirements}
                    </p>
                    <Button asChild className="w-full">
                      <Link
                        href="/kyc/onboarding"
                        data-testid={`kyc-upgrade-start-${tier}`}
                      >
                        Start {meta.label} upgrade
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
