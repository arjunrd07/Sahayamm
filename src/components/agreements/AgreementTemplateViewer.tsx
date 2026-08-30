"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, Printer, ShieldCheck, ShieldAlert, FileCheck2, User, Building2, Calendar, CreditCard, Scale, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/utils";

export interface AgreementData {
  id?: string;
  agreement_number: string;
  agreement_date: string;
  organization_name: string;
  lender_name: string;
  lender_email?: string;
  lender_role?: string;
  borrower_name: string;
  borrower_email?: string;
  employee_id?: string;
  pan_number?: string;
  loan_id: string;
  loan_amount: number;
  interest_rate: number;
  interest_amount?: number;
  loan_duration: string;
  repayment_amount: number;
  due_date: string;
  borrower_signed?: boolean;
  borrower_signed_at?: string;
  lender_signed?: boolean;
  lender_signed_at?: string;
  digital_signature_hash?: string;
}

export function AgreementTemplateViewer({
  agreement,
}: {
  agreement: AgreementData;
  onSigned?: () => void;
}) {
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
            @page { size: A4 portrait; margin: 15mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 20px; color: #0f172a; line-height: 1.4; background: #fff; }
            .header { border-bottom: 2px solid #006BFF; padding-bottom: 12px; margin-bottom: 16px; }
            .title-row { display: flex; justify-content: space-between; align-items: baseline; }
            .brand { font-size: 22px; font-weight: 900; color: #006BFF; letter-spacing: -0.5px; }
            .doc-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }
            .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; font-size: 11px; color: #475569; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .section { margin-top: 16px; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #006BFF; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; }
            .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .party-card { border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; background: #fafafa; }
            .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
            .party-name { font-size: 13px; font-weight: 800; color: #0f172a; }
            .party-meta { font-size: 11px; color: #475569; margin-top: 2px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            .table td.label { font-weight: 700; color: #475569; width: 35%; background-color: #f8fafc; }
            .table td.value { font-weight: 800; color: #0f172a; }
            .terms-list { font-size: 11px; color: #334155; padding-left: 18px; margin: 6px 0; }
            .terms-list li { margin-bottom: 5px; line-height: 1.35; }
            .disclaimer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
            .disclaimer-card { border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 6px; font-size: 10px; line-height: 1.35; }
            .disclaimer-card.legal { background: #fffbeb; border-color: #fde68a; color: #78350f; }
            .disclaimer-card.declaration { background: #eff6ff; border-color: #bfdbfe; color: #1e3a8a; }
            .disclaimer-title { font-weight: 800; text-transform: uppercase; font-size: 9px; margin-bottom: 3px; }
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
            <p className="text-xs text-ink-slate font-mono">Agreement No: {agreement.agreement_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/40">
            <ShieldCheck className="h-3.5 w-3.5" />
            Legally Binding Agreement
          </span>
          <Button variant="secondary" onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5">
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Printable Agreement Document Canvas */}
      <div ref={printRef} className="p-6 sm:p-8 bg-slate-50/50 dark:bg-canvas-dark rounded-2xl border border-slate-200/80 dark:border-surface-border-dark space-y-5 text-sm text-ink dark:text-white font-sans">
        {/* Document Header */}
        <div className="header border-b-2 border-signal pb-4">
          <div className="title-row flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h1 className="brand text-2xl font-black text-signal tracking-tight">SAHAYAM</h1>
            <h2 className="doc-title text-sm font-extrabold text-ink dark:text-white uppercase tracking-wider">
              INTERNAL LENDING AGREEMENT
            </h2>
          </div>

          <div className="meta-grid mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Agreement Ref</span>
              <strong className="text-ink dark:text-white font-mono">{agreement.agreement_number}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Execution Date</span>
              <strong className="text-ink dark:text-white">{agreement.agreement_date}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Organization</span>
              <strong className="text-ink dark:text-white">{agreement.organization_name}</strong>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="section space-y-2">
          <h3 className="section-title text-xs font-extrabold uppercase tracking-wider text-signal border-b border-slate-200 dark:border-surface-border-dark pb-1">
            Agreed Parties
          </h3>
          <div className="parties-grid grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium pt-1">
            {/* Lender Card */}
            <div className="party-card p-3.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 space-y-1">
              <span className="party-label text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Authorized Lender (Party of the First Part)
              </span>
              <p className="party-name text-sm font-extrabold text-ink dark:text-white">
                {agreement.lender_name}
              </p>
              <p className="party-meta text-[11px] text-slate-500 font-medium">
                {agreement.lender_email || "Organization Lending Officer"} · {agreement.organization_name}
              </p>
            </div>

            {/* Borrower Card */}
            <div className="party-card p-3.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 space-y-1">
              <span className="party-label text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Borrower / Applicant (Party of the Second Part)
              </span>
              <p className="party-name text-sm font-extrabold text-ink dark:text-white">
                {agreement.borrower_name}
              </p>
              <p className="party-meta text-[11px] text-slate-500 font-medium">
                {agreement.borrower_email ? `${agreement.borrower_email} · ` : ""}
                {agreement.employee_id ? `Employee ID: ${agreement.employee_id}` : ""}
                {agreement.pan_number ? ` · PAN: ${agreement.pan_number}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Loan Details Table */}
        <div className="section space-y-2">
          <h3 className="section-title text-xs font-extrabold uppercase tracking-wider text-signal border-b border-slate-200 dark:border-surface-border-dark pb-1">
            Agreed Loan Specifications &amp; Repayment Schedule
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full text-xs text-left border-collapse rounded-xl overflow-hidden border border-slate-200 dark:border-surface-border-dark">
              <tbody>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark">
                  <td className="label p-2.5 font-bold text-slate-500 w-1/3">Loan Reference ID</td>
                  <td className="value p-2.5 font-extrabold text-ink dark:text-white font-mono">{agreement.loan_id}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-slate-50 dark:bg-canvas-dark">
                  <td className="label p-2.5 font-bold text-slate-500">Agreed Principal Amount</td>
                  <td className="value p-2.5 font-black text-signal text-sm">{formatINR(agreement.loan_amount)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark">
                  <td className="label p-2.5 font-bold text-slate-500">Agreed Interest Charge</td>
                  <td className="value p-2.5 font-extrabold text-ink dark:text-white">
                    {agreement.interest_amount !== undefined && agreement.interest_amount > 0
                      ? `${formatINR(agreement.interest_amount)} (${agreement.interest_rate}% flat for tenure)`
                      : agreement.interest_rate > 0
                      ? `${agreement.interest_rate}% (Flat)`
                      : "₹0.00 (0% Flat)"}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-slate-50 dark:bg-canvas-dark">
                  <td className="label p-2.5 font-bold text-slate-500">Agreed Loan Duration / Tenure</td>
                  <td className="value p-2.5 font-extrabold text-ink dark:text-white">{agreement.loan_duration}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark">
                  <td className="label p-2.5 font-bold text-slate-500">Total Settlement / Repayment Amount</td>
                  <td className="value p-2.5 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatINR(agreement.repayment_amount)}
                  </td>
                </tr>
                <tr className="bg-slate-50 dark:bg-canvas-dark">
                  <td className="label p-2.5 font-bold text-slate-500">Settlement Due Date</td>
                  <td className="value p-2.5 font-extrabold text-ink dark:text-white font-mono">{agreement.due_date}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms & Statutory Governance */}
        <div className="section space-y-2">
          <h3 className="section-title text-xs font-extrabold uppercase tracking-wider text-signal border-b border-slate-200 dark:border-surface-border-dark pb-1">
            Terms &amp; Statutory Governance
          </h3>
          <ol className="terms-list list-decimal pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-medium leading-relaxed">
            <li>
              <strong>Disbursement:</strong> The Lender agrees to disburse the agreed principal amount of <strong>{formatINR(agreement.loan_amount)}</strong> directly to the Borrower via authorized organization settlement channels.
            </li>
            <li>
              <strong>Repayment Obligation:</strong> The Borrower unconditionally undertakes to repay the total repayment amount of <strong>{formatINR(agreement.repayment_amount)}</strong> on or before the due date (<strong>{agreement.due_date}</strong>).
            </li>
            <li>
              <strong>Default &amp; Delay:</strong> Delayed repayment beyond the agreed due date will attract a late penalty fee of 2% flat per billing cycle on the unpaid balance.
            </li>
            <li>
              <strong>Internal Governance:</strong> This transaction is executed as an intra-organization mutual support facility in compliance with Indian Information Technology Act (Section 10A) and relevant organizational credit guidelines.
            </li>
            <li>
              <strong>Jurisdiction:</strong> Both parties submit to the exclusive jurisdiction and dispute resolution mechanisms of the organization and Indian governing laws.
            </li>
          </ol>
        </div>

        {/* Legal Disclaimer & Borrower Declaration Cards */}
        <div className="disclaimer-grid grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Platform Legal Scope Card */}
          <div className="disclaimer-card legal p-3.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200 space-y-1">
            <div className="disclaimer-title flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider">
              <ShieldAlert className="h-3.5 w-3.5" />
              Platform Legal Scope &amp; Disclaimer
            </div>
            <p className="text-[11px] leading-relaxed font-medium">
              This platform solely facilitates internal record-keeping and workflow agreements between organization members. It does not act as a banking institution or NBFC. All lending terms are mutually agreed upon directly between the Lender and Borrower.
            </p>
          </div>

          {/* Borrower Declaration Card */}
          <div className="disclaimer-card declaration p-3.5 rounded-xl border border-blue-300 bg-blue-50 dark:bg-blue-950/20 text-xs text-blue-950 dark:text-blue-200 space-y-1">
            <div className="disclaimer-title flex items-center gap-1.5 text-blue-800 dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-wider">
              <FileCheck2 className="h-3.5 w-3.5" />
              Borrower Declaration &amp; Acceptance
            </div>
            <p className="text-[11px] leading-relaxed font-medium">
              I, the Borrower, confirm that all provided details and verification records are authentic. I accept full legal liability for the timely repayment of the credit amount on or before the due date specified in this Agreement.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
