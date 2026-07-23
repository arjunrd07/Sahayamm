import { cn } from "@/lib/utils";
import type { LoanStatus, VerificationStatus, AgreementStatus } from "@/types/database";

const loanStatusStyle: Record<LoanStatus, string> = {
  pending: "bg-warning-soft text-warning",
  approved: "bg-accent-soft text-accent",
  rejected: "bg-danger-soft text-danger",
  active: "bg-success-soft text-success",
  completed: "bg-surface text-ink dark:bg-white/10 dark:text-white",
  overdue: "bg-danger-soft text-danger",
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
  unverified: "bg-surface text-muted dark:bg-white/5",
  pending: "bg-warning-soft text-warning",
  verified: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
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
  draft: "bg-surface text-muted dark:bg-white/5",
  sent: "bg-warning-soft text-warning",
  partially_signed: "bg-accent-soft text-accent",
  completed: "bg-success-soft text-success",
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
