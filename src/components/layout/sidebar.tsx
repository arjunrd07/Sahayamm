"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";
import { useAuth } from "@/context/auth-context";
import { LogOut } from "lucide-react";

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-surface-border dark:border-surface-border-dark h-screen sticky top-0 px-4 py-5">
      <Link href="/" className="flex items-center gap-2 px-2 mb-6">
        <div className="h-7 w-7 rounded-lg bg-ink dark:bg-white flex items-center justify-center">
          <span className="text-white dark:text-ink text-sm font-bold">S</span>
        </div>
        <span className="font-semibold">Sahayam</span>
      </Link>

      <nav className="flex-1 space-y-0.5">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-surface dark:bg-white/10 text-ink dark:text-white"
                  : "text-muted hover:bg-surface/60 dark:hover:bg-white/5 hover:text-ink dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="border-t border-surface-border dark:border-surface-border-dark pt-4 mt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-semibold shrink-0">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-xs text-muted truncate capitalize">{profile.role}</p>
            </div>
            <button
              onClick={signOut}
              className="ml-auto text-muted hover:text-danger p-1.5 rounded-lg"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
