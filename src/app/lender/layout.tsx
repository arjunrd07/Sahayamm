"use client";

import { AppShell } from "@/components/layout/app-shell";
import { lenderNav } from "@/lib/nav";

export default function LenderLayout({ children }: { children: React.ReactNode }) {
  return <AppShell navItems={lenderNav}>{children}</AppShell>;
}
