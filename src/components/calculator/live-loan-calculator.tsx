import { calculatePlanLoan, calculateLoan } from "@/lib/loan-math";
import { formatINR, formatDate } from "@/lib/utils";
import { ShieldCheck, Calendar, TrendingUp, Sparkles, PieChart } from "lucide-react";

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
    <div className="card-static p-6 sm:p-7 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-ink dark:text-white tracking-tight">Loan Summary</h4>
            <p className="text-xs text-ink-slate font-medium">Instant Liquidity Calculation</p>
          </div>
        </div>
        <span className="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-black">
          0% Platform Fees
        </span>
      </div>

      {/* Visual Breakdown Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-ink dark:text-white">Principal: {formatINR(calc.principal)}</span>
          <span className="text-primary font-black">Total: {formatINR(calc.totalRepayment)}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex p-0.5">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${principalPct}%` }} />
          <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${100 - principalPct}%` }} />
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-ink-slate">Requested Principal</span>
          <span className="font-bold text-ink dark:text-white">{formatINR(calc.principal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-ink-slate">{interestLabel}</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">+{formatINR(calc.interest)}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-ink-slate flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" /> Due Date
          </span>
          <span className="font-bold text-ink dark:text-white">
            {(planId || (durationDays && durationDays > 0)) ? formatDate(calc.dueDate) : "Select Plan"}
          </span>
        </div>

        {/* Total Repayment Card Highlight */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-ink-slate font-extrabold uppercase tracking-wider">Total Repayment Amount</p>
            <p className="text-3xl font-black text-ink dark:text-white tracking-tight mt-0.5">
              {formatINR(calc.totalRepayment)}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-extrabold">
              <TrendingUp className="h-3.5 w-3.5" /> {durationLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Guarantee Footer */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-start gap-3 text-xs text-ink-slate font-medium">
        <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          Backed by official organization liquidity pool SLA and automatic payroll deduction schedules.
        </span>
      </div>
    </div>
  );
}
