"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AutoInvestRule } from "./AutoInvestRulesPage";

const ruleFormSchema = z.object({
  name: z.string().min(1, "Rule name is required").max(100),
  category: z.string().min(1, "Category is required"),
  minYield: z
    .number()
    .min(0, "Minimum yield must be 0 or higher")
    .max(100, "Minimum yield cannot exceed 100%"),
  maxFaceValue: z
    .number()
    .min(1000, "Max face value must be at least 1000")
    .max(1000000, "Max face value cannot exceed 1,000,000"),
  riskTier: z.string().min(1, "Risk tier is required"),
  maxPerInvoice: z
    .number()
    .min(100, "Max per invoice must be at least 100")
    .max(500000, "Max per invoice cannot exceed 500,000"),
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

interface RuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: Omit<AutoInvestRule, "id" | "createdAt">) => void;
  editingRule?: AutoInvestRule | null;
}

const CATEGORIES = [
  "Technology",
  "Finance",
  "Real Estate",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Transportation",
  "Other",
];

const RISK_TIERS = ["Low", "Medium", "High"];

export function RuleFormDialog({
  open,
  onOpenChange,
  onSave,
  editingRule,
}: RuleFormDialogProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: "",
      category: "",
      minYield: 5,
      maxFaceValue: 50000,
      riskTier: "Medium",
      maxPerInvoice: 10000,
    },
  });

  useEffect(() => {
    if (editingRule) {
      form.reset({
        name: editingRule.name,
        category: editingRule.category,
        minYield: editingRule.minYield,
        maxFaceValue: editingRule.maxFaceValue,
        riskTier: editingRule.riskTier,
        maxPerInvoice: editingRule.maxPerInvoice,
      });
    } else {
      form.reset({
        name: "",
        category: "",
        minYield: 5,
        maxFaceValue: 50000,
        riskTier: "Medium",
        maxPerInvoice: 10000,
      });
    }
  }, [editingRule, open, form]);

  const onSubmit = (values: RuleFormValues) => {
    onSave({
      name: values.name,
      category: values.category,
      minYield: values.minYield,
      maxFaceValue: values.maxFaceValue,
      riskTier: values.riskTier,
      maxPerInvoice: values.maxPerInvoice,
      isEnabled: true,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Edit Auto-Invest Rule" : "Create Auto-Invest Rule"}
          </DialogTitle>
          <DialogDescription>
            {editingRule
              ? "Update your auto-investment criteria"
              : "Set up a new rule for automatic invoice investment"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., High Yield Tech"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minYield"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Yield (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Only invest in invoices with yields at or above this %
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxFaceValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Face Value ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50000"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Skip invoices with face value above this amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riskTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Tier</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RISK_TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Risk assessment level for invoices
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxPerInvoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Per Invoice ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10000"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount to auto-invest per invoice
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
