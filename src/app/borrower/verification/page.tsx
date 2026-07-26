"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/status-badge";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";

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
    if (!idProof || !employmentProof) {
      push("error", "Both documents are required.");
      return;
    }
    setSubmitting(true);
    try {
      const idPath = await uploadDoc(idProof, "id");
      const empPath = await uploadDoc(employmentProof, "employment");

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
      push("success", "Documents submitted. An admin will review them shortly.");
      refresh();
    } catch (err: any) {
      push("error", err.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Verification</h2>
          <p className="text-sm text-muted mt-1">
            Verified members can request loans within their organization.
          </p>
        </div>
        <VerificationBadge status={profile.verification_status} />
      </div>

      {profile.verification_status === "rejected" && profile.rejection_reason && (
        <Card className="border-danger/30 bg-danger-soft">
          <p className="text-sm text-danger font-medium">Your last submission was rejected</p>
          <p className="text-sm text-danger/80 mt-1">{profile.rejection_reason}</p>
        </Card>
      )}

      {profile.verification_status === "verified" ? (
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <p className="font-medium">You're verified</p>
              <p className="text-sm text-muted">You can now request a loan.</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upload verification documents</CardTitle>
            <CardDescription>
              A government ID and proof of employment with your organization.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <FileDrop
              label="Government ID proof"
              file={idProof}
              onChange={setIdProof}
              disabled={locked}
            />
            <FileDrop
              label="Employment proof"
              file={employmentProof}
              onChange={setEmploymentProof}
              disabled={locked}
            />
          </div>

          <Button
            className="mt-6 w-full"
            onClick={handleSubmit}
            loading={submitting}
            disabled={locked}
          >
            {locked ? "Submitted — awaiting review" : "Submit for verification"}
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
      className={`flex items-center gap-3 rounded-xl border border-dashed border-surface-border dark:border-surface-border-dark px-4 py-4 cursor-pointer hover:bg-surface/60 dark:hover:bg-white/5 ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {file ? (
        <FileText className="h-5 w-5 text-accent shrink-0" />
      ) : (
        <UploadCloud className="h-5 w-5 text-muted shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted truncate">{file ? file.name : "PDF, JPG or PNG — click to choose"}</p>
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
