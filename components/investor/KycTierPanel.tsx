"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useKycTier } from "@/hooks/useKycTier";
import { KYC_TIER_META } from "@/lib/kycTier";
import { cn } from "@/lib/utils";
import { KycTierBadge } from "./KycTierBadge";
import { KycTierLimits } from "./KycTierLimits";
import { KycUpgradePrompt } from "./KycUpgradePrompt";

interface KycTierPanelProps {
  className?: string;
}

/**
 * Connected KYC tier panel for the investor profile (#475).
 *
 * Owns the loading / disconnected / error states so the profile page just
 * drops it in. The badge, limit bars, and upgrade prompt all read from the
 * single `useKycTier` view, so they can never disagree.
 */
export function KycTierPanel({ className }: KycTierPanelProps) {
  const { usage, isLoading, isError, isConnected, upgradeTarget, refetch } =
    useKycTier();

  return (
    <Card className={cn(className)} data-testid="kyc-tier-panel">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">KYC tier &amp; limits</CardTitle>
          {usage && <KycTierBadge tier={usage.tier} size="sm" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <p className="text-sm text-muted-foreground" data-testid="kyc-tier-connect">
            Connect your wallet to see your KYC tier and investment limits.
          </p>
        ) : isLoading ? (
          <div className="space-y-3" data-testid="kyc-tier-loading">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : isError ? (
          <div className="space-y-3" data-testid="kyc-tier-error">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load your KYC tier.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : usage ? (
          <>
            <KycUpgradePrompt usage={usage} target={upgradeTarget} />
            <KycTierLimits usage={usage} />
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/kyc/status"
                className="text-xs text-muted-foreground underline underline-offset-4"
              >
                View KYC status
              </Link>
              {upgradeTarget ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  data-testid="kyc-tier-upgrade-link"
                >
                  <Link href="/kyc/upgrade">
                    Upgrade to {KYC_TIER_META[upgradeTarget].label}
                  </Link>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  You&apos;re at the highest tier
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="kyc-tier-unavailable">
            KYC tier unavailable.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
