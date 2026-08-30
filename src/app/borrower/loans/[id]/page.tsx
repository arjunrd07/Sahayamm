import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { LoanTimeline } from "@/components/loans/loan-timeline";
import { AgreementCard } from "@/components/agreements/agreement-card";
import { formatINR, formatDate } from "@/lib/utils";
import type { Agreement, Loan } from "@/types/database";
import { RepaymentUpload } from "./repayment-upload";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  Clock,
  ShieldCheck,
  Receipt,
  FileCheck,
  AlertCircle,
  Percent,
} from "lucide-react";

export default async function CustomerLoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch loan directly from database
  const { data: loanData } = await supabase
    .from("loans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!loanData || (user && loanData.customer_id !== user.id)) notFound();

  const l = loanData as Loan;

  // Fetch agreement details
  const [{ data: agreement }, { data: borrowerProf }, { data: lenderProf }, { data: orgData }] = await Promise.all([
    supabase.from("agreements").select("*").eq("loan_id", l.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", l.customer_id).maybeSingle(),
    l.admin_id
      ? supabase.from("profiles").select("*").eq("id", l.admin_id).maybeSingle()
      : supabase.from("profiles").select("*").eq("org_id", l.org_id).in("role", ["lender", "admin"]).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("organizations").select("*").eq("id", l.org_id).maybeSingle(),
  ]);

  const loanDetailsForAgreement = {
    loan_id: `LN-${l.id.slice(0, 8)}`,
    amount: l.amount,
    interest_rate: l.interest_rate_annual || 0,
    interest_amount: l.calculated_interest,
    duration_days: l.duration_days,
    total_repayment: l.total_repayment,
    due_date: l.due_date,
    created_at: l.created_at,
    borrower_name: borrowerProf?.full_name || borrowerProf?.email || "Borrower",
    borrower_email: borrowerProf?.email,
    borrower_employee_id: borrowerProf?.employee_id || undefined,
    borrower_pan: borrowerProf?.pan_number || undefined,
    lender_name: lenderProf?.full_name || lenderProf?.email || "Organization Lender",
    lender_email: lenderProf?.email,
    org_name: orgData?.name || "Sahayam Organization",
  };

  const facts = [
    {
      icon: Banknote,
      label: "Requested Amount",
      value: formatINR(l.amount),
      highlight: true,
    },
    {
      icon: Percent,
      label: "Interest Rate",
      value: `${formatINR(l.calculated_interest || 0)} (${l.interest_rate_annual || 0}% p.a.)`,
    },
    {
      icon: Receipt,
      label: "Total Repayment Amount",
      value: formatINR(l.total_repayment || l.amount),
    },
    {
      icon: Clock,
      label: "Tenure / Duration",
      value: `${l.duration_days} Days`,
    },
    {
      icon: Calendar,
      label: "Repayment Due Date",
      value: l.due_date ? formatDate(l.due_date) : "Pending Approval",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Top Header Card */}
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/borrower/loans"
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 transition-colors"
              title="Back to My Loans"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-signal/10 text-signal border border-signal/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Intra-Org Emergency Loan
            </span>
          </div>
          <LoanStatusBadge status={l.status} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink dark:text-white">
            {l.purpose}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submitted on {formatDate(l.created_at)} • Application Ref:{" "}
            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
              #{l.id.slice(0, 8)}
            </span>
          </p>
        </div>
      </div>

      {/* Rejection Alert Banner */}
      {l.status === "rejected" && l.rejection_reason && (
        <Card className="border-danger/30 bg-danger/5 dark:bg-danger/10 p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-danger">Loan Application Declined</p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              {l.rejection_reason}
            </p>
          </div>
        </Card>
      )}

      {/* Main Grid Content */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Financial Summary & Agreements */}
        <div className="lg:col-span-7 space-y-6">
          {/* Loan Details Summary Card */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileCheck className="h-5 w-5 text-signal" />
              <CardTitle className="text-lg">Financial Summary</CardTitle>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {facts.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="py-3.5 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span>{f.label}</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        f.highlight
                          ? "text-base font-bold text-signal"
                          : "text-ink dark:text-white"
                      }`}
                    >
                      {f.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Legal Agreement Viewer Card */}
          <AgreementCard agreement={agreement as Agreement | null} loanDetails={loanDetailsForAgreement} />

          {/* Repayment Action Card */}
          {(l.status === "active" || l.status === "approved") && (
            <Card className="p-6">
              <CardTitle className="text-lg mb-1">Repayment & Proof Upload</CardTitle>
              <CardDescription className="mb-4">
                Once you have executed repayment to your organization's lender account, upload your transaction proof receipt for admin confirmation.
              </CardDescription>
              <RepaymentUpload
                loanId={l.id}
                orgId={l.org_id}
                alreadySubmitted={!!l.repayment_proof_url}
              />
            </Card>
          )}
        </div>

        {/* Right Column: Timeline Progress */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full">
            <CardTitle className="text-lg mb-4">Application Progress</CardTitle>
            <LoanTimeline loan={l} />
          </Card>
        </div>
      </div>
    </div>
  );
}
