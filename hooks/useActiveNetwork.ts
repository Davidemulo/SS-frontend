"use client";

import { useSyncExternalStore } from "react";
import {
  getActiveNetwork,
  getDefaultNetwork,
  setActiveNetwork,
  subscribeActiveNetwork,
} from "@/lib/stellar/network";

/**
 * The network the app is currently reading from (#443). Re-renders every
 * consumer when it changes, in this tab or another one.
 */
export function useActiveNetwork() {
  const network = useSyncExternalStore(
    subscribeActiveNetwork,
    getActiveNetwork,
    // Server render and hydration both use the default so markup matches.
    getDefaultNetwork
  );

  return { network, setNetwork: setActiveNetwork };
}
