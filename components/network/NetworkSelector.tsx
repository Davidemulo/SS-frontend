"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveNetwork } from "@/hooks/useActiveNetwork";
import { NETWORK_LABELS } from "@/lib/stellar/network";
import type { Network } from "@/lib/stellar";

const NETWORK_OPTIONS: Network[] = ["mainnet", "testnet"];

/**
 * Settings card for switching between Stellar testnet and mainnet (#443).
 * Every switch goes through a confirmation dialog, and cached queries are
 * dropped so no data from the previous network is shown afterwards.
 */
export function NetworkSelector() {
  const { network, setNetwork } = useActiveNetwork();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<Network | null>(null);

  function confirmSwitch() {
    if (!pending) return;
    setNetwork(pending);
    queryClient.invalidateQueries();
    toast.success(`Switched to ${NETWORK_LABELS[pending]}`);
    setPending(null);
  }

  return (
    <Card data-testid="network-selector">
      <CardHeader>
        <CardTitle>Stellar network</CardTitle>
        <CardDescription>
          Choose which Stellar network the app reads from and sends transactions to.
          Testnet uses test assets only.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        {NETWORK_OPTIONS.map((option) => (
          <Button
            key={option}
            variant={network === option ? "default" : "outline"}
            aria-pressed={network === option}
            data-testid={`network-option-${option}`}
            onClick={() => {
              if (option !== network) setPending(option);
            }}
          >
            {NETWORK_LABELS[option]}
          </Button>
        ))}
      </CardContent>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Switch to {pending ? NETWORK_LABELS[pending] : ""}?
            </DialogTitle>
            <DialogDescription>
              Balances, invoices and transaction history will be loaded from the
              {" "}{pending ? NETWORK_LABELS[pending] : ""} network. Assets on one network
              are not usable on the other.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button onClick={confirmSwitch} data-testid="confirm-network-switch">
              Switch network
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
