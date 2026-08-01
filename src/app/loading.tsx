import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-canvas-dark text-ink dark:text-white transition-colors duration-150">
      <div className="flex flex-col items-center gap-4">
        {/* Brand Icon with Pulsing Halo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-3 bg-signal/20 rounded-2xl blur-lg animate-pulse" />
          <div className="h-12 w-12 rounded-2xl bg-signal flex items-center justify-center shadow-button relative z-10">
            <span className="text-white text-2xl font-black">S</span>
          </div>
        </div>

        {/* Loading Spinner and Status Text */}
        <div className="flex items-center gap-2.5 mt-2">
          <Loader2 className="h-5 w-5 text-signal animate-spin" />
          <span className="text-sm font-bold text-ink-slate tracking-wide">Loading Sahayam...</span>
        </div>
      </div>
    </div>
  );
}


