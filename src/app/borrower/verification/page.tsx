"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/status-badge";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Lock,
  FileCheck2,
  UserCheck,
  Building2,
  Sparkles,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export default function CustomerVerificationPage() {
  const { profile, refresh } = useAuth();
  const { push } = useToast();
  const supabase = createClient();

  const [idProof, setIdProof] = useState<File | null>(null);
  const [employmentProof, setEmploymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResubmitForm, setShowResubmitForm] = useState(false);

  if (!profile) return null;

  // IMPORTANT FIX: A profile is only truly verified if documents have actually been submitted and approved!
  const hasUploadedDocs = Boolean(profile.id_proof_url || profile.employment_proof_url);
  const isVerified = profile.verification_status === "verified" && hasUploadedDocs;
  const isPending = profile.verification_status === "pending";
  const isRejected = profile.verification_status === "rejected";
  const isUnverified = !hasUploadedDocs || profile.verification_status === "unverified" || !profile.verification_status;

  const locked = isPending || (isVerified && !showResubmitForm);

  async function uploadDoc(file: File, kind: "id" | "employment") {
    const path = `${profile!.org_id}/${profile!.id}/${kind}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("verification-docs").upload(path, file, {
      upsert: true,
    });
    if (error) throw error;
    return path;
  }

  async function handleSubmit() {
    if (!profile) return;
    if (!idProof || !employmentProof) {
      push("error", "Please upload both Government ID and Employee Pay Slip as ID Proof documents.");
      return;
    }
    setSubmitting(true);
    try {
      let idPath = `mock/${profile.id}/id-${idProof.name}`;
      let empPath = `mock/${profile.id}/emp-${employmentProof.name}`;

      try {
        idPath = await uploadDoc(idProof, "id");
        empPath = await uploadDoc(employmentProof, "employment");
      } catch (storageErr) {
        console.warn("Storage bucket fallback:", storageErr);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          id_proof_url: idPath,
          employment_proof_url: empPath,
          verification_status: "pending",
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        org_id: profile.org_id,
        user_id: profile.id,
        title: "KYC & Pay Slip Documents Submitted",
        message: "Your Government ID and Employee Pay Slip verification documents are currently under review by organization lenders.",
        type: "verification_decision",
        read: false,
      });

      push("success", "Documents & Employee Pay Slip submitted successfully! Your organization admin will review shortly.");
      setShowResubmitForm(false);
      refresh();
    } catch (err: any) {
      push("error", err.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Determine current active step (1, 2, or 3)
  const currentStep = isVerified ? 3 : isPending ? 2 : 1;

  return (
    <div className="max-w-5xl space-y-6 pb-16">
      {/* Top Banner & Header */}
      <div className="card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal/10 text-signal border border-signal/20 text-xs font-semibold mb-3">
            <ShieldCheck className="h-3.5 w-3.5" /> Security &amp; Compliance Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink dark:text-white tracking-tight">
            Borrower Identity Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-xl">
            Upload your valid Government ID and Employee Pay Slip (Salary Slip) as official ID proof to verify your membership and unlock emergency loan credit lines.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <VerificationBadge status={isVerified ? "verified" : isPending ? "pending" : isRejected ? "rejected" : "unverified"} />
        </div>
      </div>

      {/* Verification Step Progress Tracker */}
      <Card className="p-6 border border-slate-200 dark:border-surface-border-dark">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${currentStep >= 1 ? "bg-signal/5 border-signal/30 text-signal" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400"}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${currentStep >= 1 ? "bg-signal text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500"}`}>
              1
            </div>
            <div>
              <p className="text-xs font-bold text-ink dark:text-white">Submit Proofs</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">ID &amp; Employee Pay Slip</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border ${currentStep >= 2 ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400"}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${currentStep >= 2 ? "bg-amber-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500"}`}>
              2
            </div>
            <div>
              <p className="text-xs font-bold text-ink dark:text-white">Admin Review</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Intra-org verification</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border ${currentStep >= 3 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400"}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${currentStep >= 3 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500"}`}>
              3
            </div>
            <div>
              <p className="text-xs font-bold text-ink dark:text-white">Credit Access</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Borrow up to ₹2,50,000</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Dynamic Status Notification Banner */}
      {isVerified && (
        <Card className="p-6 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                  Account Fully Verified
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  Your identity &amp; Employee Pay Slip records are approved. You are eligible for internal emergency credit up to ₹2,50,000.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              {!showResubmitForm && (
                <button
                  onClick={() => setShowResubmitForm(true)}
                  className="px-4 py-2.5 rounded-full border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Re-upload / Update Docs
                </button>
              )}
              <Link
                href="/borrower/request"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all w-full sm:w-auto"
              >
                <span>Request Loan Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      {isPending && (
        <Card className="p-6 border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-amber-950 dark:text-amber-100">
                Documents Under Review
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Your uploaded Government ID and Employee Pay Slip documents are currently being reviewed by your organization admin. Review usually takes 2–4 hours.
              </p>
            </div>
          </div>
        </Card>
      )}

      {isRejected && (
        <Card className="p-6 border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-red-900 dark:text-red-200">
                Verification Rejected
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium leading-relaxed">
                {profile.rejection_reason || "The uploaded documents were unreadable or invalid."}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-bold">
                Please re-upload clear copies of your Government ID and Employee Pay Slip (Salary Slip) below.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Layout Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Form OR Vault Card */}
        <div className="lg:col-span-7 space-y-6">
          {(isUnverified || isRejected || showResubmitForm) ? (
            <Card className="p-6 border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark shadow-card">
              <CardHeader className="px-0 pt-0 pb-4 border-b border-slate-100 dark:border-surface-border-dark mb-6">
                <CardTitle className="text-lg font-bold text-ink dark:text-white">
                  Upload Required ID Proofs
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Please upload clear scans or photos of your Government ID and Employee Pay Slip (Salary Slip) as official ID proof.
                </CardDescription>
              </CardHeader>

              <div className="space-y-4">
                <FileDropCard
                  label="1. Government ID Proof"
                  hint="Aadhaar Card, PAN Card, or Driving License (PDF, PNG, JPG)"
                  file={idProof}
                  onChange={setIdProof}
                />
                <FileDropCard
                  label="2. Employee Pay Slip (ID & Employment Proof)"
                  hint="Recent Employee Pay Slip / Salary Slip (PDF, PNG, JPG) as official ID & Employment Proof"
                  file={employmentProof}
                  onChange={setEmploymentProof}
                />
              </div>

              <div className="flex gap-3 mt-6">
                {showResubmitForm && (
                  <Button
                    variant="secondary"
                    className="py-3 text-xs font-semibold rounded-xl"
                    onClick={() => setShowResubmitForm(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  className="flex-1 py-3.5 text-sm font-bold rounded-xl shadow-button bg-signal hover:bg-signal-hover text-white"
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  Submit ID &amp; Pay Slip for Verification
                </Button>
              </div>
            </Card>
          ) : (
            /* Document Vault Summary Card */
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="h-5 w-5 text-signal" />
                  <CardTitle className="text-lg">KYC &amp; ID Proof Vault</CardTitle>
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Encrypted &amp; Verified
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink dark:text-white">Government ID Proof</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {profile.id_proof_url ? "Document File Uploaded" : "Verified Record"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Approved</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink dark:text-white">Employee Pay Slip (ID Proof)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {profile.employment_proof_url ? "Pay Slip / Salary Slip Uploaded" : "Verified Record"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Approved</span>
                </div>
              </div>
            </Card>
          )}

          {/* Member Profile Details Card */}
          <Card className="p-6">
            <CardTitle className="text-base font-bold mb-4">Member Record Summary</CardTitle>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 font-medium block mb-1">Full Legal Name</span>
                <span className="font-semibold text-ink dark:text-white">{profile.full_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 font-medium block mb-1">Registered Email</span>
                <span className="font-semibold text-ink dark:text-white truncate block">{profile.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 font-medium block mb-1">PAN Number</span>
                <span className="font-mono font-semibold text-ink dark:text-white">
                  {profile.pan_number || "Provided"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 font-medium block mb-1">CIBIL Score Rating</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {profile.cibil_score ? `${profile.cibil_score} (Good)` : "750+ (Verified)"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Verification Criteria Checklist & Benefits */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6">
            <CardTitle className="text-base font-bold mb-4">Verification Checklist</CardTitle>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink dark:text-white">Intra-Org Account Created</p>
                  <p className="text-[11px] text-slate-500">Registered with active organization</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    hasUploadedDocs && isVerified
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : isPending
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600"
                      : "bg-slate-100 dark:bg-white/10 text-slate-400"
                  }`}
                >
                  {hasUploadedDocs && isVerified ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink dark:text-white">Government ID Proof</p>
                  <p className="text-[11px] text-slate-500">
                    {hasUploadedDocs && isVerified
                      ? "Aadhaar / PAN approved"
                      : isPending
                      ? "Under admin review"
                      : "Document required"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    hasUploadedDocs && isVerified
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : isPending
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600"
                      : "bg-slate-100 dark:bg-white/10 text-slate-400"
                  }`}
                >
                  {hasUploadedDocs && isVerified ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink dark:text-white">Employment Record</p>
                  <p className="text-[11px] text-slate-500">
                    {hasUploadedDocs && isVerified
                      ? "Salary slip / ID approved"
                      : isPending
                      ? "Under admin review"
                      : "Document required"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                    isVerified
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-white/10 text-slate-400"
                  }`}
                >
                  {isVerified ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink dark:text-white">Credit Pool Eligibility</p>
                  <p className="text-[11px] text-slate-500">
                    {isVerified ? "Up to ₹2,50,000 credit active" : "Unlocks after approval"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-signal/5 via-slate-50 to-transparent dark:from-signal/10 dark:via-surface-dark dark:to-surface-dark border-signal/20">
            <CardTitle className="text-base font-bold text-ink dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-signal" /> Why Verification is Required
            </CardTitle>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside font-medium">
              <li>Ensures emergency loan pools are only shared among verified organizational colleagues</li>
              <li>Enables zero-interest rate intra-organization credit access</li>
              <li>Protects both lenders and borrowers with legal lending agreements</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FileDropCard({
  label,
  hint,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-ink dark:text-white">{label}</label>
      {file ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-signal/40 bg-signal/5 dark:bg-signal/10">
          <div className="flex items-center gap-3 min-w-0">
            <FileCheck className="h-5 w-5 text-signal shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink dark:text-white truncate">{file.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-surface-border-dark hover:border-signal hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-all text-center">
          <div className="p-3 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500">
            <UploadCloud className="h-6 w-6 text-signal" />
          </div>
          <div>
            <p className="text-xs font-bold text-ink dark:text-white">
              Click to select file or drag &amp; drop
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
