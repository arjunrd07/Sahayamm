import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { LoanStatusBadge, VerificationBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan, Profile } from "@/types/database";
import { Users, HandCoins, AlertTriangle, Wallet } from "lucide-react";

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
];

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let list: Loan[] = [];
  let pendingVerifications: Profile[] = [];

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
  }

  const pending = list.filter((l) => l.status === "pending");
  const active = list.filter((l) => l.status === "active");
  const overdue = list.filter((l) => l.status === "overdue");
  const outstanding = active.reduce((s, l) => s + l.total_repayment, 0);

  const stats = [
    { label: "Outstanding", value: formatINR(outstanding), icon: Wallet },
    { label: "Pending requests", value: pending.length, icon: HandCoins },
    { label: "Overdue loans", value: overdue.length, icon: AlertTriangle },
    { label: "Verifications queue", value: pendingVerifications.length, icon: Users },
  ];

  return (
    <div className="space-y-6">
      {!user && (
        <div className="p-4 rounded-xl bg-signal-soft border border-signal/20 text-sm text-signal-cobalt flex items-center justify-between font-semibold">
          <span>Viewing Admin Dashboard (Guest Preview Mode)</span>
          <Link href="/login" className="underline hover:text-signal">Sign In as Admin</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon className="h-4 w-4 text-signal mb-2" />
            <p className="text-2xl font-bold text-ink dark:text-white">{s.value}</p>
            <p className="text-xs font-semibold text-ink-slate mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <CardTitle className="text-lg font-bold text-ink dark:text-white">Loan requests awaiting review</CardTitle>
            <Link href="/admin/loans" className="text-sm font-semibold text-signal hover:underline">
              View all
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
                  className="flex items-center justify-between py-3.5 hover:bg-surface-pebble dark:hover:bg-white/5 -mx-2 px-3 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">{loan.purpose}</p>
                    <p className="text-xs text-ink-slate mt-0.5">
                      {formatINR(loan.amount)} · {formatDate(loan.created_at)}
                    </p>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <CardTitle className="text-lg font-bold text-ink dark:text-white">Verification queue</CardTitle>
            <Link href="/admin/verifications" className="text-sm font-semibold text-signal hover:underline">
              View all
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
                  className="flex items-center justify-between py-3.5 hover:bg-surface-pebble dark:hover:bg-white/5 -mx-2 px-3 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">{p.full_name}</p>
                    <p className="text-xs text-ink-slate mt-0.5">{p.email}</p>
                  </div>
                  <VerificationBadge status={p.verification_status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
