import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan } from "@/types/database";
import { HandCoins, Wallet, Clock, CheckCircle2, ShieldCheck, ArrowRight, Calendar, Sparkles } from "lucide-react";

const DEMO_LOANS: Loan[] = [
  {
    id: "demo-loan-1",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 50000,
    purpose: "Emergency Medical Expenses",
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
  {
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
  {
    id: "demo-loan-3",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 15000,
    purpose: "Course & Certification Fee",
    duration_days: 30,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 15000,
    due_date: "2026-06-30",
    status: "completed",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-05-30T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: "2026-06-28T16:00:00Z",
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-05-25T08:20:00Z",
    approved_at: "2026-05-27T12:00:00Z",
    active_at: "2026-05-30T10:00:00Z",
    completed_at: "2026-06-28T16:00:00Z",
    updated_at: "2026-06-28T16:00:00Z",
  },
  {
    id: "demo-loan-4",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 35000,
    purpose: "Laptop & Work Equipment Upgrade",
    duration_days: 120,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 35000,
    due_date: "2026-11-20",
    status: "approved",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-07-22T09:00:00Z",
    approved_at: "2026-07-23T14:00:00Z",
    active_at: null,
    completed_at: null,
    updated_at: "2026-07-23T14:00:00Z",
  },
];

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let list: Loan[] = [];
  let isDemoData = false;

  if (user) {
    const { data: loans } = await supabase
      .from("loans")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    list = (loans as Loan[]) || [];
  }

  if (!user || list.length === 0) {
    list = DEMO_LOANS;
    isDemoData = true;
  }

  const active = list.filter((l) => l.status === "active");
  const pending = list.filter((l) => l.status === "pending" || l.status === "approved");
  const completed = list.filter((l) => l.status === "completed");
  const outstanding = active.reduce((sum, l) => sum + l.total_repayment, 0);

  const creditLimit = 100000;
  const availableCredit = Math.max(0, creditLimit - outstanding);

  const stats = [
    { label: "Outstanding Loan Balance", value: formatINR(outstanding), icon: Wallet },
    { label: "Available Credit Limit", value: formatINR(availableCredit), icon: HandCoins },
    { label: "Active & Pending Loans", value: active.length + pending.length, icon: Clock },
    { label: "Completed Loans", value: completed.length, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      {!user ? (
        <div className="p-4 rounded-2xl bg-signal-soft border border-signal/20 text-xs sm:text-sm text-signal-cobalt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-semibold">
          <span>Viewing Customer Dashboard (Guest Preview Mode with Demo Data)</span>
          <Link href="/login" className="underline hover:text-signal shrink-0">Sign In for Personal Account</Link>
        </div>
      ) : isDemoData ? (
        <div className="p-4 rounded-2xl bg-signal-soft border border-signal/20 text-xs sm:text-sm text-signal-cobalt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-semibold">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-signal shrink-0" />
            Showing Customer Demo Data & Sample Requests
          </span>
          <Link href="/customer/request" className="btn-primary text-xs py-1.5 px-4 rounded-full shrink-0">
            Request Real Loan
          </Link>
        </div>
      ) : null}

      {/* Handcrafted Ambient Gradient Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a192f] via-[#0d2847] to-[#071324] text-white p-6 sm:p-8 shadow-elevated border border-white/10">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-signal/20 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Verified Member Account
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Organization Internal Credit
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Interest-free intra-organization loans backed by your verified employment status & payroll pool.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[140px] text-center">
              <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Credit Limit</p>
              <p className="text-2xl font-black text-white mt-0.5">{formatINR(creditLimit)}</p>
            </div>
            <Link
              href="/customer/request"
              className="inline-flex items-center justify-center gap-2 bg-signal hover:bg-signal-hover text-white py-3.5 px-6 text-sm font-semibold rounded-full shadow-button hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Apply Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards — Grid System */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 hover:-translate-y-0.5 hover:border-signal/40 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-signal-soft dark:bg-white/10 text-signal dark:text-white">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>
            <p className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">{s.value}</p>
            <p className="text-xs text-ink-slate dark:text-ink-mist mt-1 font-medium">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Main Loan List with Mobile Card Fallback */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-ink dark:text-white">Recent Loans & Requests</h3>
            <p className="text-xs sm:text-sm text-ink-slate dark:text-ink-mist mt-0.5">
              Your latest internal loans across all statuses.
            </p>
          </div>
          <Link href="/customer/loans" className="text-xs sm:text-sm font-semibold text-signal hover:underline flex items-center gap-1 shrink-0">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="No loan requests yet"
            description="Once you're verified, you can request a loan from your organization."
          />
        ) : (
          <div className="divide-y divide-surface-border dark:divide-surface-border-dark">
            {list.slice(0, 5).map((loan) => (
              <Link
                key={loan.id}
                href={`/customer/loans/${loan.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 hover:bg-surface-pebble dark:hover:bg-white/5 -mx-2 px-3 sm:px-4 rounded-xl transition-colors gap-2 sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink dark:text-white truncate">{loan.purpose}</p>
                  <div className="text-xs text-ink-slate dark:text-ink-mist mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-bold text-ink dark:text-white">{formatINR(loan.amount)}</span>
                    <span>•</span>
                    <span>Requested {formatDate(loan.created_at)}</span>
                    {loan.due_date && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-signal font-semibold">
                          <Calendar className="h-3 w-3" /> Due {loan.due_date}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="self-start sm:self-center shrink-0">
                  <LoanStatusBadge status={loan.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

