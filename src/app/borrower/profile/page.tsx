"use client";

import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import { notifyProfileUpdated } from "./actions";
import { Card, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/status-badge";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { initials } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@/types/database";
import { ProfileHero } from "@/components/profile/profile-hero";
import {
  User,
  ShieldCheck,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Building,
  Edit3,
  Check,
  X,
  Award,
  Copy,
  Landmark,
  Briefcase,
  UserCheck,
  ChevronDown,
} from "lucide-react";

export default function BorrowerProfilePage() {
  const { profile, refresh } = useAuth();
  const { refresh: refreshNotifs } = useNotifications();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedPan, setCopiedPan] = useState(false);
  const { push } = useToast();
  const supabase = createClient();

  // Primary Personal State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [cibilScore, setCibilScore] = useState("");
  const [address, setAddress] = useState("");

  // Bank Account State
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  // Emergency Contact State
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setPanNumber(profile.pan_number || "");
    setCibilScore(profile.cibil_score ? String(profile.cibil_score) : "");
    setAddress(profile.address || "");

    setBankName(profile.bank_name || "");
    setAccountNumber(profile.account_number || "");
    setIfscCode(profile.ifsc_code || "");
    setUpiId(profile.upi_id || "");

    setEmergencyName(profile.emergency_name || "");
    setEmergencyPhone(profile.emergency_phone || "");
    setEmergencyRelation(profile.emergency_relation || "");

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

  function handleCopyPan() {
    if (!profile?.pan_number) return;
    navigator.clipboard.writeText(profile.pan_number.toUpperCase());
    setCopiedPan(true);
    push("info", "PAN Card number copied to clipboard.");
    setTimeout(() => setCopiedPan(false), 2000);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (!fullName.trim()) {
      push("error", "Full name is required.");
      return;
    }

    // Phone Number Validation (Standard 10-digit check)
    if (phone.trim()) {
      const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 13 || !/^\d+$/.test(cleanPhone)) {
        push("error", "Please enter a valid 10-digit mobile phone number.");
        return;
      }
    }

    // Emergency Contact Phone Validation
    if (emergencyPhone.trim()) {
      const cleanEmergPhone = emergencyPhone.replace(/[\s\-\+\(\)]/g, "");
      if (cleanEmergPhone.length < 10 || cleanEmergPhone.length > 13 || !/^\d+$/.test(cleanEmergPhone)) {
        push("error", "Please enter a valid 10-digit emergency contact phone number.");
        return;
      }
    }

    const cleanPan = panNumber.trim().toUpperCase();
    if (cleanPan && cleanPan.length !== 10) {
      push("error", "Valid 10-character PAN card number is required (e.g., ABCDE1234F).");
      return;
    }

    const parsedCibil = cibilScore ? parseInt(cibilScore, 10) : null;
    if (parsedCibil !== null && (isNaN(parsedCibil) || parsedCibil < 300 || parsedCibil > 900)) {
      push("error", "CIBIL Score must be between 300 and 900.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          pan_number: cleanPan || null,
          cibil_score: parsedCibil,
          address: address.trim() || null,
          bank_name: bankName.trim() || null,
          account_number: accountNumber.trim() || null,
          ifsc_code: ifscCode.trim().toUpperCase() || null,
          upi_id: upiId.trim() || null,
          emergency_name: emergencyName.trim() || null,
          emergency_phone: emergencyPhone.trim() || null,
          emergency_relation: emergencyRelation || null,
          kyc_completed: Boolean(cleanPan && address.trim() && phone.trim()),
        })
        .eq("id", profile.id);

      if (error) {
        push("error", error.message);
      } else {
        push("success", "Profile details saved!");
        await notifyProfileUpdated(profile.id, profile.org_id, fullName.trim());
        await Promise.all([refresh(), refreshNotifs()]);
        setIsEditing(false);
      }
    } catch {
      push("error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Shared Profile Hero Component */}
      <ProfileHero
        profile={profile}
        org={org}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
        subtitle="Manage your personal identity, bank payout details, employment credentials, and emergency references."
      />

      {/* Main Details Tiles */}
      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tile 1: Financial & PAN Credentials */}
          <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm font-bold text-ink dark:text-white">
                  Identification & PAN Credentials
                </CardTitle>
              </div>
              {profile.pan_number && (
                <button
                  onClick={handleCopyPan}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-ink-slate hover:text-signal transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  {copiedPan ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPan ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-ink-slate">PAN Card Number</span>
                <p className={`text-base font-bold mt-0.5 uppercase ${profile.pan_number ? "text-ink dark:text-white tracking-wider" : "text-slate-400 font-normal italic"}`}>
                  {profile.pan_number ? profile.pan_number.toUpperCase() : "—"}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-surface-border-dark">
                <span className="text-xs font-semibold text-ink-slate">Mobile Phone Number</span>
                <p className={`text-sm font-bold mt-0.5 ${profile.phone ? "text-ink dark:text-white" : "text-slate-400 font-normal italic"}`}>
                  {profile.phone || "—"}
                </p>
              </div>
            </div>
          </Card>

          {/* Tile 2: Credit Score */}
          <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                  <Award className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm font-bold text-ink dark:text-white">
                  Credit Score
                </CardTitle>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-ink-slate">CIBIL Score</span>
                <p className={`text-base font-bold mt-0.5 ${profile.cibil_score ? "text-ink dark:text-white" : "text-slate-400 font-normal italic"}`}>
                  {profile.cibil_score ? `${profile.cibil_score} / 900` : "—"}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-surface-border-dark">
                <span className="text-xs font-semibold text-ink-slate">Borrowing Terms</span>
                <p className="text-sm font-bold text-signal mt-0.5">0% Intra-Org Interest</p>
              </div>
            </div>
          </Card>

          {/* Tile 3: Bank Disbursal Account */}
          <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <Landmark className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm font-bold text-ink dark:text-white">
                  Bank Disbursal Account
                </CardTitle>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-semibold text-ink-slate">Bank Name</span>
                <p className={`font-bold mt-0.5 ${bankName ? "text-ink dark:text-white" : "text-slate-400 font-normal italic"}`}>
                  {bankName || "—"}
                </p>
              </div>

              <div>
                <span className="font-semibold text-ink-slate">IFSC Code</span>
                <p className={`font-bold mt-0.5 ${ifscCode ? "text-ink dark:text-white uppercase" : "text-slate-400 font-normal italic"}`}>
                  {ifscCode || "—"}
                </p>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-surface-border-dark flex items-center justify-between">
                <div>
                  <span className="font-semibold text-ink-slate">Account Number</span>
                  <p className={`font-bold mt-0.5 ${accountNumber ? "text-ink dark:text-white" : "text-slate-400 font-normal italic"}`}>
                    {accountNumber || "—"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-ink-slate">UPI ID</span>
                  <p className={`font-bold mt-0.5 ${upiId ? "text-blue-600" : "text-slate-400 font-normal italic"}`}>
                    {upiId || "—"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Tile 4: Emergency Reference */}
          <Card className="p-5 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm font-bold text-ink dark:text-white">
                  Emergency Reference
                </CardTitle>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-semibold text-ink-slate">Contact Name</span>
                <p className={`font-bold mt-0.5 ${emergencyName ? "text-ink dark:text-white" : "text-slate-400 font-normal italic"}`}>
                  {emergencyName || "—"}
                </p>
              </div>
              <div>
                <span className="font-semibold text-ink-slate">Relationship</span>
                <p className={`font-bold mt-0.5 ${emergencyRelation ? "text-ink dark:text-white" : "text-slate-400 font-normal italic"}`}>
                  {emergencyRelation || "—"}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-surface-border-dark">
                <span className="font-semibold text-ink-slate">Phone Number</span>
                <p className={`font-bold mt-0.5 ${emergencyPhone ? "text-ink dark:text-white" : "text-slate-400 font-normal italic"}`}>
                  {emergencyPhone || "—"}
                </p>
              </div>
            </div>
          </Card>

          {/* Tile 5: Address */}
          <Card className="md:col-span-2 p-5 bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm font-bold text-ink dark:text-white">
                  Residential Address
                </CardTitle>
              </div>
            </div>

            <p className={`text-sm leading-relaxed ${profile.address ? "font-bold text-ink dark:text-white" : "text-slate-400 italic"}`}>
              {profile.address || "—"}
            </p>
          </Card>
        </div>
      ) : (
        /* EDIT PROFILE FORM */
        <Card className="p-6 sm:p-8 bg-white dark:bg-surface-dark border border-signal/30 shadow-md rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-border-dark pb-4">
            <div>
              <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-signal" /> Update Profile & Financial Credentials
              </h2>
              <p className="text-xs text-ink-slate mt-0.5 font-medium">
                Enter your identity, bank disbursal, and emergency reference details.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Section 1: Personal & Tax Identification */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-signal mb-3">1. Personal & Tax Identification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" htmlFor="edit_fullname">
                  <Input
                    id="edit_fullname"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl"
                  />
                </Field>

                <Field label="Work Email" htmlFor="edit_email">
                  <Input
                    id="edit_email"
                    disabled
                    value={profile.email}
                    className="rounded-xl bg-slate-100 dark:bg-white/5 cursor-not-allowed opacity-80"
                  />
                </Field>

                <Field label="PAN Card Number" htmlFor="edit_pan">
                  <Input
                    id="edit_pan"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="rounded-xl uppercase font-bold"
                  />
                </Field>

                <Field label="Mobile Phone Number (10 Digits)" htmlFor="edit_phone">
                  <Input
                    id="edit_phone"
                    type="tel"
                    maxLength={14}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="rounded-xl"
                  />
                </Field>
              </div>
            </div>

            {/* Section 2: Bank Disbursal Account */}
            <div className="pt-4 border-t border-slate-100 dark:border-surface-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3">2. Bank Disbursal Account</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bank Name" htmlFor="edit_bank">
                  <Input
                    id="edit_bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Enter Bank Name"
                    className="rounded-xl"
                  />
                </Field>

                <Field label="IFSC Code" htmlFor="edit_ifsc">
                  <Input
                    id="edit_ifsc"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="IFSC Code"
                    className="rounded-xl font-bold uppercase"
                  />
                </Field>

                <Field label="Account Number" htmlFor="edit_acc">
                  <Input
                    id="edit_acc"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="rounded-xl"
                  />
                </Field>

                <Field label="UPI ID (Optional)" htmlFor="edit_upi">
                  <Input
                    id="edit_upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="user@upi"
                    className="rounded-xl"
                  />
                </Field>
              </div>
            </div>

            {/* Section 3: Emergency Reference Contact */}
            <div className="pt-4 border-t border-slate-100 dark:border-surface-border-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-3">3. Emergency Reference Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Contact Name" htmlFor="edit_emerg_name">
                  <Input
                    id="edit_emerg_name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Reference Name"
                    className="rounded-xl"
                  />
                </Field>

                <Field label="Relationship" htmlFor="edit_emerg_rel">
                  <Select
                    id="edit_emerg_rel"
                    value={emergencyRelation}
                    onChange={(val) => setEmergencyRelation(val)}
                    placeholder="Select Relationship..."
                    options={[
                      { value: "Parent", label: "Parent" },
                      { value: "Spouse", label: "Spouse" },
                      { value: "Sibling", label: "Sibling" },
                      { value: "Child", label: "Child" },
                      { value: "Colleague", label: "Colleague" },
                      { value: "Friend / Other", label: "Friend / Other" },
                    ]}
                  />
                </Field>

                <Field label="Phone Number (10 Digits)" htmlFor="edit_emerg_phone">
                  <Input
                    id="edit_emerg_phone"
                    type="tel"
                    maxLength={14}
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="rounded-xl"
                  />
                </Field>
              </div>
            </div>

            {/* Section 4: Address */}
            <div className="pt-4 border-t border-slate-100 dark:border-surface-border-dark">
              <Field label="Full Residential Address" htmlFor="edit_address">
                <Input
                  id="edit_address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address details"
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
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
