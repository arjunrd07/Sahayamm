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
