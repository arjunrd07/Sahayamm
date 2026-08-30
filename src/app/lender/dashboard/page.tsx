import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LoanStatusBadge, VerificationBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Loan, Profile } from "@/types/database";
import { Users, HandCoins, AlertTriangle, Wallet, Sparkles, Building2, ShieldCheck, CheckCircle2, ArrowRight, Layers, FileCheck2, FileText, Bell } from "lucide-react";

export default async function LenderDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let list: Loan[] = [];
  let pendingVerifications: Profile[] = [];

  if (user) {
    const service = createServiceRoleClient();
    const { data: me } = await service.from("profiles").select("org_id, role").eq("id", user.id).maybeSingle();
    const orgId = me?.org_id;

    if (orgId) {
      // Auto-heal any lenders/admins mistakenly marked as pending
      await service
        .from("profiles")
        .update({ verification_status: "verified" })
        .in("role", ["lender", "admin"])
        .eq("org_id", orgId)
        .eq("verification_status", "pending");

      const [{ data: loans }, { data: verifications }] = await Promise.all([
        service.from("loans").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
        service
          .from("profiles")
          .select("*")
          .eq("org_id", orgId)
          .eq("verification_status", "pending")
          .neq("role", "lender")
          .neq("role", "admin")
          .order("created_at", { ascending: false }),
      ]);
      list = (loans as Loan[]) || [];
      pendingVerifications = (verifications as Profile[]) || [];
    }
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
    { label: "Pending Loan Requests", value: pending.length, icon: HandCoins },
    { label: "Identity Verifications", value: pendingVerifications.length, icon: Users },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Soft UI Admin Hero Header */}
      <div className="card p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-primary/20 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Organization Lender Workspace
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Capital Liquidity &amp; Approval Hub
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
              Monitor organization credit allocations, evaluate loan applications, and manage employee verifications.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[170px] text-center shrink-0">
            <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Total Capital Pool</p>
            <p className="text-2xl font-black text-white mt-1">{formatINR(totalOrgPool)}</p>
            <p className="text-[11px] text-emerald-400 font-bold mt-0.5">SLA Liquidity Pool</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="icon-box">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="badge bg-primary-soft text-primary border border-primary/20 text-[11px] font-extrabold">
                Lender Vault
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-ink dark:text-white tracking-tight">{s.value}</p>
              <p className="text-xs font-semibold text-ink-slate dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Two Column Grid for Applications and Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-7 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="text-lg font-bold text-ink dark:text-white tracking-tight">Pending Loan Applications</h3>
              <p className="text-xs text-ink-slate font-medium mt-0.5">Applications waiting for lender review.</p>
            </div>
            <Link href="/lender/loans" className="text-xs font-extrabold text-primary hover:underline shrink-0">
              View all ({pending.length})
            </Link>
          </div>

          {pending.length === 0 ? (
            <EmptyState title="No pending loan requests" description="Incoming borrower requests will be listed here." />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {pending.slice(0, 5).map((loan) => (
                <Link
                  key={loan.id}
                  href={`/lender/loans/${loan.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 hover:bg-slate-50/80 dark:hover:bg-white/5 -mx-3 px-4 rounded-2xl transition-all duration-200 gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink dark:text-white truncate">{loan.purpose}</p>
                    <p className="text-xs text-ink-slate mt-1 font-medium">
                      <span className="font-extrabold text-ink dark:text-white">{formatINR(loan.amount)}</span> · Requested {formatDate(loan.created_at)}
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

        <Card className="p-7 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="text-lg font-bold text-ink dark:text-white tracking-tight">Verification Queue</h3>
              <p className="text-xs text-ink-slate font-medium mt-0.5">Pending identity & KYC verification reviews.</p>
            </div>
            <Link href="/lender/verifications" className="text-xs font-extrabold text-primary hover:underline shrink-0">
              View all ({pendingVerifications.length})
            </Link>
          </div>

          {pendingVerifications.length === 0 ? (
            <EmptyState title="No pending verifications" description="New identity verification requests will appear here." />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {pendingVerifications.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/lender/verifications?applicant=${p.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 hover:bg-slate-50/80 dark:hover:bg-white/5 -mx-3 px-4 rounded-2xl transition-all duration-200 gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink dark:text-white truncate">{p.full_name}</p>
                    <p className="text-xs text-ink-slate mt-1 font-medium truncate">{p.email}</p>
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

