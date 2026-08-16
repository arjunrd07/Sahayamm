"use client";

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Lock,
  Plus,
  FileText,
  Send,
  User,
} from "lucide-react";
import type { Organization, Profile, Loan } from "@/types/database";

interface OrgWithMetrics extends Organization {
  memberCount: number;
  activeLoansCount: number;
  status: string;
}

export default function SuperadminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrgWithMetrics[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [borrowersCount, setBorrowersCount] = useState(0);
  const [lendersCount, setLendersCount] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);
  const [agreementsCount, setAgreementsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadSuperadminData() {
      setLoading(true);
      try {
        const [
          { data: orgsData },
          { data: profilesData },
          { data: loansData },
          { data: agsData },
          { data: logsData },
        ] = await Promise.all([
          supabase.from("organizations").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("id, org_id, full_name, role, created_at"),
          supabase.from("loans").select("id, org_id, status, amount"),
          supabase.from("agreements").select("id"),
          supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(4),
        ]);

        const rawOrgs: Organization[] = (orgsData as Organization[]) || [];
        const profiles: Profile[] = (profilesData as Profile[]) || [];
        const loans: Loan[] = (loansData as Loan[]) || [];

        setTotalUsers(profiles.length);
        setBorrowersCount(profiles.filter((p) => p.role === "borrower" || (p.role as string) === "customer").length);
        setLendersCount(profiles.filter((p) => p.role === "lender" || (p.role as string) === "admin").length);
        setTotalLoans(loans.length);
        setAgreementsCount(agsData?.length || 0);

        const mappedOrgs: OrgWithMetrics[] = rawOrgs.map((org) => {
          const countMembers = profiles.filter((p) => p.org_id === org.id).length;
          const countActive = loans.filter((l) => l.org_id === org.id && l.status === "active").length;
          return {
            ...org,
            status: (org as any).status || "active",
            capital_pool_limit: (org as any).max_loan_amount || org.capital_pool_limit || 2500000,
            memberCount: countMembers,
            activeLoansCount: countActive,
          };
        });

        setOrganizations(mappedOrgs);

        if (logsData) {
          setAuditLogs(logsData);
        }
      } catch (err) {
        console.error("Error loading superadmin dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSuperadminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPool = organizations.reduce((sum, o) => sum + (o.capital_pool_limit || 2500000), 0);

  const stats = [
    { label: "Registered Organizations", value: organizations.length, icon: Building2, detail: "Multi-tenant entities" },
    { label: "Global Platform Users", value: `${totalUsers} (${borrowersCount} B / ${lendersCount} L)`, icon: Users, detail: "Active Borrower & Lender accounts" },
    { label: "Total Liquidity Capital", value: formatINR(totalPool), icon: Wallet, detail: "Across active org pools" },
    { label: "Total Loans & Agreements", value: `${totalLoans} Loans / ${agreementsCount} Agrmts`, icon: ShieldCheck, detail: "Platform oversight" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-elevated border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 text-blue-200 border border-blue-400/30 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Lock className="h-3.5 w-3.5 text-emerald-400" /> Admin Control Center
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Complete Multi-Tenant & Platform Management
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time monitoring across all registered organizations, user directories, platform agreements, manual notification broadcasts, and audit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/superadmin/organizations"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 text-xs font-bold rounded-full shadow-button transition-all"
            >
              <Plus className="h-4 w-4" /> Add Org
            </Link>
            <Link
              href="/superadmin/users"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-4 text-xs font-bold rounded-full transition-all border border-slate-700"
            >
              <User className="h-4 w-4" /> Users Directory
            </Link>
            <Link
              href="/superadmin/notifications"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-4 text-xs font-bold rounded-full transition-all border border-slate-700"
            >
              <Send className="h-4 w-4" /> Send Notification
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 border border-slate-200 dark:border-surface-border-dark shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 px-2.5 py-0.5 rounded-full">
                Admin
              </span>
            </div>
            <p className="text-xl font-black text-ink dark:text-white tracking-tight truncate">{s.value}</p>
            <p className="text-xs text-ink-slate dark:text-slate-400 mt-1 font-semibold">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Control Module Shortcuts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/superadmin/organizations"
          className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-blue-500 transition-all text-center group shadow-card"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-ink dark:text-white block">Organizations</span>
          <span className="text-[10px] text-ink-slate block mt-0.5">Manage Orgs & Limits</span>
        </Link>

        <Link
          href="/superadmin/users"
          className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-blue-500 transition-all text-center group shadow-card"
        >
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-ink dark:text-white block">User Directory</span>
          <span className="text-[10px] text-ink-slate block mt-0.5">Revoke Access & Roles</span>
        </Link>

        <Link
          href="/superadmin/loans"
          className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-blue-500 transition-all text-center group shadow-card"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-ink dark:text-white block">Platform Loans</span>
          <span className="text-[10px] text-ink-slate block mt-0.5">Bulk Approve & Status</span>
        </Link>

        <Link
          href="/superadmin/agreements"
          className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-blue-500 transition-all text-center group shadow-card"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-ink dark:text-white block">Agreements</span>
          <span className="text-[10px] text-ink-slate block mt-0.5">Native Signed Agreements</span>
        </Link>

        <Link
          href="/superadmin/notifications"
          className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-blue-500 transition-all text-center group shadow-card"
        >
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Send className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-ink dark:text-white block">Notifications</span>
          <span className="text-[10px] text-ink-slate block mt-0.5">Targeted Broadcast</span>
        </Link>

        <Link
          href="/superadmin/audit"
          className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark hover:border-blue-500 transition-all text-center group shadow-card"
        >
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-ink dark:text-white block">Audit Logs</span>
          <span className="text-[10px] text-ink-slate block mt-0.5">CSV/JSON Exports</span>
        </Link>
      </div>

      {/* Organizations & Audit Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 sm:p-6 lg:col-span-2 border border-slate-200 dark:border-surface-border-dark shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-ink dark:text-white">Registered Tenant Organizations</h3>
              <p className="text-xs sm:text-sm text-ink-slate dark:text-slate-400 mt-0.5">
                Real database tenants & liquidity limits.
              </p>
            </div>
            <Link href="/superadmin/organizations" className="text-xs sm:text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0">
              Manage Orgs <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            </div>
          ) : organizations.length === 0 ? (
            <p className="text-sm text-ink-slate py-6 text-center">No registered organizations found in database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-surface-border-dark text-xs uppercase tracking-wider text-ink-slate font-bold">
                    <th className="pb-3">Organization</th>
                    <th className="pb-3 hidden sm:table-cell">Members</th>
                    <th className="pb-3">Capital Pool</th>
                    <th className="pb-3 text-right sm:text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-surface-border-dark">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-bold text-ink dark:text-white">
                        <div className="truncate max-w-[180px] sm:max-w-none">{org.name}</div>
                        <div className="text-xs text-ink-slate font-mono font-normal mt-0.5">{org.code}</div>
                      </td>
                      <td className="py-3.5 text-ink-slate dark:text-slate-300 font-medium hidden sm:table-cell">{org.memberCount} users</td>
                      <td className="py-3.5 font-black text-ink dark:text-white">{formatINR(org.capital_pool_limit || 2500000)}</td>
                      <td className="py-3.5 text-right sm:text-left">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            org.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200"
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" /> {org.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* System Audit Feed */}
        <Card className="p-5 sm:p-6 border border-slate-200 dark:border-surface-border-dark shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-ink dark:text-white">System Audit Stream</h3>
              <p className="text-xs sm:text-sm text-ink-slate dark:text-slate-400 mt-0.5">Live database audit feed.</p>
            </div>
            <Activity className="h-4 w-4 text-blue-600 shrink-0" />
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-surface-border-dark">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5 truncate">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{log.action}</span>
                  </span>
                </div>
                <p className="text-xs text-ink-slate dark:text-slate-300 leading-relaxed mb-2 font-medium">{log.details}</p>
                <span className="text-[11px] text-ink-slate dark:text-slate-400 font-bold block">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-surface-border-dark text-center">
            <Link href="/superadmin/audit" className="text-xs font-bold text-blue-600 hover:underline">
              View Complete Audit Logs & Export CSV/JSON →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
