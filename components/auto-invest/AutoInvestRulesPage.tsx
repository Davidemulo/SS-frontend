"use client";

import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  TrendingUp,
  AlertCircle,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWallet } from "@/context/WalletContext";
import { RuleFormDialog } from "./RuleFormDialog";
import { AutoInvestHistory } from "./AutoInvestHistory";

export interface AutoInvestRule {
  id: string;
  name: string;
  category: string;
  minYield: number;
  maxFaceValue: number;
  riskTier: string;
  maxPerInvoice: number;
  isEnabled: boolean;
  createdAt: string;
}

// Mock data
const MOCK_RULES: AutoInvestRule[] = [
  {
    id: "rule-1",
    name: "High Yield Tech",
    category: "Technology",
    minYield: 8,
    maxFaceValue: 50000,
    riskTier: "Medium",
    maxPerInvoice: 10000,
    isEnabled: true,
    createdAt: "2026-10-01",
  },
  {
    id: "rule-2",
    name: "Conservative Strategy",
    category: "Finance",
    minYield: 5,
    maxFaceValue: 100000,
    riskTier: "Low",
    maxPerInvoice: 5000,
    isEnabled: true,
    createdAt: "2026-09-15",
  },
  {
    id: "rule-3",
    name: "Real Estate Opportunities",
    category: "Real Estate",
    minYield: 7,
    maxFaceValue: 75000,
    riskTier: "Medium",
    maxPerInvoice: 8000,
    isEnabled: false,
    createdAt: "2026-09-01",
  },
];

const MOCK_HISTORY: Array<{
  id: string;
  invoiceId: string;
  ruleName: string;
  amount: number;
  yield: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}> = [
  {
    id: "inv-1",
    invoiceId: "INV-2026-001",
    ruleName: "High Yield Tech",
    amount: 5000,
    yield: 8.5,
    timestamp: "2026-10-15T14:30:00",
    status: "completed",
  },
  {
    id: "inv-2",
    invoiceId: "INV-2026-002",
    ruleName: "Conservative Strategy",
    amount: 3500,
    yield: 5.2,
    timestamp: "2026-10-14T10:15:00",
    status: "completed",
  },
  {
    id: "inv-3",
    invoiceId: "INV-2026-003",
    ruleName: "High Yield Tech",
    amount: 7200,
    yield: 8.8,
    timestamp: "2026-10-12T16:45:00",
    status: "completed",
  },
];

export function AutoInvestRulesPage() {
  const { address } = useWallet();
  const [rules, setRules] = useState<AutoInvestRule[]>(MOCK_RULES);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoInvestRule | null>(null);
  const [balanceThreshold] = useState(1000); // XLM
  const [currentBalance] = useState(15000); // XLM - mock
  const [showHistory, setShowHistory] = useState(false);

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to manage auto-invest rules
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleSaveRule = (rule: Omit<AutoInvestRule, "id" | "createdAt">) => {
    if (editingRule) {
      setRules(
        rules.map((r) =>
          r.id === editingRule.id
            ? { ...rule, id: r.id, createdAt: r.createdAt }
            : r,
        ),
      );
    } else {
      const newRule: AutoInvestRule = {
        ...rule,
        id: `rule-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setRules([...rules, newRule]);
    }
    setEditingRule(null);
    setShowFormDialog(false);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r)),
    );
  };

  const handleEditRule = (rule: AutoInvestRule) => {
    setEditingRule(rule);
    setShowFormDialog(true);
  };

  const isAutoInvestPaused = currentBalance < balanceThreshold;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Auto-Invest Rules</h1>
        <p className="text-muted-foreground mt-1">
          Set up automatic investment rules for hands-free portfolio growth
        </p>
      </div>

      {/* Balance Threshold Alert */}
      {isAutoInvestPaused && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="size-5" aria-hidden="true" />
              Auto-Invest Paused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">
              Your wallet balance ({currentBalance.toLocaleString()} XLM) is
              below the threshold ({balanceThreshold.toLocaleString()} XLM).
              Auto-invest rules are paused.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Rules</CardDescription>
            <CardTitle className="text-3xl">
              {rules.filter((r) => r.isEnabled).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rules</CardDescription>
            <CardTitle className="text-3xl">{rules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Balance Threshold</CardDescription>
            <CardTitle className="text-3xl">
              {balanceThreshold.toLocaleString()} XLM
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Active Rules Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" aria-hidden="true" />
              Active Rules
            </CardTitle>
            <CardDescription>
              Manage and configure your auto-invest rules
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingRule(null);
              setShowFormDialog(true);
            }}
            size="sm"
          >
            <Plus className="size-4 mr-2" aria-hidden="true" />
            New Rule
          </Button>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No rules created yet</p>
              <Button
                onClick={() => {
                  setEditingRule(null);
                  setShowFormDialog(true);
                }}
                variant="outline"
              >
                Create Your First Rule
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Min Yield</TableHead>
                    <TableHead>Max Face Value</TableHead>
                    <TableHead>Risk Tier</TableHead>
                    <TableHead>Max Per Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.category}</TableCell>
                      <TableCell>{rule.minYield}%</TableCell>
                      <TableCell>
                        ${rule.maxFaceValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.riskTier}</Badge>
                      </TableCell>
                      <TableCell>
                        ${rule.maxPerInvoice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.isEnabled ? "default" : "secondary"}
                        >
                          {rule.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleRule(rule.id)}
                            title={
                              rule.isEnabled ? "Disable rule" : "Enable rule"
                            }
                          >
                            <Power className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit2 className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Invest History */}
      <AutoInvestHistory history={MOCK_HISTORY} />

      {/* Rule Form Dialog */}
      <RuleFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        onSave={handleSaveRule}
        editingRule={editingRule}
      />
    </main>
  );
}
