"use client";

/**
 * Investor accreditation upgrade flow (#451)
 *
 * Modal for submitting accreditation documents and checking upgrade status.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, FileUp } from "lucide-react";
import { AccreditationTierBadge } from "./AccreditationTierBadge";

interface AccreditationUpgradeFlowProps {
  currentTier: "unaccredited" | "accredited" | "qualified";
  hasPendingApplication?: boolean;
  estimatedReviewDays?: number;
  onUpgradeClick: () => void;
}

export function AccreditationUpgradeFlow({
  currentTier,
  hasPendingApplication = false,
  estimatedReviewDays = 3,
  onUpgradeClick,
}: AccreditationUpgradeFlowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const canUpgrade = currentTier === "unaccredited" && !hasPendingApplication;

  return (
    <>
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Accreditation Status</CardTitle>
            <AccreditationTierBadge tier={currentTier} size="sm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTier === "unaccredited" && (
            <>
              <p className="text-sm text-muted-foreground">
                Upgrade to accredited or qualified investor status to unlock access to high-value invoices and premium features.
              </p>
              <Button
                onClick={() => {
                  setIsOpen(true);
                  onUpgradeClick();
                }}
                disabled={hasPendingApplication}
                className="w-full"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Upgrade Accreditation
              </Button>
            </>
          )}

          {hasPendingApplication && (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-blue-50/50 p-3 dark:bg-blue-950/20">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Application Under Review
                  </p>
                  <p className="text-xs text-blue-700/75 dark:text-blue-200/75">
                    Estimated review time: {estimatedReviewDays} business days
                  </p>
                </div>
              </div>
            </>
          )}

          {currentTier !== "unaccredited" && (
            <p className="text-xs text-muted-foreground">
              You have access to all invoice tiers. {currentTier === "qualified" ? "Manage your qualified investor portfolio." : ""}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Accreditation Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm">Choose your accreditation level</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Provide the appropriate documentation for your desired tier.
                </p>
              </div>

              <div className="space-y-2">
                {["accredited", "qualified"].map((tier) => (
                  <button
                    key={tier}
                    className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors"
                    data-testid={`upgrade-tier-${tier}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{tier} Investor</span>
                      <Badge variant="outline">{tier === "qualified" ? "Premium" : "Standard"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tier === "accredited"
                        ? "$200k+ annual income or $1M+ net worth"
                        : "$5M+ net worth (excluding primary residence)"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                Submit Documentation
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
