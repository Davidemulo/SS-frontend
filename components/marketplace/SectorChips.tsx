"use client";

import { CATEGORY_OPTIONS, type InvoiceCategory } from "@/lib/invoiceTaxonomy";

interface SectorChipsProps {
  selected: InvoiceCategory[];
  onToggle: (category: InvoiceCategory) => void;
  onReset: () => void;
  /** Live invoices per sector, shown inside each chip. */
  counts: Record<InvoiceCategory, number>;
}

const CHIP_BASE =
  "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors";
const CHIP_ACTIVE = `${CHIP_BASE} bg-primary text-primary-foreground`;
const CHIP_IDLE = `${CHIP_BASE} border border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground`;

/**
 * Horizontal row of sector toggles below the marketplace header (#477).
 *
 * Unlike `CategoryTabs`, several sectors can be active at once, so each chip is
 * a toggle button (`aria-pressed`) rather than a tab. The row scrolls sideways
 * on narrow screens instead of wrapping, keeping the grid's position stable.
 */
export function SectorChips({ selected, onToggle, onReset, counts }: SectorChipsProps) {
  const noneSelected = selected.length === 0;

  return (
    <div
      role="group"
      aria-label="Filter by sector"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
      data-testid="sector-chips"
    >
      <button
        type="button"
        aria-pressed={noneSelected}
        onClick={onReset}
        className={noneSelected ? CHIP_ACTIVE : CHIP_IDLE}
        data-testid="sector-chip-reset"
      >
        Reset All
      </button>
      {CATEGORY_OPTIONS.map(({ value, label }) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(value)}
            className={active ? CHIP_ACTIVE : CHIP_IDLE}
            data-testid={`sector-chip-${value}`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-70" data-testid={`sector-chip-count-${value}`}>
              {counts[value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
