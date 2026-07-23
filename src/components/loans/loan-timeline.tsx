import { Check } from "lucide-react";
import type { Loan } from "@/types/database";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function LoanTimeline({ loan }: { loan: Loan }) {
  const isRejected = loan.status === "rejected";

  const steps = [
    { label: "Requested", done: true, at: loan.created_at },
    isRejected
      ? { label: "Rejected", done: true, at: loan.approved_at }
      : { label: "Approved", done: !!loan.approved_at, at: loan.approved_at },
    { label: "Funds disbursed", done: !!loan.active_at, at: loan.active_at },
    { label: "Repayment submitted", done: !!loan.repayment_submitted_at, at: loan.repayment_submitted_at },
    { label: "Completed", done: !!loan.completed_at, at: loan.completed_at },
  ].filter((s) => !(isRejected && s.label === "Completed") && !(isRejected && s.label === "Repayment submitted") && !(isRejected && s.label === "Funds disbursed"));

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                step.done
                  ? isRejected && step.label === "Rejected"
                    ? "bg-danger text-white"
                    : "bg-success text-white"
                  : "bg-surface dark:bg-white/10 text-muted"
              )}
            >
              {step.done && <Check className="h-3.5 w-3.5" />}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("w-px flex-1 min-h-[24px]", step.done ? "bg-success/40" : "bg-surface-border dark:bg-white/10")} />
            )}
          </div>
          <div className="pb-6">
            <p className={cn("text-sm font-medium", !step.done && "text-muted")}>{step.label}</p>
            {step.at && <p className="text-xs text-muted mt-0.5">{formatDateTime(step.at)}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
