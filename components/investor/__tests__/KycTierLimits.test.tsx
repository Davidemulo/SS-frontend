import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KycTierLimits } from "../KycTierLimits";
import { calculateKycTierUsage } from "@/lib/kycTier";

describe("KycTierLimits (#475)", () => {
  it("renders accurate used, remaining and percent for both limits", () => {
    const usage = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: 8_000,
      largestCommitment: 500,
    });

    render(<KycTierLimits usage={usage} />);

    expect(screen.getByTestId("kyc-per-invoice-limit")).toHaveTextContent(
      "500 of 1,000 XLM",
    );
    expect(screen.getByTestId("kyc-per-invoice-limit-remaining")).toHaveTextContent(
      "500 XLM remaining",
    );
    expect(screen.getByTestId("kyc-per-invoice-limit-progress")).toHaveAttribute(
      "data-percent",
      "50",
    );

    expect(screen.getByTestId("kyc-cumulative-limit")).toHaveTextContent(
      "8,000 of 10,000 XLM",
    );
    expect(screen.getByTestId("kyc-cumulative-limit-remaining")).toHaveTextContent(
      "2,000 XLM remaining",
    );
    expect(screen.getByTestId("kyc-cumulative-limit-progress")).toHaveAttribute(
      "data-percent",
      "80",
    );
  });

  it("renders uncapped limits without a progress fill", () => {
    const usage = calculateKycTierUsage({
      tier: "accredited",
      cumulativeInvested: 5_000_000,
      largestCommitment: 100_000,
    });

    render(<KycTierLimits usage={usage} />);

    expect(screen.getByTestId("kyc-cumulative-limit")).toHaveTextContent("No limit");
    expect(screen.getByTestId("kyc-cumulative-limit-progress")).toHaveAttribute(
      "data-percent",
      "unlimited",
    );
  });
});
