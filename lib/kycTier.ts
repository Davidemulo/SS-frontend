/**
 * KYC tier model and limit maths (#475).
 *
 * Every investor sits on one of three KYC tiers. Each tier caps both how much
 * can be committed to any single invoice ("per-invoice limit") and how much can
 * be committed in total ("cumulative limit"). This module owns those rules so
 * the profile UI, the upgrade prompt, and the upgrade flow all agree on them.
 *
 * It is pure and framework-free so the threshold behaviour can be unit-tested
 * without a wallet, a network, or React.
 */

export type KycTier = "basic" | "verified" | "accredited";

/** Ordered from lowest to highest, for "what can I upgrade to?" lookups. */
export const KYC_TIER_ORDER: readonly KycTier[] = [
  "basic",
  "verified",
  "accredited",
] as const;

/** `null` means the tier has no cap on that dimension. */
export interface KycTierLimits {
  perInvoice: number | null;
  cumulative: number | null;
}

export interface KycTierMeta {
  tier: KycTier;
  label: string;
  description: string;
  /** What the investor needs to provide to reach this tier. */
  requirements: string;
  limits: KycTierLimits;
}

/**
 * Fallback limits, used to describe a tier in the upgrade flow and whenever the
 * on-chain status response omits an explicit limit. Amounts are in XLM.
 */
export const KYC_TIER_META: Record<KycTier, KycTierMeta> = {
  basic: {
    tier: "basic",
    label: "Basic",
    description: "Identity confirmed with a light-touch check.",
    requirements: "Email address and basic identity details.",
    limits: { perInvoice: 1_000, cumulative: 10_000 },
  },
  verified: {
    tier: "verified",
    label: "Verified",
    description: "Government-issued ID and proof of address verified.",
    requirements: "Government-issued photo ID and proof of address.",
    limits: { perInvoice: 25_000, cumulative: 250_000 },
  },
  accredited: {
    tier: "accredited",
    label: "Accredited",
    description: "Full accredited-investor verification.",
    requirements: "Accreditation documentation (income or net-worth evidence).",
    limits: { perInvoice: null, cumulative: null },
  },
};

/** Share of a tier's cumulative limit at which we nudge the investor to upgrade. */
export const KYC_UPGRADE_THRESHOLD = 0.8;

export function isKycTier(value: unknown): value is KycTier {
  return value === "basic" || value === "verified" || value === "accredited";
}

/** The next tier up, or `null` when already at the top. */
export function nextKycTier(tier: KycTier): KycTier | null {
  const index = KYC_TIER_ORDER.indexOf(tier);
  if (index === -1 || index === KYC_TIER_ORDER.length - 1) return null;
  return KYC_TIER_ORDER[index + 1];
}

export function tierRank(tier: KycTier): number {
  return KYC_TIER_ORDER.indexOf(tier);
}

export interface KycTierUsage {
  tier: KycTier;
  /** Total committed across every invoice, in XLM. */
  cumulativeUsed: number;
  cumulativeLimit: number | null;
  cumulativeRemaining: number | null;
  /** 0-100, clamped. `0` when the tier is uncapped. */
  cumulativePercent: number;
  cumulativeUnlimited: boolean;
  /** Largest commitment held on any single invoice, in XLM. */
  perInvoiceUsed: number;
  perInvoiceLimit: number | null;
  perInvoiceRemaining: number | null;
  perInvoicePercent: number;
  perInvoiceUnlimited: boolean;
}

function normaliseAmount(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

function normaliseLimit(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function percentOf(used: number, limit: number | null): number {
  if (limit === null) return 0;
  return Math.min(100, Math.max(0, (used / limit) * 100));
}

function remaining(used: number, limit: number | null): number | null {
  if (limit === null) return null;
  return Math.max(0, limit - used);
}

export interface KycTierUsageInput {
  tier: KycTier;
  cumulativeInvested?: number | null;
  largestCommitment?: number | null;
  /** Contract-provided limits; falls back to the tier defaults. */
  limits?: Partial<KycTierLimits> | null;
}

/** Derives every used/remaining figure the profile UI needs. */
export function calculateKycTierUsage({
  tier,
  cumulativeInvested,
  largestCommitment,
  limits,
}: KycTierUsageInput): KycTierUsage {
  const defaults = KYC_TIER_META[tier].limits;
  const cumulativeLimit = normaliseLimit(
    limits?.cumulative !== undefined ? limits.cumulative : defaults.cumulative,
  );
  const perInvoiceLimit = normaliseLimit(
    limits?.perInvoice !== undefined ? limits.perInvoice : defaults.perInvoice,
  );

  const cumulativeUsed = normaliseAmount(cumulativeInvested);
  const perInvoiceUsed = normaliseAmount(largestCommitment);

  return {
    tier,
    cumulativeUsed,
    cumulativeLimit,
    cumulativeRemaining: remaining(cumulativeUsed, cumulativeLimit),
    cumulativePercent: percentOf(cumulativeUsed, cumulativeLimit),
    cumulativeUnlimited: cumulativeLimit === null,
    perInvoiceUsed,
    perInvoiceLimit,
    perInvoiceRemaining: remaining(perInvoiceUsed, perInvoiceLimit),
    perInvoicePercent: percentOf(perInvoiceUsed, perInvoiceLimit),
    perInvoiceUnlimited: perInvoiceLimit === null,
  };
}

/**
 * Whether the investor has crossed the upgrade threshold on their cumulative
 * limit. Unlimited tiers never prompt, and neither does an exactly-zero limit
 * (that would prompt on every render rather than at 80%).
 */
export function isKycUpgradeRecommended(usage: KycTierUsage): boolean {
  if (usage.tier === "accredited") return false;
  if (usage.cumulativeUnlimited || usage.cumulativeLimit === null) return false;
  if (usage.cumulativeLimit <= 0) return false;
  return usage.cumulativeUsed / usage.cumulativeLimit >= KYC_UPGRADE_THRESHOLD;
}

/** e.g. "8,000 of 10,000 XLM". `null` limit renders as "No limit". */
export function formatLimitValue(
  used: number,
  limit: number | null,
): string {
  if (limit === null) return "No limit";
  return `${used.toLocaleString()} of ${limit.toLocaleString()} XLM`;
}
