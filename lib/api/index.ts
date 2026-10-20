import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
});

export type InvoiceStatus = "open" | "funded" | "overdue" | "settled" | "defaulted";

export interface Invoice {
  id: string;
  name: string;
  sector: string;
  issuer_wallet: string;
  amount: number;
  yield: number;
  maturity_date: string;
  status: InvoiceStatus;
}

export interface ExtensionProposal {
  id: string;
  invoice_id: string;
  proposed_maturity_date: string;
  reason: string;
  votes_for: number;
  votes_against: number;
  quorum: number;
  total_weight: number;
  ends_at: string;
  status: "active" | "executed" | "rejected";
}

export interface RatingSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  wallet_rating?: number | null;
}

export interface PoolInvoice {
  invoice_id: string;
  name: string;
  sector: string;
  weight: number; // percent
  yield: number;
  status: InvoiceStatus;
}

export interface Pool {
  id: string;
  name: string;
  tvl: number;
  weighted_yield: number;
  invoice_count: number;
  invoices: PoolInvoice[];
}

export interface BlacklistInfo {
  is_blacklisted: boolean;
  reason?: string | null;
  blacklisted_at?: string | null;
}

export interface Holding {
  invoice: Invoice;
  amount: number;
}

const get = <T,>(url: string, params?: object) => api.get<T>(url, { params }).then((r) => r.data);
const post = <T,>(url: string, body?: object) => api.post<T>(url, body).then((r) => r.data);

export const invoicesApi = {
  get: (id: string) => get<Invoice>(`/invoices/${id}`),
  byIssuer: (wallet: string) => get<Invoice[]>(`/issuers/${wallet}/invoices`),
  holderWeight: (id: string, wallet: string) =>
    get<{ weight: number }>(`/invoices/${id}/holders/${wallet}/weight`),
};

export const extensionsApi = {
  active: (invoiceId: string) =>
    get<ExtensionProposal | null>(`/invoices/${invoiceId}/extension-proposal`),
  propose: (invoiceId: string, body: { proposed_maturity_date: string; reason: string }) =>
    post<ExtensionProposal>(`/invoices/${invoiceId}/extension-proposal`, body),
  vote: (proposalId: string, body: { wallet: string; support: boolean }) =>
    post<ExtensionProposal>(`/extension-proposals/${proposalId}/votes`, body),
};

export const ratingsApi = {
  summary: (invoiceId: string, wallet?: string) =>
    get<RatingSummary>(`/invoices/${invoiceId}/ratings`, wallet ? { wallet } : undefined),
  submit: (invoiceId: string, body: { wallet: string; score: number }) =>
    post<RatingSummary>(`/invoices/${invoiceId}/ratings`, body),
};

export const poolsApi = {
  list: () => get<Pool[]>(`/pools`),
  get: (id: string) => get<Pool>(`/pools/${id}`),
  invest: (id: string, body: { wallet: string; amount: number }) =>
    post<{ tx_hash: string }>(`/pools/${id}/invest`, body),
};

export const issuersApi = {
  blacklist: (wallet: string) => get<BlacklistInfo>(`/issuers/${wallet}/blacklist`),
};

export const portfolioApi = {
  holdings: (wallet: string) => get<Holding[]>(`/portfolio/${wallet}`),
};
