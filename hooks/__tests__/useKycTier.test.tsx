import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useKycTier } from "../useKycTier";
import * as api from "@/lib/api";

const walletState = vi.hoisted(() => ({
  address: "GINVESTOR1" as string | null,
  isConnected: true,
}));

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => walletState,
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function tierStatus(overrides: Partial<api.KycTierStatus> = {}): api.KycTierStatus {
  return {
    address: walletState.address ?? "GINVESTOR1",
    tier: "basic",
    cumulative_invested: 8_000,
    largest_commitment: 500,
    per_invoice_limit: 1_000,
    cumulative_limit: 10_000,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  walletState.address = "GINVESTOR1";
  walletState.isConnected = true;
});

describe("useKycTier (#475)", () => {
  it("reads the tier for the connected wallet and derives usage", async () => {
    const fetchSpy = vi
      .spyOn(api, "fetchKycTierStatus")
      .mockResolvedValue(tierStatus());

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useKycTier(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.status).not.toBeNull());

    expect(fetchSpy).toHaveBeenCalledWith("GINVESTOR1");
    expect(result.current.usage?.tier).toBe("basic");
    expect(result.current.usage?.cumulativeRemaining).toBe(2_000);
    expect(result.current.upgradeRecommended).toBe(true);
    expect(result.current.upgradeTarget).toBe("verified");
  });

  it("does not fetch when no wallet is connected", async () => {
    walletState.address = null;
    walletState.isConnected = false;
    const fetchSpy = vi.spyOn(api, "fetchKycTierStatus");

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useKycTier(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.usage).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it("fetches the new wallet's tier after a reconnect", async () => {
    const fetchSpy = vi
      .spyOn(api, "fetchKycTierStatus")
      .mockImplementation(async (address) =>
        address === "GINVESTOR1"
          ? tierStatus({ tier: "basic", cumulative_invested: 8_000 })
          : tierStatus({
              address: "GINVESTOR2",
              tier: "verified",
              cumulative_invested: 1_000,
              largest_commitment: 1_000,
              per_invoice_limit: 25_000,
              cumulative_limit: 250_000,
            }),
      );

    const queryClient = makeQueryClient();
    const { result, rerender } = renderHook(() => useKycTier(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.usage?.tier).toBe("basic"));

    // Simulate disconnecting and reconnecting a different wallet.
    walletState.address = "GINVESTOR2";
    rerender();

    await waitFor(() => expect(result.current.usage?.tier).toBe("verified"));
    expect(fetchSpy).toHaveBeenCalledWith("GINVESTOR2");
    expect(result.current.upgradeRecommended).toBe(false);
    expect(result.current.upgradeTarget).toBe("accredited");
  });
});
