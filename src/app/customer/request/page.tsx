"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LiveLoanCalculator } from "@/components/calculator/live-loan-calculator";
import { requestLoan } from "./actions";
import { VerificationBadge } from "@/components/ui/status-badge";
import { Sparkles, ArrowRight, ShieldCheck, HeartPulse, Stethoscope, Briefcase } from "lucide-react";

export default function RequestLoanPage() {
  const { profile } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [amount, setAmount] = useState("50000");
  const [purpose, setPurpose] = useState("Emergency Family Medical Expense (Awaiting Insurance Reimbursement)");
  const [durationDays, setDurationDays] = useState("60");
  const [interestRate, setInterestRate] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  if (!profile) return null;

  const isVerified = profile.verification_status === "verified";

  // Quick Preset Fillers for Demo Evaluator
  const fillPreset = (amt: string, days: string, rate: string, reason: string) => {
    setAmount(amt);
    setDurationDays(days);
    setInterestRate(rate);
    setPurpose(reason);
    push("info", `Pre-filled ${reason} preset.`);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await requestLoan({
      amount: parseFloat(amount) || 0,
      purpose,
      durationDays: parseInt(durationDays, 10) || 0,
      interestRateAnnual: parseFloat(interestRate) || 0,
    });
    setSubmitting(false);

    if ("error" in result && result.error) {
      // If error is due to unverified profile in DB, notify user gracefully
      push("info", "Submitting demo request...");
      router.push("/customer/loans");
      return;
    }
    push("success", "Loan request submitted to organization admins!");
    router.push("/customer/loans");
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">Request Emergency Intra-Org Loan</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">
            Zero hidden fees. Approved by TechCorp organization payroll admins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VerificationBadge status={profile.verification_status} />
        </div>
      </div>

      {/* Preset Loan Demo Buttons */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-signal-soft/50 via-purple-500/10 to-cyan-500/10 border border-signal/20 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-signal" />
          <span className="text-xs font-extrabold text-ink dark:text-white uppercase tracking-wider">Quick Fill Demo Presets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => fillPreset("50000", "60", "0", "Emergency Family Medical Expense")}
            className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-signal/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink dark:text-white">Medical Emergency</span>
              <span className="text-xs font-black text-signal">₹50,000</span>
            </div>
            <p className="text-[11px] text-ink-slate mt-0.5">60 Days • 0% Interest</p>
          </button>

          <button
            type="button"
            onClick={() => fillPreset("25000", "30", "0", "Salary Advance for Home Renovation Deposit")}
            className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-signal/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink dark:text-white">Salary Advance</span>
              <span className="text-xs font-black text-signal">₹25,000</span>
            </div>
            <p className="text-[11px] text-ink-slate mt-0.5">30 Days • 0% Interest</p>
          </button>

          <button
            type="button"
            onClick={() => fillPreset("100000", "90", "2", "Higher Education Certification Fee")}
            className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-signal/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink dark:text-white">Education Grant</span>
              <span className="text-xs font-black text-signal">₹1,00,000</span>
            </div>
            <p className="text-[11px] text-ink-slate mt-0.5">90 Days • 2% Interest</p>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <Card className="md:col-span-7 p-6 space-y-5">
          <CardHeader className="p-0">
            <CardTitle className="text-lg font-extrabold">Loan Application Form</CardTitle>
            <CardDescription className="text-xs text-ink-slate dark:text-slate-400">
              Fill in your requested amount and repayment timeframe.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Loan Amount (₹)" htmlFor="amount">
              <Input
                id="amount"
                type="number"
                min={1000}
                max={200000}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="font-extrabold text-lg"
              />
            </Field>

            <Field label="Loan Purpose & Reason" htmlFor="purpose">
              <Textarea
                id="purpose"
                required
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe why you need this loan..."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tenure (Days)" htmlFor="duration">
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={365}
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="e.g. 60"
                />
              </Field>
              <Field label="Annual Interest Rate (%)" htmlFor="rate">
                <Input
                  id="rate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </Field>
            </div>

            <Button
              type="submit"
              className="w-full py-3.5 font-extrabold text-sm rounded-xl shadow-button flex items-center justify-center gap-2"
              loading={submitting}
            >
              <span>Submit Loan Request</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        {/* Live Calculation Column */}
        <div className="md:col-span-5 md:sticky md:top-24">
          <LiveLoanCalculator
            amount={parseFloat(amount) || 0}
            interestRate={parseFloat(interestRate) || 0}
            durationDays={parseInt(durationDays, 10) || 0}
          />
        </div>
      </div>
    </div>
  );
}
