"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ratingsApi, type Invoice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          id={`rating-star-${n}`}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-125"
        >
          <Star className={cn("h-8 w-8", n <= shown ? "fill-amber-400 text-amber-400" : "text-neutral-300")} />
        </button>
      ))}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-4 w-4", n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-neutral-300")}
        />
      ))}
    </span>
  );
}

export function RatingModal({
  invoice,
  wallet,
  open,
  onClose,
}: {
  invoice: Invoice;
  wallet: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [score, setScore] = useState(0);
  const m = useMutation({
    mutationFn: () => ratingsApi.submit(invoice.id, { wallet, score }),
    onSuccess: (summary) => {
      qc.setQueryData(["ratings", invoice.id, wallet], { ...summary, wallet_rating: score });
      qc.invalidateQueries({ queryKey: ["ratings", invoice.id] });
      toast({ title: "RatingSubmitted", description: `You rated ${invoice.name} ${score}/5` });
      onClose();
    },
  });
  return (
    <Modal open={open} onClose={onClose} title={`Rate ${invoice.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This invoice has settled. How was your experience?</p>
        <StarRatingInput value={score} onChange={setScore} />
        {m.isError && <p className="text-sm text-red-600">Failed to submit rating.</p>}
        <Button id="submit-rating" className="w-full" disabled={!score || m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? "Submitting…" : "Submit rating"}
        </Button>
      </div>
    </Modal>
  );
}

export function AggregateRating({ invoice, wallet }: { invoice: Invoice; wallet: string | null }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["ratings", invoice.id, wallet],
    queryFn: () => ratingsApi.summary(invoice.id, wallet ?? undefined),
  });
  if (!data) return null;
  const rated = data.wallet_rating != null;

  return (
    <Card id="aggregate-rating">
      <CardHeader>
        <CardTitle>Investor Rating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold">{data.average.toFixed(1)}</span>
          <div>
            <Stars value={data.average} />
            <p className="text-sm text-muted-foreground">{data.count} ratings</p>
          </div>
        </div>
        <div className="space-y-1">
          {([5, 4, 3, 2, 1] as const).map((n) => {
            const c = data.distribution[n] ?? 0;
            const pct = data.count ? (c / data.count) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-sm">
                <span className="w-6">{n}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right">{c}</span>
              </div>
            );
          })}
        </div>
        {rated ? (
          <p id="already-rated" className="flex items-center gap-2 text-sm">
            You rated this invoice <Stars value={data.wallet_rating!} />
          </p>
        ) : (
          wallet &&
          invoice.status === "settled" && (
            <>
              <Button id="open-rating-modal" variant="outline" onClick={() => setOpen(true)}>
                Rate this invoice
              </Button>
              <RatingModal invoice={invoice} wallet={wallet} open={open} onClose={() => setOpen(false)} />
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
