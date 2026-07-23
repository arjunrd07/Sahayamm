import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan } from "@/types/database";
import { HandCoins, Wallet, Clock, CheckCircle2 } from "lucide-react";

export default async function CustomerDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: loans } = await supabase
    .from("loans")
    .select("*")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (loans as Loan[]) || [];
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="h-4 w-4 text-muted mb-2" />
            <p className="text-xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Recent loans</CardTitle>
            <CardDescription>Your latest requests across every status.</CardDescription>
          </div>
          <Link href="/customer/loans" className="text-sm font-medium text-accent">
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
                className="flex items-center justify-between py-3 hover:bg-surface/50 dark:hover:bg-white/5 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{loan.purpose}</p>
                  <p className="text-xs text-muted mt-0.5">
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
