"use client";

/**
 * Draft resume banner (#448)
 *
 * Shows a banner for incomplete invoice drafts with a resume button.
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, X } from "lucide-react";
import { useState } from "react";

interface DraftResumeBannerProps {
  draftId: string;
  title: string;
  lastSavedAt: Date;
  onResume: () => void;
  onDiscard: () => void;
}

export function DraftResumeBanner({
  draftId,
  title,
  lastSavedAt,
  onResume,
  onDiscard,
}: DraftResumeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const timeAgo = new Intl.RelativeTimeFormat("en").format(
    Math.round((lastSavedAt.getTime() - Date.now()) / 1000),
    "second"
  );

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="font-medium text-sm">Resume draft: {title}</p>
            <p className="text-xs text-muted-foreground">Last saved {timeAgo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onResume}>
            Resume
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Are you sure you want to discard this draft?")) {
                onDiscard();
              }
            }}
          >
            Discard
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
