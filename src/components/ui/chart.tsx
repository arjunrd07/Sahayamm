"use client";

import { cn } from "@/lib/utils";

export interface MiniSparklineProps {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
}

export function MiniSparkline({ data, height = 36, color = "#2563eb", className }: MiniSparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    </div>
  );
}

export interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  className?: string;
}

export function SimpleBarChart({ data, maxValue, className }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value)) || 1;

  return (
    <div className={cn("space-y-2.5 w-full", className)}>
      {data.map((item, idx) => {
        const percentage = Math.round((item.value / max) * 100);
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", item.color || "bg-blue-600")}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
