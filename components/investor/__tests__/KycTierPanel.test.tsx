import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useKycTier, type KycTierView } from "@/hooks/useKycTier";
import { calculateKycTierUsage } from "@/lib/kycTier";
import { KycTierPanel } from "../KycTierPanel";

vi.mock("@/hooks/useKycTier", () => ({
  useKycTier: vi.fn(),
}));

const mockedUseKycTier = vi.mocked(useKycTier);

function mockView(overrides: Partial<KycTierView> = {}): KycTierView {
  return {
    status: null,
    usage: null,
    upgradeRecommended: false,
    upgradeTarget: null,
    isLoading: false,
    isError: false,
    isConnected: true,
    refetch: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("KycTierPanel (#475)", () => {
  it("renders the tier badge, limits and upgrade prompt from one view", () => {
    const usage = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: 8_500,
      largestCommitment: 900,
    });
    mockedUseKycTier.mockReturnValue(
      mockView({
        usage,
        upgradeRecommended: true,
        upgradeTarget: "verified",
      }),
    );

    render(<KycTierPanel />);

    expect(screen.getByTestId("kyc-tier-badge")).toHaveAttribute(
      "data-tier",
      "basic",
    );
    expect(screen.getByTestId("kyc-tier-limits")).toBeInTheDocument();
    expect(screen.getByTestId("kyc-upgrade-prompt")).toBeInTheDocument();
  });

  it("prompts to connect a wallet when disconnected", () => {
    mockedUseKycTier.mockReturnValue(
      mockView({ isConnected: false, usage: null }),
    );

    render(<KycTierPanel />);

    expect(screen.getByTestId("kyc-tier-connect")).toBeInTheDocument();
    expect(screen.queryByTestId("kyc-tier-badge")).not.toBeInTheDocument();
  });

  it("shows a skeleton while loading", () => {
    mockedUseKycTier.mockReturnValue(mockView({ isLoading: true }));

    render(<KycTierPanel />);

    expect(screen.getByTestId("kyc-tier-loading")).toBeInTheDocument();
  });

  it("surfaces an error with a retry action", () => {
    const refetch = vi.fn();
    mockedUseKycTier.mockReturnValue(
      mockView({ isError: true, refetch }),
    );

    render(<KycTierPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
