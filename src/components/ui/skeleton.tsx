import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text";
}

export function Skeleton({ className, variant = "rectangular", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200/80 dark:bg-slate-800/80 transition-colors",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 rounded-md w-3/4 my-1",
        variant === "rectangular" && "rounded-xl",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card p-6 flex flex-col gap-4 border border-slate-200/90 dark:border-slate-800/80", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" variant="rectangular" />
        <Skeleton className="h-9 w-9 rounded-xl" variant="rectangular" />
      </div>
      <Skeleton className="h-8 w-36 my-1" variant="rectangular" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-16" variant="rectangular" />
        <Skeleton className="h-3.5 w-24" variant="rectangular" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden border border-slate-200/90 dark:border-slate-800/80">
      {/* Table Header */}
      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-10 w-10 shrink-0" variant="circular" />
              <div className="space-y-2 flex-1 max-w-xs">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Content Area / Main Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <SkeletonTable rows={4} />
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="card p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonHomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-canvas-dark text-ink dark:text-white flex flex-col font-sans animate-fade-in">
      {/* 0. Top Interactive Evaluator Demo Banner Skeleton */}
      <div className="bg-slate-900 py-2.5 px-4 border-b border-blue-900/50">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full bg-blue-400/60" />
            <Skeleton className="h-5 w-28 rounded-full bg-slate-800" />
            <Skeleton className="h-4 w-48 bg-slate-800 hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-lg bg-slate-800" />
            <Skeleton className="h-6 w-20 rounded-lg bg-slate-800" />
            <Skeleton className="h-6 w-24 rounded-lg bg-slate-800" />
          </div>
        </div>
      </div>

      {/* 1. Header Navigation Skeleton */}
      <header className="sticky top-0 z-50 bg-white dark:bg-canvas-dark border-b border-slate-200 dark:border-surface-border-dark px-6 sm:px-12 py-4">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-6 w-28" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full hidden sm:block" />
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
        </div>
      </header>

      {/* 2. Hero Section Skeleton */}
      <section className="relative pt-12 sm:pt-20 pb-20 px-6 sm:px-12">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Skeleton */}
          <div className="lg:col-span-6 space-y-6">
            <Skeleton className="h-7 w-72 rounded-full" />

            <div className="space-y-3">
              <Skeleton className="h-12 sm:h-14 w-full" />
              <Skeleton className="h-12 sm:h-14 w-4/5" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Skeleton className="h-12 w-48 rounded-full" />
              <Skeleton className="h-12 w-44 rounded-full" />
            </div>

            <Skeleton className="h-4 w-80 pt-2" />
          </div>

          {/* Right Hero Calculator Skeleton */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-surface-border-dark rounded-3xl p-6 sm:p-8 space-y-6 shadow-elevated">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-border-dark">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-2xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full rounded-lg" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-9 rounded-xl" />
                    <Skeleton className="h-9 rounded-xl" />
                    <Skeleton className="h-9 rounded-xl" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-canvas-dark border border-slate-100 dark:border-surface-border-dark space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200/80 dark:border-surface-border-dark">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-11 rounded-full" />
                  <Skeleton className="h-11 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Showcase Cards Skeleton */}
      <section className="py-16 px-6 sm:px-12 bg-slate-50/70 dark:bg-surface-dark/30 border-t border-slate-100 dark:border-surface-border-dark">
        <div className="max-w-[1240px] mx-auto text-center space-y-6">
          <Skeleton className="h-8 w-96 mx-auto" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-surface-border-dark flex flex-col items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

