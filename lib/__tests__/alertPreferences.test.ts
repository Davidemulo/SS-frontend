import { describe, it, expect } from "vitest";
import { ALERT_EVENTS, DEFAULT_ALERT_PREFERENCES, normalizeAlertPreferences } from "../alertPreferences";

describe("alert preferences (#531)", () => {
  it("covers the five event types", () => {
    expect(ALERT_EVENTS.map((e) => e.key)).toEqual([
      "settlement",
      "kyc_expiry",
      "watchlist_change",
      "auto_invest",
      "maturity_approaching",
    ]);
  });

  it("defaults to all enabled for wallets with no saved preferences", () => {
    expect(normalizeAlertPreferences(null)).toEqual(DEFAULT_ALERT_PREFERENCES);
    expect(Object.values(normalizeAlertPreferences(undefined)).every(Boolean)).toBe(true);
  });

  it("keeps saved values and fills missing keys with enabled", () => {
    const result = normalizeAlertPreferences({ settlement: false, auto_invest: false });
    expect(result).toEqual({
      settlement: false,
      kyc_expiry: true,
      watchlist_change: true,
      auto_invest: false,
      maturity_approaching: true,
    });
  });
});
