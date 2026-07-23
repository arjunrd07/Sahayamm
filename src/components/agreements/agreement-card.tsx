"use client";

import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { AgreementStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Agreement } from "@/types/database";
import { FileSignature, Download } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function AgreementCard({ agreement }: { agreement: Agreement | null }) {
  const supabase = createClient();
  const { push } = useToast();

  if (!agreement) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <FileSignature className="h-5 w-5 text-muted" />
          <div>
            <p className="font-medium text-sm">Agreement not generated yet</p>
            <p className="text-xs text-muted mt-0.5">
              An Internal Lending Agreement is created automatically once the loan is approved.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  async function handleDownload() {
    if (!agreement!.pdf_url) {
      push("info", "The signed PDF isn't available yet — it appears once both parties have signed.");
      return;
    }
    const { data, error } = await supabase.storage
      .from("agreements")
      .createSignedUrl(agreement!.pdf_url, 60 * 10);
    if (error || !data) {
      push("error", "Could not generate a download link.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <CardTitle>Internal Lending Agreement</CardTitle>
          <CardDescription>Agreement No. {agreement.agreement_number}</CardDescription>
        </div>
        <AgreementStatusBadge status={agreement.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <SignalRow label="Borrower signature" signed={agreement.borrower_signed} />
        <SignalRow label="Lender signature" signed={agreement.lender_signed} />
      </div>

      <Button variant="secondary" className="w-full" onClick={handleDownload}>
        <Download className="h-4 w-4" />
        View / download PDF
      </Button>
    </Card>
  );
}

function SignalRow({ label, signed }: { label: string; signed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${signed ? "bg-success" : "bg-surface-border dark:bg-white/20"}`} />
      <span className="text-muted">{label}</span>
    </div>
  );
}
