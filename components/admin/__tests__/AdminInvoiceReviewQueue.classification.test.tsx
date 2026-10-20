import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { AdminInvoiceReviewQueue } from "../AdminInvoiceReviewQueue";
import { isInvoiceClassified } from "../InvoiceClassificationForm";
import * as api from "@/lib/api";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ jwt: "admin-jwt" }),
}));

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const unclassified: api.PendingInvoice = {
  id: "inv-1",
  title: "Unclassified invoice",
  seller: "GSELLER123456789012345678901234567890123456789012",
  face_value: 10000,
  submission_date: "2026-08-20",
  status: "pending_review",
};

const classified: api.PendingInvoice = {
  ...unclassified,
  id: "inv-2",
  title: "Classified invoice",
  category: "real_estate",
  risk_tier: "medium",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("AdminInvoiceReviewQueue classification (#468)", () => {
  it("renders every category and risk tier option", async () => {
    vi.spyOn(api, "fetchPendingInvoices").mockResolvedValue([unclassified]);
    renderWithClient(<AdminInvoiceReviewQueue />);

    const category = await screen.findByTestId("category-select-inv-1");
    const riskTier = screen.getByTestId("risk-tier-select-inv-1");

    const categoryOptions = within(category).getAllByRole("option").map((o) => o.textContent);
    expect(categoryOptions).toEqual([
      "Category…",
      "Trade Finance",
      "Real Estate",
      "SME",
      "Infrastructure",
    ]);
    const riskOptions = within(riskTier).getAllByRole("option").map((o) => o.textContent);
    expect(riskOptions).toEqual(["Risk tier…", "Low Risk", "Medium Risk", "High Risk"]);
  });

  it("disables approve until a category and risk tier are assigned", async () => {
    vi.spyOn(api, "fetchPendingInvoices").mockResolvedValue([unclassified, classified]);
    renderWithClient(<AdminInvoiceReviewQueue />);

    expect(await screen.findByTestId("approve-btn-inv-1")).toBeDisabled();
    expect(screen.getByTestId("classification-required-inv-1")).toBeInTheDocument();
    expect(screen.getByTestId("approve-btn-inv-2")).not.toBeDisabled();
    expect(screen.queryByTestId("classification-required-inv-2")).not.toBeInTheDocument();
  });

  it("saves the assignment and then enables approve", async () => {
    vi.spyOn(api, "fetchPendingInvoices").mockResolvedValue([unclassified]);
    const assignSpy = vi
      .spyOn(api, "assignInvoiceClassification")
      .mockResolvedValue({ category: "sme", risk_tier: "low" });
    renderWithClient(<AdminInvoiceReviewQueue />);

    const save = await screen.findByTestId("save-classification-inv-1");
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByTestId("category-select-inv-1"), { target: { value: "sme" } });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByTestId("risk-tier-select-inv-1"), { target: { value: "low" } });
    expect(save).not.toBeDisabled();

    fireEvent.click(save);

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(
        "inv-1",
        { category: "sme", risk_tier: "low" },
        "admin-jwt"
      );
      expect(screen.getByTestId("approve-btn-inv-1")).not.toBeDisabled();
    });
  });

  it("pre-fills saved values", async () => {
    vi.spyOn(api, "fetchPendingInvoices").mockResolvedValue([classified]);
    renderWithClient(<AdminInvoiceReviewQueue />);

    expect(await screen.findByTestId("category-select-inv-2")).toHaveValue("real_estate");
    expect(screen.getByTestId("risk-tier-select-inv-2")).toHaveValue("medium");
  });
});

describe("isInvoiceClassified", () => {
  it("requires both a known category and a known risk tier", () => {
    expect(isInvoiceClassified({})).toBe(false);
    expect(isInvoiceClassified({ category: "sme" })).toBe(false);
    expect(isInvoiceClassified({ category: "sme", risk_tier: "extreme" })).toBe(false);
    expect(isInvoiceClassified({ category: "Trade Finance", risk_tier: "HIGH" })).toBe(true);
  });
});
