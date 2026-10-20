import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  NETWORK_STORAGE_KEY,
  getActiveNetwork,
  readStoredNetwork,
  setActiveNetwork,
} from "@/lib/stellar/network";

describe("active Stellar network (#443)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_STELLAR_NETWORK;

  beforeEach(() => {
    window.localStorage.clear();
    process.env.NEXT_PUBLIC_STELLAR_NETWORK = "testnet";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_STELLAR_NETWORK = originalEnv;
  });

  it("falls back to the deployment default when nothing is saved", () => {
    expect(readStoredNetwork()).toBeNull();
    expect(getActiveNetwork()).toBe("testnet");
  });

  it("persists a switch to localStorage", () => {
    setActiveNetwork("mainnet");
    expect(window.localStorage.getItem(NETWORK_STORAGE_KEY)).toBe("mainnet");
    expect(getActiveNetwork()).toBe("mainnet");
  });

  it("ignores stored values that are not a known network", () => {
    window.localStorage.setItem(NETWORK_STORAGE_KEY, "futurenet");
    expect(readStoredNetwork()).toBeNull();
    expect(getActiveNetwork()).toBe("testnet");
  });
});
