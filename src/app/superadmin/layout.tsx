"use client";

import { AppShell } from "@/components/layout/app-shell";
import { superadminNav } from "@/lib/nav";

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell navItems={superadminNav}>{children}</AppShell>;
}
