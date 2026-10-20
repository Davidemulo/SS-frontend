"use client";

/**
 * Admin fee schedule editor (#440): editable rates, a diff-and-impact confirm
 * step that must be acknowledged before saving, and the change history log.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiForbiddenError,
  fetchFeeChangeHistory,
  fetchFeeSchedule,
  type FeeType,
  updateFeeSchedule,
} from "@/lib/api";
import {
  FEE_TYPE_LABELS,
  MAX_FEE_PERCENT,
  SAMPLE_INVESTMENT_XLM,
  collectFeeChanges,
  previewFeeChanges,
} from "@/lib/feeConfig";
import { truncateAddress } from "@/lib/stellar";

export const FEE_SCHEDULE_QUERY_KEY = ["admin", "fee-schedule"] as const;
export const FEE_HISTORY_QUERY_KEY = ["admin", "fee-history"] as const;

interface FeeConfigPanelProps {
  token: string;
}

export function FeeConfigPanel({ token }: FeeConfigPanelProps) {
  const queryClient = useQueryClient();
  const schedule = useQuery({
    queryKey: FEE_SCHEDULE_QUERY_KEY,
    queryFn: fetchFeeSchedule,
  });
  const history = useQuery({
    queryKey: FEE_HISTORY_QUERY_KEY,
    queryFn: () => fetchFeeChangeHistory(token),
    retry: false,
  });

  const [drafts, setDrafts] = useState<Partial<Record<FeeType, string>>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const fees = schedule.data?.fees ?? [];
  const { changes, invalid } = useMemo(
    () => collectFeeChanges(fees, drafts),
    [fees, drafts]
  );
  const preview = useMemo(() => previewFeeChanges(fees, changes), [fees, changes]);

  const save = useMutation({
    mutationFn: () => updateFeeSchedule(changes, token),
    onSuccess: () => {
      toast.success("Fee schedule updated");
      setDrafts({});
      setReviewOpen(false);
      setAcknowledged(false);
      queryClient.invalidateQueries({ queryKey: FEE_SCHEDULE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FEE_HISTORY_QUERY_KEY });
    },
  });

  const forbidden =
    history.error instanceof ApiForbiddenError || save.error instanceof ApiForbiddenError;

  if (forbidden) {
    return (
      <p role="alert" className="rounded-md border border-destructive/50 p-4 text-sm text-destructive" data-testid="fee-config-forbidden">
        Access denied. This wallet is not an admin.
      </p>
    );
  }

  if (schedule.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading fee schedule…</p>;
  }
  if (schedule.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load the fee schedule.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee schedule</CardTitle>
          <CardDescription>
            Rates are percentages between 0 and {MAX_FEE_PERCENT}. Changes apply to new
            transactions only and are recorded in the history below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fees.map((fee) => {
            const draft = drafts[fee.fee_type] ?? String(fee.rate_percentage);
            const isInvalid = invalid.includes(fee.fee_type);
            return (
              <div key={fee.fee_type} className="grid items-center gap-3 sm:grid-cols-[1fr_9rem]">
                <div>
                  <Label htmlFor={`fee-${fee.fee_type}`}>{FEE_TYPE_LABELS[fee.fee_type]}</Label>
                  <p className="text-xs text-muted-foreground">{fee.when_applies}</p>
                </div>
                <div className="space-y-1">
                  <Input
                    id={`fee-${fee.fee_type}`}
                    type="number"
                    inputMode="decimal"
                    step="0.0001"
                    min={0}
                    max={MAX_FEE_PERCENT}
                    value={draft}
                    aria-invalid={isInvalid}
                    data-testid={`fee-input-${fee.fee_type}`}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [fee.fee_type]: event.target.value }))
                    }
                  />
                  {isInvalid && (
                    <p className="text-xs text-destructive">Enter a rate from 0 to {MAX_FEE_PERCENT}.</p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-sm text-muted-foreground">
              {changes.length === 0
                ? "No pending changes."
                : `${changes.length} pending change${changes.length === 1 ? "" : "s"}`}
            </p>
            <Button
              onClick={() => {
                setAcknowledged(false);
                setReviewOpen(true);
              }}
              disabled={changes.length === 0 || invalid.length > 0}
              data-testid="review-fee-changes"
            >
              Review changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={reviewOpen} onOpenChange={(open) => !open && setReviewOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm fee changes</DialogTitle>
            <DialogDescription>
              Review each change and its effect on a {SAMPLE_INVESTMENT_XLM.toLocaleString()} XLM
              investment before saving.
            </DialogDescription>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Impact (XLM)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row) => (
                <TableRow key={row.fee_type} data-testid={`fee-diff-${row.fee_type}`}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right">{row.oldRate}%</TableCell>
                  <TableCell className="text-right font-medium">{row.newRate}%</TableCell>
                  <TableCell className="text-right">
                    {row.sampleImpactXlm > 0 ? "+" : ""}
                    {row.sampleImpactXlm.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              data-testid="fee-impact-ack"
            />
            <span>
              I understand these rates apply to all new transactions immediately and affect
              what investors and issuers are charged.
            </span>
          </label>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={!acknowledged || save.isPending}
              data-testid="apply-fee-changes"
            >
              {save.isPending ? "Saving…" : "Apply changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Change history</CardTitle>
          <CardDescription>Every fee update, who made it and when.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.isLoading && <p className="text-sm text-muted-foreground">Loading history…</p>}
          {history.data && history.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No fee changes recorded yet.</p>
          )}
          {history.data && history.data.length > 0 && (
            <div className="overflow-x-auto">
              <Table data-testid="fee-history-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Changed by</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Old</TableHead>
                    <TableHead className="text-right">New</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs">{truncateAddress(entry.actor)}</TableCell>
                      <TableCell>{FEE_TYPE_LABELS[entry.fee_type] ?? entry.fee_type}</TableCell>
                      <TableCell className="text-right">{entry.old_rate_percentage}%</TableCell>
                      <TableCell className="text-right">{entry.new_rate_percentage}%</TableCell>
                      <TableCell className="text-xs">
                        {new Date(entry.changed_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {history.error && !forbidden && (
            <p role="alert" className="text-sm text-destructive">
              Could not load change history.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
