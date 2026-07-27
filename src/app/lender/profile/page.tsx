"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/status-badge";
import { initials } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@/types/database";
import { User, Building2, CreditCard, ShieldCheck, MapPin, Phone, Mail, Award } from "lucide-react";

export default function LenderProfilePage() {
  const { profile } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!profile?.org_id) return;
    supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.org_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setOrg(data as Organization);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.org_id]);

  if (!profile) return null;

  const cibilScore = profile.cibil_score ?? 750;
  const getCibilBadge = (score: number) => {
    if (score >= 750) return { label: "Excellent Credit", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
    if (score >= 650) return { label: "Good Credit", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" };
    return { label: "Fair Credit", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" };
  };

  const cibilBadge = getCibilBadge(cibilScore);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Lender Profile Header Banner */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-[#0a192f] via-[#0d2847] to-[#071324] text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-signal to-indigo-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shrink-0 border-2 border-white/20">
            {initials(profile.full_name)}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-white tracking-tight truncate">{profile.full_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-white capitalize border border-white/20">
                {profile.role}
              </span>
            </div>

            <p className="text-sm text-slate-300 flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-signal-soft" />
              <span>{profile.email}</span>
            </p>

            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Workspace: {org?.name ?? "BedRock Organization"}</span>
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <VerificationBadge status={profile.verification_status} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Details Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-surface-border-dark">
            <div className="h-8 w-8 rounded-lg bg-signal-soft text-signal flex items-center justify-center font-bold">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Basic Account Details</CardTitle>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <DetailRow label="Full Name" value={profile.full_name} />
            <DetailRow label="Work Email" value={profile.email} />
            <DetailRow label="Gender" value={profile.gender || "Not specified"} />
            <DetailRow label="Organization" value={org?.name ?? "BedRock"} />
            <DetailRow label="Account Role" value={profile.role} capitalize />
          </div>
        </Card>

        {/* Mandatory KYC & Financial Details Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-surface-border-dark">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">KYC & Financial Information</CardTitle>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-slate font-medium flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-ink-mist" /> PAN Card
              </span>
              <span className="font-mono font-bold tracking-wider text-ink dark:text-white bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-md text-xs">
                {profile.pan_number || "NOT PROVIDED"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-slate font-medium flex items-center gap-1.5">
                <Award className="h-4 w-4 text-ink-mist" /> CIBIL Score
              </span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-ink dark:text-white text-base">{cibilScore}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${cibilBadge.color}`}>
                  {cibilBadge.label}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-slate font-medium flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-ink-mist" /> Mobile Phone
              </span>
              <span className="font-semibold text-ink dark:text-white">{profile.phone || "Not provided"}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-surface-border-dark">
              <span className="text-ink-slate font-medium flex items-center gap-1.5 mb-1">
                <MapPin className="h-4 w-4 text-ink-mist" /> Residential Address
              </span>
              <p className="text-xs text-ink dark:text-slate-200 font-medium leading-relaxed bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-surface-border-dark">
                {profile.address || "No residential address provided."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-slate font-medium">{label}</span>
      <span className={`font-semibold text-ink dark:text-white ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}
