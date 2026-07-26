"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LiveLoanCalculator } from "@/components/calculator/live-loan-calculator";
import { LOAN_PLANS, LoanPlanId } from "@/lib/loan-math";
import { requestLoan } from "./actions";

export default function RequestLoanPage() {
  const { profile } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<LoanPlanId>("7_days");
  const [submitting, setSubmitting] = useState(false);

  if (!profile) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await requestLoan({
      amount: parseFloat(amount) || 0,
      purpose,
      planId: selectedPlanId,
    });
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Loan request submitted to lender.");
    router.push("/borrower/loans");
  }

  if (profile && profile.verification_status !== "verified") {
    return (
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Request a Loan</h2>
          <p className="text-sm text-muted mt-1">Verification required before requesting credit.</p>
        </div>
        <div className="card p-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Your profile is currently <strong>{profile.verification_status}</strong>. Please complete document verification to unlock loan requests.
          </p>
          <Link
            href="/borrower/verification"
            className="btn-primary inline-block text-xs py-2 px-4 rounded-lg font-semibold"
          >
            Go to Verification Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl grid md:grid-cols-5 gap-6 items-start">
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Request a loan</CardTitle>
          <CardDescription>Select a borrowing plan and submit for lender approval.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Loan Amount (₹)" htmlFor="amount">
            <Input
              id="amount"
              type="number"
              min={100}
              step="100"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
            />
          </Field>

          <div>
            <label className="block text-sm font-medium mb-2">Select Loan Plan</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LOAN_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-accent bg-accent/5 dark:bg-accent/10 shadow-sm ring-1 ring-accent"
                        : "border-surface-border dark:border-surface-border-dark hover:border-gray-400 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{plan.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light">
                        {plan.ratePercent}%
                      </span>
                    </div>
                    <p className="text-xs text-muted">Interest rate: {plan.ratePercent}% for {plan.days} days</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Reason / Purpose" htmlFor="purpose">
            <Textarea
              id="purpose"
              required
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Explain the reason for requesting this loan..."
            />
          </Field>

          <Button type="submit" className="w-full" loading={submitting}>
            Submit Loan Request
          </Button>
        </form>
      </Card>

      <div className="md:col-span-2 md:sticky md:top-24">
        <LiveLoanCalculator
          amount={parseFloat(amount) || 0}
          planId={selectedPlanId}
        />
      </div>
    </div>
  );
}

