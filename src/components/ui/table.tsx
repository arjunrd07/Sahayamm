import { cn } from "@/lib/utils";
import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, ReactNode } from "react";
import { Inbox, Download, Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-900 shadow-card">
      <table className={cn("w-full text-sm text-left border-collapse", className)} {...props} />
    </div>
  );
}

export function Thead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-slate-50/90 dark:bg-white/5 border-b border-slate-200/70 dark:border-white/10 sticky top-0 backdrop-blur-md z-10",
        className
      )}
      {...props}
    />
  );
}

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  onSort?: () => void;
}

export function Th({ className, sortable, onSort, children, ...props }: ThProps) {
  const isCenter = className?.includes("text-center");
  const isRight = className?.includes("text-right");

  return (
    <th
      className={cn(
        "text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5 py-4 whitespace-nowrap select-none",
        sortable && "cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          isCenter ? "justify-center" : isRight ? "justify-end" : "justify-start"
        )}
      >
        <span>{children}</span>
        {sortable && <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
      </div>
    </th>
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-t border-slate-100 dark:border-white/5 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5",
        className
      )}
      {...props}
    />
  );
}

export interface TableToolbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  onExport?: () => void;
  action?: ReactNode;
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters,
  onExport,
  action,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 rounded-2xl mb-4 shadow-card">
      <div className="flex flex-1 items-center gap-3 min-w-0">
        {onSearchChange && (
          <div className="w-full sm:max-w-xs">
            <Input
              icon={Search}
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        {filters}
      </div>
      <div className="flex items-center gap-2.5 self-end sm:self-center">
        {onExport && (
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ currentPage, totalPages, totalRecords, onPageChange }: PaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 rounded-b-2xl">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of{" "}
        <span className="font-bold text-slate-900 dark:text-white">{totalPages || 1}</span>
        {totalRecords !== undefined && <span> ({totalRecords} total entries)</span>}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-white/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 shadow-xs">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="font-bold text-base text-slate-900 dark:text-white">{title}</p>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm font-medium leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
