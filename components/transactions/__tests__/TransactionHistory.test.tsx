import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { TransactionHistory, sortNewestFirst } from "../TransactionHistory";
import * as api from "@/lib/api";
import type { PlatformTransaction } from "@/lib/api";

let authAddress: string | null = "GWALLET";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ address: authAddress, jwt: "jwt-token" }),
}));

vi.mock("@/hooks/useActiveNetwork", () => ({
  useActiveNetwork: () => ({ network: "testnet", setNetwork: vi.fn() }),
}));

let intersect: ((entries: { isIntersecting: boolean }[]) => void) | null = null;

class MockIntersectionObserver {
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    intersect = cb;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function tx(overrides: Partial<PlatformTransaction>): PlatformTransaction {
  return {
    id: "tx",
    type: "invest",
    amount: 100,
    currency: "XLM",
    status: "success",
    createdAt: "2026-05-01T10:00:00Z",
    txHash: "a".repeat(64),
    invoiceTitle: "Invoice",
    ...overrides,
  };
}

const firstPage: api.PlatformTransactionsResponse = {
  transactions: [
    tx({ id: "t-old", type: "invest", createdAt: "2026-05-01T10:00:00Z", txHash: "1".repeat(64) }),
    tx({ id: "t-new", type: "claim", createdAt: "2026-06-03T10:00:00Z", txHash: "2".repeat(64) }),
    tx({ id: "t-mid", type: "list", createdAt: "2026-05-20T10:00:00Z", txHash: "3".repeat(64), status: "pending" }),
  ],
  has_more: true,
  next_cursor: "cursor-2",
};

const secondPage: api.PlatformTransactionsResponse = {
  transactions: [
    tx({ id: "t-older", type: "settle", createdAt: "2026-01-01T10:00:00Z", txHash: "4".repeat(64) }),
  ],
  has_more: false,
  next_cursor: null,
};

function rowIds() {
  return within(screen.getByTestId("tx-history-list"))
    .getAllByRole("listitem")
    .map((li) => li.getAttribute("data-testid"));
}

beforeEach(() => {
  vi.restoreAllMocks();
  authAddress = "GWALLET";
  intersect = null;
});

describe("TransactionHistory (#294)", () => {
  it("lists transactions in reverse chronological order", async () => {
    vi.spyOn(api, "fetchWalletTransactions").mockResolvedValue({ ...firstPage, has_more: false });
    renderWithClient(<TransactionHistory />);

    await screen.findByTestId("tx-history-list");
    expect(rowIds()).toEqual(["tx-row-t-new", "tx-row-t-mid", "tx-row-t-old"]);
  });

  it("labels each type and shows amount and status", async () => {
    vi.spyOn(api, "fetchWalletTransactions").mockResolvedValue({ ...firstPage, has_more: false });
    renderWithClient(<TransactionHistory />);

    expect(await screen.findByTestId("tx-type-t-new")).toHaveTextContent("Claim");
    expect(screen.getByTestId("tx-type-t-mid")).toHaveTextContent("List");
    expect(screen.getByTestId("tx-type-t-old")).toHaveTextContent("Invest");
    expect(screen.getByTestId("tx-amount-t-new")).toHaveTextContent("100 XLM");
    expect(screen.getByTestId("tx-status-t-mid")).toHaveTextContent("Pending");
  });

  it("links each transaction to Stellar Expert on the active network", async () => {
    vi.spyOn(api, "fetchWalletTransactions").mockResolvedValue({ ...firstPage, has_more: false });
    renderWithClient(<TransactionHistory />);

    const row = await screen.findByTestId("tx-row-t-new");
    expect(within(row).getByTestId("tx-hash-explorer-link")).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/testnet/tx/${"2".repeat(64)}`
    );
  });

  it("filters by type, asking the server for that type", async () => {
    const fetchSpy = vi
      .spyOn(api, "fetchWalletTransactions")
      .mockImplementation(async (_address, options) => ({
        transactions: firstPage.transactions.filter((t) => !options?.type || t.type === options.type),
        has_more: false,
        next_cursor: null,
      }));
    renderWithClient(<TransactionHistory />);

    await screen.findByTestId("tx-history-list");
    fireEvent.click(screen.getByTestId("tx-filter-claim"));

    await waitFor(() => expect(rowIds()).toEqual(["tx-row-t-new"]));
    expect(fetchSpy).toHaveBeenLastCalledWith("GWALLET", { cursor: undefined, type: "claim" }, "jwt-token");
    expect(screen.getByTestId("tx-filter-claim")).toHaveAttribute("aria-pressed", "true");
  });

  it("still narrows the list when the server ignores the type filter", async () => {
    vi.spyOn(api, "fetchWalletTransactions").mockResolvedValue({ ...firstPage, has_more: false });
    renderWithClient(<TransactionHistory />);

    await screen.findByTestId("tx-history-list");
    fireEvent.click(screen.getByTestId("tx-filter-invest"));

    await waitFor(() => expect(rowIds()).toEqual(["tx-row-t-old"]));
  });

  it("loads older transactions when scrolled to the bottom", async () => {
    const fetchSpy = vi
      .spyOn(api, "fetchWalletTransactions")
      .mockImplementation(async (_address, options) =>
        options?.cursor === "cursor-2" ? secondPage : firstPage
      );
    renderWithClient(<TransactionHistory />);

    await screen.findByTestId("tx-history-list");
    await act(async () => {
      intersect?.([{ isIntersecting: true }]);
    });

    await waitFor(() => expect(rowIds()).toContain("tx-row-t-older"));
    expect(fetchSpy).toHaveBeenCalledWith("GWALLET", { cursor: "cursor-2", type: undefined }, "jwt-token");
    expect(rowIds().at(-1)).toBe("tx-row-t-older");
  });

  it("shows an empty state", async () => {
    vi.spyOn(api, "fetchWalletTransactions").mockResolvedValue({
      transactions: [],
      has_more: false,
      next_cursor: null,
    });
    renderWithClient(<TransactionHistory />);

    expect(await screen.findByTestId("tx-history-empty")).toHaveTextContent("No transactions yet.");
  });

  it("asks the user to connect a wallet first", () => {
    authAddress = null;
    renderWithClient(<TransactionHistory />);

    expect(screen.getByTestId("tx-history-no-wallet")).toBeInTheDocument();
  });
});

describe("sortNewestFirst", () => {
  it("puts unparseable dates last", () => {
    const sorted = sortNewestFirst([
      tx({ id: "bad", createdAt: "not a date" }),
      tx({ id: "a", createdAt: "2026-01-01T00:00:00Z" }),
      tx({ id: "b", createdAt: "2026-02-01T00:00:00Z" }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["b", "a", "bad"]);
  });
});

describe("fetchWalletTransactions", () => {
  it("normalises backend spellings and drops unknown types", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          transactions: [
            { id: "1", type: "investment", amount: "50", tx_hash: "h1", created_at: "2026-01-01", status: "submitted" },
            { id: "2", type: "cancel_listing", amount: 0, hash: "h2", created_at: "2026-01-02" },
            { id: "3", type: "airdrop", amount: 1 },
          ],
          has_more: true,
          next_cursor: "n",
        })
      )
    );

    const page = await api.fetchWalletTransactions("GWALLET", { type: "invest" });

    expect(page.transactions.map((t) => [t.id, t.type, t.status, t.txHash])).toEqual([
      ["1", "invest", "pending", "h1"],
      ["2", "cancel", "success", "h2"],
    ]);
    expect(page.transactions[0].amount).toBe(50);
    expect(page.next_cursor).toBe("n");
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain("/wallets/GWALLET/transactions?type=invest");
  });
});
