"use client";

/**
 * Category and risk tier assignment for an invoice under review (#468).
 *
 * Both values gate investing by accreditation tier, so an invoice cannot be
 * approved to live until an admin has saved them. The parent decides when
 * approval is allowed via `isInvoiceClassified`; this form only edits and saves.
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  assignInvoiceClassification,
  type InvoiceClassification,
} from "@/lib/api";
import {
  CATEGORY_OPTIONS,
  RISK_TIER_OPTIONS,
  normalizeCategory,
  normalizeRiskTier,
} from "@/lib/invoiceTaxonomy";

/** True once both a known category and a known risk tier are saved. */
export function isInvoiceClassified(invoice: {
  category?: string | null;
  risk_tier?: string | null;
}): boolean {
  return (
    normalizeCategory(invoice.category) !== null &&
    normalizeRiskTier(invoice.risk_tier) !== null
  );
}

interface InvoiceClassificationFormProps {
  invoiceId: string;
  category?: string | null;
  riskTier?: string | null;
  token?: string | null;
  onSaved: (classification: InvoiceClassification) => void;
}

const selectClassName =
  "h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function InvoiceClassificationForm({
  invoiceId,
  category,
  riskTier,
  token,
  onSaved,
}: InvoiceClassificationFormProps) {
  const savedCategory = normalizeCategory(category) ?? "";
  const savedRiskTier = normalizeRiskTier(riskTier) ?? "";
  const [draftCategory, setDraftCategory] = useState<string>(savedCategory);
  const [draftRiskTier, setDraftRiskTier] = useState<string>(savedRiskTier);

  // Follow the server values when they change underneath us (refetch, save).
  useEffect(() => setDraftCategory(savedCategory), [savedCategory]);
  useEffect(() => setDraftRiskTier(savedRiskTier), [savedRiskTier]);

  const mutation = useMutation({
    mutationFn: (classification: InvoiceClassification) =>
      assignInvoiceClassification(invoiceId, classification, token ?? undefined),
    onSuccess: (saved) => {
      toast.success("Category and risk tier saved");
      onSaved(saved);
    },
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to save category and risk tier"
      ),
  });

  const isDirty = draftCategory !== savedCategory || draftRiskTier !== savedRiskTier;
  const canSave = Boolean(draftCategory && draftRiskTier) && isDirty && !mutation.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={`classification-form-${invoiceId}`}>
      <label className="sr-only" htmlFor={`category-${invoiceId}`}>
        Category
      </label>
      <select
        id={`category-${invoiceId}`}
        className={selectClassName}
        value={draftCategory}
        onChange={(e) => setDraftCategory(e.target.value)}
        data-testid={`category-select-${invoiceId}`}
      >
        <option value="">Category…</option>
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor={`risk-tier-${invoiceId}`}>
        Risk tier
      </label>
      <select
        id={`risk-tier-${invoiceId}`}
        className={selectClassName}
        value={draftRiskTier}
        onChange={(e) => setDraftRiskTier(e.target.value)}
        data-testid={`risk-tier-select-${invoiceId}`}
      >
        <option value="">Risk tier…</option>
        {RISK_TIER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Button
        size="sm"
        variant="outline"
        className="h-8"
        disabled={!canSave}
        onClick={() =>
          mutation.mutate({ category: draftCategory, risk_tier: draftRiskTier })
        }
        data-testid={`save-classification-${invoiceId}`}
      >
        {mutation.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
