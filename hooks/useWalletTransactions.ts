"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchWalletTransactions, type PlatformTransactionType } from "@/lib/api";

export const walletTransactionsQueryKey = (
  address: string,
  type: PlatformTransactionType | null
) => ["wallet-transactions", address, type ?? "all"] as const;

/** Cursor-paginated platform transactions for a wallet (#294). */
export function useWalletTransactions(
  address: string | null | undefined,
  type: PlatformTransactionType | null,
  token?: string | null
) {
  return useInfiniteQuery({
    queryKey: walletTransactionsQueryKey(address ?? "", type),
    queryFn: ({ pageParam }) =>
      fetchWalletTransactions(
        address ?? "",
        { cursor: pageParam as string | undefined, type: type ?? undefined },
        token ?? undefined
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
    enabled: Boolean(address),
  });
}
