"use client";
import { useEffect, useState } from "react";

export function useStellarWallet() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const freighter = await import("@stellar/freighter-api");
        if (await freighter.isConnected()) {
          const pk = await freighter.getPublicKey();
          if (pk) setAddress(pk);
        }
      } catch {
        /* wallet unavailable */
      }
    })();
  }, []);

  return { address };
}
