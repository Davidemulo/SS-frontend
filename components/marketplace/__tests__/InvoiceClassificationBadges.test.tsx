import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InvoiceClassificationBadges } from "../InvoiceClassificationBadges";

describe("InvoiceClassificationBadges (#468)", () => {
  it("shows the saved category and risk tier", () => {
    render(
      <InvoiceClassificationBadges
        invoice={{ id: "inv-1", category: "infrastructure", risk_tier: "high" }}
      />
    );

    expect(screen.getByTestId("invoice-category-badge")).toHaveTextContent("Infrastructure");
    expect(screen.getByTestId("invoice-risk-tier-badge")).toHaveTextContent("High Risk");
  });

  it("falls back to the risk grade when no tier is saved", () => {
    render(
      <InvoiceClassificationBadges
        invoice={{ id: "inv-1", category: "sme", risk_rating: { tier: "A" } }}
      />
    );

    expect(screen.getByTestId("invoice-risk-tier-badge")).toHaveTextContent("Low Risk");
  });

  it("renders nothing for an unclassified invoice", () => {
    const { container } = render(<InvoiceClassificationBadges invoice={{ id: "inv-1" }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
