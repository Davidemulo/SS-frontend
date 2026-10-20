"use client";

/**
 * Issuer public profile page (#452)
 *
 * Displays issuer details, reputation score, invoice history, and active invoices.
 */

import { useParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, TrendingUp, FileText } from "lucide-react";
import { Money } from "@/components/currency";

function IssuerProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface IssuerProfile {
  id: string;
  name: string;
  isVerified: boolean;
  memberSince: string;
  totalCapitalRaised: number;
  reputationScore: number;
  onTimeSettlementRate: number;
  invoiceCount: number;
  invoices: Array<{
    id: string;
    title: string;
    faceValue: number;
    yield: number;
    status: string;
    maturityDate: string;
    fundingProgress: number;
  }>;
}

function IssuerProfileContent({ issuer }: { issuer: IssuerProfile }) {
  const activeInvoices = issuer.invoices.filter((inv) => inv.status === "active");

  return (
    <main className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/50" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">{issuer.name}</h1>
                  {issuer.isVerified && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(issuer.memberSince).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reputation Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{issuer.reputationScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on settlement history</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <TrendingUp className="inline h-4 w-4 mr-1" />
              On-Time Settlement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{issuer.onTimeSettlementRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {issuer.invoiceCount} invoices funded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Capital Raised
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <Money xlm={issuer.totalCapitalRaised} className="text-3xl font-bold" />
            </div>
          </CardContent>
        </Card>
      </div>

      {activeInvoices.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Active Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{invoice.title}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>Face Value: <Money xlm={invoice.faceValue} /></span>
                      <span>Yield: {invoice.yield}%</span>
                      <span>Maturity: {new Date(invoice.maturityDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/marketplace/${invoice.id}`}>Invest</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-muted-foreground">
                  <th className="text-left py-2 px-2">Title</th>
                  <th className="text-right py-2 px-2">Face Value</th>
                  <th className="text-right py-2 px-2">Yield</th>
                  <th className="text-center py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Maturity</th>
                </tr>
              </thead>
              <tbody>
                {issuer.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-2">
                      <Link href={`/marketplace/${invoice.id}`} className="hover:underline font-medium">
                        {invoice.title}
                      </Link>
                    </td>
                    <td className="text-right py-3 px-2">
                      <Money xlm={invoice.faceValue} />
                    </td>
                    <td className="text-right py-3 px-2">{invoice.yield}%</td>
                    <td className="text-center py-3 px-2">
                      <Badge variant="outline" className="capitalize">
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">{new Date(invoice.maturityDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function IssuerProfilePage() {
  const params = useParams<{ id: string }>();

  const mockIssuer: IssuerProfile = {
    id: params.id,
    name: "Acme Corp",
    isVerified: true,
    memberSince: "2023-01-15",
    totalCapitalRaised: 2500000,
    reputationScore: 4.8,
    onTimeSettlementRate: 98,
    invoiceCount: 12,
    invoices: [
      {
        id: "inv-001",
        title: "Q4 Operating Expenses",
        faceValue: 150000,
        yield: 8.5,
        status: "active",
        maturityDate: "2024-03-15",
        fundingProgress: 85,
      },
    ],
  };

  return (
    <Suspense fallback={<IssuerProfileSkeleton />}>
      <IssuerProfileContent issuer={mockIssuer} />
    </Suspense>
  );
}
