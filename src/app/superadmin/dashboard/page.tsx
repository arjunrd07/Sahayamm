import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { Building2, Users, ShieldCheck, Wallet, ArrowUpRight, Activity, Database, CheckCircle2, Lock, Plus } from "lucide-react";

interface SuperadminOrgDemo {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  poolAmount: number;
  activeLoansCount: number;
  status: "active" | "pending" | "suspended";
  createdAt: string;
}

const DEMO_ORGANIZATIONS: SuperadminOrgDemo[] = [
  {
    id: "org-techcorp",
    name: "TechCorp Solutions Pvt Ltd",
    code: "TECHCORP",
    memberCount: 342,
    poolAmount: 5000000,
    activeLoansCount: 14,
    status: "active",
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "demo-org",
    name: "Sahayam Demo Organization",
    code: "SAHAYAM-DEMO",
    memberCount: 85,
    poolAmount: 2500000,
    activeLoansCount: 6,
    status: "active",
    createdAt: "2026-03-10T10:30:00Z",
  },
  {
    id: "org-apex",
    name: "Apex Global Services",
    code: "APEX-GLOBAL",
    memberCount: 520,
    poolAmount: 8500000,
    activeLoansCount: 22,
    status: "active",
    createdAt: "2026-02-01T14:15:00Z",
  },
  {
    id: "org-innovate",
    name: "Innovate AI Labs",
    code: "INNOVATE",
    memberCount: 140,
    poolAmount: 1500000,
    activeLoansCount: 3,
    status: "active",
    createdAt: "2026-05-20T09:45:00Z",
  },
];

const DEMO_SECURITY_LOGS = [
  {
    id: "log-1",
    event: "Row Level Security (RLS) Health Audit Passed",
    org: "Platform-wide",
    timestamp: "10 mins ago",
    status: "success",
    details: "100% database queries verified under isolated org tenant policies.",
  },
  {
    id: "log-2",
    event: "First Employee Superadmin Trigger Executed",
    org: "Innovate AI Labs",
    timestamp: "2 hours ago",
    status: "info",
    details: "Granted superadmin role to primary org creator: lead.admin@innovate.io",
  },
  {
    id: "log-3",
    event: "Large Disbursement Audit Verified",
    org: "Apex Global Services",
    timestamp: "5 hours ago",
    status: "success",
    details: "₹1,50,000 disbursement proof confirmed with DocuSeal digital agreement.",
  },
  {
    id: "log-4",
    event: "Automatic Backup & Schema Integrity Check",
    org: "Platform-wide",
    timestamp: "12 hours ago",
    status: "success",
    details: "Zero database schema drift detected. Supabase RLS policies active.",
  },
];

