import Link from "next/link";
import { Check, ShieldCheck, Sparkles, Building2, Lock, FileText, ArrowRight } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-canvas-dark text-ink dark:text-white flex flex-col font-sans">
      {/* Main Split Screen */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-screen">
        {/* Left Column: Form Area */}
        <div className="w-full lg:w-1/2 px-6 sm:px-12 lg:px-20 py-12 flex flex-col justify-center max-w-xl mx-auto lg:max-w-none">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center justify-between mb-10">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl bg-signal flex items-center justify-center shadow-button transition-transform group-hover:scale-105">
                  <span className="text-white text-xl font-black">S</span>
                </div>
                <span className="font-extrabold text-2xl text-ink dark:text-white tracking-tight">Sahayam</span>
              </Link>
              <ThemeToggle />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink dark:text-white mb-3">
              {title}
            </h1>
            <p className="text-base text-ink-slate dark:text-ink-mist mb-8 leading-relaxed">
              {subtitle}
            </p>

            {children}
          </div>
        </div>

        {/* Right Column: Feature List & Preview Panel (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#f8fafc] dark:bg-surface-dark/70 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-surface-border-dark px-8 sm:px-12 lg:px-16 py-12 flex-col justify-center relative overflow-hidden">
          {/* Accent Blobs */}
          <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-purple-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-lg mx-auto w-full space-y-8 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-signal-soft text-signal-cobalt text-xs font-bold mb-4 border border-signal/20">
                Try Sahayam
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight leading-snug">
                Workplace community financial assistance documentation and management platform
              </h2>
            </div>

            {/* Checkmark List with Signal Blue icons */}
            <ul className="space-y-4 text-sm sm:text-base text-ink-slate dark:text-ink-mist font-semibold">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-signal text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Member ID verification & employment proof review</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-signal text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Simple interest calculation with zero hidden fees</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-signal text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Digital loan agreement e-signatures with audit logs</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-signal text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Disbursal & repayment tracking with proof upload</span>
              </li>
            </ul>

            {/* Floating Card Widget Preview over Gradient background (matching reference image style) */}
            <div className="relative pt-2">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 via-signal/20 to-cyan-500/20 rounded-3xl blur-xl -z-10" />
              <div className="bg-white dark:bg-canvas-dark rounded-2xl p-6 shadow-elevated border border-slate-200/90 dark:border-surface-border-dark space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-border-dark">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-signal-soft text-signal flex items-center justify-center font-bold">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink dark:text-white">TechCorp Workspace</p>
                      <p className="text-xs text-ink-slate">100% Verified Org Pool</p>
                    </div>
                  </div>
                  <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" /> Active Workspace
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-surface-border-dark">
                    <p className="text-xs text-ink-slate font-medium">Available Credit Limit</p>
                    <p className="text-lg font-extrabold text-ink dark:text-white mt-0.5">₹1,00,000</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-surface-border-dark">
                    <p className="text-xs text-ink-slate font-medium">Agreement</p>
                    <p className="text-xs font-bold text-signal flex items-center gap-1 mt-1">
                      <FileText className="h-3.5 w-3.5" /> Sahayam E-Sign Verified
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-ink-slate pt-2 font-medium">
              Trusted by leading organizations using Sahayam for intra-company lending.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

