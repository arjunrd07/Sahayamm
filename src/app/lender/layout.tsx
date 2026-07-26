"use client";

import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/lib/nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell navItems={adminNav}>{children}</AppShell>;
}
