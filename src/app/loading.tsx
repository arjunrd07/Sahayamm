import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-canvas dark:bg-canvas-dark text-ink dark:text-white transition-colors duration-300 relative overflow-hidden selection:bg-primary/20">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-primary/15 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

      {/* Subtle Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] dark:opacity-[0.08] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6 p-8 rounded-3xl bg-white/60 dark:bg-surface-dark/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-xl shadow-card transition-all duration-300">
        {/* Brand Icon Badge with Pulsing Ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-3 bg-gradient-to-tr from-primary via-blue-500 to-indigo-600 rounded-3xl blur-md opacity-40 animate-pulse" />
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary via-blue-600 to-indigo-600 flex items-center justify-center shadow-button shadow-primary/30 relative z-10 border border-white/20">
            <span className="text-white text-2xl font-black tracking-tight drop-shadow-md">S</span>
          </div>
        </div>

        {/* Loading Spinner & Status Text */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Loader2 className="h-4 w-4 text-primary dark:text-blue-400 animate-spin" />
            <span className="text-sm font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary to-slate-700 dark:from-white dark:via-blue-300 dark:to-slate-300">
              Loading Sahayam...
            </span>
          </div>

          {/* Shimmering Progress Bar */}
          <div className="w-36 h-1 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-primary to-transparent w-full animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}



