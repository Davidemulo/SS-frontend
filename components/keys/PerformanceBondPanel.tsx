"use client";

import { AlertCircle, CheckCircle2, Shield, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PerformanceBond } from "@/lib/api";

interface PerformanceBondPanelProps {
  bond?: PerformanceBond | null;
}

const BOND_STATE_ICON = {
  staked: <Shield className="h-5 w-5 text-blue-600" />,
  released: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  forfeited: <XCircle className="h-5 w-5 text-destructive" />,
} as const;

const BOND_STATE_LABEL = {
  staked: "Staked",
  released: "Released",
  forfeited: "Forfeited",
} as const;

const BOND_STATE_COLOR = {
  staked: "text-blue-600 bg-blue-50",
  released: "text-green-600 bg-green-50",
  forfeited: "text-destructive bg-red-50",
} as const;

/**
 * Displays creator's performance bond status on the key detail page.
 * Shows bond amount, current state, maturity milestone, and additional info.
 * Hidden if key has no performance bond.
 */
export function PerformanceBondPanel({ bond }: PerformanceBondPanelProps) {
  // Hide panel if no bond exists
  if (!bond) return null;

  const formattedAmount = bond.amount.toLocaleString();
  const releaseDate = bond.release_timestamp
    ? new Date(bond.release_timestamp).toLocaleDateString()
    : null;

  return (
    <Card data-testid="performance-bond-panel">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg">Performance Bond</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex">
                  <AlertCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs" side="top">
                <p>
                  The performance bond is a guarantee that protects investors.
                  If the creator fails to meet their obligations, the bond can
                  be forfeited to compensate investors. A staked bond indicates
                  the creator&apos;s commitment to deliver on their promises.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bond Amount */}
        <div className="flex justify-between items-start">
          <span className="text-sm text-muted-foreground">Bond Amount</span>
          <span
            className="font-semibold text-foreground"
            data-testid="bond-amount"
          >
            {formattedAmount} XLM
          </span>
        </div>
              creator&apos;s commitment to deliver on their promises.
        {/* Bond State */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Current State</span>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${BOND_STATE_COLOR[bond.state]}`}
            data-testid={`bond-state-${bond.state}`}
          >
            {BOND_STATE_ICON[bond.state]}
            {BOND_STATE_LABEL[bond.state]}
          </div>
        </div>

        {/* Maturity Milestone */}
        {bond.maturity_milestone && (
          <div className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground">
              Maturity Milestone
            </span>
            <span
              className="text-sm font-medium text-foreground"
              data-testid="maturity-milestone"
            >
              {bond.maturity_milestone}
            </span>
          </div>
        )}

        {/* Released State Additional Info */}
        {bond.state === "released" && releaseDate && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3">
            <p className="text-sm text-green-900">
              Bond released on <strong>{releaseDate}</strong>
            </p>
          </div>
        )}

        {/* Forfeited State with Reason */}
        {bond.state === "forfeited" && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm font-medium text-destructive mb-1">
              Bond Forfeited
            </p>
            {bond.forfeiture_reason && (
              <p
                className="text-xs text-destructive"
                data-testid="forfeiture-reason"
              >
                {bond.forfeiture_reason}
              </p>
            )}
          </div>
        )}

        {/* Staked State Additional Info */}
        {bond.state === "staked" && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm text-blue-900">
              Bond is actively staked to guarantee creator obligations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
