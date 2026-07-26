import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge, VerificationBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan, Profile } from "@/types/database";
import { Users, HandCoins, AlertTriangle, Wallet, Sparkles, Building2, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

const DEMO_LOANS: Loan[] = [
  {
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
    created_at: "2026-07-22T09:15:00Z",
    approved_at: null,
    active_at: null,
    completed_at: null,
    updated_at: "2026-07-22T09:15:00Z",
  },
  {
    id: "admin-demo-loan-2",
    org_id: "demo-org",
    customer_id: "demo-cust-2",
    admin_id: null,
    amount: 30000,
    purpose: "Vehicle Maintenance & Repair",
    duration_days: 60,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 30000,
    due_date: null,
    status: "pending",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-07-21T14:40:00Z",
    approved_at: null,
    active_at: null,
    completed_at: null,
    updated_at: "2026-07-21T14:40:00Z",
  },
  {
    id: "admin-demo-loan-3",
    org_id: "demo-org",
    customer_id: "demo-cust-3",
    admin_id: "demo-admin",
    amount: 60000,
    purpose: "Family Medical Advance",
    duration_days: 90,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 60000,
    due_date: "2026-10-01",
    status: "active",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-07-01T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-06-25T11:00:00Z",
    approved_at: "2026-06-28T09:00:00Z",
    active_at: "2026-07-01T10:00:00Z",
    completed_at: null,
    updated_at: "2026-07-01T10:00:00Z",
  },
  {
    id: "admin-demo-loan-4",
    org_id: "demo-org",
    customer_id: "demo-cust-4",
    admin_id: "demo-admin",
    amount: 20000,
    purpose: "Emergency Relocation Expenses",
    duration_days: 30,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 20000,
    due_date: "2026-07-15",
    status: "overdue",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-06-15T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: 5,
    late_fee_amount: 1000,
    created_at: "2026-06-10T10:00:00Z",
    approved_at: "2026-06-12T11:00:00Z",
    active_at: "2026-06-15T10:00:00Z",
    completed_at: null,
    updated_at: "2026-07-16T00:00:00Z",
  },
];

const DEMO_PROFILES: Profile[] = [
  {
    id: "demo-user-1",
    org_id: "demo-org",
    full_name: "Sarah Jenkins",
    email: "sarah.j@company.com",
    phone: "+91 98765 43210",
    role: "customer",
    verification_status: "pending",
    rejection_reason: null,
    id_proof_url: "verification-docs/id.pdf",
    employment_proof_url: "verification-docs/letter.pdf",
    verified_by: null,
    verified_at: null,
    created_at: "2026-07-23T11:00:00Z",
    updated_at: "2026-07-23T11:00:00Z",
  },
  {
    id: "demo-user-2",
    org_id: "demo-org",
    full_name: "David Chen",
    email: "david.c@company.com",
    phone: "+91 98123 45678",
    role: "customer",
    verification_status: "pending",
    rejection_reason: null,
    id_proof_url: "verification-docs/id2.pdf",
    employment_proof_url: "verification-docs/letter2.pdf",
    verified_by: null,
    verified_at: null,
    created_at: "2026-07-24T08:30:00Z",
    updated_at: "2026-07-24T08:30:00Z",
  },
  {
    id: "demo-user-3",
    org_id: "demo-org",
    full_name: "Meera Nair",
    email: "meera.n@company.com",
    phone: "+91 97654 32109",
    role: "customer",
    verification_status: "pending",
    rejection_reason: null,
    id_proof_url: "verification-docs/id3.pdf",
    employment_proof_url: "verification-docs/letter3.pdf",
    verified_by: null,
    verified_at: null,
    created_at: "2026-07-25T14:10:00Z",
    updated_at: "2026-07-25T14:10:00Z",
  },
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let list: Loan[] = [];
  let pendingVerifications: Profile[] = [];
  let isDemoData = false;

  if (user) {
    const { data: me } = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();
    const orgId = me?.org_id;

    if (orgId) {
      const [{ data: loans }, { data: verifications }] = await Promise.all([
        supabase.from("loans").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("org_id", orgId)
          .eq("verification_status", "pending")
          .order("created_at", { ascending: false }),
      ]);
      list = (loans as Loan[]) || [];
      pendingVerifications = (verifications as Profile[]) || [];
    }
  }

  if (!user || list.length === 0) {
    const { data: publicLoans } = await supabase.from("loans").select("*").order("created_at", { ascending: false });
    const { data: publicProfiles } = await supabase.from("profiles").select("*").eq("verification_status", "pending");

    list = publicLoans && publicLoans.length > 0 ? (publicLoans as Loan[]) : DEMO_LOANS;
    pendingVerifications = publicProfiles && publicProfiles.length > 0 ? (publicProfiles as Profile[]) : DEMO_PROFILES;
    isDemoData = true;
  }

  const pending = list.filter((l) => l.status === "pending");
  const active = list.filter((l) => l.status === "active");
  const overdue = list.filter((l) => l.status === "overdue");
  const outstanding = active.reduce((s, l) => s + l.total_repayment, 0);

  const totalOrgPool = 2500000;
  const availableLiquidity = Math.max(0, totalOrgPool - outstanding);

  const stats = [
    { label: "Total Outstanding Capital", value: formatINR(outstanding), icon: Wallet },
    { label: "Available Pool Liquidity", value: formatINR(availableLiquidity), icon: Building2 },
    { label: "Pending Requests", value: pending.length, icon: HandCoins },
    { label: "Verifications Queue", value: pendingVerifications.length, icon: Users },
  ];

  return (
    <div className="space-y-6">
      {!user ? (
        <div className="p-4 rounded-2xl bg-signal-soft border border-signal/20 text-xs sm:text-sm text-signal-cobalt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-semibold">
          <span>Viewing Admin Dashboard (Guest Preview Mode with Demo Data)</span>
          <Link href="/login" className="underline hover:text-signal shrink-0">Sign In as Admin</Link>
        </div>
      ) : isDemoData ? (
        <div className="p-4 rounded-2xl bg-signal-soft border border-signal/20 text-xs sm:text-sm text-signal-cobalt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-semibold">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-signal shrink-0" />
            Showing Admin Demo Data & Verification Queue
          </span>
          <Link href="/admin/verifications" className="btn-primary text-xs py-1.5 px-4 rounded-full shrink-0">
            Review Verifications
          </Link>
        </div>
      ) : null}

      {/* Admin Capital Summary Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a192f] via-[#0d2847] to-[#071324] text-white p-6 sm:p-8 shadow-elevated border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-signal/20 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Organization Admin Management
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Organization Capital Pool & Oversight
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Monitor liquidity, approve employee loan requests, and verify member identity proofs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[140px] text-center">
              <p className="text-xs text-slate-300 font-medium uppercase tracking-wider">Total Capital Pool</p>
              <p className="text-2xl font-black text-white mt-0.5">{formatINR(totalOrgPool)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 hover:-translate-y-0.5 hover:border-signal/40 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-signal-soft dark:bg-white/10 text-signal dark:text-white">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                Admin
              </span>
            </div>
            <p className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">{s.value}</p>
            <p className="text-xs text-ink-slate dark:text-ink-mist mt-1 font-medium">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-ink dark:text-white">Loan requests awaiting review</h3>
              <p className="text-xs sm:text-sm text-ink-slate dark:text-ink-mist mt-0.5">Pending employee applications.</p>
            </div>
            <Link href="/admin/loans" className="text-xs sm:text-sm font-semibold text-signal hover:underline shrink-0">
              View all ({pending.length})
            </Link>
          </div>
          {pending.length === 0 ? (
            <EmptyState title="Nothing pending" description="New loan requests will appear here." />
          ) : (
            <div className="divide-y divide-surface-border dark:divide-surface-border-dark">
              {pending.slice(0, 5).map((loan) => (
                <Link
                  key={loan.id}
                  href={`/admin/loans/${loan.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 hover:bg-surface-pebble dark:hover:bg-white/5 -mx-2 px-3 rounded-xl transition-colors gap-2 sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink dark:text-white truncate">{loan.purpose}</p>
                    <p className="text-xs text-ink-slate dark:text-ink-mist mt-0.5">
                      <span className="font-bold text-ink dark:text-white">{formatINR(loan.amount)}</span> · Requested {formatDate(loan.created_at)}
                    </p>
                  </div>
                  <div className="self-start sm:self-center shrink-0">
                    <LoanStatusBadge status={loan.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-ink dark:text-white">Verification queue</h3>
              <p className="text-xs sm:text-sm text-ink-slate dark:text-ink-mist mt-0.5">Pending identity reviews.</p>
            </div>
            <Link href="/admin/verifications" className="text-xs sm:text-sm font-semibold text-signal hover:underline shrink-0">
              View all ({pendingVerifications.length})
            </Link>
          </div>
          {pendingVerifications.length === 0 ? (
            <EmptyState title="Nothing to review" description="Pending customer verifications appear here." />
          ) : (
            <div className="divide-y divide-surface-border dark:divide-surface-border-dark">
              {pendingVerifications.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/verifications`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 hover:bg-surface-pebble dark:hover:bg-white/5 -mx-2 px-3 rounded-xl transition-colors gap-2 sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink dark:text-white truncate">{p.full_name}</p>
                    <p className="text-xs text-ink-slate dark:text-ink-mist mt-0.5 truncate">{p.email}</p>
                  </div>
                  <div className="self-start sm:self-center shrink-0">
                    <VerificationBadge status={p.verification_status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

