"use client";

import { useState } from "react";
import Link from "next/link";
import { calculateLoan } from "@/lib/loan-math";
import { formatINR, formatDate } from "@/lib/utils";
import { 
  Calculator, 
  ShieldCheck, 
  Percent, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Printer,
  Sparkles
} from "lucide-react";
import { AgreementTemplateViewer, AgreementData } from "@/components/agreements/AgreementTemplateViewer";

export function HeroCalculator() {
  const [amount, setAmount] = useState(50000);
  const [durationDays, setDurationDays] = useState(30);
  const [interestRate, setInterestRate] = useState(0);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const calc = calculateLoan(amount, interestRate, durationDays);

  const sampleAgreement: AgreementData = {
    agreement_number: "SHM-2026-0089",
    agreement_date: formatDate(new Date().toISOString()),
    organization_name: "TechCorp Global Solutions",
    lender_name: "Ramesh Sharma",
    borrower_name: "Sarah Jenkins",
    employee_id: "EMP-4092",
    loan_id: "LN-8841",
    loan_amount: amount,
    interest_rate: interestRate,
    loan_duration: `${durationDays} Days`,
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

      <div className="bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-surface-border-dark rounded-3xl p-6 sm:p-8 shadow-elevated space-y-6">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-surface-border-dark">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-signal text-white flex items-center justify-center font-black shadow-md">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-ink dark:text-white">Live Loan Calculator</h3>
              <p className="text-xs text-ink-slate">Simulate Sahayam 0% Intra-Org Emergency Credit</p>
            </div>
          </div>
          <span className="badge bg-signal-soft text-signal-cobalt font-extrabold text-xs flex items-center gap-1.5 py-1.5 px-3">
            <ShieldCheck className="h-4 w-4" /> Live Engine
          </span>
        </div>

        {/* Interactive Controls */}
        <div className="space-y-5">
          {/* Amount Slider & Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-ink dark:text-white">
              <label htmlFor="hero-loan-amount" className="text-ink-slate uppercase tracking-wider text-[11px]">Requested Loan Amount</label>
              <span className="text-base font-black text-signal">{formatINR(amount)}</span>
            </div>
            <input
              id="hero-loan-amount"
              type="range"
              min="5000"
              max="200000"
              step="5000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 dark:bg-canvas-dark rounded-lg appearance-none cursor-pointer accent-signal"
            />
            <div className="flex justify-between text-[10px] text-ink-slate font-semibold">
              <span>₹5,000</span>
              <span>₹1,000,000</span>
              <span>₹2,00,000</span>
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-2">
            <label className="text-xs text-ink-slate font-extrabold uppercase tracking-wider block">Duration / Tenure</label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDurationDays(days)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                    durationDays === days
                      ? "bg-signal text-white border-signal shadow-sm scale-[1.02]"
                      : "bg-slate-50 dark:bg-canvas-dark text-ink dark:text-white border-slate-200 dark:border-surface-border-dark hover:border-signal/40"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-ink-slate uppercase tracking-wider text-[11px]">Interest Rate (Annual)</span>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                {interestRate === 0 ? "0% Intra-Org Policy" : `${interestRate}% p.a.`}
              </span>
            </div>
            <div className="flex gap-2">
              {[0, 2, 5, 8].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setInterestRate(rate)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    interestRate === rate
                      ? "bg-signal-soft text-signal-cobalt border-signal/40"
                      : "bg-white dark:bg-surface-dark border-slate-200 dark:border-surface-border-dark text-ink-slate"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Breakdown Box */}
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-canvas-dark border border-slate-100 dark:border-surface-border-dark space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-slate font-medium">Principal Amount</span>
              <span className="font-extrabold text-ink dark:text-white">{formatINR(calc.principal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-slate font-medium">Calculated Interest ({interestRate}%)</span>
              <span className="font-extrabold text-ink dark:text-white">{formatINR(calc.interest)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-slate font-medium">Estimated Due Date</span>
              <span className="font-extrabold text-ink dark:text-white">{formatDate(calc.dueDate)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 dark:border-surface-border-dark flex items-center justify-between">
              <span className="text-xs font-black text-ink dark:text-white uppercase tracking-wider">Total Repayment</span>
              <span className="text-lg font-black text-signal">{formatINR(calc.totalRepayment)}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowAgreementModal(true)}
              className="py-3 px-4 rounded-full border border-signal text-signal dark:text-cyan-400 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-signal-soft transition-colors"
            >
              <FileText className="h-4 w-4" />
              Preview Agreement
            </button>

            <Link
              href="/signup"
              className="btn-primary py-3 px-4 rounded-full font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-button"
            >
              <span>Apply for Loan</span>
              <ArrowRight className="h-4 w-4" />
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
                <h3 className="font-extrabold text-lg text-ink dark:text-white">DocuSeal Agreement Preview</h3>
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
