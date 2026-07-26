"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Show top 4 nav items in bottom bar for quick thumbtip access
  const displayItems = items.slice(0, 4);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-canvas-dark/95 backdrop-blur-md border-t border-slate-200/90 dark:border-surface-border-dark px-3 py-1.5 flex items-center justify-around shadow-lg">
      {displayItems.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-150 min-w-[64px]",
              active
                ? "text-signal font-bold"
                : "text-ink-slate hover:text-ink dark:hover:text-white"
            )}
          >
            <div className={cn("p-1 rounded-lg transition-colors", active ? "bg-signal-soft dark:bg-white/10" : "")}>
              <Icon className={cn("h-5 w-5", active ? "text-signal dark:text-white" : "text-ink-mist")} />
            </div>
            <span className="text-[10px] font-semibold tracking-tight truncate max-w-[64px]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
