"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Share2,
  Twitter,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/context/WalletContext";

interface WaitlistData {
  queuePosition: number;
  totalQueue: number;
  estimatedAccessDate: string;
  referralCount: number;
  referralLink: string;
  boostAmount: number; // How many more referrals needed to move up one tier
}

// Mock data - in production, fetch from API
const generateMockWaitlistData = (address: string): WaitlistData => {
  const hash = address
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const position = (hash % 450) + 1;
  const totalQueue = 500;
  const referralCount = Math.floor((hash % 50) / 10);
  const boostAmount = 5 - (referralCount % 5);

  // Estimate access date based on queue position
  const daysToAccess = Math.ceil((position / totalQueue) * 60);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysToAccess);

  return {
    queuePosition: position,
    totalQueue,
    estimatedAccessDate: estimatedDate.toISOString().split("T")[0],
    referralCount,
    referralLink: `https://stellarsettle.app/waitlist?ref=${address.slice(-8)}`,
    boostAmount,
  };
};

export function WaitlistPage() {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view your waitlist position
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const waitlistData = generateMockWaitlistData(address);
  const progressPercentage = (waitlistData.referralCount / (waitlistData.referralCount + waitlistData.boostAmount)) * 100;
  const daysUntilAccess = Math.ceil(
    (new Date(waitlistData.estimatedAccessDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(waitlistData.referralLink);
    } catch {
      const el = document.getElementById("waitlist-referral-input") as HTMLInputElement | null;
      el?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = `I'm on the @StellarSettle waitlist! Join me and help me move up the queue. ${waitlistData.referralLink}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "width=550,height=420"
    );
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Waitlist Status</h1>
        <p className="text-muted-foreground mt-1">
          Your position in the queue and referral progress
        </p>
      </div>

      {/* Queue Position Card */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" aria-hidden="true" />
              Queue Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-bold text-blue-600">
                {waitlistData.queuePosition}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                of {waitlistData.totalQueue} total
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((waitlistData.totalQueue - waitlistData.queuePosition) / waitlistData.totalQueue) * 100}%`,
                }}
                role="progressbar"
                aria-valuenow={waitlistData.queuePosition}
                aria-valuemin={1}
                aria-valuemax={waitlistData.totalQueue}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estimated Access Card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" aria-hidden="true" />
              Estimated Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-bold text-green-600">
                {daysUntilAccess}d
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(waitlistData.estimatedAccessDate).toLocaleDateString(
                  undefined,
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated time based on current queue position. Referrals can accelerate this.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="size-5" aria-hidden="true" />
            Share Your Referral Link
          </CardTitle>
          <CardDescription>
            Invite friends to move up the queue. Each successful referral moves
            you {waitlistData.boostAmount} position{waitlistData.boostAmount !== 1 ? "s" : ""} higher.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waitlist-referral-input">Your referral link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="waitlist-referral-input"
                type="text"
                value={waitlistData.referralLink}
                readOnly
                onFocus={(e) => e.target.select()}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                onClick={copyLink}
                aria-live="polite"
                className="sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="size-4 mr-2" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4 mr-2" aria-hidden="true" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="pt-2">
            <p className="text-sm font-medium mb-3">Share on</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={shareOnTwitter}
              >
                <Twitter className="size-4 mr-2" aria-hidden="true" />
                Twitter/X
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const href = `mailto:?subject=${encodeURIComponent(
                    "Join me on StellarSettle Waitlist"
                  )}&body=${encodeURIComponent(
                    `I'm on the StellarSettle waitlist! Join me to help me move up the queue.\n\n${waitlistData.referralLink}`
                  )}`;
                  window.location.href = href;
                }}
              >
                <Users className="size-4 mr-2" aria-hidden="true" />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" aria-hidden="true" />
            Referral Progress
          </CardTitle>
          <CardDescription>
            How many more referrals you need to move up one queue tier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium">
                {waitlistData.referralCount} of{" "}
                {waitlistData.referralCount + waitlistData.boostAmount} referrals
              </span>
              <Badge variant="secondary">
                {waitlistData.boostAmount} more needed
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={waitlistData.referralCount}
                aria-valuemin={0}
                aria-valuemax={waitlistData.referralCount + waitlistData.boostAmount}
              />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              <strong>Each successful referral:</strong> Moves you{" "}
              {waitlistData.boostAmount} position{waitlistData.boostAmount !== 1 ? "s" : ""} higher in the queue
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
