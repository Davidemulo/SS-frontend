import { describe, expect, it } from "vitest";
import type { FeeScheduleItem } from "@/lib/api";
import {
  collectFeeChanges,
  parseFeeRate,
  previewFeeChanges,
} from "@/lib/feeConfig";

const CURRENT: FeeScheduleItem[] = [
  {
    fee_type: "investment_fee",
    label: "Investment fee",
    rate_percentage: 1.5,
    when_applies: "On investment",
    applies_to: "investor",
  },
  {
    fee_type: "settlement_fee",
    label: "Settlement fee",
    rate_percentage: 2,
    when_applies: "At settlement",
    applies_to: "issuer",
  },
];

describe("parseFeeRate (#440)", () => {
  it("accepts rates from 0 to 100 and rounds to 4 decimals", () => {
    expect(parseFeeRate("2.5")).toBe(2.5);
    expect(parseFeeRate(" 0 ")).toBe(0);
    expect(parseFeeRate("100")).toBe(100);
    expect(parseFeeRate("1.123456")).toBe(1.1235);
  });

  it("rejects empty, non-numeric, negative and out-of-range input", () => {
    expect(parseFeeRate("")).toBeNull();
    expect(parseFeeRate("abc")).toBeNull();
    expect(parseFeeRate("-1")).toBeNull();
    expect(parseFeeRate("100.01")).toBeNull();
  });
});

describe("collectFeeChanges (#440)", () => {
  it("returns only fees whose parsed rate differs from the saved one", () => {
    const result = collectFeeChanges(CURRENT, {
      investment_fee: "1.5",
      settlement_fee: "2.25",
    });
    expect(result.changes).toEqual([{ fee_type: "settlement_fee", rate_percentage: 2.25 }]);
    expect(result.invalid).toEqual([]);
  });

  it("flags invalid drafts instead of turning them into changes", () => {
    const result = collectFeeChanges(CURRENT, { investment_fee: "oops" });
    expect(result.changes).toEqual([]);
    expect(result.invalid).toEqual(["investment_fee"]);
  });
});

describe("previewFeeChanges (#440)", () => {
  it("shows old and new rates with the impact on the sample investment", () => {
    const [row] = previewFeeChanges(CURRENT, [
      { fee_type: "investment_fee", rate_percentage: 2.5 },
    ]);
    expect(row.oldRate).toBe(1.5);
    expect(row.newRate).toBe(2.5);
    // +1 percentage point on 10,000 XLM costs 100 XLM more.
    expect(row.sampleImpactXlm).toBeCloseTo(100);
  });

  it("shows a negative impact when a fee is reduced", () => {
    const [row] = previewFeeChanges(CURRENT, [
      { fee_type: "settlement_fee", rate_percentage: 1 },
    ]);
    expect(row.sampleImpactXlm).toBeCloseTo(-100);
  });
});
