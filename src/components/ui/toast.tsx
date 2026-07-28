"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

import { AnimatedListItem } from "@/components/ui/animated-list";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<{ push: (kind: ToastKind, message: string) => void } | null>(
  null
);

const icon: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />,
  error: <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />,
  info: <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-16 right-4 sm:right-6 z-[100] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <AnimatedListItem key={t.id}>
            <div
              className={cn(
                "card pointer-events-auto flex items-start gap-3 px-4 py-3.5 shadow-elevated border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark rounded-2xl"
              )}
            >
              {icon[t.kind]}
              <p className="text-xs font-bold text-ink dark:text-white flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}
                className="text-slate-400 hover:text-ink dark:hover:text-white p-0.5 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </AnimatedListItem>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
