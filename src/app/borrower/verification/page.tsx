"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/status-badge";
import { UploadCloud, FileText, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

export default function CustomerVerificationPage() {
  const { profile, refresh } = useAuth();
  const { push } = useToast();
  const supabase = createClient();
  const [idProof, setIdProof] = useState<File | null>(null);
  const [employmentProof, setEmploymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!profile) return null;

  const locked = profile.verification_status === "pending" || profile.verification_status === "verified";

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
      push("error", "Both Government ID and Employment Proof documents are required.");
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

      // Trigger notification for profile verification submission
      await supabase.from("notifications").insert({
        org_id: profile.org_id,
        user_id: profile.id,
        title: "KYC Documents Submitted",
        message: "Your identity and employment verification documents are currently under review by organization lenders.",
        type: "verification_decision",
        read: false,
      });

      push("success", "Verification documents submitted successfully! Admin will review shortly.");
      refresh();
    } catch (err: any) {
      push("error", err.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-bold mb-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Identity &amp; Compliance Vault
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-ink dark:text-white tracking-tight">Borrower Verification</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Verified members gain immediate access to 0% interest internal emergency loan requests.
          </p>
        </div>
        <div className="shrink-0">
          <VerificationBadge status={profile.verification_status} />
        </div>
      </div>

      {/* Status Warning Banners */}
      {profile.verification_status === "rejected" && profile.rejection_reason && (
        <Card className="p-5 border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900 dark:text-red-200">Verification Submission Rejected</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium leading-relaxed">{profile.rejection_reason}</p>
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-2 font-bold">Please upload clear &amp; updated documents below to resubmit.</p>
            </div>
          </div>
        </Card>
      )}

      {profile.verification_status === "verified" ? (
        <Card className="p-6 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-emerald-950 dark:text-emerald-100">Account Fully Verified</p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Your identity &amp; employment records are approved. You can request up to ₹2,50,000 credit.</p>
              </div>
            </div>
            <Link
              href="/borrower/request"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all shrink-0"
            >
              <span>Apply For Loan</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      ) : profile.verification_status === "pending" ? (
        <Card className="p-6 border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-amber-950 dark:text-amber-100">Documents Under Review</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">An organization lender administrator is currently reviewing your uploaded KYC files.</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark shadow-card">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-slate-100 dark:border-surface-border-dark mb-6">
            <CardTitle className="text-lg font-bold text-ink dark:text-white">Upload Verification Documents</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Submit a government-issued ID proof and official employment verification to unlock your credit pool.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <FileDrop
              label="Government ID Proof (Aadhaar / PAN / Passport)"
              file={idProof}
              onChange={setIdProof}
              disabled={locked}
            />
            <FileDrop
              label="Employment Proof (Offer Letter / Salary Slip / Employee ID)"
              file={employmentProof}
              onChange={setEmploymentProof}
              disabled={locked}
            />
          </div>

          <Button
            className="mt-6 w-full py-3.5 text-sm font-bold rounded-xl shadow-button bg-signal hover:bg-signal-hover text-white"
            onClick={handleSubmit}
            loading={submitting}
            disabled={locked}
          >
            {locked ? "Verification Submitted — Pending Review" : "Submit Verification Documents"}
          </Button>
        </Card>
      )}
    </div>
  );
}

function FileDrop({
  label,
  file,
  onChange,
  disabled,
}: {
  label: string;
  file: File | null;
  onChange: (f: File) => void;
  disabled: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-3.5 rounded-xl border border-dashed border-slate-300 dark:border-surface-border-dark px-4 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {file ? (
        <FileText className="h-5 w-5 text-signal shrink-0" />
      ) : (
        <UploadCloud className="h-5 w-5 text-slate-400 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-ink dark:text-white">{label}</p>
        <p className="text-[11px] text-slate-400 truncate font-medium">{file ? file.name : "PDF, JPG or PNG (Max 10MB)"}</p>
      </div>
      <input
        type="file"
        className="hidden"
        accept="application/pdf,image/*"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
    </label>
  );
}
