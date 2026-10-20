import type { AlertPreferences } from "@/lib/api";

export type AlertEventType = keyof AlertPreferences;

export const ALERT_EVENTS: {
  key: AlertEventType;
  label: string;
  description: string;
}[] = [
  { key: "settlement", label: "Settlement", description: "An invoice you hold is settled." },
  { key: "kyc_expiry", label: "KYC Expiry", description: "Your KYC verification is about to expire." },
  { key: "watchlist_change", label: "Watchlist Change", description: "A watched invoice changes state." },
  { key: "auto_invest", label: "Auto-Invest", description: "Auto-invest buys an invoice on your behalf." },
  { key: "maturity_approaching", label: "Maturity Approaching", description: "An invoice you hold is nearing maturity." },
];

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  settlement: true,
  kyc_expiry: true,
  watchlist_change: true,
  auto_invest: true,
  maturity_approaching: true,
};

/** Fills missing or non-boolean keys with the all-enabled default. */
export function normalizeAlertPreferences(
  raw: Partial<AlertPreferences> | null | undefined,
): AlertPreferences {
  const result = { ...DEFAULT_ALERT_PREFERENCES };
  if (!raw) return result;
  for (const { key } of ALERT_EVENTS) {
    if (typeof raw[key] === "boolean") result[key] = raw[key] as boolean;
  }
  return result;
}
