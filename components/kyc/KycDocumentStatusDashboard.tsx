"use client";

/**
 * Issuer KYC document dashboard (#469).
 *
 * One card per required document showing where it is in verification.
 * Rejected documents explain why and offer a resubmit; expired ones show when
 * they lapsed and offer a renewal. Both upload a replacement file, which puts
 * the document back to pending.
 */

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KYC_DOCUMENT_TYPES,
  type KycDocumentState,
  type KycDocumentStatus,
  type KycDocumentType,
} from "@/lib/api";
import { useKycDocuments, useResubmitKycDocument } from "@/hooks/useKycDocuments";

export const KYC_DOCUMENT_LABELS: Record<KycDocumentType, string> = {
  business_registration: "Business registration",
  director_id: "Director ID",
  proof_of_address: "Proof of address",
};

interface StateStyle {
  label: string;
  icon: LucideIcon;
  badge: string;
  card: string;
}

const STATE_STYLES: Record<KycDocumentState, StateStyle> = {
  pending: {
    label: "Pending review",
    icon: Clock,
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-200",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    badge: "bg-green-100 text-green-800",
    card: "border-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-red-100 text-red-800",
    card: "border-red-300",
  },
  expired: {
    label: "Expired",
    icon: AlertTriangle,
    badge: "bg-orange-100 text-orange-800",
    card: "border-orange-300",
  },
};

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Why a replacement file cannot be uploaded, or null if it is acceptable. */
export function validateKycFile(file: File): string | null {
  if (file.size === 0) return "File cannot be empty";
  if (!ACCEPTED_TYPES.includes(file.type)) return "Upload a PDF, JPG or PNG file";
  if (file.size > MAX_FILE_SIZE) return "File must be under 10 MB";
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface DocumentCardProps {
  doc: KycDocumentStatus;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function KycDocumentCard({ doc, isUploading, onUpload }: DocumentCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const style = STATE_STYLES[doc.status];
  const Icon = style.icon;
  const label = KYC_DOCUMENT_LABELS[doc.type];
  const ctaLabel = doc.status === "rejected" ? "Resubmit" : "Renew";
  const canReplace = doc.status === "rejected" || doc.status === "expired";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    e.target.value = "";
    if (!file) return;
    const error = validateKycFile(file);
    setFileError(error);
    if (!error) onUpload(file);
  };

  return (
    <Card className={style.card} data-testid={`kyc-doc-${doc.type}`} data-status={doc.status}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
            {label}
          </CardTitle>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}
            data-testid={`kyc-doc-status-${doc.type}`}
          >
            <Icon className="size-3" aria-hidden="true" />
            {style.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {doc.status === "pending" && (
          <p className="text-muted-foreground">
            Submitted {formatDate(doc.submitted_at)}. We&apos;ll update this once it&apos;s reviewed.
          </p>
        )}

        {doc.status === "approved" && (
          <p className="text-muted-foreground" data-testid={`kyc-doc-verified-${doc.type}`}>
            Verified on {formatDate(doc.verified_at)}
            {doc.expires_at && <> · valid until {formatDate(doc.expires_at)}</>}
          </p>
        )}

        {doc.status === "rejected" && (
          <div className="rounded-md bg-red-50 p-3 text-red-800" data-testid={`kyc-doc-reason-${doc.type}`}>
            <p className="font-semibold">Rejection reason</p>
            <p>{doc.rejection_reason || "No reason was given. Upload a clearer copy."}</p>
          </div>
        )}

        {doc.status === "expired" && (
          <p className="text-orange-800" data-testid={`kyc-doc-expiry-${doc.type}`}>
            Expired on {formatDate(doc.expires_at)}. Upload a current copy to stay verified.
          </p>
        )}

        {canReplace && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFile}
              aria-label={`Upload new ${label}`}
              data-testid={`kyc-doc-file-${doc.type}`}
            />
            <Button
              size="sm"
              variant={doc.status === "rejected" ? "default" : "outline"}
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              data-testid={`kyc-doc-cta-${doc.type}`}
            >
              {isUploading ? "Uploading…" : ctaLabel}
            </Button>
            {fileError && (
              <p className="text-xs text-destructive" role="alert">
                {fileError}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function KycDocumentStatusDashboard() {
  const { data, isLoading, isError } = useKycDocuments();
  const resubmit = useResubmitKycDocument();

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="kyc-docs-loading">
        {KYC_DOCUMENT_TYPES.map((type) => (
          <Skeleton key={type} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive" data-testid="kyc-docs-error">
        Couldn&apos;t load your document status. Try again shortly.
      </p>
    );
  }

  const byType = new Map((data ?? []).map((doc) => [doc.type, doc]));
  const uploadingType = resubmit.isPending ? resubmit.variables?.type : undefined;

  return (
    <section className="space-y-3" aria-labelledby="kyc-docs-heading" data-testid="kyc-docs-dashboard">
      <h2 id="kyc-docs-heading" className="text-lg font-semibold">
        Documents
      </h2>
      {KYC_DOCUMENT_TYPES.map((type) => {
        const doc = byType.get(type);
        if (!doc) {
          return (
            <Card key={type} data-testid={`kyc-doc-${type}`} data-status="missing">
              <CardContent className="py-4 text-sm text-muted-foreground">
                {KYC_DOCUMENT_LABELS[type]}: not submitted yet
              </CardContent>
            </Card>
          );
        }
        return (
          <KycDocumentCard
            key={type}
            doc={doc}
            isUploading={uploadingType === type}
            onUpload={(file) => resubmit.mutate({ type, file })}
          />
        );
      })}
    </section>
  );
}
