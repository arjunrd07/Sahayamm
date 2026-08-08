import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode } from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "card p-6 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-bold text-slate-900 dark:text-white tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed", className)} {...props} />;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  trendLabel?: string;
  secondary?: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  secondary,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("space-y-3.5 relative overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-xs">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
            {description && <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{description}</p>}
          </div>
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border shadow-xs",
              trend.positive !== false
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50"
            )}
          >
            {trend.positive !== false ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        {trendLabel && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{trendLabel}</p>}
        {secondary && <div className="mt-3 text-xs border-t border-slate-100 dark:border-white/5 pt-3">{secondary}</div>}
      </div>
    </Card>
  );
}
