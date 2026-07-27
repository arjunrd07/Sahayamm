"use client";

import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import type { Profile, Organization } from "@/types/database";
import { ShieldCheck, Mail, Building, Edit3, X } from "lucide-react";

interface ProfileHeroProps {
  profile: Profile;
  org: Organization | null;
  isEditing: boolean;
  onToggleEdit: () => void;
  subtitle?: string;
}

export function ProfileHero({
  profile,
  org,
  isEditing,
  onToggleEdit,
  subtitle = "Manage your identity, disbursal bank vault, and credentials.",
}: ProfileHeroProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-surface-border-dark">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-white tracking-tight capitalize">
            {profile.role || "User"} Profile & Financial Vault
          </h1>
          <p className="text-xs sm:text-sm text-ink-slate mt-0.5 font-medium">
            {subtitle}
          </p>
        </div>

        {!isEditing ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onToggleEdit}
            className="flex items-center gap-2 font-bold text-xs shrink-0 self-start sm:self-center py-2.5 px-4 rounded-xl border border-slate-200 dark:border-surface-border-dark shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5 text-signal" /> Edit Profile Details
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleEdit}
            className="flex items-center gap-1.5 font-bold text-xs shrink-0 self-start sm:self-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 py-2 px-3 rounded-xl"
          >
            <X className="h-4 w-4" /> Cancel Editing
          </Button>
        )}
      </div>

      {/* Hero Overview Card */}
      <Card className="p-5 sm:p-6 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-signal-soft text-signal-cobalt border border-signal/20 flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
              {initials(profile.full_name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-ink dark:text-white">{profile.full_name}</h2>
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-200">
                  {profile.role || "User"}
                </span>
              </div>
              <p className="text-xs text-ink-slate flex items-center gap-1.5 mt-1 font-medium">
                <Mail className="h-3.5 w-3.5 text-signal" /> {profile.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-ink-slate font-medium flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-ink-mist" /> {org?.name ?? "Sahayam Workspace"}
                </span>
                {profile.kyc_completed && (
                  <>
                    <span>•</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Profile
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="self-stretch sm:self-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-surface-border-dark flex flex-col items-start sm:items-end">
            <span className="text-[11px] font-bold text-ink-slate uppercase tracking-wider">Status</span>
            <div className="mt-1">
              <VerificationBadge status={profile.verification_status} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
