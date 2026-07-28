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
    <div className="flex flex-wrap items-center gap-1 border-b border-surface-border dark:border-surface-border-dark overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer",
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
