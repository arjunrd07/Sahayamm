import { cn } from "@/lib/utils";
import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Inbox } from "lucide-react";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto no-scrollbar rounded-lg border border-slate-200/60 dark:border-white/10 bg-white dark:bg-surface-dark shadow-card">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Thead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 sticky top-0", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("text-left text-xs font-semibold uppercase tracking-wider text-ink-slate dark:text-slate-400 px-5 py-4 whitespace-nowrap", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-5 py-4 whitespace-nowrap text-sm font-medium text-ink dark:text-slate-200", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-t border-slate-100 dark:border-white/5 transition-colors hover:bg-slate-50/60 dark:hover:bg-white/5",
        className
      )}
      {...props}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="h-14 w-14 rounded-2xl bg-primary-soft dark:bg-white/10 flex items-center justify-center mb-4 text-primary shadow-xs">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="font-bold text-base text-ink dark:text-white">{title}</p>
      {description && <p className="text-xs text-ink-slate dark:text-slate-400 mt-1 max-w-sm font-medium">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
