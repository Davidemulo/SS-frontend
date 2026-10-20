"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { extensionsApi, invoicesApi, type ExtensionProposal, type Invoice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface Props {
  invoice: Invoice;
  wallet: string | null;
  isHolder: boolean;
}

export function ExtensionProposalSection({ invoice, wallet, isHolder }: Props) {
  const isIssuer = !!wallet && wallet === invoice.issuer_wallet;
  const { data: proposal } = useQuery({
    queryKey: ["extension", invoice.id],
    queryFn: () => extensionsApi.active(invoice.id),
  });

  if (invoice.status !== "overdue" && proposal?.status !== "executed") return null;

  return (
    <section id="extension-proposal" className="space-y-4">
      <h2 className="text-xl font-semibold">Extension Proposal</h2>
      {proposal?.status === "executed" ? (
        <ExtensionExecutedBanner date={proposal.proposed_maturity_date} />
      ) : proposal?.status === "active" ? (
        <ActiveProposalCard proposal={proposal} invoiceId={invoice.id} wallet={wallet} isHolder={isHolder} />
      ) : isIssuer ? (
        <ProposeExtensionPanel invoice={invoice} />
      ) : (
        <p className="text-sm text-muted-foreground">No active extension proposal.</p>
      )}
    </section>
  );
}

function ExtensionExecutedBanner({ date }: { date: string }) {
  return (
    <div
      id="extension-executed-banner"
      className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-700"
    >
      <CheckCircle2 className="h-5 w-5" />
      <p>
        <strong>Extension executed.</strong> New maturity date:{" "}
        <strong>{format(new Date(date), "PPP")}</strong>
      </p>
    </div>
  );
}

function ProposeExtensionPanel({ invoice }: { invoice: Invoice }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const minDate = new Date(Math.max(Date.now(), new Date(invoice.maturity_date).getTime()) + 864e5)
    .toISOString()
    .slice(0, 10);

  const m = useMutation({
    mutationFn: () => extensionsApi.propose(invoice.id, { proposed_maturity_date: date, reason }),
    onSuccess: (p) => {
      qc.setQueryData(["extension", invoice.id], p);
      toast({ title: "Extension proposed" });
    },
  });

  return (
    <Card id="propose-extension-panel">
      <CardHeader>
        <CardTitle>Propose Extension</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="new-maturity-date">New maturity date</Label>
            <Input
              id="new-maturity-date"
              type="date"
              min={minDate}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="extension-reason">Reason</Label>
            <textarea
              id="extension-reason"
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          {m.isError && <p className="text-sm text-red-600">Failed to submit proposal.</p>}
          <Button id="submit-extension-proposal" type="submit" disabled={m.isPending || !date || !reason.trim()}>
            {m.isPending ? "Submitting…" : "Submit proposal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ActiveProposalCard({
  proposal,
  invoiceId,
  wallet,
  isHolder,
}: {
  proposal: ExtensionProposal;
  invoiceId: string;
  wallet: string | null;
  isHolder: boolean;
}) {
  const [open, setOpen] = useState(false);
  const cast = proposal.votes_for + proposal.votes_against;
  const forPct = cast ? (proposal.votes_for / cast) * 100 : 0;
  const quorumPct = proposal.quorum ? Math.min(100, (cast / proposal.quorum) * 100) : 0;
  const ended = isPast(new Date(proposal.ends_at));

  return (
    <Card id="active-extension-proposal">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" /> Proposed maturity:{" "}
          {format(new Date(proposal.proposed_maturity_date), "PPP")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{proposal.reason}</p>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-emerald-600">For {proposal.votes_for.toLocaleString()}</span>
            <span className="text-red-600">Against {proposal.votes_against.toLocaleString()}</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-red-500/70">
            <div className="bg-emerald-500" style={{ width: `${forPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Quorum progress</span>
            <span>
              {cast.toLocaleString()} / {proposal.quorum.toLocaleString()} ({quorumPct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${quorumPct}%` }} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {ended ? "Voting ended" : `${formatDistanceToNowStrict(new Date(proposal.ends_at))} remaining`}
        </p>
        {isHolder && wallet && !ended && (
          <Button id="open-vote-modal" onClick={() => setOpen(true)}>
            Vote
          </Button>
        )}
      </CardContent>
      {wallet && (
        <VoteModal open={open} onClose={() => setOpen(false)} proposal={proposal} invoiceId={invoiceId} wallet={wallet} />
      )}
    </Card>
  );
}

function VoteModal({
  open,
  onClose,
  proposal,
  invoiceId,
  wallet,
}: {
  open: boolean;
  onClose: () => void;
  proposal: ExtensionProposal;
  invoiceId: string;
  wallet: string;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [support, setSupport] = useState<boolean | null>(null);
  const { data: weight } = useQuery({
    queryKey: ["holder-weight", invoiceId, wallet],
    queryFn: () => invoicesApi.holderWeight(invoiceId, wallet),
    enabled: open,
  });
  const m = useMutation({
    mutationFn: () => extensionsApi.vote(proposal.id, { wallet, support: !!support }),
    onSuccess: (p) => {
      qc.setQueryData(["extension", invoiceId], p);
      toast({ title: "Vote submitted" });
      onClose();
    },
  });

  const share = weight && proposal.total_weight ? (weight.weight / proposal.total_weight) * 100 : 0;

  return (
    <Modal open={open} onClose={onClose} title="Vote on extension">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              id={v ? "vote-for" : "vote-against"}
              type="button"
              onClick={() => setSupport(v)}
              className={`rounded-lg border py-3 font-medium transition ${
                support === v
                  ? v
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-red-500 bg-red-500 text-white"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {v ? "For" : "Against"}
            </button>
          ))}
        </div>
        <p className="text-sm">
          Estimated weight:{" "}
          <strong>{weight ? `${weight.weight.toLocaleString()} (${share.toFixed(2)}%)` : "…"}</strong>
        </p>
        {m.isError && <p className="text-sm text-red-600">Vote failed.</p>}
        <Button id="submit-vote" className="w-full" disabled={support === null || m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? "Submitting…" : "Submit vote"}
        </Button>
      </div>
    </Modal>
  );
}
