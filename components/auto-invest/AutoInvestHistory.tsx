"use client";

import { format } from "date-fns";
import { History, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AutoInvestHistoryItem {
  id: string;
  invoiceId: string;
  ruleName: string;
  amount: number;
  yield: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

interface AutoInvestHistoryProps {
  history: AutoInvestHistoryItem[];
}

export function AutoInvestHistory({ history }: AutoInvestHistoryProps) {
  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5" aria-hidden="true" />
          Auto-Invest History
        </CardTitle>
        <CardDescription>
          Track all investments triggered by your auto-invest rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No auto-investments yet. Your rules will execute when matching invoices appear.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {item.invoiceId}
                    </TableCell>
                    <TableCell className="font-medium">{item.ruleName}</TableCell>
                    <TableCell>${item.amount.toLocaleString()}</TableCell>
                    <TableCell>{item.yield.toFixed(2)}%</TableCell>
                    <TableCell>
                      {format(new Date(item.timestamp), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(item.status)}>
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
