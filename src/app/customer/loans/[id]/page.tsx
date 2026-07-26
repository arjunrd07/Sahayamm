import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { LoanTimeline } from "@/components/loans/loan-timeline";
import { AgreementCard } from "@/components/agreements/agreement-card";
import { formatINR, formatDate } from "@/lib/utils";
import type { Agreement, Loan } from "@/types/database";
import { RepaymentUpload } from "./repayment-upload";

export default async function CustomerLoanDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: loan } = await supabase
    .from("loans")
    .select("*")
    .eq("id", params.id)
    .eq("customer_id", user!.id)
    .single();

  if (!loan) notFound();

  const { data: agreement } = await supabase
    .from("agreements")
    .select("*")
    .eq("loan_id", loan.id)
    .maybeSingle();

  const l = loan as Loan;

  const facts = [
    { label: "Amount", value: formatINR(l.amount) },
    { label: "Interest", value: `${formatINR(l.calculated_interest)} (${l.interest_rate_annual}% p.a.)` },
    { label: "Total repayment", value: formatINR(l.total_repayment) },
    { label: "Duration", value: `${l.duration_days} days` },
    { label: "Due date", value: l.due_date ? formatDate(l.due_date) : "—" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{l.purpose}</h2>
          <p className="text-sm text-muted mt-1">Requested {formatDate(l.created_at)}</p>
        </div>
        <LoanStatusBadge status={l.status} />
      </div>

      {l.status === "rejected" && l.rejection_reason && (
        <Card className="border-danger/30 bg-danger-soft">
          <p className="text-sm text-danger font-medium">Rejected</p>
          <p className="text-sm text-danger/80 mt-1">{l.rejection_reason}</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
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

          <AgreementCard agreement={agreement as Agreement | null} />

          {l.status === "active" && (
            <Card>
              <CardTitle>Repayment</CardTitle>
              <CardDescription className="mb-4">
                Once you've paid your organization back, upload proof for the admin to verify.
              </CardDescription>
              <RepaymentUpload loanId={l.id} orgId={l.org_id} alreadySubmitted={!!l.repayment_proof_url} />
            </Card>
          )}
        </div>

        <Card>
          <CardTitle className="mb-4">Timeline</CardTitle>
          <LoanTimeline loan={l} />
        </Card>
      </div>
    </div>
  );
}
