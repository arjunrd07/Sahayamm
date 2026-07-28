"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-canvas-dark text-ink dark:text-white flex items-center justify-center p-4 transition-colors duration-150">
      <div className="max-w-xl w-full text-center space-y-8 py-12">
        {/* Clean 404 Visual */}
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-9xl sm:text-[11rem] font-black tracking-tighter bg-gradient-to-r from-signal via-indigo-600 to-sky-500 bg-clip-text text-transparent drop-shadow-sm select-none leading-none">
            404
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-3 px-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white">
            Lost in the Sahayam Workspace?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            The page or resource you are looking for doesn't exist, has been moved, or requires elevated privileges.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 px-4">
          <button
            onClick={() => router.back()}
            className="btn btn-secondary flex items-center gap-2 text-sm px-5 py-2.5 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            href="/"
            className="btn btn-primary flex items-center gap-2 text-sm px-6 py-2.5"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
