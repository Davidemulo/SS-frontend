"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchKycDocuments,
  resubmitKycDocument,
  uploadDocument,
  type KycDocumentStatus,
  type KycDocumentType,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export const KYC_DOCUMENTS_QUERY_KEY = ["kyc", "documents"] as const;

/** Per-document KYC verification state for the connected issuer (#469). */
export function useKycDocuments() {
  const { jwt } = useAuth();
  return useQuery<KycDocumentStatus[]>({
    queryKey: KYC_DOCUMENTS_QUERY_KEY,
    queryFn: () => fetchKycDocuments(jwt ?? undefined),
    refetchInterval: 60_000,
  });
}

/**
 * Uploads a replacement file, then resubmits it for review. On success the
 * cached document flips to `pending` straight away.
 */
export function useResubmitKycDocument() {
  const { jwt } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, file }: { type: KycDocumentType; file: File }) => {
      const { url } = await uploadDocument(file);
      return resubmitKycDocument(type, url, jwt ?? undefined);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<KycDocumentStatus[]>(KYC_DOCUMENTS_QUERY_KEY, (prev) =>
        prev?.map((doc) => (doc.type === updated.type ? updated : doc))
      );
      toast.success("Document submitted for review");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to resubmit document");
    },
  });
}
