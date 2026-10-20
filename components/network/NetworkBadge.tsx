"use client";

import { Badge } from "@/components/ui/badge";
import { useActiveNetwork } from "@/hooks/useActiveNetwork";
import { NETWORK_LABELS } from "@/lib/stellar/network";

/** Always-visible network indicator for the navbar (#443). */
export function NetworkBadge() {
  const { network } = useActiveNetwork();

  return (
    <Badge
      variant={network === "mainnet" ? "default" : "secondary"}
      className={
        network === "mainnet"
          ? "bg-green-500 text-white hover:bg-green-600"
          : "bg-yellow-400 text-black hover:bg-yellow-500"
      }
      data-testid="network-badge"
    >
      {NETWORK_LABELS[network]}
    </Badge>
  );
}
