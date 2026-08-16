"use client";

import { useState } from "react";
import Link from "next/link";
import { calculatePlanLoan, LOAN_PLANS, LoanPlanId } from "@/lib/loan-math";
import { formatINR, formatDate } from "@/lib/utils";
import { 
  Calculator, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Sparkles,
  Calendar,
  TrendingUp,
  ArrowRightLeft
} from "lucide-react";
import { AgreementTemplateViewer, AgreementData } from "@/components/agreements/AgreementTemplateViewer";

export function HeroCalculator() {
  const [amount, setAmount] = useState(25000);
  const [selectedPlanId, setSelectedPlanId] = useState<LoanPlanId>("7_days");
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const calc = calculatePlanLoan(amount, selectedPlanId);
  const principalPct = calc.totalRepayment > 0 ? Math.round((calc.principal / calc.totalRepayment) * 100) : 100;

  const sampleAgreement: AgreementData = {
    agreement_number: "SHM-2026-0089",
    agreement_date: formatDate(new Date().toISOString()),
    organization_name: "TechCorp Global Solutions",
    lender_name: "Ramesh Sharma",
    borrower_name: "Sarah Jenkins",
    employee_id: "EMP-4092",
    loan_id: "LN-8841",
    loan_amount: amount,
    interest_rate: calc.annualEquivalentRate,
    loan_duration: `${calc.plan.days} Days`,
    repayment_amount: calc.totalRepayment,
    due_date: formatDate(calc.dueDate),
    borrower_signed: true,
    borrower_signed_at: formatDate(new Date().toISOString()),
    lender_signed: true,
    lender_signed_at: formatDate(new Date().toISOString()),
  };

  return (
    <div className="relative">
      {/* Background Soft Glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-signal/25 via-purple-500/20 to-cyan-500/25 rounded-[40px] blur-2xl -z-10" />

      <div className="bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-surface-border-dark rounded-3xl p-5 sm:p-6 shadow-elevated space-y-4">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-border-dark">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-signal text-white flex items-center justify-center font-black shadow-md">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-ink dark:text-white">Live Loan Calculator</h3>
              <p className="text-[11px] text-ink-slate">Simulate emergency borrowing parameters</p>
            </div>
          </div>
          <span className="badge bg-signal-soft text-signal-cobalt font-extrabold text-[10px] flex items-center gap-1 py-1 px-2.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Live Engine
          </span>
        </div>

        {/* Interactive Controls */}
        <div className="space-y-4">
          {/* Loan Amount Input & Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-ink dark:text-white">
              <label htmlFor="hero-loan-amount" className="text-ink-slate uppercase tracking-wider text-[10px]">Requested Loan Amount (₹)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-24 text-right font-black text-signal bg-transparent border-b border-slate-200 focus:border-signal outline-none pb-0.5"
              />
            </div>
            <input
              id="hero-loan-amount"
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={amount || 1000}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-canvas-dark rounded-lg appearance-none cursor-pointer accent-signal"
            />
            <div className="flex justify-between text-[9px] text-ink-slate font-semibold">
              <span>₹1,000</span>
              <span>₹50,000</span>
              <span>₹1,00,000</span>
            </div>
          </div>

          {/* Repayment Duration Plan Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-ink-slate font-extrabold uppercase tracking-wider block">Select Repayment Duration Plan</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOAN_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`py-2 px-2.5 rounded-xl text-left transition-all border relative ${
                      isSelected
                        ? "border-2 border-signal bg-signal/5 dark:bg-signal/10 shadow-sm"
                        : "border-slate-200 dark:border-surface-border-dark hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-surface-dark"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-3 w-3 rounded-full bg-signal text-white flex items-center justify-center">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      </div>
                    )}
                    <p className="font-extrabold text-xs text-ink dark:text-white">{plan.name}</p>
                    <p className="text-[9px] font-semibold text-signal mt-0.5">{plan.days} Days Term</p>
                    <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-surface-border-dark/60 flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 font-medium">Interest</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{plan.ratePercent}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculation Breakdown Box */}
          <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-canvas-dark border border-slate-100 dark:border-surface-border-dark space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-slate font-medium">
                Interest ({calc.plan.days} Days @ {calc.plan.ratePercent}%)
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{formatINR(calc.interest)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-slate font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Estimated Due Date
              </span>
              <span className="font-bold text-ink dark:text-white">{formatDate(calc.dueDate)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 dark:border-surface-border-dark flex items-center justify-between">
              <div>
                <p className="text-[9px] text-ink-slate font-semibold uppercase tracking-wider">Total Repayment</p>
                <p className="text-lg font-black text-ink dark:text-white mt-0.5">{formatINR(calc.totalRepayment)}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-[9px] font-bold">
                  <TrendingUp className="h-3 w-3" /> {calc.plan.days} Days Term
                </span>
              </div>
            </div>
          </div>

          {/* Guarantee / SLA Note */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-border-dark flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Backed by organization capital pool SLA &amp; payroll deduction.</span>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setShowAgreementModal(true)}
              className="py-2.5 px-3 rounded-full border border-signal text-signal dark:text-cyan-400 font-extrabold text-[11px] flex items-center justify-center gap-1.5 hover:bg-signal-soft transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Preview Agreement
            </button>

            <Link
              href="/signup"
              className="btn-primary py-2.5 px-3 rounded-full font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-button"
            >
              <span>Apply for Loan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Official SAHAYAM Agreement Preview Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-canvas-dark rounded-3xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-surface-border-dark">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-signal" />
                <h3 className="font-extrabold text-lg text-ink dark:text-white">Digital Agreement Preview</h3>
              </div>
              <button
                onClick={() => setShowAgreementModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-surface-dark flex items-center justify-center text-ink-slate hover:text-ink dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AgreementTemplateViewer agreement={sampleAgreement} />

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAgreementModal(false)}
                className="btn-secondary py-2.5 px-6 rounded-full text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
