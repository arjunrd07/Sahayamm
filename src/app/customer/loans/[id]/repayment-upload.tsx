"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitRepaymentProof } from "./actions";

export function RepaymentUpload({
  loanId,
  orgId,
  alreadySubmitted,
}: {
  loanId: string;
  orgId: string;
  alreadySubmitted: boolean;
}) {
  const { profile } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (alreadySubmitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="h-4 w-4" />
        Repayment proof submitted — awaiting admin verification.
      </div>
    );
  }

  async function handleSubmit() {
    if (!file || !profile) {
      push("error", "Choose a file first.");
      return;
    }
    setSubmitting(true);
    try {
      const path = `${orgId}/${profile.id}/repayment-${loanId}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (uploadError) throw uploadError;

      const result = await submitRepaymentProof(loanId, path);
      if ("error" in result && result.error) throw new Error(result.error);

      push("success", "Repayment proof submitted.");
      router.refresh();
    } catch (err: any) {
      push("error", err.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 rounded-xl border border-dashed border-surface-border dark:border-surface-border-dark px-4 py-4 cursor-pointer hover:bg-surface/60 dark:hover:bg-white/5">
        {file ? (
          <FileText className="h-5 w-5 text-accent shrink-0" />
        ) : (
          <UploadCloud className="h-5 w-5 text-muted shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">Payment proof</p>
          <p className="text-xs text-muted truncate">{file ? file.name : "Receipt or transfer screenshot"}</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept="application/pdf,image/*"
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
        />
      </label>
      <Button className="w-full" onClick={handleSubmit} loading={submitting}>
        Submit repayment proof
      </Button>
    </div>
  );
}
