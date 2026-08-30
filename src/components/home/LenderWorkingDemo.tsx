"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Building2,
  ArrowRight,
  RotateCcw,
  BadgeCheck,
  Check,
  Zap,
  FileCheck2,
  AlertCircle,
} from "lucide-react";

interface SampleLoan {
  id: string;
  applicant: string;
  role: string;
  department: string;
  amount: number;
  tenure: string;
  purpose: string;
  bankStatementVerified: boolean;
  idProofVerified: boolean;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

const INITIAL_LOANS: SampleLoan[] = [
  {
    id: "LN-8092",
    applicant: "Alex Rivera",
    role: "Senior Frontend Engineer",
    department: "Engineering",
    amount: 25000,
    tenure: "30 Days (1 Installment)",
    purpose: "Emergency Family Medical Advance",
    bankStatementVerified: true,
    idProofVerified: true,
    status: "pending",
    submittedAt: "10 mins ago",
  },
  {
    id: "LN-8093",
    applicant: "Priya Sharma",
    role: "Product Design Lead",
    department: "Design",
    amount: 45000,
    tenure: "60 Days (2 Installments)",
    purpose: "Higher Education Certification Pool",
    bankStatementVerified: true,
    idProofVerified: true,
    status: "pending",
    submittedAt: "25 mins ago",
  },
  {
    id: "LN-8094",
    applicant: "David Chen",
    role: "Operations Manager",
    department: "Logistics",
    amount: 30000,
    tenure: "30 Days (1 Installment)",
    purpose: "Home Relocation Emergency Advance",
    bankStatementVerified: true,
    idProofVerified: true,
    status: "pending",
    submittedAt: "1 hour ago",
  },
  {
    id: "LN-8088",
    applicant: "Sarah Jenkins",
    role: "HR Specialist",
    department: "People Ops",
    amount: 50000,
    tenure: "90 Days (3 Installments)",
    purpose: "Medical Advance Pool",
    bankStatementVerified: true,
    idProofVerified: true,
    status: "approved",
    submittedAt: "3 hours ago",
  },
];

export function LenderWorkingDemo() {
  const [loans, setLoans] = useState<SampleLoan[]>(INITIAL_LOANS);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [selectedLoan, setSelectedLoan] = useState<SampleLoan | null>(INITIAL_LOANS[0]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [disbursedPoolTotal, setDisbursedPoolTotal] = useState(1840000);

  const pendingLoans = loans.filter((l) => l.status === "pending");
  const approvedLoans = loans.filter((l) => l.status === "approved");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (id: string) => {
    setActionLoading(id);
    const targetLoan = loans.find((l) => l.id === id);

    setTimeout(() => {
      setLoans((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "approved" as const } : l))
      );
      if (targetLoan) {
        setDisbursedPoolTotal((prev) => prev + targetLoan.amount);
      }
      setActionLoading(null);
      showToast(`🎉 Loan ${id} approved & digital agreement dispatched! Disbursed to ${targetLoan?.applicant}.`);

      // Update selected loan view
      const remainingPending = loans.filter((l) => l.status === "pending" && l.id !== id);
      if (remainingPending.length > 0) {
        setSelectedLoan(remainingPending[0]);
      }
    }, 900);
  };

