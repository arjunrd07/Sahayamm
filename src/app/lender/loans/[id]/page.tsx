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
    setLoan(loanData as Loan);
    if (loanData) {
      const [{ data: cust }, { data: agr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", loanData.customer_id).single(),
        supabase.from("agreements").select("*").eq("loan_id", loanData.id).maybeSingle(),
      ]);
      setCustomer(cust as Profile);
      setAgreement(agr as Agreement | null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!loan) return null;

  async function handleApprove() {
    setSubmitting(true);
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
          <h2 className="text-xl font-semibold">{loan.purpose}</h2>
          <p className="text-sm text-muted mt-1">Requested {formatDate(loan.created_at)}</p>
        </div>
        <LoanStatusBadge status={loan.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {customer && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <CardTitle>Applicant</CardTitle>
                <VerificationBadge status={customer.verification_status} />
              </div>
              <div className="text-sm space-y-1.5">
                <p className="font-medium">{customer.full_name}</p>
                <p className="text-muted">{customer.email}</p>
                {customer.phone && <p className="text-muted">{customer.phone}</p>}
              </div>
            </Card>
          )}

          <Card>
            <CardTitle className="mb-4">Loan details</CardTitle>
            <div className="space-y-2.5">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{f.label}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {loan.status === "pending" && (
            <Card>
              <CardTitle>Decision</CardTitle>
              <CardDescription className="mb-4">Approve to generate the lending agreement, or reject with a reason.</CardDescription>
              {rejecting && (
                <Textarea
                  className="mb-3"
                  placeholder="Reason for rejection"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
              <div className="flex gap-3">
                {rejecting ? (
                  <>
                    <Button variant="secondary" className="flex-1" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" className="flex-1" loading={submitting} onClick={handleReject}>
                      Confirm reject
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="danger" className="flex-1" onClick={() => setRejecting(true)}>
                      Reject
                    </Button>
                    <Button variant="primary" className="flex-1" loading={submitting} onClick={handleApprove}>
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}

          {loan.status !== "pending" && loan.status !== "rejected" && <AgreementCard agreement={agreement} />}

          {loan.rejection_reason && loan.status === "rejected" && (
            <Card className="border-danger/30 bg-danger-soft">
              <p className="text-sm text-danger font-medium">Rejected</p>
              <p className="text-sm text-danger/80 mt-1">{loan.rejection_reason}</p>
            </Card>
          )}
        </div>

        <Card>
          <CardTitle className="mb-4">Timeline</CardTitle>
          <LoanTimeline loan={loan} />
        </Card>
      </div>
    </div>
  );
}
