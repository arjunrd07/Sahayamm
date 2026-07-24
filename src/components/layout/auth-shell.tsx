import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

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
    <div className="min-h-screen bg-white dark:bg-canvas-dark text-ink dark:text-white flex flex-col">
      {/* Main Split Screen */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-screen">
        {/* Left Column: Form Area */}
        <div className="w-full lg:w-1/2 px-6 sm:px-12 lg:px-16 py-12 flex flex-col justify-center max-w-xl mx-auto lg:max-w-none">
          <div className="max-w-md mx-auto w-full">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="h-9 w-9 rounded-lg bg-signal flex items-center justify-center shadow-button">
                <span className="text-white text-base font-bold">S</span>
              </div>
              <span className="font-bold text-2xl text-ink dark:text-white tracking-tight">Sahayam</span>
            </Link>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-white mb-2">
              {title}
            </h1>
            <p className="text-base text-ink-slate dark:text-ink-mist mb-8">
              {subtitle}
            </p>

            {children}
          </div>
        </div>

        {/* Right Column: Feature List & Image Panel */}
        <div className="w-full lg:w-1/2 bg-[#f8f9fb] dark:bg-surface-dark border-t lg:border-t-0 lg:border-l border-surface-border dark:border-surface-border-dark px-8 sm:px-12 lg:px-16 py-12 flex flex-col justify-center relative overflow-hidden">
          <div className="max-w-lg mx-auto w-full space-y-8">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-signal-soft text-signal-cobalt text-xs font-semibold mb-6">
                Try Sahayam
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink dark:text-white tracking-tight leading-snug">
                Explore transparent internal lending features for your team
              </h2>
            </div>

            {/* Checkmark List */}
            <ul className="space-y-4 text-sm sm:text-base text-ink-slate dark:text-ink-mist font-medium">
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-signal-soft text-signal flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Member ID verification & employment proof review</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-signal-soft text-signal flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Simple interest calculation with zero hidden fees</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-signal-soft text-signal flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Digital loan agreement signatures via DocuSeal</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-signal-soft text-signal flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Disbursal & repayment tracking with proof upload</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-signal-soft text-signal flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                <span>Export CSV audit reports for organization accounting</span>
              </li>
            </ul>

            {/* Preview Banner Image on Right */}
            <div className="relative pt-4">
              <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden shadow-elevated border border-surface-border dark:border-surface-border-dark bg-white dark:bg-canvas-dark">
                <Image
                  src="/sahayam_preview_banner.png"
                  alt="Sahayam Lending Platform Preview"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <p className="text-xs text-center text-ink-mist pt-2 font-medium">
              Join leading organizations using Sahayam for intra-company lending.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
