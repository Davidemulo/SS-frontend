import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { KycDocumentStatusDashboard, validateKycFile } from "../KycDocumentStatusDashboard";
import * as api from "@/lib/api";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ jwt: "issuer-jwt" }),
}));

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const docs: api.KycDocumentStatus[] = [
  {
    type: "business_registration",
    status: "approved",
    submitted_at: "2026-01-02T00:00:00Z",
    verified_at: "2026-01-10T12:00:00Z",
    expires_at: null,
    rejection_reason: null,
  },
  {
    type: "director_id",
    status: "rejected",
    submitted_at: "2026-02-01T00:00:00Z",
    verified_at: null,
    expires_at: null,
    rejection_reason: "Photo is blurred",
  },
  {
    type: "proof_of_address",
    status: "expired",
    submitted_at: "2025-01-01T00:00:00Z",
    verified_at: "2025-01-05T12:00:00Z",
    expires_at: "2026-03-15T12:00:00Z",
    rejection_reason: null,
  },
];

function formatted(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pdf(name = "doc.pdf") {
  return new File(["%PDF-1.4"], name, { type: "application/pdf" });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("KycDocumentStatusDashboard (#469)", () => {
  it("renders the correct state for each document type", async () => {
    vi.spyOn(api, "fetchKycDocuments").mockResolvedValue(docs);
    renderWithClient(<KycDocumentStatusDashboard />);

    expect(await screen.findByTestId("kyc-doc-status-business_registration")).toHaveTextContent("Approved");
    expect(screen.getByTestId("kyc-doc-status-director_id")).toHaveTextContent("Rejected");
    expect(screen.getByTestId("kyc-doc-status-proof_of_address")).toHaveTextContent("Expired");
  });

  it("shows the verification date for approved documents", async () => {
    vi.spyOn(api, "fetchKycDocuments").mockResolvedValue(docs);
    renderWithClient(<KycDocumentStatusDashboard />);

    expect(await screen.findByTestId("kyc-doc-verified-business_registration")).toHaveTextContent(
      `Verified on ${formatted("2026-01-10T12:00:00Z")}`
    );
    expect(screen.queryByTestId("kyc-doc-cta-business_registration")).not.toBeInTheDocument();
  });

  it("shows the rejection reason and a resubmit CTA", async () => {
    vi.spyOn(api, "fetchKycDocuments").mockResolvedValue(docs);
    renderWithClient(<KycDocumentStatusDashboard />);

    expect(await screen.findByTestId("kyc-doc-reason-director_id")).toHaveTextContent("Photo is blurred");
    expect(screen.getByTestId("kyc-doc-cta-director_id")).toHaveTextContent("Resubmit");
  });

  it("shows the expiry date and a renew CTA", async () => {
    vi.spyOn(api, "fetchKycDocuments").mockResolvedValue(docs);
    renderWithClient(<KycDocumentStatusDashboard />);

    expect(await screen.findByTestId("kyc-doc-expiry-proof_of_address")).toHaveTextContent(
      `Expired on ${formatted("2026-03-15T12:00:00Z")}`
    );
    expect(screen.getByTestId("kyc-doc-cta-proof_of_address")).toHaveTextContent("Renew");
  });

  it("uploads a resubmitted document and moves it to pending", async () => {
    vi.spyOn(api, "fetchKycDocuments").mockResolvedValue(docs);
    const upload = vi.spyOn(api, "uploadDocument").mockResolvedValue({ url: "https://files/new-id.pdf" });
    const resubmit = vi.spyOn(api, "resubmitKycDocument").mockResolvedValue({
      ...docs[1],
      status: "pending",
      submitted_at: "2026-04-01T00:00:00Z",
      rejection_reason: null,
    });
    renderWithClient(<KycDocumentStatusDashboard />);

    const input = await screen.findByTestId("kyc-doc-file-director_id");
    const file = pdf("new-id.pdf");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith(file);
      expect(resubmit).toHaveBeenCalledWith("director_id", "https://files/new-id.pdf", "issuer-jwt");
      expect(screen.getByTestId("kyc-doc-status-director_id")).toHaveTextContent("Pending review");
    });
    expect(screen.queryByTestId("kyc-doc-cta-director_id")).not.toBeInTheDocument();
  });

  it("renews an expired document the same way", async () => {
    vi.spyOn(api, "fetchKycDocuments").mockResolvedValue(docs);
    vi.spyOn(api, "uploadDocument").mockResolvedValue({ url: "https://files/address.pdf" });
    const resubmit = vi.spyOn(api, "resubmitKycDocument").mockResolvedValue({
      ...docs[2],
      status: "pending",
    });
    renderWithClient(<KycDocumentStatusDashboard />);

    fireEvent.change(await screen.findByTestId("kyc-doc-file-proof_of_address"), {
      target: { files: [pdf()] },
    });

    await waitFor(() => {
      expect(resubmit).toHaveBeenCalledWith("proof_of_address", "https://files/address.pdf", "issuer-jwt");
      expect(screen.getByTestId("kyc-doc-status-proof_of_address")).toHaveTextContent("Pending review");
    });
  });

  it("rejects an unsupported file before uploading", async () => {
    vi.spyOn(api, "fetchKycDocuments").mockResolvedValue(docs);
    const upload = vi.spyOn(api, "uploadDocument");
    renderWithClient(<KycDocumentStatusDashboard />);

    fireEvent.change(await screen.findByTestId("kyc-doc-file-director_id"), {
      target: { files: [new File(["x"], "id.txt", { type: "text/plain" })] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload a PDF, JPG or PNG file");
    expect(upload).not.toHaveBeenCalled();
  });

  it("marks document types the issuer has not submitted", async () => {
    vi.spyOn(api, "fetchKycDocuments").mockResolvedValue([docs[0]]);
    renderWithClient(<KycDocumentStatusDashboard />);

    expect(await screen.findByTestId("kyc-doc-director_id")).toHaveAttribute("data-status", "missing");
  });
});

describe("validateKycFile", () => {
  it("accepts PDF and images under 10 MB", () => {
    expect(validateKycFile(pdf())).toBeNull();
    expect(validateKycFile(new File(["x"], "a.png", { type: "image/png" }))).toBeNull();
  });

  it("rejects empty files", () => {
    expect(validateKycFile(new File([], "a.pdf", { type: "application/pdf" }))).toBe("File cannot be empty");
  });
});
