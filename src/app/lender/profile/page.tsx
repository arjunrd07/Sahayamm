"use client";

import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@/types/database";
import { ProfileHero } from "@/components/profile/profile-hero";
import { notifyProfileUpdated } from "@/app/borrower/profile/actions";
import {
  CreditCard,
  Phone,
  Landmark,
  ShieldCheck,
  Building,
  Check,
  Edit3,
  Wallet,
  FileCheck2,
} from "lucide-react";

export default function LenderProfilePage() {
  const { profile, refresh } = useAuth();
  const { refresh: refreshNotifs } = useNotifications();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { push } = useToast();
  const supabase = createClient();

  // State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");

    supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.org_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setOrg(data as Organization);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 p-4">
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (!fullName.trim()) {
      push("error", "Full name is required.");
      return;
    }

    if (phone.trim()) {
      const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 13 || !/^\d+$/.test(cleanPhone)) {
        push("error", "Please enter a valid 10-digit mobile phone number.");
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        })
        .eq("id", profile.id);

      if (error) {
        push("error", error.message);
      } else {
        push("success", "Lender Treasury profile updated successfully!");
        await notifyProfileUpdated(profile.id, profile.org_id, fullName.trim());
        await Promise.all([refresh(), refreshNotifs()]);
        setIsEditing(false);
      }
    } catch {
      push("error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Shared Hero Component */}
      <ProfileHero
        profile={profile}
        org={org}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
        subtitle="Manage your Lender Admin credentials and Organization Treasury pool."
      />

      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tile 1: Organization Treasury Fund */}
          <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                  <Wallet className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm font-bold text-ink dark:text-white">
                  Organization Treasury &amp; Pool
                </CardTitle>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-ink-slate">Active Capital Reserve</span>
                <p className="text-base font-bold text-emerald-600 mt-0.5">₹50,00,000</p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-surface-border-dark flex items-center justify-between">
                <div>
                  <span className="font-semibold text-ink-slate">Max Disbursal / Loan</span>
                  <p className="font-bold text-ink dark:text-white mt-0.5">₹1,00,000</p>
                </div>
                <div>
                  <span className="font-semibold text-ink-slate">Interest Structure</span>
                  <p className="font-bold text-signal mt-0.5">0% Intra-Org Rate</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Tile 2: Authorized Signatory Credentials */}
          <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                  <FileCheck2 className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm font-bold text-ink dark:text-white">
                  Lender Approval Credentials
                </CardTitle>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-ink-slate">Designated Role</span>
                <p className="font-bold text-ink dark:text-white mt-0.5">Lender Admin Officer</p>
              </div>
              <div>
                <span className="font-semibold text-ink-slate">Agreement Stamp</span>
                <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Digital Seal Enabled
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-surface-border-dark">
                <span className="font-semibold text-ink-slate">Contact Phone</span>
                <p className={`font-bold mt-0.5 ${phone ? "text-ink dark:text-white" : "text-slate-400 font-normal italic"}`}>
                  {phone || "—"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* EDIT LENDER PROFILE FORM */
        <Card className="p-6 sm:p-8 bg-white dark:bg-surface-dark border border-signal/30 shadow-md rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-4">
            <div>
              <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-signal" /> Update Lender Admin Credentials
              </h2>
              <p className="text-xs text-ink-slate mt-0.5 font-medium">
                Update officer identity and contact information.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Officer Name" htmlFor="edit_lender_name">
                <Input
                  id="edit_lender_name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl"
                />
              </Field>

              <Field label="Corporate Phone Number" htmlFor="edit_lender_phone">
                <Input
                  id="edit_lender_phone"
                  type="tel"
                  maxLength={14}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="rounded-xl"
                />
              </Field>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-surface-border-dark">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-1/3 py-3 font-semibold rounded-full min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-2/3 py-3 font-bold rounded-full shadow-button flex items-center justify-center gap-2 min-h-[44px]"
                loading={saving}
              >
                <Check className="h-4 w-4" /> Save Lender Profile Details
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
