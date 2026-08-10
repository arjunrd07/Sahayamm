import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan, Profile } from "@/types/database";
import { HandCoins, Wallet, Clock, CheckCircle2, ShieldCheck, ArrowRight, Calendar, Sparkles, TrendingUp, Award, Activity, Plus } from "lucide-react";

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
];

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let list: Loan[] = [];
  let userProfile: Profile | null = null;

  if (user) {
    const { data: loans } = await supabase
      .from("loans")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    list = (loans as Loan[]) || [];

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    userProfile = (prof as Profile) || null;
  }

  const active = list.filter((l) => l.status === "active");
  const pending = list.filter((l) => l.status === "pending" || l.status === "approved");
  const completed = list.filter((l) => l.status === "completed");
  const overdue = list.filter((l) => l.status === "overdue");

  const outstanding = active.reduce((sum, l) => sum + l.total_repayment, 0);

  const cibilScore = userProfile?.cibil_score || 750;
  
  let maxEligibleLimit = 100000;
  if (completed.length > 0) {
    maxEligibleLimit = Math.min(250000, 100000 + completed.length * 25000);
  }
  if (overdue.length > 0) {
    maxEligibleLimit = Math.max(50000, maxEligibleLimit * 0.5);
  }

  const availableCredit = Math.max(0, maxEligibleLimit - outstanding);
  const creditUtilizationPct = Math.min(100, Math.round((outstanding / maxEligibleLimit) * 100));

  const stats = [
    { label: "Outstanding Loan Balance", value: formatINR(outstanding), icon: Wallet, highlight: false },
    { label: "Available Credit Limit", value: formatINR(availableCredit), icon: HandCoins, highlight: true },
    { label: "Active & Pending Loans", value: active.length + pending.length, icon: Clock, highlight: false },
    { label: "Completed Repayments", value: completed.length, icon: CheckCircle2, highlight: false },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Soft UI Hero Banner Header */}
      <div className="card p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-elevated relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-primary/20 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/30 text-blue-200 border border-primary/40 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-primary-light" /> Enterprise Borrower Workspace
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Sahayam Credit Dashboard
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
              0% Interest intra-organization emergency credit pool with instant e-signatures and payroll auto-deductions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[170px] text-center">
              <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Max Request Limit</p>
              <p className="text-2xl font-black text-white mt-1">{formatINR(maxEligibleLimit)}</p>
              <p className="text-[11px] text-emerald-400 font-bold mt-0.5">₹1 Lakh Base Limit</p>
            </div>
            <Link
              href="/borrower/request"
              className="btn-primary py-4 px-7 text-sm font-bold shadow-button"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Apply For Loan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Credit Rating & Loan Eligibility Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Score Gauge Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink dark:text-white">Credit Rating Score</h4>
                <p className="text-xs text-ink-slate font-medium">Verified CIBIL Metric</p>
              </div>
            </div>
            <span className="badge bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold">
              Excellent
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-3xl font-black text-ink dark:text-white tracking-tight">{cibilScore}</span>
            <span className="text-xs font-semibold text-ink-slate">/ 900 Points</span>
          </div>

          {/* Visual Bar */}
          <div className="w-full bg-slate-100 dark:bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((cibilScore / 900) * 100))}%` }}
            />
          </div>

          <p className="text-xs text-ink-slate leading-relaxed font-medium">
            High credit standing unlocks express loan processing from your company liquidity pool.
          </p>
        </Card>

        {/* Credit Limit & Utilization Engine */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink dark:text-white">Credit Limit Used</h4>
                <p className="text-xs text-ink-slate font-medium">Repayment Growth Engine</p>
              </div>
            </div>
            <span className="badge bg-primary-soft text-primary border border-primary/20 text-xs font-bold">
              {creditUtilizationPct}% Used
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1 text-xs font-bold">
            <span className="text-ink dark:text-white">Active Balance: {formatINR(outstanding)}</span>
            <span className="text-emerald-600 dark:text-emerald-400">Available: {formatINR(availableCredit)}</span>
          </div>

          {/* Utilization Bar */}
          <div className="w-full bg-slate-100 dark:bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${creditUtilizationPct}%` }}
            />
          </div>

          <p className="text-xs text-ink-slate leading-relaxed font-medium">
            Every completed loan repayment automatically increases your limit by <strong>+₹25,000</strong>.
          </p>
        </Card>

        {/* Borrower Tier Badge Card */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink dark:text-white">Borrower Status Tier</h4>
                <p className="text-xs text-ink-slate font-medium">Tier 1 Prime Member</p>
              </div>
            </div>
            <p className="text-xs text-ink-slate leading-relaxed font-medium">
              You are in the <strong>Prime Borrower Category</strong>. Express approval & 0% hidden fee privileges enabled.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold">
            <span className="text-ink-slate">Base Limit: ₹1,00,000</span>
            <span className="text-primary">Max Cap: ₹2,50,000</span>
          </div>
        </Card>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="icon-box">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="badge bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-extrabold">
                Active Pool
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-ink dark:text-white tracking-tight">{s.value}</p>
              <p className="text-xs font-semibold text-ink-slate dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Loan List */}
      <Card className="p-7">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="text-lg font-bold text-ink dark:text-white tracking-tight">Recent Borrower Loans &amp; Requests</h3>
            <p className="text-xs text-ink-slate font-medium mt-0.5">
              Your active, pending, and completed internal loans.
            </p>
          </div>
          <Link href="/borrower/loans" className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 shrink-0">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="No loan requests yet"
            description="Once you're verified, you can request a 0% interest loan from your Sahayam Lender pool."
            action={
              <Link href="/borrower/request" className="btn-primary text-xs font-bold">
                Apply For Your First Loan
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {list.slice(0, 5).map((loan) => (
              <Link
                key={loan.id}
                href={`/borrower/loans/${loan.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4.5 hover:bg-slate-50/80 dark:hover:bg-white/5 -mx-3 px-4 rounded-2xl transition-all duration-200 gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink dark:text-white truncate">{loan.purpose}</p>
                  <div className="text-xs text-ink-slate mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                    <span className="font-extrabold text-ink dark:text-white">{formatINR(loan.amount)}</span>
                    <span>•</span>
                    <span>Requested {formatDate(loan.created_at)}</span>
                    {loan.due_date && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-primary font-bold">
                          <Calendar className="h-3.5 w-3.5" /> Due {loan.due_date}
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
