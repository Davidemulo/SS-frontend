"use client";

/**
 * Investor account settings (#444). Four tabs, each saving on its own:
 * profile, notifications, security (2FA and sessions) and the connected wallet.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailNotificationPreferencesSettings } from "@/components/dashboard/EmailNotificationPreferencesSettings";
import { useAuth } from "@/hooks/useAuth";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import {
  type AccountProfile,
  type AccountSession,
  type TwoFactorSetup,
  confirmTwoFactorSetup,
  fetchAccountProfile,
  fetchAccountSessions,
  revokeAccountSession,
  startTwoFactorSetup,
  updateAccountProfile,
  uploadDocument,
} from "@/lib/api";
import { NETWORK_LABELS } from "@/lib/stellar/network";

export const ACCOUNT_PROFILE_QUERY_KEY = ["account-profile"] as const;
export const ACCOUNT_SESSIONS_QUERY_KEY = ["account-sessions"] as const;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const TIMEZONE_OPTIONS = [
  "UTC",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const selectClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function AccountSettings() {
  const { jwt } = useAuth();

  if (!jwt) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="account-connect-prompt">
        Connect your wallet to manage your account settings.
      </p>
    );
  }

  return (
    <Tabs defaultValue="profile">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="wallet">Wallet</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        <ProfileTab token={jwt} />
      </TabsContent>
      <TabsContent value="notifications" className="mt-4">
        <EmailNotificationPreferencesSettings />
      </TabsContent>
      <TabsContent value="security" className="mt-4 space-y-6">
        <TwoFactorCard token={jwt} />
        <SessionsCard token={jwt} />
      </TabsContent>
      <TabsContent value="wallet" className="mt-4">
        <WalletCard />
      </TabsContent>
    </Tabs>
  );
}

function ProfileTab({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ACCOUNT_PROFILE_QUERY_KEY,
    queryFn: () => fetchAccountProfile(token),
  });
  const [draft, setDraft] = useState<AccountProfile | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  const save = useMutation({
    mutationFn: (patch: AccountProfile) => updateAccountProfile(patch, token),
    onSuccess: (saved) => {
      queryClient.setQueryData(ACCOUNT_PROFILE_QUERY_KEY, saved);
      toast.success("Profile saved");
    },
  });

  async function handleAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 2 MB or smaller");
      return;
    }
    setAvatarUploading(true);
    try {
      const { url } = await uploadDocument(file);
      setDraft((current) => (current ? { ...current, avatar_url: url } : current));
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Could not load profile"}
      </p>
    );
  }
  if (isLoading || !draft) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  const dirty = profile ? JSON.stringify(draft) !== JSON.stringify(profile) : false;
  const initials = draft.display_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(draft);
      }}
      data-testid="profile-form"
    >
      <div className="flex items-center gap-4">
        {draft.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.avatar_url}
            alt="Profile avatar"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">
            {initials}
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="avatar-upload">Avatar</Label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            disabled={avatarUploading}
            className="text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleAvatar(file);
            }}
          />
          <p className="text-xs text-muted-foreground">PNG, JPG or GIF, up to 2 MB.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          maxLength={60}
          value={draft.display_name}
          onChange={(event) =>
            setDraft({ ...draft, display_name: event.target.value })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="preferred-currency">Preferred currency</Label>
          <select
            id="preferred-currency"
            className={selectClass}
            value={draft.preferred_currency}
            onChange={(event) =>
              setDraft({
                ...draft,
                preferred_currency: event.target.value as AccountProfile["preferred_currency"],
              })
            }
          >
            <option value="XLM">XLM</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            className={selectClass}
            value={draft.timezone}
            onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
          >
            {TIMEZONE_OPTIONS.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" disabled={!dirty || save.isPending || avatarUploading}>
        {save.isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

function TwoFactorCard({ token }: { token: string }) {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [enabled, setEnabled] = useState(false);

  const start = useMutation({
    mutationFn: () => startTwoFactorSetup(token),
    onSuccess: (data) => setSetup(data),
  });

  const confirm = useMutation({
    mutationFn: () => confirmTwoFactorSetup(code, token),
    onSuccess: () => {
      setEnabled(true);
      setSetup(null);
      setCode("");
      toast.success("Two-factor authentication enabled");
    },
  });

  return (
    <Card data-testid="two-factor-card">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          Require a one-time code from an authenticator app when signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Enabled
          </Badge>
        ) : setup ? (
          <div className="space-y-3">
            <p className="text-sm">
              Add this key to your authenticator app, then enter the 6-digit code it shows.
            </p>
            <p className="break-all rounded-md bg-muted p-2 font-mono text-xs" data-testid="two-factor-secret">
              {setup.secret}
            </p>
            <div className="flex gap-2">
              <Input
                aria-label="Verification code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                className="max-w-40"
              />
              <Button onClick={() => confirm.mutate()} disabled={code.length !== 6 || confirm.isPending}>
                Verify and enable
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            Set up two-factor authentication
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SessionsCard({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ACCOUNT_SESSIONS_QUERY_KEY,
    queryFn: () => fetchAccountSessions(token),
  });

  const revoke = useMutation({
    mutationFn: (session: AccountSession) => revokeAccountSession(session.id, token),
    onSuccess: (_data, session) => {
      toast.success("Session revoked");
      if (session.is_current) {
        logout();
        return;
      }
      queryClient.invalidateQueries({ queryKey: ACCOUNT_SESSIONS_QUERY_KEY });
    },
  });

  return (
    <Card data-testid="sessions-card">
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>Devices currently signed in to your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading sessions…</p>}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load sessions"}
          </p>
        )}
        {!isLoading && !error && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between gap-3 rounded-md border p-3"
            data-testid={`session-row-${session.id}`}
          >
            <div className="min-w-0 space-y-0.5 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <span className="truncate">{session.device}</span>
                {session.is_current && <Badge variant="secondary">This device</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.ip_address ?? "Unknown IP"} · Last active{" "}
                {new Date(session.last_active_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => revoke.mutate(session)}
              disabled={revoke.isPending}
              data-testid={`revoke-session-${session.id}`}
            >
              Revoke
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WalletCard() {
  const { address, network, disconnect } = useStellarWallet();

  return (
    <Card data-testid="wallet-card">
      <CardHeader>
        <CardTitle>Connected wallet</CardTitle>
        <CardDescription>The wallet you use to sign in and invest.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {address ? (
          <>
            <p className="break-all font-mono text-sm" data-testid="account-wallet-address">
              {address}
            </p>
            <p className="text-sm text-muted-foreground">
              Network: {network ? NETWORK_LABELS[network] : "Unknown"}
            </p>
            <Button variant="destructive" onClick={() => disconnect()}>
              Disconnect wallet
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No wallet connected.</p>
        )}
      </CardContent>
    </Card>
  );
}
