import { calculateLoan } from "@/lib/loan-math";
import { formatINR, formatDate } from "@/lib/utils";

export function LiveLoanCalculator({
  amount,
  interestRate,
  durationDays,
}: {
  amount: number;
  interestRate: number;
  durationDays: number;
}) {
  const calc = calculateLoan(amount, interestRate, durationDays);

  const rows = [
    { label: "Principal", value: formatINR(calc.principal) },
    { label: `Interest (${interestRate || 0}% p.a.)`, value: formatINR(calc.interest) },
    { label: "Total repayment", value: formatINR(calc.totalRepayment), emphasize: true },
    { label: "Due date", value: durationDays > 0 ? formatDate(calc.dueDate) : "—" },
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
