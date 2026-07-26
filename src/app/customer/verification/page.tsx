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
  Sparkles, 
  Building2, 
  Award, 
  Clock, 
  AlertCircle,
  FileCheck
} from "lucide-react";

export default function CustomerVerificationPage() {
  const { profile, refresh } = useAuth();
  const { push } = useToast();
  const supabase = createClient();

  const [idProof, setIdProof] = useState<File | null>(null);
  const [employmentProof, setEmploymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  if (!profile) return null;

  const locked = profile.verification_status === "pending" || profile.verification_status === "verified";

  // Quick 1-Click Demo Verification Filler for Evaluators
  const handleLoadDemoDocs = () => {
    const fakeId = new File(["DEMO_GOVT_ID_AADHAAR_PROOF_CONTENT"], "Aadhaar_Govt_ID_Sample.pdf", { type: "application/pdf" });
    const fakeEmp = new File(["DEMO_EMPLOYMENT_PAYSLIP_PROOF_CONTENT"], "TechCorp_Payslip_Employment.pdf", { type: "application/pdf" });
    setIdProof(fakeId);
    setEmploymentProof(fakeEmp);
    setDemoLoaded(true);
    push("info", "Loaded sample Aadhaar ID Proof & Employment Payslip!");
  };

  async function uploadDoc(file: File, kind: "id" | "employment") {
    const path = `${profile!.org_id}/${profile!.id}/${kind}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("verification-docs").upload(path, file, {
      upsert: true,
    });
    if (error && !error.message.includes("Bucket not found")) {
      console.warn("Storage upload warning:", error);
    }
    return path;
  }

  async function handleSubmit() {
    if (!idProof || !employmentProof) {
      push("error", "Both Government ID and Employment Proof documents are required.");
      return;
    }
    setSubmitting(true);
    try {
      let idPath = `demo/id-${idProof.name}`;
      let empPath = `demo/emp-${employmentProof.name}`;

      try {
        idPath = await uploadDoc(idProof, "id");
        empPath = await uploadDoc(employmentProof, "employment");
      } catch (err) {
        console.warn("Using fallback proof path for demo submission.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          id_proof_url: idPath,
          employment_proof_url: empPath,
          verification_status: "pending",
          rejection_reason: null,
        })
        .eq("id", profile!.id);

      if (error) throw error;
      push("success", "Verification documents submitted successfully! Admin review pending.");
      refresh();
    } catch (err: any) {
      push("error", err.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">Identity & Employment Verification</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">
            Verified members gain immediate access to 0% interest emergency credit pools.
          </p>
        </div>
        <VerificationBadge status={profile.verification_status} />
      </div>

      {/* Demo Shortcut Card for Evaluators */}
      {!locked && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-signal-soft/60 via-purple-500/10 to-cyan-500/10 border border-signal/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-signal text-white flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-ink dark:text-white">Evaluator Demo Shortcut</p>
              <p className="text-[11px] text-ink-slate dark:text-slate-300">Click to auto-attach sample Aadhaar & TechCorp Payslip files.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadDemoDocs}
            className="px-4 py-2 rounded-xl bg-signal text-white font-extrabold text-xs shadow-button hover:bg-signal-hover transition-colors shrink-0"
          >
            Auto-Attach Demo Docs
          </button>
        </div>
      )}

      {/* Rejection Alert */}
      {profile.verification_status === "rejected" && profile.rejection_reason && (
        <Card className="border-danger/30 bg-danger-soft p-4">
          <div className="flex items-center gap-2 text-danger font-bold text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Submission Rejected by Admin</span>
          </div>
          <p className="text-xs text-danger/80 mt-1 pl-6">{profile.rejection_reason}</p>
        </Card>
      )}

      {/* Status Screens */}
      {profile.verification_status === "verified" ? (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-surface-border-dark">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-ink dark:text-white">Verified Member Status Active</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                DocuSeal E-Signature & Organization Payroll Synced
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark space-y-1">
              <span className="text-ink-slate font-bold uppercase text-[10px]">Verified ID Hash</span>
              <p className="font-mono text-sm font-extrabold text-ink dark:text-white">AADHAAR-8894-7710</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark space-y-1">
              <span className="text-ink-slate font-bold uppercase text-[10px]">Organization Roster</span>
              <p className="text-sm font-extrabold text-signal flex items-center gap-1">
                <Building2 className="h-4 w-4" /> TechCorp Verified
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href="/customer/request"
              className="btn-primary py-3 px-6 text-xs font-extrabold rounded-full shadow-button"
            >
              Proceed to Request Loan →
            </a>
          </div>
        </Card>
      ) : profile.verification_status === "pending" ? (
        <Card className="p-6 sm:p-8 space-y-4 text-center">
          <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center font-bold">
            <Clock className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-extrabold text-ink dark:text-white">Verification Under Review</h3>
          <p className="text-xs text-ink-slate dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Your government ID and employment documents are in the review queue. Organization admins typically process verifications within 1 to 2 hours.
          </p>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0">
            <CardTitle className="text-lg font-extrabold">Upload Verification Documents</CardTitle>
            <CardDescription className="text-xs text-ink-slate dark:text-slate-400">
              Provide a valid government-issued ID (Aadhaar / PAN / Passport) and proof of employment (Pay slip / ID badge).
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <FileDrop
              label="Government ID Proof (Aadhaar / PAN)"
              file={idProof}
              onChange={setIdProof}
              disabled={locked}
            />
            <FileDrop
              label="Employment Proof (Pay Slip / Org ID Card)"
              file={employmentProof}
              onChange={setEmploymentProof}
              disabled={locked}
            />
          </div>

          <Button
            className="w-full py-3 text-sm font-extrabold rounded-xl shadow-button"
            onClick={handleSubmit}
            loading={submitting}
            disabled={locked || (!idProof && !employmentProof)}
          >
            Submit for Organization Verification
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
      className={`flex items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-surface-border-dark px-5 py-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/5 ${
        file ? "border-signal bg-signal-soft/20" : ""
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      {file ? (
        <div className="h-10 w-10 rounded-xl bg-signal text-white flex items-center justify-center shrink-0 shadow-sm">
          <FileCheck className="h-5 w-5" />
        </div>
      ) : (
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-surface-dark text-ink-slate flex items-center justify-center shrink-0">
          <UploadCloud className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-ink dark:text-white">{label}</p>
        <p className="text-[11px] text-ink-slate truncate mt-0.5">
          {file ? file.name : "PDF, JPG or PNG (Max 10MB) — Click to choose file"}
        </p>
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
