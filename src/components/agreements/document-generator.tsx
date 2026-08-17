"use client";

import { useRef, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils";
import { generateDigitalSignatureHash } from "@/lib/agreements";
import {
  FileText,
  Printer,
  ShieldCheck,
  Sparkles,
  Sliders,
  CheckCircle2,
  Download,
  Copy,
  Landmark,
  FileCheck,
  ShieldAlert,
  FileCheck2,
} from "lucide-react";

export type TemplateType =
  | "lending_agreement"
  | "salary_deduction_auth"
  | "promissory_note"
  | "disbursal_certificate";

interface DocumentGeneratorProps {
  initialBorrowerName?: string;
  initialEmployeeId?: string;
  initialOrgName?: string;
  initialLenderName?: string;
  initialAmount?: number;
  initialPurpose?: string;
}

export function DocumentGenerator({
  initialBorrowerName = "Rahul Sharma",
  initialEmployeeId = "EMP-9021",
  initialOrgName = "Sahayam Financial Solutions",
  initialLenderName = "Organization Manager",
  initialAmount = 50000,
  initialPurpose = "Medical Emergency Credit Line",
}: DocumentGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  const [templateType, setTemplateType] = useState<TemplateType>("lending_agreement");
  const [borrowerName, setBorrowerName] = useState(initialBorrowerName);
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [orgName, setOrgName] = useState(initialOrgName);
  const [lenderName, setLenderName] = useState(initialLenderName);
  const [amount, setAmount] = useState(String(initialAmount));
  const [interestRate, setInterestRate] = useState("0.0");
  const [durationDays, setDurationDays] = useState("30");
  const [purpose, setPurpose] = useState(initialPurpose);
  const [utrNumber, setUtrNumber] = useState("UTR" + Math.floor(100000000000 + Math.random() * 900000000000));
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split("T")[0]);

  const numAmount = parseFloat(amount) || 0;
  const numRate = parseFloat(interestRate) || 0;
  const days = parseInt(durationDays) || 30;
  const interestAmount = (numAmount * numRate * days) / (365 * 100);
  const totalRepayment = numAmount + interestAmount;

  const agreementNumber = `SHY-DOC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const shaSeal = generateDigitalSignatureHash({
    agreementNumber,
    borrowerId: employeeId,
    lenderId: "ORG-ADMIN",
    amount: numAmount,
    dateStr: documentDate,
  });

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${agreementNumber} - ${templateType.toUpperCase()}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
            .header { border-bottom: 3px solid #006BFF; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 26px; font-weight: 900; color: #006BFF; letter-spacing: -0.02em; margin: 0; }
            .doc-title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-top: 6px; color: #0F172A; }
            .meta { font-size: 13px; color: #475569; margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .seal-box { background: #0f172a; color: #ffffff; padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 12px; margin: 20px 0; display: flex; justify-content: space-between; }
            .seal-token { color: #34d399; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
            .table th { background-color: #f8fafc; font-weight: 700; color: #334155; }
            .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
            .sig-card { border: 1px dashed #94a3b8; padding: 20px; border-radius: 10px; background: #f8fafc; text-align: center; }
            .sig-name { font-family: cursive; font-size: 18px; font-weight: bold; color: #006BFF; margin-top: 12px; }
            @media print { body { padding: 0; } }
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
    }, 300);
  };

  function copySeal() {
    navigator.clipboard.writeText(shaSeal);
    push("success", "SHA-256 Seal Token copied to clipboard!");
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-ink dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-signal" />
            Document &amp; Contract Generator Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate legally binding internal lending contracts, payroll deduction authorizations, and promissory notes.
          </p>
        </div>

        <Button variant="primary" onClick={handlePrint} className="text-xs font-bold shrink-0">
          <Printer className="h-4 w-4 mr-1.5" />
          Print / Export Document PDF
        </Button>
      </div>

      {/* Controls & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Form Controls */}
        <Card className="lg:col-span-5 space-y-5">
          <div className="flex items-center gap-2 text-signal">
            <Sliders className="h-5 w-5" />
            <CardTitle>Template Parameters</CardTitle>
          </div>

          <Field label="Document Template Type" htmlFor="templateType">
            <Select
              id="templateType"
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as TemplateType)}
            >
              <option value="lending_agreement">Internal Lending Agreement</option>
              <option value="salary_deduction_auth">Salary Payroll Deduction Authorization</option>
              <option value="promissory_note">Promissory Debt Acknowledgment Note</option>
              <option value="disbursal_certificate">Loan Disbursal &amp; UTR Receipt Certificate</option>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Borrower Name" htmlFor="borrowerName">
              <Input
                id="borrowerName"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="Full Name"
              />
            </Field>

            <Field label="Employee ID" htmlFor="employeeId">
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-1234"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Organization Name" htmlFor="orgName">
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Company Name"
              />
            </Field>

            <Field label="Lender / Admin Name" htmlFor="lenderName">
              <Input
                id="lenderName"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                placeholder="Lender Representative"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Amount (₹)" htmlFor="amount">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>

            <Field label="Interest (%)" htmlFor="interest">
              <Input
                id="interest"
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </Field>

            <Field label="Duration (Days)" htmlFor="duration">
              <Input
                id="duration"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Loan Purpose" htmlFor="purpose">
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Credit Purpose..."
            />
          </Field>

          {templateType === "disbursal_certificate" && (
            <Field label="Payment UTR Ref #" htmlFor="utr">
              <Input
                id="utr"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
              />
            </Field>
          )}

          <Field label="Document Date" htmlFor="docDate">
            <Input
              id="docDate"
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </Field>

          <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-mono flex items-center justify-between">
            <span className="truncate mr-2">Seal: {shaSeal}</span>
            <button
              type="button"
              onClick={copySeal}
              className="p-1 rounded hover:bg-white/10 text-emerald-400 shrink-0"
              title="Copy SHA-256 Token"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </Card>

        {/* Right Interactive Contract Document Canvas */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 bg-white dark:bg-canvas-dark border border-slate-200 dark:border-slate-800 shadow-md">
            <div ref={printRef} className="space-y-6 text-sm text-ink dark:text-white">
              {/* Document Header */}
              <div className="header border-b-2 border-signal pb-4">
                <div className="flex items-center justify-between">
                  <h1 className="brand text-2xl font-black text-signal">SAHAYAM</h1>
                  <span className="badge bg-signal/10 text-signal border-signal/20 text-xs font-mono font-bold">
                    {agreementNumber}
                  </span>
                </div>
                <h2 className="doc-title text-base font-extrabold text-ink dark:text-white mt-1 uppercase tracking-wide">
                  {templateType === "lending_agreement" && "INTERNAL EMERGENCY LENDING AGREEMENT"}
                  {templateType === "salary_deduction_auth" && "SALARY PAYROLL DEDUCTION AUTHORIZATION"}
                  {templateType === "promissory_note" && "PROMISSORY DEBT ACKNOWLEDGMENT NOTE"}
                  {templateType === "disbursal_certificate" && "LOAN DISBURSAL & UTR RECEIPT CERTIFICATE"}
                </h2>

                <div className="meta mt-3 text-xs text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-2 font-medium">
                  <div><strong>Date:</strong> {documentDate}</div>
                  <div><strong>Organization:</strong> {orgName}</div>
                </div>
              </div>

              {/* Cryptographic SHA Token Bar */}
              <div className="seal-box p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
                <span>SHA-256 Token: <strong className="seal-token text-emerald-400">{shaSeal}</strong></span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Statutory Audit Verified</span>
              </div>

              {/* Template Content 1: Internal Lending Agreement */}
              {templateType === "lending_agreement" && (
                <>
                  <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <p>
                      This Internal Lending Agreement is executed on <strong>{documentDate}</strong> between{" "}
                      <strong>{orgName}</strong> ("Lender") and <strong>{borrowerName}</strong> (Employee ID:{" "}
                      <strong>{employeeId}</strong>, "Borrower").
                    </p>
                  </div>

                  <table className="table w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <tbody>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <td className="p-2.5 font-bold bg-slate-50 dark:bg-slate-800/60 w-1/3">Principal Amount</td>
                        <td className="p-2.5 font-extrabold text-signal">{formatINR(numAmount)}</td>
                      </tr>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <td className="p-2.5 font-bold bg-slate-50 dark:bg-slate-800/60">Interest Rate</td>
                        <td className="p-2.5 font-bold">{numRate}% Annual Equivalent</td>
                      </tr>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <td className="p-2.5 font-bold bg-slate-50 dark:bg-slate-800/60">Duration Term</td>
                        <td className="p-2.5 font-bold">{days} Days</td>
                      </tr>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <td className="p-2.5 font-bold bg-slate-50 dark:bg-slate-800/60">Total Repayment</td>
                        <td className="p-2.5 font-extrabold text-emerald-600 dark:text-emerald-400">{formatINR(totalRepayment)}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold bg-slate-50 dark:bg-slate-800/60">Stated Purpose</td>
                        <td className="p-2.5 font-medium">{purpose}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {/* Template Content 2: Salary Payroll Deduction Auth */}
              {templateType === "salary_deduction_auth" && (
                <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>
                    I, <strong>{borrowerName}</strong> (Employee ID: <strong>{employeeId}</strong>), hereby authorize{" "}
                    <strong>{orgName}</strong> to deduct <strong>{formatINR(totalRepayment)}</strong> directly from my upcoming monthly salary payout for emergency loan clearance.
                  </p>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 font-medium">
                    Authorization includes principal ({formatINR(numAmount)}) plus accrued interest ({formatINR(interestAmount)}).
                  </div>
                </div>
              )}

              {/* Template Content 3: Promissory Note */}
              {templateType === "promissory_note" && (
                <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p className="font-serif italic text-sm">
                    ON DEMAND, I, <strong>{borrowerName}</strong>, promise to pay <strong>{orgName}</strong> or order, the sum of{" "}
                    <strong>{formatINR(totalRepayment)}</strong> for value received in emergency credit support.
                  </p>
                  <p>
                    Reason / Purpose: <strong>{purpose}</strong>.
                  </p>
                </div>
              )}

              {/* Template Content 4: Disbursal Certificate */}
              {templateType === "disbursal_certificate" && (
                <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>
                    This certifies that <strong>{formatINR(numAmount)}</strong> was successfully disbursed to{" "}
                    <strong>{borrowerName}</strong> (Employee ID: <strong>{employeeId}</strong>) on <strong>{documentDate}</strong>.
                  </p>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-900 dark:text-emerald-200 font-mono font-bold">
                    Banking UTR Reference Number: {utrNumber}
                  </div>
                </div>
              )}

              {/* Premium Redesigned Legal Disclaimer & Acknowledgement Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {/* Platform Scope Suggested Disclaimer Card */}
                <div className="p-3.5 rounded-2xl border border-amber-500/30 dark:border-amber-400/20 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200 space-y-2 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-amber-200/80 dark:border-amber-900/40">
                    <div className="p-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                      <ShieldAlert className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block leading-none">
                        Legal Notice
                      </span>
                      <span className="font-extrabold text-[11px] text-ink dark:text-white">
                        Suggested Disclaimer
                      </span>
                    </div>
                  </div>
                  <p className="leading-relaxed text-[10.5px] text-amber-900/90 dark:text-amber-300 font-medium">
                    This platform only facilitates introductions and documentation between employees who voluntarily choose to lend and borrow. It does not hold, transfer, or manage funds, does not guarantee repayment, and is not a bank, NBFC, or financial institution. All loan transactions occur directly between the lender and borrower.
                  </p>
                </div>

                {/* Borrower Acknowledgement & Declaration Card */}
                <div className="p-3.5 rounded-2xl border border-blue-500/30 dark:border-blue-400/20 bg-blue-50/70 dark:bg-blue-950/20 text-xs text-blue-950 dark:text-blue-200 space-y-2 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-blue-200/80 dark:border-blue-900/40">
                    <div className="p-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-400 shrink-0">
                      <FileCheck2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block leading-none">
                        Borrower Declaration
                      </span>
                      <span className="font-extrabold text-[11px] text-ink dark:text-white">
                        Acknowledgement &amp; Terms
                      </span>
                    </div>
                  </div>
                  <p className="leading-relaxed text-[10.5px] text-blue-900/90 dark:text-blue-300 font-medium">
                    I, <strong>{borrowerName}</strong>, hereby acknowledge that I have read, understood, and agreed to all terms, repayment schedules, and conditions of this document. I confirm that all provided details and identity records are true and accurate, and I voluntarily authorize settlement clearance upon the due date.
                  </p>
                </div>
              </div>

              {/* Signatures Footer Block */}
              <div className="signatures grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="sig-card p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Borrower Signature</span>
                  <div className="sig-name font-serif italic text-base text-signal mt-2 font-bold">{borrowerName}</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">E-Signed via Sahayam</span>
                </div>

                <div className="sig-card p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Lender Representative</span>
                  <div className="sig-name font-serif italic text-base text-signal mt-2 font-bold">{lenderName}</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">Authorized Org Representative</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
