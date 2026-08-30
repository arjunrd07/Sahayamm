"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
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
import { formatINR } from "@/lib/utils";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  Landmark,
  ArrowRight,
  AlertCircle,
  FileText,
  Sliders,
  Award,
  Zap,
  ShieldAlert,
} from "lucide-react";

export default function RequestLoanPage() {
  const { profile, loading, refresh } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [amount, setAmount] = useState<string>("25000");
  const [purpose, setPurpose] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<LoanPlanId>("7_days");
  const [submitting, setSubmitting] = useState(false);

  const { refresh: refreshNotifications } = useNotifications();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl space-y-8">
        <div className="h-32 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-8 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark shadow-card space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-signal/10 text-signal flex items-center justify-center mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-ink dark:text-white">Authentication Required</h2>
          <p className="text-xs text-slate-500 font-medium">Please sign in to apply for an emergency loan.</p>
          <Link href="/login" className="btn-primary inline-flex items-center justify-center w-full py-3 rounded-xl text-xs font-bold shadow-button">
            Sign In to Sahayam
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const numAmount = parseFloat(amount) || 0;
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
    push("success", "Loan request submitted! A notification has been sent to your inbox and lenders.");
    await refreshNotifications();
    router.push("/borrower/loans");
  }

  if (profile && profile.verification_status !== "verified") {
    return (
      <div className="max-w-xl space-y-6">
        <div className="p-8 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 space-y-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-sm">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-ink dark:text-white">Verification Required</h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-0.5">
                Your profile status is currently <strong className="capitalize">{profile.verification_status}</strong>. Please complete KYC verification to unlock credit requests.
              </p>
            </div>
          </div>
          <Link
            href="/borrower/verification"
            className="btn-primary w-full py-3.5 px-6 rounded-2xl text-xs font-bold shadow-button"
          >
            <span>Proceed to Verification Page</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const numericAmount = parseFloat(amount) || 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Application Flow Stepper */}
      <div className="card p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-extrabold mb-2">
              <Zap className="h-3.5 w-3.5" /> Express Intra-Org Liquidity
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight">
              Emergency Loan Application
            </h1>
            <p className="text-xs sm:text-sm text-ink-slate dark:text-slate-400 mt-1 font-medium">
              Request instant payroll-backed credit up to your organization limit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> 0% Hidden Fees SLA
            </span>
          </div>
        </div>

        {/* Animated Stepper Workflow */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-bold">
          <div className="p-3 rounded-2xl bg-primary text-white flex items-center gap-2.5 shadow-sm">
            <span className="h-6 w-6 rounded-xl bg-white/20 flex items-center justify-center text-xs">1</span>
            <span>Application</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-ink-slate dark:text-slate-400 flex items-center gap-2.5">
            <span className="h-6 w-6 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs">2</span>
            <span>Verification</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-ink-slate dark:text-slate-400 flex items-center gap-2.5">
            <span className="h-6 w-6 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs">3</span>
            <span>Approval</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-ink-slate dark:text-slate-400 flex items-center gap-2.5">
            <span className="h-6 w-6 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs">4</span>
            <span>Agreement</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-ink-slate dark:text-slate-400 flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <span className="h-6 w-6 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs">5</span>
            <span>Disbursal</span>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Form Card */}
        <Card className="lg:col-span-7 p-7 sm:p-8 space-y-7">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-slate-100 dark:border-white/5">
            <CardTitle className="text-xl font-bold text-ink dark:text-white">Loan Parameters</CardTitle>
            <CardDescription className="text-xs text-ink-slate font-medium">
              Adjust the slider or enter your principal amount and choose a repayment plan.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Amount Slider + Input Synced */}
            <div className="space-y-3 p-5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-slate dark:text-slate-400 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-primary" /> Select Loan Amount
                </label>
                <span className="text-2xl font-black text-primary tracking-tight">
                  {formatINR(numericAmount)}
                </span>
              </div>

              <input
                type="range"
                min="1000"
                max="250000"
                step="1000"
                value={numericAmount || 1000}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Min ₹1,000</span>
                <span>Max ₹2,50,000</span>
              </div>

              <div className="pt-2">
                <Input
                  id="amount"
                  type="number"
                  min={100}
                  step="100"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Or enter custom amount in ₹..."
                  className="text-sm font-bold bg-white dark:bg-surface-dark"
                />
              </div>
            </div>

            {/* Duration Plan Cards */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-slate dark:text-slate-400 mb-3">
                Select Repayment Duration Plan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {LOAN_PLANS.map((plan, idx) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isRecommended = idx === 0;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 relative group ${
                        isSelected
                          ? "border-2 border-primary bg-primary-soft/40 dark:bg-primary/20 shadow-button shadow-primary/10 scale-[1.02]"
                          : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-surface-dark"
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                          Fastest Approval
                        </span>
                      )}

                      {isSelected && (
                        <div className="absolute top-4 right-3 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}

                      <p className="font-extrabold text-sm text-ink dark:text-white">{plan.name}</p>
                      <p className="text-xs font-bold text-primary mt-1">{plan.days} Days Term</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold">
                        <span className="text-ink-slate font-medium">Interest</span>
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">{plan.ratePercent}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Reason & Purpose for Credit" htmlFor="purpose" hint="Explain the purpose for payroll approval records">
              <Textarea
                id="purpose"
                required
                rows={3}
                className="resize-none font-medium"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Emergency medical advance, family urgent expenditure..."
              />
            </Field>

            {/* Platform Suggested Disclaimer Box */}
            <div className="p-4 rounded-2xl border border-amber-500/30 dark:border-amber-400/20 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200 space-y-2 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 pb-1.5 border-b border-amber-200/80 dark:border-amber-900/40">
                <div className="p-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block leading-none">
                    Legal &amp; Platform Notice
                  </span>
                  <span className="font-extrabold text-xs text-ink dark:text-white">
                    Suggested Disclaimer
                  </span>
                </div>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-900/90 dark:text-amber-300 font-medium">
                This platform only facilitates introductions and documentation between employees who voluntarily choose to lend and borrow. It does not hold, transfer, or manage funds, does not guarantee repayment, and is not a bank, NBFC, or financial institution. All loan transactions occur directly between the lender and borrower.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-4 text-base font-bold shadow-button"
              loading={submitting}
            >
              Submit Loan Application
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>
        </Card>

        {/* Live Loan Breakdown & Eligibility Card */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <LiveLoanCalculator
            amount={numericAmount}
            planId={selectedPlanId}
          />

          {/* Org Borrowing Limit Card */}
          <div className="card p-6 border border-slate-200/60 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink dark:text-white">Borrowing Eligibility</h4>
                <p className="text-xs text-ink-slate font-medium">Verified Organization Limit</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-ink-slate">Maximum Available Credit</span>
                <span className="font-extrabold text-ink dark:text-white">₹2,50,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-slate">Repayment Mode</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Direct Disbursal &amp; Auto-Settlement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
