/**
 * Active Stellar network for the app (#443).
 *
 * The network a developer or tester picks is saved on this device. When
 * nothing is saved, the app falls back to NEXT_PUBLIC_STELLAR_NETWORK so
 * existing deployments keep their current behaviour.
 *
 * Storage is best-effort: if localStorage is unavailable (private mode,
 * blocked site data) the choice lasts for the page session only.
 */

import type { Network } from "./index";

export const NETWORK_STORAGE_KEY = "stellarsettle.network";
const NETWORK_CHANGE_EVENT = "stellarsettle:network-change";

export const NETWORK_LABELS: Record<Network, string> = {
  mainnet: "Mainnet",
  testnet: "Testnet",
};

function isNetwork(value: unknown): value is Network {
  return value === "mainnet" || value === "testnet";
}

export function getDefaultNetwork(): Network {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

export function readStoredNetwork(): Network | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(NETWORK_STORAGE_KEY);
    return isNetwork(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function getActiveNetwork(): Network {
  return readStoredNetwork() ?? getDefaultNetwork();
}

export function setActiveNetwork(network: Network): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NETWORK_STORAGE_KEY, network);
  } catch {
    // Storage unavailable: the switch still applies to this page session.
  }
  window.dispatchEvent(new Event(NETWORK_CHANGE_EVENT));
}

/** Subscribes to network changes from this tab and from other tabs. */
export function subscribeActiveNetwork(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(NETWORK_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(NETWORK_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
