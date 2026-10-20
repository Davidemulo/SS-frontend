import { describe, expect, it } from "vitest";
import { compareToOriginalYield } from "@/lib/secondaryMarket";

describe("compareToOriginalYield (#463)", () => {
  it("reports a discount when the implied yield beats the original", () => {
    expect(compareToOriginalYield(14, 10)).toEqual({
      differencePoints: 4,
      pricing: "discount",
    });
  });

  it("reports a premium when the implied yield is below the original", () => {
    const result = compareToOriginalYield(7.5, 10);
    expect(result?.pricing).toBe("premium");
    expect(result?.differencePoints).toBeCloseTo(-2.5);
  });

  it("reports par when the yields match", () => {
    expect(compareToOriginalYield(10, 10)?.pricing).toBe("par");
  });

  it("returns null when the original yield is missing", () => {
    expect(compareToOriginalYield(10, undefined)).toBeNull();
    expect(compareToOriginalYield(10, null)).toBeNull();
  });

  it("returns null when the implied yield is not meaningful", () => {
    expect(compareToOriginalYield(0, 10)).toBeNull();
  });
});
