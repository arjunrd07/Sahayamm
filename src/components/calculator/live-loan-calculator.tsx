import { calculatePlanLoan, calculateLoan } from "@/lib/loan-math";
import { formatINR, formatDate } from "@/lib/utils";

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

  if (planId) {
    const planCalc = calculatePlanLoan(amount, planId);
    calc = planCalc;
    interestLabel = `Interest (${planCalc.plan.days} days @ ${planCalc.plan.ratePercent}%)`;
  } else {
    calc = calculateLoan(amount, interestRate || 0, durationDays || 0);
    interestLabel = `Interest (${interestRate || 0}% p.a.)`;
  }

  const rows = [
    { label: "Principal", value: formatINR(calc.principal) },
    { label: interestLabel, value: formatINR(calc.interest) },
    { label: "Total repayment", value: formatINR(calc.totalRepayment), emphasize: true },
    { label: "Due date", value: (planId || (durationDays && durationDays > 0)) ? formatDate(calc.dueDate) : "—" },
  ];

  return (
    <div className="rounded-2xl border border-surface-border dark:border-surface-border-dark bg-surface dark:bg-white/5 p-5">
      <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Live calculation</p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-sm text-muted">{row.label}</span>
            <span className={row.emphasize ? "text-base font-semibold" : "text-sm font-medium"}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

