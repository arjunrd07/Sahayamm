import { cn } from "@/lib/utils";
import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Inbox } from "lucide-react";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto no-scrollbar rounded-2xl border border-surface-border dark:border-surface-border-dark">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Thead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface dark:bg-white/5", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("text-left font-medium text-muted px-4 py-3 whitespace-nowrap", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 whitespace-nowrap", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-t border-surface-border dark:border-surface-border-dark hover:bg-surface/60 dark:hover:bg-white/5",
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
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-12 w-12 rounded-full bg-surface dark:bg-white/5 flex items-center justify-center mb-4">
        <Inbox className="h-5 w-5 text-muted" />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
