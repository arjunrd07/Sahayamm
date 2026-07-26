"use client";

import { useRef } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, Printer, Download, CheckCircle2 } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

export interface AgreementData {
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
}

export function AgreementTemplateViewer({ agreement }: { agreement: AgreementData }) {
  const printRef = useRef<HTMLDivElement>(null);

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
            <p className="text-xs text-ink-slate">Agreement No: {agreement.agreement_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            Terms
          </h3>
          <ul className="list-disc pl-5 text-xs text-ink-slate space-y-1.5 font-medium leading-relaxed">
            <li>The Lender agrees to lend the above amount to the Borrower.</li>
            <li>The Borrower agrees to repay the total repayment amount on or before the due date.</li>
            <li>Late repayment attracts an additional 2% flat interest on the outstanding amount.</li>
            <li>Sahayam only manages documentation and workflow. Money transfer occurs outside the platform.</li>
            <li>This Agreement is governed by the laws of India.</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-signal border-b border-slate-200 dark:border-surface-border-dark pb-1">
            Signatures
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Borrower Signature */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-surface-border-dark bg-white dark:bg-surface-dark space-y-2">
              <span className="text-xs font-extrabold text-ink dark:text-white block">Borrower</span>
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
                Date: <strong>{agreement.borrower_signed_at || (agreement.borrower_signed ? agreement.agreement_date : "Pending")}</strong>
              </p>
            </div>

            {/* Lender Signature */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-surface-border-dark bg-white dark:bg-surface-dark space-y-2">
              <span className="text-xs font-extrabold text-ink dark:text-white block">Lender (Organization Admin)</span>
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
                Date: <strong>{agreement.lender_signed_at || (agreement.lender_signed ? agreement.agreement_date : "Pending")}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
