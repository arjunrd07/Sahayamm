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
import { FileUploader } from "@/components/ui/file-uploader";
import { useToast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import type { Agreement, Loan, Profile } from "@/types/database";
import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { approveLoan, rejectLoan, sendRepaymentReminder } from "../actions";

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
  const [reminderSending, setReminderSending] = useState(false);

  async function load() {
    const { data: loanData } = await supabase.from("loans").select("*").eq("id", params.id).maybeSingle();
    setLoan(loanData as Loan);
    if (loanData) {
      const [{ data: cust }, { data: agr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", loanData.customer_id).maybeSingle(),
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

  const [approving, setApproving] = useState(false);
  const [disbursalProofUrl, setDisbursalProofUrl] = useState("");

  if (!loan) return null;

  async function handleApprove() {
    setSubmitting(true);
    const result = await approveLoan(loan!.id, disbursalProofUrl.trim() || undefined);
    setSubmitting(false);
    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Loan approved & activated with payment proof recorded.");
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

  async function handleSendReminder() {
    setReminderSending(true);
    const result = await sendRepaymentReminder(loan!.id);
    setReminderSending(false);
    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Repayment reminder notification sent to borrower.");
  }

  const planLabel =
    loan.duration_days === 7
      ? "7 Days Plan (0.4% interest)"
      : loan.duration_days === 14
      ? "14 Days Plan (0.8% interest)"
      : loan.duration_days === 21
      ? "21 Days Plan (1.4% interest)"
      : `${loan.duration_days} days`;

  const facts = [
    { label: "Amount Requested", value: formatINR(loan.amount) },
    { label: "Selected Plan", value: planLabel },
    { label: "Calculated Interest", value: formatINR(loan.calculated_interest) },
    { label: "Total Repayment", value: formatINR(loan.total_repayment) },
    { label: "Due Date", value: loan.due_date ? formatDate(loan.due_date) : "—" },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header with Inline Back Arrow */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/lender/loans"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
            title="Back to Loan Requests"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink dark:text-white">{loan.purpose}</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Requested on {formatDate(loan.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loan.status === "active" && (
            <Button
              variant="secondary"
              className="text-xs flex items-center gap-1.5"
              loading={reminderSending}
              onClick={handleSendReminder}
            >
              <Bell className="h-3.5 w-3.5" /> Notify Repayment Due
            </Button>
          )}
          <LoanStatusBadge status={loan.status} />
        </div>
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
                <p className="font-bold text-ink dark:text-white">{customer.full_name}</p>
                <p className="text-muted">{customer.email}</p>
                {customer.phone && <p className="text-muted">{customer.phone}</p>}
                <p className="text-[11px] text-slate-400 italic mt-1">
                  🔒 Sensitive PAN/CIBIL details masked for compliance.
                </p>
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

          {loan.disbursal_proof_url && (
            <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">
              <CardTitle className="text-emerald-900 dark:text-emerald-300 mb-2">
                Disbursal Payment Proof (Image/Doc)
              </CardTitle>
              <p className="text-xs text-muted mb-3">Stored proof of payment in Supabase Storage & loan_payments table.</p>
              {loan.disbursal_proof_url.startsWith("http") || loan.disbursal_proof_url.startsWith("/") || loan.disbursal_proof_url.startsWith("data:") ? (
                <img
                  src={loan.disbursal_proof_url}
                  alt="Payment Receipt Proof"
                  className="rounded-lg border max-h-56 object-contain w-full bg-white p-1"
                />
              ) : (
                <div className="p-3 bg-white dark:bg-black/20 rounded-lg text-xs font-mono break-all border">
                  Proof File: {loan.disbursal_proof_url}
                </div>
              )}
            </Card>
          )}

          {loan.status === "pending" && (
            <Card>
              <CardTitle>Lender Decision</CardTitle>
              <CardDescription className="mb-4">
                Upload payment receipt proof (Image or Document) to approve and activate loan, or reject request.
              </CardDescription>

              {approving ? (
                <div className="space-y-4 mb-4">
                  <FileUploader
                    bucket="disbursals"
                    label="Upload Disbursal Payment Proof"
                    onUploadComplete={(url) => setDisbursalProofUrl(url)}
                  />

                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" className="flex-1 text-xs" onClick={() => setApproving(false)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 text-xs font-bold"
                      loading={submitting}
                      onClick={handleApprove}
                    >
                      Confirm Approval & Activate
                    </Button>
                  </div>
                </div>
              ) : rejecting ? (
                <div className="space-y-3 mb-4">
                  <Textarea
                    className="mb-1 text-xs"
                    placeholder="Reason for rejection"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1 text-xs" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" className="flex-1 text-xs" loading={submitting} onClick={handleReject}>
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button variant="danger" className="flex-1" onClick={() => setRejecting(true)}>
                    Disapprove / Reject
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={() => setApproving(true)}>
                    Approve Loan
                  </Button>
                </div>
              )}
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
