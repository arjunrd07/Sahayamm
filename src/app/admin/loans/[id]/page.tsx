"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge, VerificationBadge } from "@/components/ui/status-badge";
import { LoanTimeline } from "@/components/loans/loan-timeline";
import { AgreementCard } from "@/components/agreements/agreement-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import type { Agreement, Loan, Profile } from "@/types/database";
import { approveLoan, rejectLoan } from "../actions";

const DEMO_LOAN_FALLBACK: Loan = {
  id: "admin-demo-loan-1",
  org_id: "demo-org",
  customer_id: "demo-cust-1",
  admin_id: null,
  amount: 75000,
  purpose: "Higher Education Fee Advance",
  duration_days: 120,
  interest_rate_annual: 0,
  calculated_interest: 0,
  total_repayment: 75000,
  due_date: null,
  status: "pending",
  rejection_reason: null,
  disbursal_proof_url: null,
  disbursed_at: null,
  repayment_proof_url: null,
  repayment_submitted_at: null,
  late_fee_rate: null,
  late_fee_amount: null,
  created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  approved_at: null,
  active_at: null,
  completed_at: null,
  updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
};

const DEMO_CUSTOMER_FALLBACK: Profile = {
  id: "demo-cust-1",
  org_id: "demo-org",
  email: "rahul.sharma@techcorp.com",
  full_name: "Rahul Sharma",
  phone: "+91 98123 45678",
  role: "customer",
  verification_status: "verified",
  rejection_reason: null,
  id_proof_url: null,
  employment_proof_url: null,
  verified_by: "admin-1",
  verified_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function AdminLoanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { push } = useToast();
  const supabase = createClient();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data: loanData } = await supabase.from("loans").select("*").eq("id", params.id).single();
    if (loanData) {
      setLoan(loanData as Loan);
      const [{ data: cust }, { data: agr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", loanData.customer_id).single(),
        supabase.from("agreements").select("*").eq("loan_id", loanData.id).maybeSingle(),
      ]);
      setCustomer((cust as Profile) || DEMO_CUSTOMER_FALLBACK);
      setAgreement(agr as Agreement | null);
    } else {
      setLoan({ ...DEMO_LOAN_FALLBACK, id: params.id });
      setCustomer(DEMO_CUSTOMER_FALLBACK);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!loan) return null;

  async function handleApprove() {
    setSubmitting(true);
    if (loan!.id.startsWith("admin-") || loan!.id.startsWith("demo-") || loan!.id.startsWith("rep-")) {
      setLoan((prev) => prev ? { ...prev, status: "approved", approved_at: new Date().toISOString() } : null);
      push("success", "Demo Loan approved and internal agreement generated!");
      setSubmitting(false);
      return;
    }
    const result = await approveLoan(loan!.id);
    setSubmitting(false);
    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Loan approved and agreement generated.");
    load();
  }

  async function handleReject() {
    if (!reason.trim()) {
      push("error", "Add a reason for rejection.");
      return;
    }
    setSubmitting(true);
    if (loan!.id.startsWith("admin-") || loan!.id.startsWith("demo-") || loan!.id.startsWith("rep-")) {
      setLoan((prev) => prev ? { ...prev, status: "rejected", rejection_reason: reason } : null);
      push("success", "Demo Loan rejected.");
      setSubmitting(false);
      return;
    }
    const result = await rejectLoan(loan!.id, reason);
    setSubmitting(false);
    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Loan rejected.");
    load();
  }

  const facts = [
    { label: "Amount", value: formatINR(loan.amount) },
    { label: "Interest", value: `${formatINR(loan.calculated_interest)} (${loan.interest_rate_annual}% p.a.)` },
    { label: "Total repayment", value: formatINR(loan.total_repayment) },
    { label: "Duration", value: `${loan.duration_days} days` },
    { label: "Due date", value: loan.due_date ? formatDate(loan.due_date) : "—" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white">{loan.purpose}</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">Requested {formatDate(loan.created_at)}</p>
        </div>
        <LoanStatusBadge status={loan.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {customer && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-base font-extrabold">Applicant Customer</CardTitle>
                <VerificationBadge status={customer.verification_status} />
              </div>
              <div className="text-xs space-y-1.5 font-semibold">
                <p className="font-extrabold text-ink dark:text-white">{customer.full_name}</p>
                <p className="text-ink-slate">{customer.email}</p>
                {customer.phone && <p className="text-ink-slate">{customer.phone}</p>}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <CardTitle className="mb-4 text-base font-extrabold">Loan Terms</CardTitle>
            <div className="space-y-2.5">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-ink-slate">{f.label}</span>
                  <span className="font-extrabold text-ink dark:text-white">{f.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {loan.status === "pending" && (
            <Card className="p-6">
              <CardTitle className="text-base font-extrabold">Approval Decision</CardTitle>
              <CardDescription className="mb-4 text-xs">
                Approve to generate DocuSeal agreement, or reject with a specified reason.
              </CardDescription>
              {rejecting && (
                <Textarea
                  className="mb-3 text-xs"
                  placeholder="Reason for rejection"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
              <div className="flex gap-3">
                {rejecting ? (
                  <>
                    <Button variant="secondary" className="flex-1 text-xs font-bold" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" className="flex-1 text-xs font-bold" loading={submitting} onClick={handleReject}>
                      Confirm Reject
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="danger" className="flex-1 text-xs font-bold" onClick={() => setRejecting(true)}>
                      Reject
                    </Button>
                    <Button variant="primary" className="flex-1 text-xs font-bold" loading={submitting} onClick={handleApprove}>
                      Approve & Disburse
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}

          {loan.status !== "pending" && loan.status !== "rejected" && <AgreementCard agreement={agreement} />}

          {loan.rejection_reason && loan.status === "rejected" && (
            <Card className="border-danger/30 bg-danger-soft p-4">
              <p className="text-xs text-danger font-extrabold">Application Rejected</p>
              <p className="text-xs text-danger/80 mt-1">{loan.rejection_reason}</p>
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