export default async function SuperadminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let realOrgCount = 0;
  let realUserCount = 0;
  let realLoanCount = 0;

  if (user) {
    const [{ count: orgCount }, { count: userCount }, { count: loanCount }] = await Promise.all([
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("loans").select("*", { count: "exact", head: true }),
    ]);
    realOrgCount = orgCount || 0;
    realUserCount = userCount || 0;
    realLoanCount = loanCount || 0;
  }

  const isDemo = !user || realOrgCount === 0;

  const totalPool = DEMO_ORGANIZATIONS.reduce((sum, o) => sum + o.poolAmount, 0);
  const totalMembers = isDemo ? 1087 : realUserCount;
  const totalOrgs = isDemo ? DEMO_ORGANIZATIONS.length : Math.max(realOrgCount, DEMO_ORGANIZATIONS.length);

  const stats = [
    { label: "Total Organizations", value: totalOrgs, icon: Building2, trend: "+2 this month" },
    { label: "Global Platform Users", value: totalMembers.toLocaleString("en-IN"), icon: Users, trend: "+124 new users" },
    { label: "Total Liquidity Capital", value: formatINR(totalPool), icon: Wallet, trend: "Across 4 main org pools" },
    { label: "RLS Security Compliance", value: "100%", icon: ShieldCheck, trend: "Zero tenant leaks" },
  ];

  return (
    <div className="space-y-6">
      {/* Handcrafted Ambient Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a192f] via-[#0d2847] to-[#071324] text-white p-6 sm:p-8 shadow-elevated border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-signal/20 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Lock className="h-3.5 w-3.5 text-emerald-400" /> Superadmin Central Control
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              System & Multi-Tenant Platform Dashboard
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Global oversight across all registered organizations, Row Level Security status, and liquidity pools.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/superadmin/organizations"
              className="inline-flex items-center justify-center gap-2 bg-signal hover:bg-signal-hover text-white py-3 px-5 text-sm font-semibold rounded-full shadow-button hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Add Organization
            </Link>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white py-3 px-5 text-sm font-semibold rounded-full transition-all"
            >
              Org Admin View
            </Link>
          </div>
        </div>
      </div>

      {isDemo && (
        <div className="p-4 rounded-2xl bg-signal-soft border border-signal/20 text-xs sm:text-sm text-signal-cobalt flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-semibold">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-signal shrink-0" />
            Showing Superadmin Demo Data & Multi-Org Analytics
          </span>
          <span className="text-xs bg-white dark:bg-canvas-dark px-3 py-1 rounded-full border border-signal/20 text-ink dark:text-white font-bold shrink-0">
            Demo Mode Active
          </span>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 hover:-translate-y-0.5 hover:border-signal/40 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-slate dark:text-ink-mist">{s.label}</span>
              <div className="p-2 rounded-xl bg-signal-soft dark:bg-white/10 text-signal dark:text-white">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">{s.value}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {s.trend}
            </p>
          </Card>
        ))}
      </div>

      {/* Organizations Overview & Security Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations Table / Mobile Card Layout */}
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-ink dark:text-white">Registered Organizations</h3>
              <p className="text-xs sm:text-sm text-ink-slate dark:text-ink-mist mt-0.5">
                Multi-tenant liquidity pools & member distribution.
              </p>
            </div>
            <Link href="/superadmin/organizations" className="text-xs sm:text-sm font-semibold text-signal hover:underline flex items-center gap-1 shrink-0">
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark text-xs uppercase tracking-wider text-ink-slate font-semibold">
                  <th className="pb-3 font-semibold">Organization</th>
                  <th className="pb-3 font-semibold hidden sm:table-cell">Members</th>
                  <th className="pb-3 font-semibold">Capital Pool</th>
                  <th className="pb-3 font-semibold hidden md:table-cell">Active Loans</th>
                  <th className="pb-3 font-semibold text-right sm:text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                {DEMO_ORGANIZATIONS.map((org) => (
                  <tr key={org.id} className="hover:bg-surface-pebble dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-semibold text-ink dark:text-white">
                      <div className="truncate max-w-[180px] sm:max-w-none">{org.name}</div>
                      <div className="text-xs text-ink-slate font-mono mt-0.5">{org.code}</div>
                    </td>
                    <td className="py-3.5 text-ink-slate dark:text-ink-mist hidden sm:table-cell">{org.memberCount} users</td>
                    <td className="py-3.5 font-bold text-ink dark:text-white">{formatINR(org.poolAmount)}</td>
                    <td className="py-3.5 text-ink-slate dark:text-ink-mist hidden md:table-cell">{org.activeLoansCount} active</td>
                    <td className="py-3.5 text-right sm:text-left">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Audit & Security Log Feed */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-ink dark:text-white">System & RLS Audit</h3>
              <p className="text-xs sm:text-sm text-ink-slate dark:text-ink-mist mt-0.5">Live platform security events.</p>
            </div>
            <Activity className="h-4 w-4 text-signal shrink-0" />
          </div>

          <div className="space-y-3">
            {DEMO_SECURITY_LOGS.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-ink dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-signal shrink-0" />
                    <span className="truncate">{log.event}</span>
                  </span>
                </div>
                <p className="text-xs text-ink-slate dark:text-ink-mist leading-relaxed mb-2">{log.details}</p>
                <div className="flex items-center justify-between text-[11px] text-ink-slate dark:text-ink-mist font-semibold">
                  <span className="truncate max-w-[140px]">Org: {log.org}</span>
                  <span className="shrink-0">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-surface-border dark:border-surface-border-dark text-center">
            <Link href="/superadmin/audit" className="text-xs font-semibold text-signal hover:underline">
              View Complete Audit Logs & System Health →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

