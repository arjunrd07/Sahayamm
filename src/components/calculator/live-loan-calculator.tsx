import { calculatePlanLoan, calculateLoan } from "@/lib/loan-math";
import { formatINR, formatDate } from "@/lib/utils";
import { Calculator, Calendar, Percent, ShieldCheck } from "lucide-react";

interface LiveLoanCalculatorProps {
  amount: number;
  monthlyIncome?: number;
  planId?: string;
  interestRate?: number;
  durationDays?: number;
}

export function LiveLoanCalculator({
  amount,
  monthlyIncome,
  planId,
  interestRate,
  durationDays,
}: LiveLoanCalculatorProps) {
  let calc;
  let interestLabel = "";
  let durationText = "";
  let rateText = "";

  if (planId) {
    const planCalc = calculatePlanLoan(amount, planId);
    calc = planCalc;
    interestLabel = `Interest (${planCalc.plan.ratePercent}%)`;
    durationText = `${planCalc.plan.days} Days`;
    rateText = `${planCalc.plan.ratePercent}%`;
  } else {
    calc = calculateLoan(amount, interestRate || 0, durationDays || 0);
    interestLabel = `Interest (${interestRate || 0}% p.a.)`;
    durationText = `${durationDays || 0} Days`;
    rateText = `${interestRate || 0}%`;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark p-6 shadow-card space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-surface-border-dark">
        <div className="h-8 w-8 rounded-lg bg-signal-soft text-signal flex items-center justify-center font-bold">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h4 className="font-extrabold text-base text-ink dark:text-white">Loan Breakdown</h4>
          <p className="text-xs text-ink-slate">Live calculations & repayment terms</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-slate font-medium">Loan Amount</span>
          <span className="font-bold text-ink dark:text-white">{formatINR(calc.principal)}</span>
        </div>

        {Boolean(monthlyIncome && monthlyIncome > 0) && (
          <div className="flex items-center justify-between">
            <span className="text-ink-slate font-medium">Declared Monthly Income</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(monthlyIncome!)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-ink-slate font-medium">Loan Duration</span>
          <span className="font-semibold text-ink dark:text-white flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-signal" /> {durationText}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-ink-slate font-medium">Mapped Interest Rate</span>
          <span className="font-bold text-signal px-2 py-0.5 rounded-full bg-signal-soft text-xs">
            {rateText}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-ink-slate font-medium">{interestLabel}</span>
          <span className="font-semibold text-ink dark:text-white">{formatINR(calc.interest)}</span>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-surface-border-dark flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-ink-slate uppercase tracking-wider block">Payable Back Amount</span>
            <span className="text-xs text-ink-mist">Principal + Interest</span>
          </div>
          <span className="text-xl font-black text-signal">
            {formatINR(calc.totalRepayment)}
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-surface-border-dark">
          <span className="text-xs font-semibold text-ink-slate">Repayment Due Date</span>
          <span className="text-xs font-bold text-ink dark:text-white">
            {planId || (durationDays && durationDays > 0) ? formatDate(calc.dueDate) : "—"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-ink-slate bg-signal-soft/30 dark:bg-signal/10 p-2.5 rounded-xl border border-signal/10">
        <ShieldCheck className="h-4 w-4 text-signal shrink-0" />
        <span>0% Hidden Fees • DocuSeal e-agreement generated on approval</span>
      </div>
    </div>
  );
}
