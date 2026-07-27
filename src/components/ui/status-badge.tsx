import { cn } from "@/lib/utils";
import type { LoanStatus, VerificationStatus, AgreementStatus } from "@/types/database";

const loanStatusStyle: Record<LoanStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50",
  active: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
  completed: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  overdue: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900",
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
  unverified: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50",
};

const verificationLabel: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  pending: "Pending Review",
  verified: "Verified",
  rejected: "Rejected",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <span className={cn("badge", verificationStyle[status])}>{verificationLabel[status]}</span>;
}

const agreementStyle: Record<AgreementStatus, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
  sent: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
  partially_signed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
};

const agreementLabel: Record<AgreementStatus, string> = {
  draft: "Draft",
  sent: "Awaiting Signatures",
  partially_signed: "Partially Signed",
  completed: "Fully Signed",
};

export function AgreementStatusBadge({ status }: { status: AgreementStatus }) {
  return <span className={cn("badge", agreementStyle[status])}>{agreementLabel[status]}</span>;
}
