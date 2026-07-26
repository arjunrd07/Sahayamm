"use client";

import { AppShell } from "@/components/layout/app-shell";
import { customerNav } from "@/lib/nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell navItems={customerNav}>{children}</AppShell>;
}
