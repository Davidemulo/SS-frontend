import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectorChips } from "../SectorChips";
import { sectorCounts } from "@/lib/invoiceTaxonomy";

const COUNTS = { trade_finance: 3, real_estate: 0, sme: 5, infrastructure: 1 };

describe("SectorChips (#477)", () => {
  it("shows counts and highlights several selected sectors", () => {
    render(<SectorChips selected={["sme", "infrastructure"]} onToggle={vi.fn()} onReset={vi.fn()} counts={COUNTS} />);
    expect(screen.getByTestId("sector-chip-count-sme")).toHaveTextContent("5");
    expect(screen.getByTestId("sector-chip-sme")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("sector-chip-infrastructure")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("sector-chip-real_estate")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("sector-chip-reset")).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles the clicked sector and resets on Reset All", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onReset = vi.fn();
    render(<SectorChips selected={["sme"]} onToggle={onToggle} onReset={onReset} counts={COUNTS} />);

    await user.click(screen.getByTestId("sector-chip-real_estate"));
    expect(onToggle).toHaveBeenCalledWith("real_estate");
    await user.click(screen.getByTestId("sector-chip-reset"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe("sectorCounts (#477)", () => {
  it("counts only open, recognised sectors", () => {
    const counts = sectorCounts([
      { status: "open", category: "sme" },
      { status: "open", category: "Trade Finance" },
      { status: "funded", category: "sme" },
      { status: "open", category: "agriculture" },
      { status: "open" },
    ]);
    expect(counts).toEqual({ trade_finance: 1, real_estate: 0, sme: 1, infrastructure: 0 });
  });
});
