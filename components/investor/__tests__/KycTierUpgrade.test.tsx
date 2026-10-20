import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useKycTier, type KycTierView } from "@/hooks/useKycTier";
import { calculateKycTierUsage, type KycTier } from "@/lib/kycTier";
import { KycTierUpgrade } from "../KycTierUpgrade";

vi.mock("@/hooks/useKycTier", () => ({
  useKycTier: vi.fn(),
}));

const mockedUseKycTier = vi.mocked(useKycTier);

function viewFor(tier: KycTier): KycTierView {
  return {
    status: null,
    usage: calculateKycTierUsage({ tier, cumulativeInvested: 0 }),
    upgradeRecommended: false,
    upgradeTarget: tier === "accredited" ? null : tier === "basic" ? "verified" : "accredited",
    isLoading: false,
    isError: false,
    isConnected: true,
    refetch: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("KycTierUpgrade (#475)", () => {
  it("offers only tiers above the current one and links to the KYC flow", () => {
    mockedUseKycTier.mockReturnValue(viewFor("basic"));

    render(<KycTierUpgrade />);

    expect(screen.getByTestId("kyc-upgrade-tier-verified")).toBeInTheDocument();
    expect(screen.getByTestId("kyc-upgrade-tier-accredited")).toBeInTheDocument();
    expect(screen.queryByTestId("kyc-upgrade-tier-basic")).not.toBeInTheDocument();

    expect(screen.getByTestId("kyc-upgrade-start-verified")).toHaveAttribute(
      "href",
      "/kyc/onboarding",
    );
  });

  it("shows the highest-tier message for an accredited investor", () => {
    mockedUseKycTier.mockReturnValue(viewFor("accredited"));

    render(<KycTierUpgrade />);

    expect(screen.getByTestId("kyc-upgrade-none")).toBeInTheDocument();
    expect(screen.queryByTestId("kyc-upgrade-tier-verified")).not.toBeInTheDocument();
  });
});
