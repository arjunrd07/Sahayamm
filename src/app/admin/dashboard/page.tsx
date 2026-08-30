"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Building2,
  Users,
  Wallet,
  FileText,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAdminDashboardStats } from "./actions";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalCampuses: 0,
    totalUsers: 0,
    totalLoans: 0,
    activeVolume: 0,
    pendingVerifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminStats() {
      setLoading(true);
      try {
        const res = await getAdminDashboardStats();
        setStats({
          totalOrgs: res.totalOrgs,
          totalCampuses: res.totalCampuses,
          totalUsers: res.totalUsers,
          totalLoans: res.totalLoans,
          activeVolume: res.activeVolume,
          pendingVerifications: res.pendingVerifications,
        });
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminStats();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-elevated relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal/20 border border-signal/40 text-signal text-xs font-extrabold uppercase tracking-wider mb-3">
            <Activity className="h-3.5 w-3.5 animate-pulse" /> Platform Administration
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Multi-Tenant Administration Overview
          </h1>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            Monitor system performance, multi-tenant organization health, user access controls, and platform credit volume.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 space-y-2 border border-slate-200 dark:border-surface-border-dark">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-slate">Organizations</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-ink dark:text-white">
            {loading ? "..." : stats.totalOrgs}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {stats.totalCampuses} Active Campuses
          </p>
        </Card>

        <Card className="p-5 space-y-2 border border-slate-200 dark:border-surface-border-dark">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-slate">Global Users</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-ink dark:text-white">
            {loading ? "..." : stats.totalUsers}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" /> {stats.pendingVerifications} Pending Verification
          </p>
        </Card>

        <Card className="p-5 space-y-2 border border-slate-200 dark:border-surface-border-dark">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-slate">Credit Applications</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-ink dark:text-white">
            {loading ? "..." : stats.totalLoans}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Active Loan Records
          </p>
        </Card>

        <Card className="p-5 space-y-2 border border-slate-200 dark:border-surface-border-dark">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-slate">Active Credit Volume</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-ink dark:text-white">
            {loading ? "..." : formatCurrency(stats.activeVolume)}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Total Disbursed Volume
          </p>
        </Card>
      </div>

      {/* Admin Modules Grid */}
      <div>
        <h2 className="text-xl font-bold text-ink dark:text-white mb-4">Management Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link href="/admin/organizations">
            <Card className="p-6 space-y-4 hover:border-signal transition-all cursor-pointer group h-full">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink dark:text-white group-hover:text-signal transition-colors flex items-center justify-between">
                  Organizations &amp; Campuses
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-signal transition-colors" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage tenant organization structures, codes, and campus-level isolation mappings.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="p-6 space-y-4 hover:border-signal transition-all cursor-pointer group h-full">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink dark:text-white group-hover:text-signal transition-colors flex items-center justify-between">
                  User Access Directory
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-signal transition-colors" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage global user profiles, assign roles, inspect KYC verification, and manage access.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/loans">
            <Card className="p-6 space-y-4 hover:border-signal transition-all cursor-pointer group h-full">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-110 transition-transform">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink dark:text-white group-hover:text-signal transition-colors flex items-center justify-between">
                  Platform Loans Oversight
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-signal transition-colors" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Inspect cross-tenant credit requests, interest calculations, and disbursal states.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/agreements">
            <Card className="p-6 space-y-4 hover:border-signal transition-all cursor-pointer group h-full">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink dark:text-white group-hover:text-signal transition-colors flex items-center justify-between">
                  Legal Agreements Inspector
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-signal transition-colors" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Review e-signature status, agreement numbers, and generated contract PDFs.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/audit">
            <Card className="p-6 space-y-4 hover:border-signal transition-all cursor-pointer group h-full">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink dark:text-white group-hover:text-signal transition-colors flex items-center justify-between">
                  Security &amp; Audit Logs
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-signal transition-colors" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Export audit logs, review security events, and verify platform activity records.
                </p>
              </div>
            </Card>
          </Link>

          <Card className="p-6 space-y-4 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-surface-border-dark flex flex-col justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-bold text-sm">Tenant Isolation Active</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Row-Level Security (RLS) is enforcing strict organization and campus-level data isolation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
