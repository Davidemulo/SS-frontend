"use client";

import Link from "next/link";
import { CalendarClock, Info, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { truncateAddress } from "@/lib/stellar";
import {
  compareToOriginalYield,
  daysUntil,
  isSoldOut,
  listingImpliedYield,
  type YieldPricing,
} from "@/lib/secondaryMarket";
import type { ResaleListing } from "@/lib/api";

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

const PRICING_BADGE: Record<YieldPricing, { label: string; className: string }> = {
  discount: { label: "Discount", className: "border-green-500 text-green-600" },
  premium: { label: "Premium", className: "border-red-500 text-red-600" },
  par: { label: "At original", className: "" },
};

export function SecondaryListingSkeleton() {
  return (
    <Card data-testid="secondary-listing-skeleton">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

interface SecondaryListingCardProps {
  listing: ResaleListing;
  onBuy: (listing: ResaleListing) => void;
  /** Address of the connected wallet, so sellers cannot buy their own listing. */
  currentAddress?: string | null;
  isBuying?: boolean;
}

/**
 * One listing in the secondary-market grid (issue #380): invoice name,
 * fraction quantity, ask price, implied yield and seller.
 */
export function SecondaryListingCard({
  listing,
  onBuy,
  currentAddress,
  isBuying,
}: SecondaryListingCardProps) {
  const yieldPct = listingImpliedYield(listing);
  const comparison = compareToOriginalYield(yieldPct, listing.original_yield_percentage);
  const days = daysUntil(listing.maturity_date);
  const soldOut = isSoldOut(listing);
  const isOwnListing =
    Boolean(currentAddress) && currentAddress === listing.seller;

  return (
    <Card data-testid={`secondary-listing-${listing.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/marketplace/${listing.invoice_id}`}
            className="min-w-0 font-semibold hover:underline"
            data-testid={`listing-invoice-link-${listing.id}`}
          >
            <span className="line-clamp-2">{listing.invoice_title}</span>
          </Link>
          <Badge variant={soldOut ? "secondary" : "outline"} className="shrink-0">
            {soldOut ? "Sold out" : listing.invoice_type.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Fractions</p>
            <p className="font-medium" data-testid={`listing-quantity-${listing.id}`}>
              {listing.remaining_quantity} of {listing.quantity}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Ask price</p>
            <p className="font-medium" data-testid={`listing-ask-price-${listing.id}`}>
              {formatPrice(listing.ask_price)} XLM
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>Implied yield</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="cursor-default"
                    aria-label="How implied yield is calculated"
                    data-testid={`listing-yield-tooltip-${listing.id}`}
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left">
                  Annualised return from buying at the ask price: (maturity value − ask price) ÷
                  ask price, scaled to a year over the days left until maturity. Updates as the
                  ask price changes.
                </TooltipContent>
              </Tooltip>
            </div>
            <p
              className="flex items-center gap-1 font-medium"
              data-testid={`listing-implied-yield-${listing.id}`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {yieldPct.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`listing-original-yield-${listing.id}`}>
              Original:{" "}
              {listing.original_yield_percentage != null
                ? `${listing.original_yield_percentage.toFixed(2)}%`
                : "—"}
            </p>
            {comparison && (
              <Badge
                variant="outline"
                className={`mt-1 ${PRICING_BADGE[comparison.pricing].className}`}
                data-testid={`listing-pricing-badge-${listing.id}`}
              >
                {comparison.pricing === "par"
                  ? PRICING_BADGE.par.label
                  : `${comparison.differencePoints > 0 ? "+" : "−"}${Math.abs(
                      comparison.differencePoints
                    ).toFixed(2)} pts · ${PRICING_BADGE[comparison.pricing].label}`}
              </Badge>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Maturity</p>
            <p className="flex items-center gap-1 font-medium">
              <CalendarClock className="h-3.5 w-3.5" />
              {Number.isFinite(days) ? `${days}d` : "—"}
            </p>
          </div>
        </div>

        <p
          className="text-xs text-muted-foreground"
          data-testid={`listing-seller-${listing.id}`}
        >
          Seller: {listing.seller ? truncateAddress(listing.seller) : "Unknown"}
        </p>

        {soldOut ? (
          <p className="text-sm text-muted-foreground" data-testid={`listing-sold-out-${listing.id}`}>
            This listing has been fully purchased.
          </p>
        ) : isOwnListing ? (
          <p className="text-sm text-muted-foreground" data-testid={`listing-own-${listing.id}`}>
            This is your own listing.
          </p>
        ) : (
          <Button
            className="w-full"
            onClick={() => onBuy(listing)}
            disabled={isBuying}
            data-testid={`buy-fraction-btn-${listing.id}`}
          >
            Buy fractions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
