"use client";

import { FeeConfigPanel } from "@/components/admin/FeeConfigPanel";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";

// #440 — admin platform configuration. Access is enforced by the API (403);
// the panel renders an access-denied state for non-admin wallets.
export default function AdminFeeConfigPage() {
  usePageTitle("Fee configuration");
  const { jwt } = useAuth();

  return (
    <main className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Fee configuration</h1>
      {jwt ? (
        <FeeConfigPanel token={jwt} />
      ) : (
        <p className="text-sm text-muted-foreground">Connect an admin wallet to manage fees.</p>
      )}
    </main>
  );
}
