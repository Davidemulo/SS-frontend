"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatLimitValue, type KycTierUsage } from "@/lib/kycTier";

interface KycTierLimitsProps {
  usage: KycTierUsage;
  className?: string;
}

interface LimitRowProps {
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  percent: number;
  unlimited: boolean;
  testId: string;
}

function LimitRow({
  label,
  used,
  limit,
  remaining,
  percent,
  unlimited,
  testId,
}: LimitRowProps) {
  return (
    <div className="space-y-1.5" data-testid={testId}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {unlimited ? "No limit" : formatLimitValue(used, limit)}
        </span>
      </div>
      <Progress
        value={unlimited ? 0 : percent}
        aria-label={`${label} usage`}
        data-testid={`${testId}-progress`}
        data-percent={unlimited ? "unlimited" : Math.round(percent)}
      />
      <p className="text-xs text-muted-foreground" data-testid={`${testId}-remaining`}>
        {unlimited
          ? "This tier has no cap on this limit."
          : `${(remaining ?? 0).toLocaleString()} XLM remaining`}
      </p>
    </div>
  );
}

/** Used-vs-remaining progress for the per-invoice and cumulative KYC limits. */
export function KycTierLimits({ usage, className }: KycTierLimitsProps) {
  return (
    <div className={cn("space-y-4", className)} data-testid="kyc-tier-limits">
      <LimitRow
        label="Per-invoice limit"
        used={usage.perInvoiceUsed}
        limit={usage.perInvoiceLimit}
        remaining={usage.perInvoiceRemaining}
        percent={usage.perInvoicePercent}
        unlimited={usage.perInvoiceUnlimited}
        testId="kyc-per-invoice-limit"
      />
      <LimitRow
        label="Cumulative limit"
        used={usage.cumulativeUsed}
        limit={usage.cumulativeLimit}
        remaining={usage.cumulativeRemaining}
        percent={usage.cumulativePercent}
        unlimited={usage.cumulativeUnlimited}
        testId="kyc-cumulative-limit"
      />
    </div>
  );
}
