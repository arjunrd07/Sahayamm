import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { LoanTimeline } from "@/components/loans/loan-timeline";
import { AgreementCard } from "@/components/agreements/agreement-card";
import { formatINR, formatDate } from "@/lib/utils";
import type { Agreement, Loan } from "@/types/database";
import { RepaymentUpload } from "./repayment-upload";

const DEMO_LOANS_LOOKUP: Record<string, Loan> = {
  "demo-loan-1": {
    id: "demo-loan-1",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 50000,
    purpose: "Emergency Family Medical Expenses",
    duration_days: 90,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 50000,
    due_date: "2026-10-15",
    status: "active",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-07-15T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-07-10T14:30:00Z",
    approved_at: "2026-07-12T09:00:00Z",
    active_at: "2026-07-15T10:00:00Z",
    completed_at: null,
    updated_at: "2026-07-15T10:00:00Z",
  },
  "demo-loan-2": {
    id: "demo-loan-2",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: null,
    amount: 25000,
    purpose: "Home Refurbishment Advance",
    duration_days: 60,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 25000,
    due_date: null,
    status: "pending",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-07-20T11:15:00Z",
    approved_at: null,
    active_at: null,
    completed_at: null,
    updated_at: "2026-07-20T11:15:00Z",
  },
  "cust-loan-1": {
    id: "cust-loan-1",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 50000,
    purpose: "Emergency Family Medical Expenses",
    duration_days: 90,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 50000,
    due_date: "2026-10-15",
    status: "active",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-07-15T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-07-10T14:30:00Z",
    approved_at: "2026-07-12T09:00:00Z",
    active_at: "2026-07-15T10:00:00Z",
    completed_at: null,
    updated_at: "2026-07-15T10:00:00Z",
  },
};

export default async function CustomerLoanDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let loan: Loan | null = null;
  let agreement: Agreement | null = null;

  if (user) {
    const { data } = await supabase
      .from("loans")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    loan = data as Loan | null;
  }

  if (!loan) {
    loan = DEMO_LOANS_LOOKUP[params.id] || DEMO_LOANS_LOOKUP["demo-loan-1"];
  }

  if (!loan) notFound();

  const facts = [
    { label: "Amount", value: formatINR(loan.amount) },
    { label: "Interest", value: `${formatINR(loan.calculated_interest)} (${loan.interest_rate_annual}% p.a.)` },
    { label: "Total Repayment", value: formatINR(loan.total_repayment) },
    { label: "Tenure Duration", value: `${loan.duration_days} days` },
    { label: "Due Date", value: loan.due_date ? formatDate(loan.due_date) : "—" },
  ];

  const demoAgreement: Agreement = {
    id: "agr-demo",
    loan_id: loan.id,
    org_id: loan.org_id,
    agreement_number: "AGR-2026-8842",
    docuseal_submission_id: "DOCUSEAL-SUB-9942",
    pdf_url: null,
    borrower_signed: true,
    borrower_signed_at: "2026-07-12T09:30:00Z",
    lender_signed: true,
    lender_signed_at: "2026-07-12T10:00:00Z",
    status: "completed",
    created_at: loan.created_at,
    updated_at: loan.updated_at,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white">{loan.purpose}</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">Requested {formatDate(loan.created_at)}</p>
        </div>
        <LoanStatusBadge status={loan.status} />
      </div>

      {loan.status === "rejected" && loan.rejection_reason && (
        <Card className="border-danger/30 bg-danger-soft p-4">
          <p className="text-xs text-danger font-extrabold">Loan Application Declined</p>
          <p className="text-xs text-danger/80 mt-1">{loan.rejection_reason}</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <CardTitle className="mb-4 text-base font-extrabold">Loan Summary</CardTitle>
            <div className="space-y-3">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-ink-slate">{f.label}</span>
                  <span className="font-extrabold text-ink dark:text-white">{f.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <AgreementCard agreement={demoAgreement} />

          {loan.status === "active" && (
            <Card className="p-6">
              <CardTitle className="text-base font-extrabold">Repayment Proof Upload</CardTitle>
              <CardDescription className="mb-4 text-xs">
                Upload your bank UTR receipt once repayment is completed.
              </CardDescription>
              <RepaymentUpload loanId={loan.id} orgId={loan.org_id} alreadySubmitted={!!loan.repayment_proof_url} />
            </Card>
          )}
        </div>

        <Card className="p-6">
          <CardTitle className="mb-4 text-base font-extrabold">Lifecycle Timeline</CardTitle>
          <LoanTimeline loan={loan} />
        </Card>
      </div>
    </div>
  );
}