  const handleReject = (id: string) => {
    setActionLoading(id);
    const targetLoan = loans.find((l) => l.id === id);

    setTimeout(() => {
      setLoans((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "rejected" as const } : l))
      );
      setActionLoading(null);
      showToast(`Loan ${id} for ${targetLoan?.applicant} rejected.`);
    }, 600);
  };

  const handleResetDemo = () => {
    setLoans(INITIAL_LOANS);
    setSelectedLoan(INITIAL_LOANS[0]);
    setDisbursedPoolTotal(1840000);
    setActiveTab("pending");
    showToast("Demo reset to default state.");
  };

  return (
    <section id="lender-demo" className="py-24 px-6 sm:px-12 bg-white dark:bg-canvas-dark text-ink dark:text-white relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-signal-soft text-signal-cobalt dark:bg-signal/20 dark:text-blue-300 text-xs font-bold border border-signal/20">
            <Sparkles className="h-4 w-4 text-signal" />
            <span>Interactive Lender Portal Sandbox</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-ink dark:text-white">
            Experience how Lenders approve loans in seconds
          </h2>

          <p className="text-ink-slate dark:text-slate-300 text-base sm:text-lg leading-relaxed">
            Test the live administrative workflow below. Approve requests, inspect Bank statements, and monitor capital pool metrics in real-time.
          </p>
        </div>

        {/* Live Notification Toast Banner */}
        {toastMessage && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-3 shadow-md">
            <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        )}

        {/* Lender Working Demo Interface Container */}
        <div className="space-y-8">
          {/* Top Bar: Treasury Pool Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-200/80 dark:border-surface-border-dark">
            <div className="p-4 rounded-2xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm space-y-1">
              <span className="text-xs font-semibold text-ink-slate">Total Active Capital Pool</span>
              <p className="text-2xl font-black text-ink dark:text-white">₹50,00,000</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% Intra-Org Fund
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm space-y-1">
              <span className="text-xs font-semibold text-ink-slate">Current Disbursed Total</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{disbursedPoolTotal.toLocaleString("en-IN")}</p>
              <div className="flex items-center gap-1 text-[11px] text-ink-slate font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Automated Payroll Deductions
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm space-y-1">
              <span className="text-xs font-semibold text-ink-slate">Pending Review Queue</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingLoans.length} Applications</p>
              <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-300 font-medium">
                <AlertCircle className="h-3.5 w-3.5" /> Requires Action
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-sm space-y-1">
              <span className="text-xs font-semibold text-ink-slate">Standard Rate Policy</span>
              <p className="text-2xl font-black text-signal">0% Interest</p>
              <div className="flex items-center gap-1 text-[11px] text-signal font-medium">
                <BadgeCheck className="h-3.5 w-3.5" /> Native E-Sign Legal Stamp
              </div>
            </div>
          </div>

          {/* Sandbox Main Area: Queue Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Queue List */}
            <div className="lg:col-span-7 space-y-4">
              {/* Queue Navigation Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-2 ${
                      activeTab === "pending"
                        ? "bg-signal text-white shadow-button"
                        : "bg-white dark:bg-canvas-dark text-ink-slate hover:text-ink dark:hover:text-white border border-slate-200 dark:border-surface-border-dark"
                    }`}
                  >
                    Pending Review ({pendingLoans.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("approved")}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-2 ${
                      activeTab === "approved"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white dark:bg-canvas-dark text-ink-slate hover:text-ink dark:hover:text-white border border-slate-200 dark:border-surface-border-dark"
                    }`}
                  >
                    Approved &amp; Disbursed ({approvedLoans.length})
                  </button>
                </div>

                <button
                  onClick={handleResetDemo}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-canvas-dark text-ink-slate hover:text-ink dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-surface-border-dark shadow-sm"
                  title="Reset Demo State"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Sandbox
                </button>
              </div>

              {/* Loan Item Cards */}
              <div className="space-y-3">
                {(activeTab === "pending" ? pendingLoans : approvedLoans).length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-canvas-dark rounded-2xl border border-slate-200 dark:border-surface-border-dark space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-ink dark:text-white">All pending applications reviewed!</p>
                    <p className="text-xs text-ink-slate">Click &quot;Reset Sandbox&quot; above to try approving again.</p>
                  </div>
                ) : (
                  (activeTab === "pending" ? pendingLoans : approvedLoans).map((loan) => {
                    const isSelected = selectedLoan?.id === loan.id;

                    return (
                      <div
                        key={loan.id}
                        onClick={() => setSelectedLoan(loan)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-white dark:bg-canvas-dark border-signal shadow-md ring-2 ring-signal/20"
                            : "bg-white/80 dark:bg-canvas-dark/60 border-slate-200/80 dark:border-surface-border-dark hover:border-signal/40"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-signal">{loan.id}</span>
                              <h4 className="font-extrabold text-sm text-ink dark:text-white">{loan.applicant}</h4>
                              <span className="text-[11px] text-ink-slate">({loan.department})</span>
                            </div>
                            <p className="text-xs text-ink-slate font-medium">{loan.purpose}</p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{loan.amount.toLocaleString("en-IN")}</p>
                              <p className="text-[11px] text-ink-slate font-semibold">{loan.tenure.split(" ")[0]} Days</p>
                            </div>

                            {loan.status === "pending" ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleApprove(loan.id)}
                                  disabled={actionLoading === loan.id}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                                >
                                  {actionLoading === loan.id ? (
                                    "Approving..."
                                  ) : (
                                    <>
                                      <Check className="h-3.5 w-3.5" /> Approve
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleReject(loan.id)}
                                  disabled={actionLoading === loan.id}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200 dark:border-rose-800/40"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Disbursed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Loan Detail & Pay Slip Inspector Panel */}
            <div className="lg:col-span-5 bg-white dark:bg-canvas-dark border border-slate-200 dark:border-surface-border-dark rounded-2xl p-6 space-y-6 shadow-sm">
              {selectedLoan ? (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-border-dark">
                    <div>
                      <span className="text-[11px] font-extrabold text-signal uppercase tracking-wider">Application Inspection</span>
                      <h3 className="text-lg font-black text-ink dark:text-white">{selectedLoan.applicant}</h3>
                      <p className="text-xs text-ink-slate">{selectedLoan.role}</p>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-surface-dark text-ink dark:text-white text-xs font-extrabold border border-slate-200 dark:border-surface-border-dark">
                      {selectedLoan.id}
                    </span>
                  </div>

                  {/* Loan Parameters Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark space-y-2 text-xs">
                    <div className="flex justify-between text-ink-slate">
                      <span>Requested Credit Amount:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">₹{selectedLoan.amount.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex justify-between text-ink-slate">
                      <span>Repayment Schedule:</span>
                      <strong className="text-ink dark:text-white font-bold">{selectedLoan.tenure}</strong>
                    </div>
                    <div className="flex justify-between text-ink-slate">
                      <span>Interest Rate:</span>
                      <strong className="text-signal font-bold">0.0% (Company Benefit)</strong>
                    </div>
                  </div>

                  {/* Verified Documents Checklist (Highlighting Pay Slip ID Proof) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-slate flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-signal" /> Submitted Identity &amp; Verification
                    </h4>

                    {/* Pay Slip Verification Card */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-ink dark:text-white block">Pay Slip (Salary Proof)</span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Verified Salary &amp; Employment Match
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-500/30">
                        Inspected
                      </span>
                    </div>

                    {/* Government ID Card */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-ink dark:text-white block">Government ID Card (PAN / Aadhaar)</span>
                        <span className="text-[11px] text-ink-slate font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> KYC Identity On Record
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-canvas-dark text-ink dark:text-white font-bold text-[11px] border border-slate-200 dark:border-surface-border-dark">
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* Native Digital Agreement Integration & Decision Controls */}
                  <div className="pt-4 border-t border-slate-100 dark:border-surface-border-dark space-y-3">
                    <div className="flex items-center gap-2 text-xs text-ink-slate">
                      <ShieldCheck className="h-4 w-4 text-signal shrink-0" />
                      <span>Approving triggers automated digital signature agreement delivery to {selectedLoan.applicant}.</span>
                    </div>

                    {selectedLoan.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(selectedLoan.id)}
                          disabled={actionLoading === selectedLoan.id}
                          className="flex-1 py-3 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-button transition-colors"
                        >
                          <Check className="h-4 w-4" /> Approve &amp; Disburse
                        </button>
                        <button
                          onClick={() => handleReject(selectedLoan.id)}
                          disabled={actionLoading === selectedLoan.id}
                          className="py-3 px-4 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 font-extrabold text-xs border border-rose-200 dark:border-rose-800/40 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Approved &amp; Disbursed to Payroll Ledger
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-ink-slate text-xs">
                  Select an application from the queue to inspect details.
                </div>
              )}
            </div>
          </div>

          {/* Sandbox Footer CTA */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-surface-border-dark flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-ink-slate font-medium">
              <Building2 className="h-4 w-4 text-signal" />
              <span>Want full access to organization settings, HRMS sync, and digital agreement templates?</span>
            </div>

            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-full btn-primary text-xs font-bold flex items-center gap-2 shadow-button transition-colors shrink-0"
            >
              <span>Set up your Lender Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
