import { cn } from "@/lib/utils";
import type { LoanStatus, VerificationStatus, AgreementStatus } from "@/types/database";

const loanStatusStyle: Record<LoanStatus, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  approved: "bg-signal-soft text-signal-cobalt",
  rejected: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300",
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  completed: "bg-surface-pebble text-ink-slate dark:bg-white/10 dark:text-white",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
};

const loanStatusLabel: Record<LoanStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  completed: "Completed",
  overdue: "Overdue",
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return <span className={cn("badge", loanStatusStyle[status])}>{loanStatusLabel[status]}</span>;
}

const verificationStyle: Record<VerificationStatus, string> = {
  unverified: "bg-surface-pebble text-ink-mist dark:bg-white/5",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  verified: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300",
};

const verificationLabel: Record<VerificationStatus, string> = {
  unverified: "Not submitted",
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <span className={cn("badge", verificationStyle[status])}>{verificationLabel[status]}</span>;
}

const agreementStyle: Record<AgreementStatus, string> = {
  draft: "bg-surface-pebble text-ink-mist dark:bg-white/5",
  sent: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  partially_signed: "bg-signal-soft text-signal-cobalt",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

const agreementLabel: Record<AgreementStatus, string> = {
  draft: "Draft",
  sent: "Awaiting signatures",
  partially_signed: "Partially signed",
  completed: "Fully signed",
};

export function AgreementStatusBadge({ status }: { status: AgreementStatus }) {
  return <span className={cn("badge", agreementStyle[status])}>{agreementLabel[status]}</span>;
}
