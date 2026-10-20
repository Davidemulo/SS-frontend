"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchKycTierStatus, type KycTierStatus } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import {
  calculateKycTierUsage,
  isKycUpgradeRecommended,
  nextKycTier,
  type KycTier,
  type KycTierUsage,
} from "@/lib/kycTier";

/**
 * Reads the connected wallet's KYC tier and limits from the on-chain
 * `kyc_tier` contract (via the indexed API) and derives the used/remaining
 * figures the profile UI renders (#475).
 */

export const KYC_TIER_QUERY_KEY = ["kyc", "tier"] as const;

export interface KycTierView {
  status: KycTierStatus | null;
  usage: KycTierUsage | null;
  /** True once cumulative usage crosses the 80% threshold. */
  upgradeRecommended: boolean;
  /** The next tier up, when one exists. */
  upgradeTarget: KycTier | null;
  isLoading: boolean;
  isError: boolean;
  isConnected: boolean;
  refetch: () => void;
}

export function useKycTier(options: { enabled?: boolean } = {}): KycTierView {
  const { address, isConnected } = useWallet();
  const { enabled = true } = options;

  const query = useQuery<KycTierStatus>({
    // Keyed by address: reconnecting a different wallet fetches that wallet's
    // tier rather than serving the previous address's cached status.
    queryKey: [...KYC_TIER_QUERY_KEY, address],
    queryFn: () => fetchKycTierStatus(address as string),
    enabled: enabled && isConnected && Boolean(address),
    staleTime: 30 * 1000,
  });

  const usage = useMemo(() => {
    if (!query.data) return null;
    return calculateKycTierUsage({
      tier: query.data.tier,
      cumulativeInvested: query.data.cumulative_invested,
      largestCommitment: query.data.largest_commitment,
      limits: {
        cumulative: query.data.cumulative_limit,
        perInvoice: query.data.per_invoice_limit,
      },
    });
  }, [query.data]);

  return {
    status: query.data ?? null,
    usage,
    upgradeRecommended: usage ? isKycUpgradeRecommended(usage) : false,
    upgradeTarget: query.data ? nextKycTier(query.data.tier) : null,
    isLoading: query.isLoading,
    isError: query.isError,
    isConnected,
    refetch: () => {
      void query.refetch();
    },
  };
}
