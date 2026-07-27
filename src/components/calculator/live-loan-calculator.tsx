import { calculatePlanLoan, calculateLoan } from "@/lib/loan-math";
import { formatINR, formatDate } from "@/lib/utils";
import { ShieldCheck, Sparkles, Calendar, ArrowRightLeft, TrendingUp } from "lucide-react";

interface LiveLoanCalculatorProps {
  amount: number;
  planId?: string;
  interestRate?: number;
  durationDays?: number;
}

export function LiveLoanCalculator({
  amount,
  planId,
  interestRate,
  durationDays,
}: LiveLoanCalculatorProps) {
  let calc;
  let interestLabel = "";
  let durationLabel = "";

  if (planId) {
    const planCalc = calculatePlanLoan(amount, planId);
    calc = planCalc;
    interestLabel = `Interest (${planCalc.plan.days} Days @ ${planCalc.plan.ratePercent}%)`;
    durationLabel = `${planCalc.plan.days} Days Term`;
  } else {
    calc = calculateLoan(amount, interestRate || 0, durationDays || 0);
    interestLabel = `Interest (${interestRate || 0}% p.a.)`;
    durationLabel = `${durationDays || 0} Days Term`;
  }

  const principalPct = calc.totalRepayment > 0 ? Math.round((calc.principal / calc.totalRepayment) * 100) : 100;

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark p-6 shadow-card space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-border-dark">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-signal-soft text-signal">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink dark:text-white">Loan Breakdown</h4>
            <p className="text-[11px] text-ink-slate">Live Terms &amp; Repayment Projection</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800/40">
          0% Hidden Fees
        </span>
      </div>

      {/* Visual Breakdown Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-ink dark:text-white">Principal: {formatINR(calc.principal)}</span>
          <span className="text-signal">Total: {formatINR(calc.totalRepayment)}</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div className="h-full bg-signal transition-all duration-300" style={{ width: `${principalPct}%` }} />
          <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${100 - principalPct}%` }} />
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-slate font-medium">Principal Amount</span>
          <span className="font-bold text-ink dark:text-white">{formatINR(calc.principal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-slate font-medium">{interestLabel}</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">{formatINR(calc.interest)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-slate font-medium flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" /> Repayment Due Date
          </span>
          <span className="font-bold text-ink dark:text-white">
            {(planId || (durationDays && durationDays > 0)) ? formatDate(calc.dueDate) : "Select Plan"}
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-surface-border-dark flex items-center justify-between">
          <div>
            <p className="text-[11px] text-ink-slate font-semibold uppercase tracking-wider">Total Repayment</p>
            <p className="text-2xl font-black text-ink dark:text-white mt-0.5">{formatINR(calc.totalRepayment)}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-[11px] font-bold">
              <TrendingUp className="h-3 w-3" /> {durationLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Guarantee Footer */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-border-dark flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
        <span>Backed by organization capital pool SLA &amp; automated payroll deduction schedules.</span>
      </div>
    </div>
  );
}
