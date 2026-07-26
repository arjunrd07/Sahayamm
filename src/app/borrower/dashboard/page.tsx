import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan, Profile } from "@/types/database";
import { HandCoins, Wallet, Clock, CheckCircle2, ShieldCheck, ArrowRight, Calendar, Sparkles, TrendingUp, Award, Activity } from "lucide-react";

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
];

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let list: Loan[] = [];
  let userProfile: Profile | null = null;
  let isDemoData = false;

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

  if (!user || list.length === 0) {
    list = DEMO_LOANS;
    isDemoData = true;
  }

  const active = list.filter((l) => l.status === "active");
  const pending = list.filter((l) => l.status === "pending" || l.status === "approved");
  const completed = list.filter((l) => l.status === "completed");
  const overdue = list.filter((l) => l.status === "overdue");

  const outstanding = active.reduce((sum, l) => sum + l.total_repayment, 0);

  // Dynamic Credit Score & Credit Limit Calculation Engine:
  // Default Base Credit Limit: ₹1,00,000 (1 Lakh)
  // Base CIBIL score: userProfile?.cibil_score || 750
  const cibilScore = userProfile?.cibil_score || 750;
  
  // Calculate dynamic limit bonuses based on completed payments (+25k per completed loan, max 2.5L limit)
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
    { label: "Outstanding Loan Balance", value: formatINR(outstanding), icon: Wallet },
    { label: "Available Borrowing Limit", value: formatINR(availableCredit), icon: HandCoins },
    { label: "Active & Pending Requests", value: active.length + pending.length, icon: Clock },
    { label: "Completed Repayments", value: completed.length, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      {!user ? (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-semibold shadow-sm border border-slate-800">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
            Viewing Borrower Dashboard (Guest Preview Mode with Demo Data)
          </span>
          <Link href="/login" className="underline hover:text-blue-300 shrink-0">Sign In for Personal Account</Link>
        </div>
      ) : isDemoData ? (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-semibold">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
            Showing Borrower Demo Data & Sample Requests
          </span>
          <Link href="/borrower/request" className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-4 rounded-full shrink-0">
            Request Real Loan
          </Link>
        </div>
      ) : null}

      {/* Hero Header with Dynamic Credit Score & Max Limit Engine */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-elevated border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> BedRock Verified Borrower Account
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Borrower Credit Workspace
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              0% Interest intra-organization emergency loans backed by BedRock liquidity pools & automated repayment scoring.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 min-w-[160px] text-center">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Max Request Limit</p>
              <p className="text-2xl font-black text-white mt-0.5">{formatINR(maxEligibleLimit)}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Default ₹1 Lakh Eligible</p>
            </div>
            <Link
              href="/borrower/request"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 text-sm font-bold rounded-full shadow-button transition-all active:scale-[0.98]"
            >
              Apply For Loan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Credit Rating & Loan Eligibility Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Credit Score Gauge Card */}
        <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink dark:text-white">CIBIL Credit Score</h4>
                <p className="text-[11px] text-ink-slate">Verified Financial Score</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
              Excellent
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-ink dark:text-white">{cibilScore}</span>
            <span className="text-xs font-semibold text-ink-slate">/ 900 Points</span>
          </div>

          {/* Score Visual Bar */}
          <div className="w-full bg-slate-100 dark:bg-white/10 h-2.5 rounded-full overflow-hidden mb-3">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((cibilScore / 900) * 100))}%` }}
            />
          </div>

          <p className="text-xs text-ink-slate leading-relaxed">
            High credit score qualifies you for instant 0% interest loan approvals from Lender pools.
          </p>
        </Card>

        {/* Credit Limit & Utilization Engine */}
        <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink dark:text-white">Credit Limit Utilization</h4>
                <p className="text-[11px] text-ink-slate">Dynamic Repayment Growth</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
              {creditUtilizationPct}% Used
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-bold text-ink dark:text-white">Active Balance: {formatINR(outstanding)}</span>
            <span className="text-xs font-bold text-emerald-600">Available: {formatINR(availableCredit)}</span>
          </div>

          {/* Utilization Bar */}
          <div className="w-full bg-slate-100 dark:bg-white/10 h-2.5 rounded-full overflow-hidden mb-3">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${creditUtilizationPct}%` }}
            />
          </div>

          <p className="text-xs text-ink-slate leading-relaxed">
            Every completed loan repayment automatically increases your maximum borrowing limit by <strong>+₹25,000</strong>.
          </p>
        </Card>

        {/* Borrower Tier Badge Card */}
        <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink dark:text-white">Borrower Tier Level</h4>
                <p className="text-[11px] text-ink-slate">Tier 1 Prime Member</p>
              </div>
            </div>
            <p className="text-xs text-ink-slate leading-relaxed">
              You are in the <strong>Prime Borrower Category</strong> with BedRock. Instant approval privileges enabled.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-surface-border-dark mt-3 flex items-center justify-between text-xs font-bold">
            <span className="text-ink-slate">Default Cap: ₹1,00,000</span>
            <span className="text-blue-600">Max Cap: ₹2,50,000</span>
          </div>
        </Card>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 hover:-translate-y-0.5 transition-all duration-200 border border-slate-200 dark:border-surface-border-dark">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white">
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

      {/* Main Loan List */}
      <Card className="p-5 sm:p-6 border border-slate-200 dark:border-surface-border-dark">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-ink dark:text-white">Recent Borrower Loans & Requests</h3>
            <p className="text-xs sm:text-sm text-ink-slate dark:text-ink-mist mt-0.5">
              Your active, pending, and completed internal loans.
            </p>
          </div>
          <Link href="/borrower/loans" className="text-xs sm:text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="No loan requests yet"
            description="Once you're verified, you can request a 0% interest loan from your BedRock Lender pool."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-surface-border-dark">
            {list.slice(0, 5).map((loan) => (
              <Link
                key={loan.id}
                href={`/borrower/loans/${loan.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 hover:bg-slate-50 dark:hover:bg-white/5 -mx-2 px-3 sm:px-4 rounded-xl transition-colors gap-2 sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink dark:text-white truncate">{loan.purpose}</p>
                  <div className="text-xs text-ink-slate dark:text-ink-mist mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-extrabold text-ink dark:text-white">{formatINR(loan.amount)}</span>
                    <span>•</span>
                    <span>Requested {formatDate(loan.created_at)}</span>
                    {loan.due_date && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
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
