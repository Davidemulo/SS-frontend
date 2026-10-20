/**
 * Fee schedule editing rules for the admin configuration page (#440).
 *
 * Pure helpers: they turn the form's text drafts into validated changes and
 * work out what each change costs a reference investment, so the confirm
 * step can show the impact before anything is saved.
 */

import type { FeeChangeInput, FeeScheduleItem, FeeType } from "@/lib/api";

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  investment_fee: "Investment fee",
  secondary_market_fee: "Secondary market fee",
  settlement_fee: "Settlement fee",
  early_exit_penalty: "Early exit penalty",
};

/** Reference principal (XLM) used to show the impact of a rate change. */
export const SAMPLE_INVESTMENT_XLM = 10000;
export const MAX_FEE_PERCENT = 100;

/**
 * Parses a rate typed into the form. Returns null for empty, non-numeric,
 * negative or above-100 input; otherwise the rate rounded to 4 decimal places.
 */
export function parseFeeRate(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > MAX_FEE_PERCENT) return null;

  return Math.round(value * 10_000) / 10_000;
}

export interface CollectedFeeChanges {
  /** Fees whose parsed rate differs from the saved schedule. */
  changes: FeeChangeInput[];
  /** Fees whose draft text is not a valid rate. */
  invalid: FeeType[];
}

export function collectFeeChanges(
  current: FeeScheduleItem[],
  drafts: Partial<Record<FeeType, string>>
): CollectedFeeChanges {
  const changes: FeeChangeInput[] = [];
  const invalid: FeeType[] = [];

  for (const fee of current) {
    const draft = drafts[fee.fee_type];
    if (draft === undefined) continue;

    const parsed = parseFeeRate(draft);
    if (parsed === null) {
      invalid.push(fee.fee_type);
    } else if (parsed !== fee.rate_percentage) {
      changes.push({ fee_type: fee.fee_type, rate_percentage: parsed });
    }
  }

  return { changes, invalid };
}

export interface FeeChangePreview {
  fee_type: FeeType;
  label: string;
  oldRate: number;
  newRate: number;
  /** Extra XLM charged on the sample investment; negative when the fee drops. */
  sampleImpactXlm: number;
}

/** Old vs new rate for each pending change, with its effect on the sample investment. */
export function previewFeeChanges(
  current: FeeScheduleItem[],
  changes: FeeChangeInput[]
): FeeChangePreview[] {
  return changes.flatMap((change) => {
    const fee = current.find((item) => item.fee_type === change.fee_type);
    if (!fee) return [];

    const sampleImpactXlm =
      ((change.rate_percentage - fee.rate_percentage) / 100) * SAMPLE_INVESTMENT_XLM;

    return [
      {
        fee_type: change.fee_type,
        label: FEE_TYPE_LABELS[change.fee_type],
        oldRate: fee.rate_percentage,
        newRate: change.rate_percentage,
        sampleImpactXlm,
      },
    ];
  });
}
