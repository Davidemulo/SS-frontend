"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAlertPreferences,
  setAlertPreferences,
  type AlertPreferences,
} from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import { normalizeAlertPreferences } from "@/lib/alertPreferences";

export function alertPreferencesQueryKey(address: string | null) {
  return ["alert-preferences", address] as const;
}

/**
 * Alert preferences for the connected wallet (#531). Wallets with no saved
 * preferences read as all-enabled; saving submits `set_alert_preferences`.
 */
export function useAlertPreferences() {
  const { address, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const key = alertPreferencesQueryKey(address);

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchAlertPreferences(address as string),
    enabled: isConnected && Boolean(address),
    staleTime: 30 * 1000,
  });

  const preferences = useMemo(
    () => normalizeAlertPreferences(query.data),
    [query.data],
  );

  const save = useMutation({
    mutationFn: (next: AlertPreferences) => {
      if (!address) throw new Error("Connect a wallet to save alert preferences");
      return setAlertPreferences(address, next);
    },
    onSuccess: (_result, next) => {
      queryClient.setQueryData(key, next);
      toast.success("Alert preferences saved");
    },
    onError: () => {
      toast.error("Couldn't save alert preferences. Please try again.");
    },
  });

  return {
    preferences,
    isLoading: query.isLoading,
    isError: query.isError,
    isConnected,
    save,
  };
}
