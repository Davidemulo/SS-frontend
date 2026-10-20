import { describe, it, expect } from "vitest";
import {
  KYC_TIER_META,
  KYC_TIER_ORDER,
  KYC_UPGRADE_THRESHOLD,
  calculateKycTierUsage,
  formatLimitValue,
  isKycTier,
  isKycUpgradeRecommended,
  nextKycTier,
  tierRank,
} from "../kycTier";

describe("KYC tier model (#475)", () => {
  it("orders the tiers basic -> verified -> accredited", () => {
    expect(KYC_TIER_ORDER).toEqual(["basic", "verified", "accredited"]);
    expect(tierRank("basic")).toBe(0);
    expect(tierRank("accredited")).toBe(2);
    expect(nextKycTier("basic")).toBe("verified");
    expect(nextKycTier("verified")).toBe("accredited");
    expect(nextKycTier("accredited")).toBeNull();
  });

  it("labels each tier and gives accredited no caps", () => {
    expect(KYC_TIER_META.basic.label).toBe("Basic");
    expect(KYC_TIER_META.verified.label).toBe("Verified");
    expect(KYC_TIER_META.accredited.label).toBe("Accredited");
    expect(KYC_TIER_META.accredited.limits).toEqual({
      perInvoice: null,
      cumulative: null,
    });
  });

  it("validates tier strings", () => {
    expect(isKycTier("verified")).toBe(true);
    expect(isKycTier("gold")).toBe(false);
  });
});

describe("calculateKycTierUsage", () => {
  it("computes used, remaining and percent from the tier defaults", () => {
    const usage = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: 8_000,
      largestCommitment: 500,
    });

    expect(usage.cumulativeLimit).toBe(10_000);
    expect(usage.cumulativeRemaining).toBe(2_000);
    expect(usage.cumulativePercent).toBe(80);
    expect(usage.perInvoiceLimit).toBe(1_000);
    expect(usage.perInvoiceRemaining).toBe(500);
    expect(usage.perInvoicePercent).toBe(50);
  });

  it("clamps at 100% and never returns a negative remainder when overspent", () => {
    const usage = calculateKycTierUsage({
      tier: "verified",
      cumulativeInvested: 999_999,
      largestCommitment: 50_000,
    });

    expect(usage.cumulativePercent).toBe(100);
    expect(usage.cumulativeRemaining).toBe(0);
    expect(usage.perInvoicePercent).toBe(100);
    expect(usage.perInvoiceRemaining).toBe(0);
  });

  it("prefers contract-provided limits over the tier defaults", () => {
    const usage = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: 5_000,
      largestCommitment: 100,
      limits: { cumulative: 20_000, perInvoice: 2_000 },
    });

    expect(usage.cumulativeLimit).toBe(20_000);
    expect(usage.perInvoiceLimit).toBe(2_000);
    expect(usage.cumulativePercent).toBe(25);
  });

  it("treats null limits as uncapped", () => {
    const usage = calculateKycTierUsage({
      tier: "accredited",
      cumulativeInvested: 5_000_000,
      largestCommitment: 250_000,
    });

    expect(usage.cumulativeUnlimited).toBe(true);
    expect(usage.cumulativeRemaining).toBeNull();
    expect(usage.cumulativePercent).toBe(0);
    expect(usage.perInvoiceUnlimited).toBe(true);
  });

  it("ignores negative or non-finite usage values", () => {
    const usage = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: Number.NaN,
      largestCommitment: -10,
    });

    expect(usage.cumulativeUsed).toBe(0);
    expect(usage.perInvoiceUsed).toBe(0);
  });
});

describe("isKycUpgradeRecommended", () => {
  it("fires exactly at the 80% threshold", () => {
    const atThreshold = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: 8_000,
    });
    const justBelow = calculateKycTierUsage({
      tier: "basic",
      cumulativeInvested: 7_999,
    });

    expect(KYC_UPGRADE_THRESHOLD).toBe(0.8);
    expect(isKycUpgradeRecommended(atThreshold)).toBe(true);
    expect(isKycUpgradeRecommended(justBelow)).toBe(false);
  });

  it("never fires for an uncapped tier", () => {
    const usage = calculateKycTierUsage({
      tier: "accredited",
      cumulativeInvested: 10_000_000,
    });
    expect(isKycUpgradeRecommended(usage)).toBe(false);
  });
});

describe("formatLimitValue", () => {
  it("formats capped and uncapped limits", () => {
    expect(formatLimitValue(8_000, 10_000)).toBe("8,000 of 10,000 XLM");
    expect(formatLimitValue(1, null)).toBe("No limit");
  });
});
