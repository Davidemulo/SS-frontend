"use client";

/**
 * Accreditation tier badge display (#451)
 *
 * Shows investor's accreditation status: unaccredited, accredited, or qualified investor.
 */

import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccreditationTier = "unaccredited" | "accredited" | "qualified";

interface AccreditationTierBadgeProps {
  tier: AccreditationTier;
  size?: "sm" | "md";
  className?: string;
}

const tierConfig = {
  unaccredited: {
    label: "Unaccredited",
    icon: AlertCircle,
    variant: "outline" as const,
    bgColor: "bg-gray-50 dark:bg-gray-900",
    textColor: "text-gray-700 dark:text-gray-300",
    borderColor: "border-gray-300 dark:border-gray-600",
  },
  accredited: {
    label: "Accredited Investor",
    icon: Shield,
    variant: "secondary" as const,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-600",
  },
  qualified: {
    label: "Qualified Investor",
    icon: CheckCircle2,
    variant: "secondary" as const,
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-600",
  },
};

export function AccreditationTierBadge({
  tier,
  size = "md",
  className,
}: AccreditationTierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5",
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
      data-testid={`accreditation-badge-${tier}`}
    >
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
}
