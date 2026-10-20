"use client";

import { Layers, ShieldCheck } from "lucide-react";
import type { Invoice } from "@/lib/api";
import {
  categoryLabel,
  normalizeCategory,
  riskTierLabel,
  riskTierOf,
  type RiskTier,
} from "@/lib/invoiceTaxonomy";

const RISK_TIER_STYLES: Record<RiskTier, string> = {
  low: "border-green-200 bg-green-50 text-green-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-800",
};

interface InvoiceClassificationBadgesProps {
  invoice: Pick<Invoice, "id" | "category" | "risk_tier" | "risk_rating">;
}

/**
 * Admin-assigned category and risk tier for an invoice (#468), shown on
 * marketplace cards and the detail page. Renders nothing when neither is set.
 */
export function InvoiceClassificationBadges({ invoice }: InvoiceClassificationBadgesProps) {
  const category = normalizeCategory(invoice.category);
  const riskTier = riskTierOf(invoice);
  if (!category && !riskTier) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      data-testid={`invoice-classification-${invoice.id}`}
    >
      {category && (
        <span
          className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs font-medium"
          data-testid="invoice-category-badge"
        >
          <Layers className="size-3" aria-hidden="true" />
          {categoryLabel(category)}
        </span>
      )}
      {riskTier && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${RISK_TIER_STYLES[riskTier]}`}
          data-testid="invoice-risk-tier-badge"
        >
          <ShieldCheck className="size-3" aria-hidden="true" />
          {riskTierLabel(riskTier)}
        </span>
      )}
    </div>
  );
}
