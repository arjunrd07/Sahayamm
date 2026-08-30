"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
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
  LogOut,
  Shield,
  KeyRound,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, initials } from "@/lib/utils";
import { getAdminDashboardStats } from "./actions";

export default function AdminDashboardPage() {
  const { profile, signOut } = useAuth();
  const { push } = useToast();
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalCampuses: 0,
    totalUsers: 0,
    totalLoans: 0,
    activeVolume: 0,
    pendingVerifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

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

  async function handleSignOut() {
    setLoggingOut(true);
    try {
      push("info", "Signing out from admin workspace...");
      await signOut();
    } catch (err: any) {
      push("error", err?.message || "Failed to log out");
      setLoggingOut(false);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-elevated relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
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

        <div className="relative z-10 shrink-0 flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setLogoutModalOpen(true)}
            className="rounded-2xl text-xs font-bold gap-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/15 hover:border-red-500/40 transition-all backdrop-blur-md px-4 py-2.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
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

      {/* Admin Account & Session Management Section */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-white/10">
        <h2 className="text-xl font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-signal" /> Admin Account &amp; Session Management
        </h2>

        <Card className="p-6 md:p-8 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Identity Details */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                {profile?.full_name ? initials(profile.full_name) : "AD"}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-ink dark:text-white">
                    {profile?.full_name || "Platform Administrator"}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <UserCheck className="h-3 w-3" /> {profile?.role || "Admin"} Role
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Session
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {profile?.email || "admin@sahayam.com"}
                </p>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <KeyRound className="h-3 w-3 text-signal" />
                  <span>Scope: Full Platform Access · Master DB Authority</span>
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/5">
              <Link href="/admin/users">
                <Button variant="secondary" className="rounded-xl text-xs font-bold gap-1.5 py-2.5 px-4">
                  <Users className="h-4 w-4" /> Manage Users
                </Button>
              </Link>

              <Button
                variant="danger"
                onClick={() => setLogoutModalOpen(true)}
                className="rounded-xl text-xs font-bold gap-2 py-2.5 px-4 shadow-sm transition-all"
              >
                <LogOut className="h-4 w-4" /> Log Out of Admin
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Log Out Confirmation Modal */}
      <Modal open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} title="Confirm Admin Logout">
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-red-900 dark:text-red-200">
                Are you sure you want to log out?
              </p>
              <p className="text-red-700/90 dark:text-red-300/90">
                Logging out will terminate your administrative session and redirect you to the login screen. Any unsaved form inputs will be cleared.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              disabled={loggingOut}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={handleSignOut}
              loading={loggingOut}
              className="rounded-xl text-xs font-bold gap-2 shadow-sm"
            >
              <LogOut className="h-4 w-4" /> Confirm Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
