"use client";

/**
 * Invoice expiry countdown with urgency states (#450)
 *
 * Displays a real-time countdown (days, hours, minutes) for invoice funding deadlines.
 * Shows urgency styling for under 24 hours and handles closed-unfunded state.
 */

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceExpiryCountdownProps {
  dueDate: string;
  status: string;
  isFunded?: boolean;
  now?: number;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
}

function calculateTimeRemaining(dueDate: string, now = Date.now()): TimeRemaining {
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const diff = Math.max(0, due - now);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  return {
    days,
    hours,
    minutes,
    isExpired: diff === 0,
  };
}

export function InvoiceExpiryCountdown({
  dueDate,
  status,
  isFunded = true,
  now: initialNow,
}: InvoiceExpiryCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(dueDate, initialNow)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(dueDate));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dueDate]);

  // Handle closed-unfunded state
  if (status === "closed" && !isFunded) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"
        data-testid="closed-unfunded-badge"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Funding deadline passed
      </div>
    );
  }

  // Don't show countdown for non-trading statuses
  const nonTradingStatuses = ["settled", "rejected", "draft"];
  if (nonTradingStatuses.includes(status)) {
    return null;
  }

  if (timeRemaining.isExpired) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"
        data-testid="expiry-countdown-expired"
      >
        <Clock className="h-3.5 w-3.5" />
        Closing now
      </div>
    );
  }

  const isUrgent = timeRemaining.days === 0 && timeRemaining.hours < 24;

  const timeStr =
    timeRemaining.days > 0
      ? `${timeRemaining.days}d ${timeRemaining.hours}h`
      : timeRemaining.hours > 0
        ? `${timeRemaining.hours}h ${timeRemaining.minutes}m`
        : `${timeRemaining.minutes}m`;

  return (
    <span
      data-testid="invoice-expiry-countdown"
      title={new Date(dueDate).toLocaleString()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        isUrgent
          ? "border-orange-400/50 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
          : "border-muted-foreground/20 text-muted-foreground"
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {timeStr} left
    </span>
  );
}
