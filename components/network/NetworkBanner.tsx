"use client";

import { useActiveNetwork } from "@/hooks/useActiveNetwork";

/** Warning strip shown on every page while the testnet is active (#443). */
export function NetworkBanner() {
  const { network } = useActiveNetwork();
  if (network !== "testnet") return null;

  return (
    <div
      role="status"
      data-testid="testnet-banner"
      className="bg-yellow-400 px-4 py-1.5 text-center text-xs font-medium text-black"
    >
      Testnet mode: transactions use test assets with no real value.
    </div>
  );
}
