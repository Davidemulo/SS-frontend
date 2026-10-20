"use client";

/**
 * Invoice drafts list (#448)
 *
 * Shows all incomplete invoice drafts with last-saved timestamps.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Trash2 } from "lucide-react";

interface Draft {
  id: string;
  title: string;
  lastSavedAt: Date;
  faceValue?: number;
}

interface InvoiceDraftsListProps {
  drafts: Draft[];
  isLoading?: boolean;
  onDelete?: (draftId: string) => Promise<void>;
}

export function InvoiceDraftsList({ drafts, isLoading = false, onDelete }: InvoiceDraftsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Draft Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No draft invoices</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Draft Invoices ({drafts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-sm">{draft.title || "Untitled Invoice"}</h4>
                <p className="text-xs text-muted-foreground">
                  Last saved {new Date(draft.lastSavedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link href={`/dashboard/seller/invoices/${draft.id}/edit`}>Resume</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (confirm("Discard this draft?") && onDelete) {
                      await onDelete(draft.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
