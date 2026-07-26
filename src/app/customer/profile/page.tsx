"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/status-badge";
import { initials, formatINR } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization, Profile } from "@/types/database";
import { 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  Mail, 
  CheckCircle2,
  Sparkles
} from "lucide-react";

const DEMO_PROFILE_FALLBACK: Profile = {
  id: "demo-cust-profile",
  org_id: "demo-org",
  email: "sarah.jenkins@techcorp.com",
  full_name: "Sarah Jenkins",
  phone: "+91 98765 43210",
  role: "customer",
  verification_status: "verified",
  rejection_reason: null,
  id_proof_url: "demo/id.pdf",
  employment_proof_url: "demo/payslip.pdf",
  verified_by: "admin-1",
  verified_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function CustomerProfilePage() {
  const { profile: authProfile } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const supabase = createClient();

  const profile = authProfile || DEMO_PROFILE_FALLBACK;

  useEffect(() => {
    if (!profile.org_id || profile.org_id === "demo-org") return;
    supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.org_id)
      .single()
      .then(({ data }) => setOrg(data as Organization));
  }, [profile?.org_id]);

  return (
    <div className="max-w-3xl space-y-6">
      {!authProfile && (
        <div className="p-3.5 rounded-2xl bg-signal-soft border border-signal/20 text-xs text-signal-cobalt flex items-center justify-between font-semibold">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-signal shrink-0" />
            Viewing Demo Customer Profile (Sarah Jenkins • TechCorp Global)
          </span>
          <span className="bg-white dark:bg-canvas-dark px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border border-signal/20 text-ink dark:text-white">
            Guest Preview Mode
          </span>
        </div>
      )}

      {/* Top Banner Card */}
      <Card className="p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-signal text-white flex items-center justify-center text-xl font-black shadow-lg">
              {initials(profile.full_name || "Sarah Jenkins")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-white tracking-tight">
                  {profile.full_name || "Sarah Jenkins"}
                </h2>
                <VerificationBadge status={profile.verification_status} />
              </div>
              <p className="text-xs text-ink-slate dark:text-slate-400 mt-1 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-signal" /> {profile.email}
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark text-left sm:text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-slate">Employee ID</p>
            <p className="text-sm font-mono font-black text-ink dark:text-white">EMP-4092</p>
          </div>
        </div>
      </Card>

      {/* Credit Pool & Roster Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-1">
          <span className="text-[11px] font-extrabold uppercase text-ink-slate flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-signal" /> Approved Credit Limit
          </span>
          <p className="text-2xl font-black text-ink dark:text-white">{formatINR(150000)}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">100% Interest-Free Pool</p>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-[11px] font-extrabold uppercase text-ink-slate flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Available Credit
          </span>
          <p className="text-2xl font-black text-signal">{formatINR(100000)}</p>
          <p className="text-[11px] text-ink-slate">Ready for immediate disbursal</p>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-[11px] font-extrabold uppercase text-ink-slate flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-purple-500" /> DocuSeal Status
          </span>
          <p className="text-sm font-extrabold text-emerald-600 flex items-center gap-1 mt-2">
            <CheckCircle2 className="h-4 w-4" /> Signed & Verified
          </p>
          <p className="text-[11px] text-ink-slate">Agreement #SHM-2026-0089</p>
        </Card>
      </div>

      {/* Detailed Member Rows */}
      <Card className="p-6 space-y-4">
        <CardTitle className="text-base font-extrabold border-b border-slate-100 dark:border-surface-border-dark pb-3">
          Employment & Organization Details
        </CardTitle>

        <div className="space-y-3.5 text-xs font-semibold">
          <Row label="Organization Roster" value={org?.name || "TechCorp Global Solutions"} />
          <Row label="Department / Division" value="Engineering & Product Design" />
          <Row label="Phone Number" value={profile.phone || "+91 98765 43210"} />
          <Row label="Member Role" value="Customer (Verified Borrowing Member)" />
          <Row label="Disbursal Bank Account" value="HDFC Bank • Account ****8104" />
          <Row label="DocuSeal VPA (UPI ID)" value="sarah.jenkins@okaxis" />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-surface-border-dark/50">
      <span className="text-ink-slate font-medium">{label}</span>
      <span className="font-extrabold text-ink dark:text-white">{value}</span>
    </div>
  );
}
