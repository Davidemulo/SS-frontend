import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KycTierBadge } from "../KycTierBadge";
import type { KycTier } from "@/lib/kycTier";

describe("KycTierBadge (#475)", () => {
  it.each<[KycTier, string]>([
    ["basic", "Basic"],
    ["verified", "Verified"],
    ["accredited", "Accredited"],
  ])("renders the %s tier with its label", (tier, label) => {
    render(<KycTierBadge tier={tier} />);

    const badge = screen.getByTestId("kyc-tier-badge");
    expect(badge).toHaveAttribute("data-tier", tier);
    expect(badge).toHaveTextContent(label);
  });
});
