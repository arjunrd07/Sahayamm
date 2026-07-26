"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  FileText, 
  Percent, 
  Calendar, 
  ArrowUpRight, 
  Building2, 
  Copy, 
  Mail, 
  CheckCircle2, 
  Lock, 
  Zap, 
  Clock, 
  Users,
  ChevronDown
} from "lucide-react";

const SWITCHBACK_ITEMS = [
  {
    id: "connect",
    title: "Connect your organization & calendars",
    description: "Sahayam syncs directly with your HRMS database, Google Workspace, and Microsoft Outlook to verify employee credit pools automatically.",
    color: "#006BFF",
    badgeBg: "bg-[#E6F0FF] text-[#006BFF]",
    borderActive: "border-[#006BFF]",
    icon: (active: boolean) => (
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${active ? "bg-[#006BFF] text-white shadow-md scale-105" : "bg-[#E6F0FF] text-[#006BFF]"}`}>
        <Building2 className="h-5 w-5" />
      </div>
    ),
  },
  {
    id: "availability",
    title: "Add loan availability & interest policies",
    description: "Keep employees informed of available pool funds. Take full control of lending limits, 0% interest policies, and approval thresholds.",
    color: "#8247F5",
    badgeBg: "bg-[#F3EBFD] text-[#8247F5]",
    borderActive: "border-[#8247F5]",
    icon: (active: boolean) => (
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${active ? "bg-[#8247F5] text-white shadow-md scale-105" : "bg-[#F3EBFD] text-[#8247F5]"}`}>
        <Percent className="h-5 w-5" />
      </div>
    ),
  },
  {
    id: "docuseal",
    title: "Connect DocuSeal digital signatures",
    description: "Sync e-signature agreements automatically. Every loan includes legally binding digital signatures with timestamped compliance audit logs.",
    color: "#BB32D5",
    badgeBg: "bg-[#FDF0FF] text-[#BB32D5]",
    borderActive: "border-[#BB32D5]",
    icon: (active: boolean) => (
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${active ? "bg-[#BB32D5] text-white shadow-md scale-105" : "bg-[#FDF0FF] text-[#BB32D5]"}`}>
        <FileText className="h-5 w-5" />
      </div>
    ),
  },
  {
    id: "event_types",
    title: "Customize your loan event types",
    description: "Configure One-on-One Emergency Advances, Department Pooled Funds, and Round-Robin Approval queues with automated payroll deduction.",
    color: "#FFA600",
    badgeBg: "bg-[#FFF8E6] text-[#FFA600]",
    borderActive: "border-[#FFA600]",
    icon: (active: boolean) => (
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${active ? "bg-[#FFA600] text-white shadow-md scale-105" : "bg-[#FFF8E6] text-[#FFA600]"}`}>
        <Calendar className="h-5 w-5" />
      </div>
    ),
  },
  {
    id: "share",
    title: "Share your loan request link",
    description: "Easily request emergency funds by sharing customized application links directly with your organization admins for instant approval.",
    color: "#004EBA",
    badgeBg: "bg-[#EBF3FF] text-[#004EBA]",
    borderActive: "border-[#004EBA]",
    icon: (active: boolean) => (
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${active ? "bg-[#004EBA] text-white shadow-md scale-105" : "bg-[#EBF3FF] text-[#004EBA]"}`}>
        <ArrowUpRight className="h-5 w-5" />
      </div>
    ),
  },
];

export function FeatureSwitchback() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  // Auto switch active tab every 7 seconds if user doesn't manually click
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % SWITCHBACK_ITEMS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="features" className="py-24 px-6 sm:px-12 bg-white dark:bg-black">
      <div className="max-w-[1240px] mx-auto">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0B3558] dark:text-white leading-[1.12]">
            Sahayam makes lending simple
          </h2>
          <p className="text-[#476788] dark:text-slate-300 text-lg leading-relaxed">
            Sahayam is easy enough for individual employees, and powerful enough to meet the needs of enterprise organizations — including 86% of leading companies.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#006BFF] text-white font-extrabold text-sm hover:bg-[#0052cc] transition-all shadow-[0_4px_20px_rgba(0,107,255,0.25)]"
            >
              <span>Sign up for free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Switchback Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Accordion Column */}
          <div className="lg:col-span-5 space-y-3">
            {SWITCHBACK_ITEMS.map((item, index) => {
              const isActive = index === activeTab;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(index)}
                  className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? `bg-white dark:bg-[#0a0a0a] ${item.borderActive} shadow-[0_8px_24px_rgba(0,0,0,0.08)] scale-[1.02]`
                      : "bg-[#F4F8FF]/60 dark:bg-surface-dark/40 border-[#D4E0ED]/60 dark:border-surface-border-dark hover:border-[#006BFF]/40"
                  }`}
                >
                  {/* Progress Line for Active Tab */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl bg-[#006BFF] overflow-hidden">
                      <div className="h-full bg-[#006BFF] animate-pulse" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {item.icon(isActive)}
                      <h3 className="font-extrabold text-lg sm:text-xl text-[#0B3558] dark:text-white leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-[#476788] transition-transform duration-300 shrink-0 ${isActive ? "rotate-180 text-[#006BFF]" : ""}`} />
                  </div>

                  {isActive && (
                    <p className="mt-3 text-sm text-[#476788] dark:text-slate-300 pl-13 leading-relaxed font-medium transition-opacity duration-300">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Product UI Illustration Mockup Display */}
          <div className="lg:col-span-7 relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-[#006BFF]/15 via-[#8247F5]/15 to-[#BB32D5]/15 rounded-[48px] blur-3xl -z-10 pointer-events-none" />

            <div className="bg-white dark:bg-[#0a0a0a] border border-[#D4E0ED] dark:border-surface-border-dark rounded-3xl p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.4)] min-h-[460px] flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between pb-6 border-b border-[#D4E0ED]/80 dark:border-surface-border-dark">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#006BFF] text-white flex items-center justify-center font-black shadow-md">
                    S
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-[#0B3558] dark:text-white">TechCorp Credit Workspace</h4>
                    <p className="text-xs text-[#476788] dark:text-slate-400">Verified HRMS & Organization Sync</p>
                  </div>
                </div>

                <span className="badge bg-[#E6F0FF] text-[#006BFF] font-extrabold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Active Pool
                </span>
              </div>

              {/* Dynamic UI Illustration Content for Active Tab */}
              <div className="py-6 my-auto space-y-5">
                {activeTab === 0 && (
                  /* Screen 1: Connect Organization & Calendars */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-4 rounded-2xl bg-[#F4F8FF] dark:bg-canvas-dark border border-[#D4E0ED] dark:border-surface-border-dark flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark flex items-center justify-center shadow-sm">
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-[#0B3558] dark:text-white">Google Workspace Roster</p>
                          <p className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 142 Active Employees Synced
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#E6F0FF] text-[#006BFF] text-xs font-extrabold">Connected</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F8FF] dark:bg-canvas-dark border border-[#D4E0ED] dark:border-surface-border-dark flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark flex items-center justify-center shadow-sm">
                          <svg className="h-5 w-5" viewBox="0 0 23 23">
                            <path fill="#f35325" d="M1 1h10v10H1z" />
                            <path fill="#81bc06" d="M12 1h10v10H1z" />
                            <path fill="#05a6f0" d="M1 12h10v10H1z" />
                            <path fill="#ffba08" d="M12 12h10v10H1z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-[#0B3558] dark:text-white">Microsoft 365 Azure AD</p>
                          <p className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> SSO Single Sign-On Verified
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#E6F0FF] text-[#006BFF] text-xs font-extrabold">Connected</span>
                    </div>
                  </div>
                )}

                {activeTab === 1 && (
                  /* Screen 2: Add Loan Availability & Interest Policies */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-5 rounded-2xl bg-[#F4F8FF] dark:bg-canvas-dark border border-[#D4E0ED] dark:border-surface-border-dark">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold text-[#476788] uppercase tracking-wider">Available Emergency Pool</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold">0% Interest Verified</span>
                      </div>
                      <p className="text-4xl font-black text-[#0B3558] dark:text-white">₹1,50,000</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-white dark:bg-surface-dark border-2 border-[#8247F5] shadow-sm">
                        <p className="text-xs font-extrabold text-[#8247F5]">30 Days</p>
                        <p className="text-[11px] text-[#476788] font-bold">1 Installment</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-[#D4E0ED] dark:border-surface-border-dark">
                        <p className="text-xs font-extrabold text-[#0B3558] dark:text-white">60 Days</p>
                        <p className="text-[11px] text-[#476788] font-bold">2 Installments</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-[#D4E0ED] dark:border-surface-border-dark">
                        <p className="text-xs font-extrabold text-[#0B3558] dark:text-white">90 Days</p>
                        <p className="text-[11px] text-[#476788] font-bold">3 Installments</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 2 && (
                  /* Screen 3: DocuSeal Digital Signatures */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-[#D4E0ED] dark:border-surface-border-dark shadow-sm space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-border-dark">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-[#BB32D5]" />
                          <span className="text-sm font-extrabold text-[#0B3558] dark:text-white">DocuSeal Agreement #SL-9941</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-[#BB32D5] text-xs font-extrabold">Legal Signature</span>
                      </div>

                      <div className="space-y-2 text-xs font-medium text-[#476788] dark:text-slate-300">
                        <div className="flex justify-between">
                          <span>Borrower Employee:</span>
                          <strong className="text-[#0B3558] dark:text-white font-extrabold">Sarah Jenkins</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>DocuSeal Signature Hash:</span>
                          <strong className="font-mono text-[11px] text-[#BB32D5]">0x88f92a1...4901b</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Compliance Audit Log:</span>
                          <strong className="text-emerald-600 font-extrabold">Verified & Timestamped</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 3 && (
                  /* Screen 4: Customize Loan Event Types */
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-300">
                    <div className="p-4 rounded-2xl bg-[#FFF8E6] dark:bg-surface-dark border-2 border-[#FFA600] space-y-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFA600] text-white text-[10px] font-extrabold uppercase">One-on-One</span>
                      <h5 className="font-extrabold text-sm text-[#0B3558] dark:text-white">Emergency Advance</h5>
                      <p className="text-xs text-[#476788]">Up to ₹50,000 • 30 Day Term</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#E6F0FF] dark:bg-surface-dark border border-[#D4E0ED] space-y-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#006BFF] text-white text-[10px] font-extrabold uppercase">Collective</span>
                      <h5 className="font-extrabold text-sm text-[#0B3558] dark:text-white">Department Pool</h5>
                      <p className="text-xs text-[#476788]">Up to ₹2,00,000 • Multi-Admin</p>
                    </div>
                  </div>
                )}

                {activeTab === 4 && (
                  /* Screen 5: Share Loan Request Link */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-4 rounded-2xl bg-[#F4F8FF] dark:bg-canvas-dark border border-[#D4E0ED] dark:border-surface-border-dark space-y-3">
                      <label className="text-xs font-extrabold text-[#0B3558] dark:text-white block">
                        Your Custom Loan Application Link
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="https://sahayam.com/request/techcorp-alex"
                          className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#006BFF]"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="px-4 py-2.5 rounded-xl bg-[#006BFF] text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 hover:bg-[#0052cc] transition-colors"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span>{copied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">Instant Admin Notification</p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Sent directly to TechCorp Admin Queue</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">Ready</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Footer Ribbon of Product UI Screen */}
              <div className="pt-4 border-t border-[#D4E0ED]/80 dark:border-surface-border-dark flex items-center justify-between text-xs text-[#476788] font-bold">
                <span>Row Level Security (RLS) Protected</span>
                <span className="text-[#006BFF] flex items-center gap-1 hover:underline cursor-pointer">
                  View interactive demo →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
