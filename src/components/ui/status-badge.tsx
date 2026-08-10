import { cn } from "@/lib/utils";
import type { LoanStatus, VerificationStatus, AgreementStatus } from "@/types/database";

const loanStatusStyle: Record<LoanStatus, { bg: string; dot: string }> = {
  pending: {
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dot: "bg-amber-500",
  },
  approved: {
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  rejected: {
    bg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dot: "bg-rose-500",
  },
  active: {
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    dot: "bg-blue-500",
  },
  completed: {
    bg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    dot: "bg-slate-500",
  },
  overdue: {
    bg: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    dot: "bg-red-500 animate-pulse",
  },
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
  const conf = loanStatusStyle[status];
  return (
    <span className={cn("badge font-bold text-xs tracking-tight", conf.bg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", conf.dot)} />
      {loanStatusLabel[status]}
    </span>
  );
}

const verificationStyle: Record<VerificationStatus, { bg: string; dot: string }> = {
  unverified: {
    bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  },
  pending: {
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dot: "bg-amber-500",
  },
  verified: {
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  rejected: {
    bg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dot: "bg-rose-500",
  },
};

const verificationLabel: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  pending: "Pending Review",
  verified: "Verified",
  rejected: "Rejected",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const conf = verificationStyle[status];
  return (
    <span className={cn("badge font-bold text-xs tracking-tight", conf.bg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", conf.dot)} />
      {verificationLabel[status]}
    </span>
  );
}

const agreementStyle: Record<AgreementStatus, { bg: string; dot: string }> = {
  draft: {
    bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  },
  sent: {
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dot: "bg-amber-500",
  },
  partially_signed: {
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    dot: "bg-blue-500",
  },
  completed: {
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
};

const agreementLabel: Record<AgreementStatus, string> = {
  draft: "Draft",
  sent: "Awaiting Signatures",
  partially_signed: "Partially Signed",
  completed: "Fully Signed",
};

export function AgreementStatusBadge({ status }: { status: AgreementStatus }) {
  const conf = agreementStyle[status];
  return (
    <span className={cn("badge font-bold text-xs tracking-tight", conf.bg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", conf.dot)} />
      {agreementLabel[status]}
    </span>
  );
}
