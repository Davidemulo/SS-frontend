"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  ShoppingBag,
  ArrowLeftRight,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { useActivity, useActivityEvents, type ActivityEvent, type ActivityEventType } from "@/hooks/useActivity";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<ActivityEventType, React.ElementType> = {
  investment: TrendingUp,
  secondary_buy: ShoppingBag,
  secondary_sell: ShoppingBag,
  transfer: ArrowLeftRight,
  settlement: RotateCcw,
  kyc_submitted: ShieldCheck,
  kyc_approved: ShieldCheck,
  kyc_rejected: ShieldAlert,
};

const TYPE_LABELS: Record<ActivityEventType, string> = {
  investment: "Investment",
  secondary_buy: "Secondary Buy",
  secondary_sell: "Secondary Sell",
  transfer: "Transfer",
  settlement: "Settlement",
  kyc_submitted: "KYC Submitted",
  kyc_approved: "KYC Approved",
  kyc_rejected: "KYC Rejected",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "investment", label: "Investments" },
  { value: "secondary_market", label: "Secondary Market" },
  { value: "settlements", label: "Settlements" },
  { value: "kyc", label: "KYC Events" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

function exportActivityAsCSV(events: ActivityEvent[], filename = "activity-history.csv") {
  const headers = ["Date", "Time", "Type", "Description", "Amount", "Currency"];
  const rows = events.map((event) => [
    format(new Date(event.timestamp), "yyyy-MM-dd"),
    format(new Date(event.timestamp), "HH:mm:ss"),
    TYPE_LABELS[event.type] || event.type,
    event.description,
    event.amount?.toString() ?? "",
    event.currency ?? "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function mapFilterToTypes(filter: FilterValue): ActivityEventType[] | null {
  switch (filter) {
    case "all":
      return null;
    case "investment":
      return ["investment"];
    case "secondary_market":
      return ["secondary_buy", "secondary_sell"];
    case "settlements":
      return ["settlement"];
    case "kyc":
      return ["kyc_submitted", "kyc_approved", "kyc_rejected"];
  }
}

export function ActivityFeed() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [preset, setPreset] = useState<"today" | "7d" | "30d" | "custom">("30d");

  const handlePresetChange = (value: "today" | "7d" | "30d" | "custom") => {
    setPreset(value);
    const now = new Date();
    let start: Date;
    switch (value) {
      case "today":
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "7d":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        return;
    }
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(now.toISOString().split("T")[0]);
  };

  const types = mapFilterToTypes(filter);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useActivity(
    types?.[0],
    startDate || undefined,
    endDate || undefined
  );

  const events = data?.pages.flatMap((p) => p.events) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <p className="text-muted-foreground">No activity events found matching your filters.</p>
        </CardContent>
      </Card>
    );
  }

  const handleExport = () => {
    const filename = `activity-${format(new Date(), "yyyy-MM-dd")}.csv`;
    exportActivityAsCSV(events, filename);
  };

  return (
    <div className="space-y-4" role="region" aria-label="Activity history">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
            <SelectTrigger className="w-[180px]" aria-label="Filter events by type">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                aria-label="Filter events by date range"
              >
                <Calendar className="h-4 w-4" />
                <span>
                  {preset === "custom"
                    ? startDate && endDate
                      ? `${format(new Date(startDate), "MMM d")} - ${format(new Date(endDate), "MMM d")}`
                      : "Date Range"
                    : preset === "today"
                    ? "Today"
                    : preset === "7d"
                    ? "Last 7 Days"
                    : "Last 30 Days"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-3">
                {["today", "7d", "30d", "custom"].map((p) => (
                  <Button
                    key={p}
                    variant={preset === p ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handlePresetChange(p as "today" | "7d" | "30d" | "custom")}
                  >
                    {p === "today" && "Today"}
                    {p === "7d" && "Last 7 Days"}
                    {p === "30d" && "Last 30 Days"}
                    {p === "custom" && "Custom Range"}
                  </Button>
                ))}
                {preset === "custom" && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="start-date" className="text-xs font-medium block mb-1">
                          Start Date
                        </label>
                        <input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm w-full"
                          max={new Date().toISOString().split("T")[0]}
                          aria-label="Start date for activity filter"
                        />
                      </div>
                      <div>
                        <label htmlFor="end-date" className="text-xs font-medium block mb-1">
                          End Date
                        </label>
                        <input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm w-full"
                          max={new Date().toISOString().split("T")[0]}
                          aria-label="End date for activity filter"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handlePresetChange("custom")}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={events.length === 0}
            className="gap-2"
            aria-label="Export activity history as CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3" role="list">
        {events.map((event) => (
          <ActivityEventCard key={event.id} event={event} />
        ))}

        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}

        {!hasNextPage && events.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No more events
          </p>
        )}
      </div>
    </div>
  );
}

function ActivityEventCard({ event }: { event: ActivityEvent }) {
  const Icon = TYPE_ICONS[event.type] || TrendingUp;
  const typeLabel = TYPE_LABELS[event.type] || event.type;

  return (
    <Card
      className="hover:shadow-md transition-shadow"
      role="listitem"
      aria-label={`${typeLabel}: ${event.description} on ${format(
        new Date(event.timestamp),
        "MMM d, yyyy"
      )}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{event.description}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <Badge variant="outline" className="whitespace-nowrap">
                {typeLabel}
              </Badge>
            </div>
            {event.amount !== null && (
              <p className="mt-1 font-mono text-sm font-medium">
                {event.amount.toLocaleString()} {event.currency}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
            <div className="h-4 w-1/4 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}