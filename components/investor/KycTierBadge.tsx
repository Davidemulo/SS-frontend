"use client";

import { Award, Shield, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KYC_TIER_META, type KycTier } from "@/lib/kycTier";

interface KycTierBadgeProps {
  tier: KycTier;
  size?: "sm" | "md";
  className?: string;
}

const TIER_STYLES: Record<
  KycTier,
  { icon: typeof Shield; className: string }
> = {
  basic: {
    icon: Shield,
    className: "border-transparent bg-slate-100 text-slate-700",
  },
  verified: {
    icon: ShieldCheck,
    className: "border-transparent bg-blue-100 text-blue-800",
  },
  accredited: {
    icon: Award,
    className: "border-transparent bg-amber-100 text-amber-900",
  },
};

/**
 * KYC tier indicator (#475).
 *
 * Purely presentational — the connected container (`KycTierPanel`) supplies the
 * tier so this can be rendered anywhere, including in the profile header.
 */
export function KycTierBadge({
  tier,
  size = "md",
  className,
}: KycTierBadgeProps) {
  const { icon: Icon, className: tone } = TIER_STYLES[tier];
  const meta = KYC_TIER_META[tier];
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <Badge
      title={meta.description}
      data-testid="kyc-tier-badge"
      data-tier={tier}
      className={cn("inline-flex items-center gap-1.5", tone, className)}
    >
      <Icon className={iconSize} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
