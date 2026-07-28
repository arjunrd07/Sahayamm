"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LiveLoanCalculator } from "@/components/calculator/live-loan-calculator";
import { LOAN_PLANS, LoanPlanId } from "@/lib/loan-math";
import { requestLoan } from "./actions";
import { ShieldCheck, Sparkles, CheckCircle2, Clock, Landmark, ArrowRight, AlertCircle, FileText } from "lucide-react";

export default function RequestLoanPage() {
  const { profile } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<LoanPlanId>("7_days");
  const [submitting, setSubmitting] = useState(false);

  const { refresh: refreshNotifications } = useNotifications();

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
    push("success", "Loan request submitted! A notification has been sent to your inbox and lenders.");
    await refreshNotifications();
    router.push("/borrower/loans");
  }

  if (profile && profile.verification_status !== "verified") {
    return (
      <div className="max-w-xl space-y-6">
        <div className="p-6 rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-white shrink-0 shadow-sm">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100">Verification Required</h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Your profile status is currently <strong className="capitalize">{profile.verification_status}</strong>. Please complete KYC verification to unlock credit requests.
              </p>
            </div>
          </div>
          <Link
            href="/borrower/verification"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Proceed to Verification Page</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-bold mb-2">
            <Landmark className="h-3.5 w-3.5" /> Emergency Credit Application
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-ink dark:text-white tracking-tight">Request Emergency Loan</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Submit your internal credit request backed by organization liquidity pool terms.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-surface-border-dark text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="px-3 py-1.5 rounded-xl bg-signal text-white shadow-xs">Step 1: Application</span>
          <span className="px-3 py-1.5 rounded-xl text-slate-400 font-medium">Step 2: Approval</span>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid md:grid-cols-5 gap-6 items-start">
        {/* Form Card */}
        <Card className="md:col-span-3 p-6 sm:p-7 border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark shadow-card">
          <CardHeader className="px-0 pt-0 pb-5 border-b border-slate-100 dark:border-surface-border-dark mb-6">
            <CardTitle className="text-lg font-bold text-ink dark:text-white">Borrowing Parameters</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Specify your required principal amount and choose a repayment plan duration.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Field label="Loan Amount (₹)" htmlFor="amount" hint="Min ₹100 — Subject to organization borrowing limits">
              <Input
                id="amount"
                type="number"
                min={100}
                step="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25000"
                className="text-base font-bold h-12"
              />
            </Field>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Select Repayment Duration Plan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LOAN_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`text-left p-4 rounded-2xl border transition-all relative ${
                        isSelected
                          ? "border-2 border-signal bg-signal/5 dark:bg-signal/10 shadow-sm"
                          : "border-slate-200 dark:border-surface-border-dark hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-surface-dark"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 h-4 w-4 rounded-full bg-signal text-white flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <p className="font-extrabold text-sm text-ink dark:text-white">{plan.name}</p>
                      <p className="text-xs font-semibold text-signal mt-0.5">{plan.days} Days Term</p>
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-surface-border-dark/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Interest</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{plan.ratePercent}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Reason & Purpose for Credit" htmlFor="purpose" hint="Provide a brief explanation for lender records">
              <Textarea
                id="purpose"
                required
                rows={3}
                className="resize-none"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Medical emergency advance, educational fee payment..."
              />
            </Field>

            <Button
              type="submit"
              className="w-full py-4 text-sm font-bold rounded-xl shadow-button bg-signal hover:bg-signal-hover text-white transition-all active:scale-[0.99]"
              loading={submitting}
            >
              Submit Loan Application
            </Button>
          </form>
        </Card>

        {/* Calculator Widget */}
        <div className="md:col-span-2 md:sticky md:top-24">
          <LiveLoanCalculator
            amount={parseFloat(amount) || 0}
            planId={selectedPlanId}
          />
        </div>
      </div>
    </div>
  );
}
