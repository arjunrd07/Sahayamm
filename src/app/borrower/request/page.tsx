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
import { HandCoins, ArrowRight, ShieldCheck, Clock, Percent } from "lucide-react";

export default function RequestLoanPage() {
  const { profile } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<LoanPlanId>("7_days");
  const [submitting, setSubmitting] = useState(false);

  if (!profile) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    const numIncome = parseFloat(monthlyIncome) || 0;

    if (numAmount <= 0) {
      push("error", "Please enter a valid loan amount.");
      return;
    }
    if (!purpose.trim()) {
      push("error", "Please enter the reason for this loan request.");
      return;
    }

    setSubmitting(true);
    const result = await requestLoan({
      amount: numAmount,
      purpose,
      planId: selectedPlanId,
    });
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Loan request submitted to lender successfully!");
    router.push("/borrower/loans");
  }

  const isEligible = profile && (profile.verification_status === "verified" || profile.kyc_completed || Boolean(profile.pan_number));

  if (profile && !isEligible) {
    return (
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Request a Loan</h2>
          <p className="text-sm text-muted mt-1">Verification required before requesting credit.</p>
        </div>
        <div className="card p-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Your profile is currently <strong>{profile.verification_status}</strong>. Please complete your KYC details or document verification to unlock loan requests.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/borrower/profile"
              className="btn-primary inline-block text-xs py-2 px-4 rounded-lg font-semibold"
            >
              Update KYC Profile
            </Link>
            <Link
              href="/borrower/verification"
              className="btn-secondary inline-block text-xs py-2 px-4 rounded-lg font-semibold"
            >
              Upload Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2">
            <HandCoins className="h-6 w-6 text-signal" /> Request a New Loan
          </h2>
          <p className="text-xs text-ink-slate mt-0.5">
            Fill in your borrowing details and choose a duration plan to submit for approval.
          </p>
        </div>
        <Link
          href="/borrower/loans"
          className="text-xs font-bold text-signal hover:underline flex items-center gap-1 shrink-0"
        >
          View My Loans →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Input Form */}
        <Card className="md:col-span-7 space-y-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Loan Amount (₹)" htmlFor="amount">
                <Input
                  id="amount"
                  type="number"
                  min={100}
                  step="500"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10000"
                />
              </Field>

              <Field label="Monthly Income (₹)" htmlFor="income">
                <Input
                  id="income"
                  type="number"
                  min={0}
                  step="1000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="e.g. 45000"
                />
              </Field>
            </div>

            {/* Duration & Mapped Interest Selection Cards */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-slate dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-signal" /> Select Loan Duration & Mapped Interest Rate
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LOAN_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-signal bg-signal-soft/30 dark:bg-signal/20 text-ink dark:text-white font-bold ring-2 ring-signal/20 shadow-sm"
                          : "border-slate-200 dark:border-surface-border-dark hover:bg-slate-50 dark:hover:bg-white/5 text-ink-slate"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-sm text-ink dark:text-white">{plan.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-signal text-white shadow-xs">
                          {plan.ratePercent}%
                        </span>
                      </div>
                      <p className="text-xs text-ink-slate font-medium">
                        Interest: <strong className="text-ink dark:text-white">{plan.ratePercent}%</strong> for {plan.days} days
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Reason / Purpose of Loan" htmlFor="purpose">
              <Textarea
                id="purpose"
                required
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Briefly describe the purpose of requesting this loan (e.g. Medical Emergency, Higher Education, Home Maintenance)..."
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 text-base font-bold rounded-full shadow-button flex items-center justify-center gap-2"
              loading={submitting}
            >
              <span>Submit Loan Request</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        {/* Right Side Live Calculation Breakdown Widget */}
        <div className="md:col-span-5 md:sticky md:top-24">
          <LiveLoanCalculator
            amount={parseFloat(amount) || 0}
            monthlyIncome={parseFloat(monthlyIncome) || 0}
            planId={selectedPlanId}
          />
        </div>
      </div>
    </div>
  );
}
