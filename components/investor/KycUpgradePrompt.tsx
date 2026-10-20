"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isKycUpgradeRecommended,
  KYC_TIER_META,
  type KycTier,
  type KycTierUsage,
} from "@/lib/kycTier";

interface KycUpgradePromptProps {
  usage: KycTierUsage;
  target: KycTier | null;
  className?: string;
}

/**
 * Contextual upgrade banner (#475).
 *
 * Appears once cumulative usage reaches the 80% threshold, and only for tiers
 * that actually have somewhere to upgrade to. Links into the KYC upgrade flow.
 */
export function KycUpgradePrompt({
  usage,
  target,
  className,
}: KycUpgradePromptProps) {
  if (!isKycUpgradeRecommended(usage) || !target) return null;

  const percent = Math.round(usage.cumulativePercent);
  const targetLabel = KYC_TIER_META[target].label;

  return (
    <Alert
      variant="warning"
      data-testid="kyc-upgrade-prompt"
      className={cn("items-center", className)}
    >
      <AlertTriangle aria-hidden="true" />
      <AlertTitle>Approaching your {KYC_TIER_META[usage.tier].label} limit</AlertTitle>
      <AlertDescription>
        <p>
          You have used {percent}% of your cumulative investment limit. Upgrade
          to {targetLabel} to raise or remove your caps.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-2">
          <Link href="/kyc/upgrade" data-testid="kyc-upgrade-cta">
            Upgrade to {targetLabel}
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
