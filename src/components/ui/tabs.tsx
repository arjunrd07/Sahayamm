"use client";

import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-nowrap items-center gap-1 border-b border-surface-border dark:border-surface-border-dark overflow-x-auto no-scrollbar pb-0.5 max-w-full">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer shrink-0",
            value === tab.value
              ? "border-ink dark:border-white text-ink dark:text-white"
              : "border-transparent text-muted hover:text-ink dark:hover:text-white"
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span className="ml-2 text-xs bg-surface dark:bg-white/10 rounded-full px-1.5 py-0.5">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
