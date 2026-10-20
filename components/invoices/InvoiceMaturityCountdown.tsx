"use client";

/**
 * Enhanced maturity countdown display (#460)
 * Shows days to settlement in a prominent card format
 */

import { useCountdown } from "@/hooks/useCountdown";
import { isExpired } from "@/components/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InvoiceMaturityCountdownProps {
  maturityDate: string | null | undefined;
  maturityAmount?: number;
}

export function InvoiceMaturityCountdown({
  maturityDate,
  maturityAmount,
}: InvoiceMaturityCountdownProps) {
  const hasMaturityDate = Boolean(maturityDate);
  const matured = hasMaturityDate && isExpired(maturityDate as string);
  const countdown = useCountdown(
    maturityDate ?? null,
    hasMaturityDate && !matured
  );

  if (!hasMaturityDate) return null;

  const daysRemaining = countdown.days;
  const isUrgent = daysRemaining <= 7;
  const isCritical = daysRemaining <= 1;

  if (matured) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-amber-900">
            Settlement Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800">
            This invoice has reached maturity. Settlement payouts are being processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Days to Settlement</CardTitle>
          {isUrgent && (
            <Badge variant="destructive" className="text-xs">
              {isCritical ? "Critical" : "Urgent"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="text-3xl font-bold text-primary">{daysRemaining}</p>
          <p className="text-xs text-muted-foreground">
            {daysRemaining === 0
              ? "Settlement today"
              : daysRemaining === 1
              ? "Settlement tomorrow"
              : `Settlement in ${daysRemaining} days`}
          </p>
        </div>

        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs text-slate-600">
            Settlement Date:{" "}
            <span className="font-mono font-semibold">
              {new Date(maturityDate as string).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </p>
          {maturityAmount !== undefined && (
            <p className="text-xs text-slate-600 mt-1">
              Settlement Amount:{" "}
              <span className="font-mono font-semibold">
                ${maturityAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            Time remaining: {countdown.days}d {countdown.hours}h {countdown.minutes}m
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
