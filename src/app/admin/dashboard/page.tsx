import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge, VerificationBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan, Profile } from "@/types/database";
import { Users, HandCoins, AlertTriangle, Wallet } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("org_id").eq("id", user!.id).single();
  const orgId = me!.org_id;

  const [{ data: loans }, { data: pendingVerifications }] = await Promise.all([
    supabase.from("loans").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("*")
      .eq("org_id", orgId)
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const list = (loans as Loan[]) || [];
  const pending = list.filter((l) => l.status === "pending");
  const active = list.filter((l) => l.status === "active");
  const overdue = list.filter((l) => l.status === "overdue");
  const outstanding = active.reduce((s, l) => s + l.total_repayment, 0);

  const stats = [
    { label: "Outstanding", value: formatINR(outstanding), icon: Wallet },
    { label: "Pending requests", value: pending.length, icon: HandCoins },
    { label: "Overdue loans", value: overdue.length, icon: AlertTriangle },
    { label: "Verifications queue", value: (pendingVerifications || []).length, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="h-4 w-4 text-muted mb-2" />
            <p className="text-xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Loan requests awaiting review</CardTitle>
            <Link href="/admin/loans" className="text-sm font-medium text-accent">
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
                  className="flex items-center justify-between py-3 hover:bg-surface/50 dark:hover:bg-white/5 -mx-2 px-2 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{loan.purpose}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatINR(loan.amount)} · {formatDate(loan.created_at)}
                    </p>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Verification queue</CardTitle>
            <Link href="/admin/verifications" className="text-sm font-medium text-accent">
              View all
            </Link>
          </div>
          {!pendingVerifications || pendingVerifications.length === 0 ? (
            <EmptyState title="Nothing to review" description="Pending customer verifications appear here." />
          ) : (
            <div className="divide-y divide-surface-border dark:divide-surface-border-dark">
              {(pendingVerifications as Profile[]).slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/verifications`}
                  className="flex items-center justify-between py-3 hover:bg-surface/50 dark:hover:bg-white/5 -mx-2 px-2 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted mt-0.5">{p.email}</p>
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
