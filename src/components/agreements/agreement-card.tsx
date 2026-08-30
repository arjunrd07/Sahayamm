"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { AgreementStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Agreement } from "@/types/database";
import { FileSignature, Download, Eye, FileText } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { AgreementTemplateViewer } from "./AgreementTemplateViewer";

interface AgreementCardProps {
  agreement: Agreement | null;
  loanDetails?: {
    loan_id: string;
    amount: number;
    interest_rate: number;
    interest_amount?: number;
    duration_days: number;
    total_repayment: number;
    due_date?: string | null;
    created_at?: string | null;
    borrower_name: string;
    borrower_email?: string;
    borrower_employee_id?: string;
    borrower_pan?: string;
    lender_name: string;
    lender_email?: string;
    org_name: string;
  };
}

export function AgreementCard({ agreement, loanDetails }: AgreementCardProps) {
  const supabase = createClient();
  const { push } = useToast();
  const [showFullTemplate, setShowFullTemplate] = useState(false);

  if (!agreement) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <FileSignature className="h-5 w-5 text-muted" />
          <div>
            <p className="font-medium text-sm">Agreement not generated yet</p>
            <p className="text-xs text-muted mt-0.5">
              An Internal Lending Agreement is created automatically once the loan application is submitted and approved.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  async function handleDownload() {
    if (!agreement!.pdf_url) {
      push("info", "Opening interactive contract viewer for print / PDF save...");
      setShowFullTemplate(true);
      return;
    }
    const { data, error } = await supabase.storage
      .from("agreements")
      .createSignedUrl(agreement!.pdf_url, 60 * 10);
    if (error || !data) {
      push("info", "Opening interactive contract viewer...");
      setShowFullTemplate(true);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const defaultDetails = {
    agreement_number: agreement.agreement_number,
    agreement_date: agreement.created_at
      ? new Date(agreement.created_at).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN"),
    organization_name: loanDetails?.org_name || "Sahayam Organization",
    lender_name: loanDetails?.lender_name || "Authorized Organization Lender",
    lender_email: loanDetails?.lender_email,
    borrower_name: loanDetails?.borrower_name || "Employee Borrower",
    borrower_email: loanDetails?.borrower_email,
    employee_id: loanDetails?.borrower_employee_id || "EMP-8842",
    pan_number: loanDetails?.borrower_pan,
    loan_id: loanDetails?.loan_id || `LN-${agreement.loan_id.slice(0, 8)}`,
    loan_amount: loanDetails?.amount || 50000,
    interest_rate: loanDetails?.interest_rate || 0,
    interest_amount: loanDetails?.interest_amount,
    loan_duration: `${loanDetails?.duration_days || 30} Days`,
    repayment_amount: loanDetails?.total_repayment || 50000,
    due_date: loanDetails?.due_date
      ? new Date(loanDetails.due_date).toLocaleDateString("en-IN")
      : `${loanDetails?.duration_days || 30} Days from disbursal`,
  };

  return (
    <div className="space-y-4">
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

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setShowFullTemplate(!showFullTemplate)} className="text-xs font-bold">
            <FileText className="h-4 w-4 mr-1.5" />
            {showFullTemplate ? "Hide contract" : "View full contract"}
          </Button>

          <Button variant="primary" onClick={handleDownload} className="text-xs font-bold">
            <Download className="h-4 w-4 mr-1.5" />
            Download PDF
          </Button>
        </div>
      </Card>

      {showFullTemplate && (
        <AgreementTemplateViewer agreement={defaultDetails} />
      )}
    </div>
  );
}

function SignalRow({ label, signed }: { label: string; signed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${signed ? "bg-emerald-500" : "bg-surface-border dark:bg-white/20"}`} />
      <span className="text-muted text-xs font-medium">{label}</span>
    </div>
  );
}
