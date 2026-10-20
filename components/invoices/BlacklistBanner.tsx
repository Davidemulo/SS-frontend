"use client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { issuersApi } from "@/lib/api";

export function useIssuerBlacklist(wallet?: string) {
  return useQuery({
    queryKey: ["blacklist", wallet],
    queryFn: () => issuersApi.blacklist(wallet!),
    enabled: !!wallet,
  });
}

export function BlacklistBanner({ wallet }: { wallet?: string }) {
  const { data } = useIssuerBlacklist(wallet);
  if (!data?.is_blacklisted) return null;
  return (
    <div
      id="issuer-blacklist-banner"
      role="alert"
      className="flex gap-3 rounded-lg border border-red-600 bg-red-600/10 p-4 text-red-700"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">This issuer has been blacklisted</p>
        <p className="text-sm">New investments are disabled. Existing holders should review their positions.</p>
        {data.reason && (
          <p className="mt-1 text-sm">
            <strong>Reason:</strong> {data.reason}
          </p>
        )}
        {data.blacklisted_at && (
          <p className="text-sm">
            <strong>Blacklisted on:</strong> {format(new Date(data.blacklisted_at), "PPP")}
          </p>
        )}
      </div>
    </div>
  );
}
