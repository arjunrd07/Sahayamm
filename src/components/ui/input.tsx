import { cn } from "@/lib/utils";
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2, LucideIcon } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: boolean | string;
  success?: boolean;
  loading?: boolean;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon: Icon, error, success, loading, rightElement, disabled, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled || loading}
          className={cn(
            "w-full min-h-[46px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-white/5",
            Icon && "pl-11",
            (error || success || loading || rightElement) && "pr-11",
            error && "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 dark:border-rose-500",
            success && "border-emerald-500 focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-emerald-500",
            className
          )}
          {...props}
        />
        <div className="absolute right-4 flex items-center gap-1.5 pointer-events-none">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />}
          {error && !loading && <AlertCircle className="h-4 w-4 text-rose-500" />}
          {success && !loading && !error && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {rightElement && !loading && !error && !success && rightElement}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, disabled, ...props }, ref) => (
    <textarea
      ref={ref}
      disabled={disabled}
      className={cn(
        "w-full min-h-[100px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs resize-none disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, disabled, ...props }, ref) => (
    <select
      ref={ref}
      disabled={disabled}
      className={cn(
        "w-full min-h-[46px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-xs cursor-pointer disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor={htmlFor}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      </div>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{hint}</p>}
      {error && <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
}
