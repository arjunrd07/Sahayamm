import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan } from "@/types/database";
import { HandCoins, Wallet, Clock, CheckCircle2 } from "lucide-react";

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let list: Loan[] = [];

  if (user) {
    const { data: loans } = await supabase
      .from("loans")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    list = (loans as Loan[]) || [];
  } else {
    const { data: publicLoans } = await supabase
      .from("loans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    list = publicLoans && publicLoans.length > 0 ? (publicLoans as Loan[]) : DEMO_LOANS;
  }

  const active = list.filter((l) => l.status === "active");
  const pending = list.filter((l) => l.status === "pending");
  const completed = list.filter((l) => l.status === "completed");
  const outstanding = active.reduce((sum, l) => sum + l.total_repayment, 0);

  const stats = [
    { label: "Outstanding", value: formatINR(outstanding), icon: Wallet },
    { label: "Active loans", value: active.length, icon: HandCoins },
    { label: "Pending requests", value: pending.length, icon: Clock },
    { label: "Completed", value: completed.length, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {!user && (
        <div className="p-4 rounded-xl bg-signal-soft border border-signal/20 text-sm text-signal-cobalt flex items-center justify-between font-semibold">
          <span>Viewing Customer Dashboard (Guest Preview Mode)</span>
          <Link href="/login" className="underline hover:text-signal">Sign In for Personal Account</Link>
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

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <CardTitle className="text-lg font-bold text-ink dark:text-white">Recent loans</CardTitle>
            <CardDescription className="text-ink-slate">Your latest requests across every status.</CardDescription>
          </div>
          <Link href="/customer/loans" className="text-sm font-semibold text-signal hover:underline">
            View all
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
                className="flex items-center justify-between py-3.5 hover:bg-surface-pebble dark:hover:bg-white/5 -mx-2 px-3 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-white">{loan.purpose}</p>
                  <p className="text-xs text-ink-slate mt-0.5">
                    {formatINR(loan.amount)} · Requested {formatDate(loan.created_at)}
                  </p>
                </div>
                <LoanStatusBadge status={loan.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
