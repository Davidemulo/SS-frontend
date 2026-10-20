"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletActivityFeed } from "@/components/dashboard/WalletActivityFeed";
import { KycTierBadge, KycTierPanel } from "@/components/investor";
import { useAuth } from "@/hooks/useAuth";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useKycTier } from "@/hooks/useKycTier";
import { truncateAddress } from "@/lib/stellar";

type ProfileTab = "overview" | "activity";

export function UserProfile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const { address: authAddress } = useAuth();
  const { address: walletAddress, network } = useStellarWallet();

  const address = authAddress ?? walletAddress ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Wallet</p>
              <p className="font-mono text-lg font-semibold" data-testid="profile-address">
                {address ? truncateAddress(address) : "Not connected"}
              </p>
              {network && (
                <p className="text-xs text-muted-foreground capitalize">{network}</p>
              )}
            </div>
            <ProfileKycTierBadge />
          </div>
        </CardContent>
      </Card>

      <KycTierPanel />

      <div className="flex gap-4 border-b">
        <button
          type="button"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("overview")}
          data-testid="profile-overview-tab"
        >
          Overview
        </button>
        <button
          type="button"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "activity"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("activity")}
          data-testid="profile-activity-tab"
        >
          Activity
        </button>
      </div>

      {activeTab === "overview" ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Your wallet activity, holdings, and dividends are tracked on-chain. Open the
            Activity tab to see your full history.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Activity</h2>
          <WalletActivityFeed address={address} />
        </div>
      )}
    </div>
  );
}

/**
 * KYC tier badge for the profile header (#475).
 *
 * Kept local to `UserProfile` because it only exists to sit beside the wallet
 * address; the full tier panel below owns the limits and upgrade prompt.
 */
function ProfileKycTierBadge() {
  const { usage, isLoading, isConnected } = useKycTier();

  if (!isConnected) return null;
  if (isLoading || !usage) {
    return <Skeleton className="h-6 w-24" data-testid="profile-kyc-tier-loading" />;
  }

  return <KycTierBadge tier={usage.tier} />;
}
