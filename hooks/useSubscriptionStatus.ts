"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSubscriptionStatus, type SubscriptionStatus } from "@/lib/api";

export const subscriptionStatusQueryKey = (keyId: string, walletAddress: string) =>
  ["subscription-status", keyId, walletAddress] as const;

/**
 * Fetches subscription status for a wallet against a specific key.
 * Used to determine if user has minimum key balance for gated content access.
 */
export function useSubscriptionStatus(
  keyId: string,
  walletAddress?: string | null,
  token?: string | null
) {
  return useQuery<SubscriptionStatus>({
    queryKey: subscriptionStatusQueryKey(keyId, walletAddress ?? ""),
    queryFn: () =>
      fetchSubscriptionStatus(keyId, walletAddress ?? "", token ?? undefined),
    enabled: Boolean(walletAddress && keyId),
  });
}
