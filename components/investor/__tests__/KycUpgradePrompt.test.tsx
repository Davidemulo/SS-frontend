import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KycUpgradePrompt } from "../KycUpgradePrompt";
import { calculateKycTierUsage } from "@/lib/kycTier";

describe("KycUpgradePrompt (#475)", () => {
  it("appears at the 80% threshold and links to the upgrade flow", () => {
    const usage = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: 8_000,
    });

    render(<KycUpgradePrompt usage={usage} target="verified" />);

    expect(screen.getByTestId("kyc-upgrade-prompt")).toBeInTheDocument();
    const cta = screen.getByTestId("kyc-upgrade-cta");
    expect(cta).toHaveAttribute("href", "/kyc/upgrade");
    expect(cta).toHaveTextContent("Upgrade to Verified");
  });

  it("stays hidden below the threshold", () => {
    const usage = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: 7_000,
    });

    render(<KycUpgradePrompt usage={usage} target="verified" />);

    expect(screen.queryByTestId("kyc-upgrade-prompt")).not.toBeInTheDocument();
  });

  it("stays hidden when there is no higher tier", () => {
    const usage = calculateKycTierUsage({
      tier: "accredited",
      cumulativeInvested: 1_000_000,
    });

    render(<KycUpgradePrompt usage={usage} target={null} />);

    expect(screen.queryByTestId("kyc-upgrade-prompt")).not.toBeInTheDocument();
  });
});
