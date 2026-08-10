"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  Building2,
  Bell,
  Settings,
  PlusCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Command as CommandIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Admin" | "Superadmin" | "Lender" | "Borrower";
  href?: string;
  onSelect?: () => void;
  icon: any;
  shortcut?: string;
}

const defaultCommands: CommandItem[] = [
  { id: "dash-b", title: "Borrower Dashboard", category: "Borrower", href: "/borrower/dashboard", icon: LayoutDashboard },
  { id: "req-b", title: "Request New Loan", category: "Borrower", href: "/borrower/request", icon: PlusCircle, shortcut: "N" },
  { id: "verif-b", title: "Verification Status", category: "Borrower", href: "/borrower/verification", icon: ShieldCheck },
  { id: "notif-b", title: "Borrower Notifications", category: "Borrower", href: "/borrower/notifications", icon: Bell },
  { id: "set-b", title: "Borrower Settings", category: "Borrower", href: "/borrower/settings", icon: Settings },
  { id: "dash-l", title: "Lender Overview", category: "Lender", href: "/lender/dashboard", icon: LayoutDashboard },
  { id: "loans-l", title: "Manage Active Loans", category: "Lender", href: "/lender/active", icon: FileText },
  { id: "verif-l", title: "Identity Verifications", category: "Lender", href: "/lender/verifications", icon: ShieldCheck },
  { id: "reports-l", title: "Capital Pool Reports", category: "Lender", href: "/lender/reports", icon: FileText },
  { id: "dash-sa", title: "Admin Portal", category: "Admin", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { id: "users-sa", title: "Platform Users", category: "Admin", href: "/superadmin/users", icon: Users },
  { id: "orgs-sa", title: "Organizations", category: "Admin", href: "/superadmin/organizations", icon: Building2 },
  { id: "agree-sa", title: "Legal Agreements", category: "Admin", href: "/superadmin/agreements", icon: FileText },
  { id: "audit-sa", title: "Security Audit Logs", category: "Admin", href: "/superadmin/audit", icon: Clock },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return defaultCommands;
    const q = query.toLowerCase();
    return defaultCommands.filter(
      (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeItem = (item: CommandItem) => {
    setOpen(false);
    setQuery("");
    if (item.href) {
      router.push(item.href);
    } else if (item.onSelect) {
      item.onSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      executeItem(filteredCommands[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
        onClick={() => setOpen(false)}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-elevated overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search loans, organizations, users, verifications... (Press Esc to exit)"
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold select-none",
                    isSelected
                      ? "bg-blue-600 text-white shadow-button"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg shrink-0",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate text-sm font-bold">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-white/10 text-slate-400"
                      )}
                    >
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="h-3.5 w-3.5 text-white" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Command Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-mono text-[10px] text-slate-600 dark:text-slate-300">↑</kbd><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-mono text-[10px] text-slate-600 dark:text-slate-300">↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-mono text-[10px] text-slate-600 dark:text-slate-300">↵</kbd> Select</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
            <Sparkles className="h-3 w-3" /> Press Esc to close
          </div>
        </div>
      </div>
    </div>
  );
}
