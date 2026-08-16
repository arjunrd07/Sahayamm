"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, Printer, CheckCircle2, ShieldCheck, PenTool } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { signLendingAgreement } from "@/app/api/agreements/actions";
import { useToast } from "@/components/ui/toast";

export interface AgreementData {
  id?: string;
  agreement_number: string;
  agreement_date: string;
  organization_name: string;
  lender_name: string;
  borrower_name: string;
  employee_id: string;
  loan_id: string;
  loan_amount: number;
  interest_rate: number;
  loan_duration: string;
  repayment_amount: number;
  due_date: string;
  borrower_signed: boolean;
  borrower_signed_at?: string;
  lender_signed: boolean;
  lender_signed_at?: string;
  digital_signature_hash?: string;
}

export function AgreementTemplateViewer({
  agreement,
  onSigned,
}: {
  agreement: AgreementData;
  onSigned?: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);
  const { push } = useToast();

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sahayam Internal Lending Agreement - ${agreement.agreement_number}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 2px solid #006BFF; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 800; color: #006BFF; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 18px; font-weight: 700; margin-top: 4px; color: #0F172A; }
            .meta { margin-top: 12px; font-size: 14px; color: #475569; }
            .section { margin-top: 24px; }
            .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #006BFF; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            .table th { background-color: #f8fafc; font-weight: 700; }
            .terms { font-size: 13px; color: #334155; padding-left: 20px; }
            .terms li { margin-bottom: 8px; }
            .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
            .sig-box { border: 1px dashed #94a3b8; padding: 16px; border-radius: 8px; background: #f8fafc; }
            .sig-title { font-weight: 700; font-size: 14px; margin-bottom: 8px; }
            .sig-status { font-weight: 700; color: #16a34a; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  async function handleExecuteSignature(e: React.FormEvent) {
    e.preventDefault();
    if (!agreement.id) return;
    if (!signatureName.trim()) {
      push("error", "Please enter your full legal name to sign.");
      return;
    }
    setSigning(true);
    const res = await signLendingAgreement(agreement.id, signatureName.trim());
    setSigning(false);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push("success", `Digital signature recorded for ${agreement.agreement_number}!`);
    if (onSigned) onSigned();
  }

  const isFullySigned = agreement.borrower_signed && agreement.lender_signed;

  return (
    <Card className="p-6 space-y-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark shadow-sm">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-border-dark">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-signal/10 text-signal flex items-center justify-center font-bold">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-ink dark:text-white">Internal Lending Agreement</h3>
            <p className="text-xs text-ink-slate font-mono">Agreement No: {agreement.agreement_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/40">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sahayam Native Seal
          </span>
          <Button variant="secondary" onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5">
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Printable Agreement Document Canvas */}
      <div ref={printRef} className="p-6 sm:p-8 bg-slate-50/50 dark:bg-canvas-dark rounded-2xl border border-slate-200/80 dark:border-surface-border-dark space-y-6 text-sm text-ink dark:text-white font-sans">
        {/* Document Header */}
        <div className="header text-center sm:text-left border-b border-signal/20 pb-4">
          <h1 className="text-2xl font-black text-signal tracking-tight">SAHAYAM</h1>
          <h2 className="text-lg font-extrabold text-ink dark:text-white mt-1 uppercase tracking-wide">
            INTERNAL LENDING AGREEMENT
          </h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-ink-slate">
            <div><strong>Agreement No:</strong> {agreement.agreement_number}</div>
            <div><strong>Agreement Date:</strong> {agreement.agreement_date}</div>
            <div><strong>Organization:</strong> {agreement.organization_name}</div>
          </div>
        </div>

        {/* Cryptographic Seal Badge */}
        {agreement.digital_signature_hash && (
          <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Digital SHA-256 Seal: <strong>{agreement.digital_signature_hash}</strong></span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Verified Token</span>
          </div>
        )}

        {/* Parties */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-signal border-b border-slate-200 dark:border-surface-border-dark pb-1">
            Parties
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark">
              <span className="text-ink-slate font-bold block mb-1">Lender:</span>
              <strong className="text-ink dark:text-white text-sm">{agreement.lender_name}</strong>
              <span className="text-ink-slate block text-[11px] mt-0.5">(Organization Admin)</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark">
              <span className="text-ink-slate font-bold block mb-1">Borrower:</span>
              <strong className="text-ink dark:text-white text-sm">{agreement.borrower_name}</strong>
              <span className="text-ink-slate block text-[11px] mt-0.5">(Employee ID: {agreement.employee_id})</span>
            </div>
          </div>
        </div>

        {/* Loan Details Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-signal border-b border-slate-200 dark:border-surface-border-dark pb-1">
            Loan Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse rounded-xl overflow-hidden border border-slate-200 dark:border-surface-border-dark">
              <tbody>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark">
                  <td className="p-2.5 font-bold text-ink-slate w-1/3">Loan ID</td>
                  <td className="p-2.5 font-extrabold text-ink dark:text-white">{agreement.loan_id}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-slate-50 dark:bg-canvas-dark">
                  <td className="p-2.5 font-bold text-ink-slate">Amount</td>
                  <td className="p-2.5 font-extrabold text-signal">{formatINR(agreement.loan_amount)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark">
                  <td className="p-2.5 font-bold text-ink-slate">Interest</td>
                  <td className="p-2.5 font-extrabold text-ink dark:text-white">{agreement.interest_rate}% (Flat)</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-slate-50 dark:bg-canvas-dark">
                  <td className="p-2.5 font-bold text-ink-slate">Duration</td>
                  <td className="p-2.5 font-extrabold text-ink dark:text-white">{agreement.loan_duration}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark">
                  <td className="p-2.5 font-bold text-ink-slate">Repayment Amount</td>
                  <td className="p-2.5 font-extrabold text-emerald-600">{formatINR(agreement.repayment_amount)}</td>
                </tr>
                <tr className="bg-slate-50 dark:bg-canvas-dark">
                  <td className="p-2.5 font-bold text-ink-slate">Due Date</td>
                  <td className="p-2.5 font-extrabold text-ink dark:text-white">{agreement.due_date}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-signal border-b border-slate-200 dark:border-surface-border-dark pb-1">
            Terms &amp; Statutory Governance
          </h3>
          <ul className="list-disc pl-5 text-xs text-ink-slate space-y-1.5 font-medium leading-relaxed">
            <li>The Lender agrees to lend the specified principal amount to the Borrower under organization guidelines.</li>
            <li>The Borrower agrees to repay the total repayment amount on or before the due date specified above.</li>
            <li>Late repayment attracts an additional 2% flat interest on the outstanding balance.</li>
            <li>Sahayam native e-signatures provide legally binding digital audit logs under Indian IT Act Section 10A.</li>
            <li>This Agreement is governed by the laws of India.</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-signal border-b border-slate-200 dark:border-surface-border-dark pb-1">
            Digital Signatures &amp; Execution Stamping
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Borrower Signature */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-surface-border-dark bg-white dark:bg-surface-dark space-y-2">
              <span className="text-xs font-extrabold text-ink dark:text-white block">Borrower Signature</span>
              <div className="h-12 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-canvas-dark px-3">
                {agreement.borrower_signed ? (
                  <span className="font-serif italic font-bold text-base text-signal flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {agreement.borrower_name}
                  </span>
                ) : (
                  <span className="text-xs text-ink-slate italic font-medium">Pending Digital Signature</span>
                )}
              </div>
              <p className="text-[11px] text-ink-slate font-medium">
                Timestamp: <strong>{agreement.borrower_signed_at || (agreement.borrower_signed ? agreement.agreement_date : "Pending")}</strong>
              </p>
            </div>

            {/* Lender Signature */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-surface-border-dark bg-white dark:bg-surface-dark space-y-2">
              <span className="text-xs font-extrabold text-ink dark:text-white block">Lender (Organization Admin) Signature</span>
              <div className="h-12 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-canvas-dark px-3">
                {agreement.lender_signed ? (
                  <span className="font-serif italic font-bold text-base text-signal flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {agreement.lender_name}
                  </span>
                ) : (
                  <span className="text-xs text-ink-slate italic font-medium">Pending Admin Signature</span>
                )}
              </div>
              <p className="text-[11px] text-ink-slate font-medium">
                Timestamp: <strong>{agreement.lender_signed_at || (agreement.lender_signed ? agreement.agreement_date : "Pending")}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive In-App Native E-Sign Drawer if not fully signed */}
      {!isFullySigned && agreement.id && (
        <form onSubmit={handleExecuteSignature} className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 space-y-3">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
            <PenTool className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Sahayam In-App Digital Signature Execution</span>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Type your full legal name below to sign this agreement natively inside Sahayam.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter Full Legal Name..."
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-surface-border-dark text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <Button variant="primary" loading={signing} type="submit" className="text-xs font-bold py-2 px-4 bg-blue-600 hover:bg-blue-700">
              Execute E-Signature
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
