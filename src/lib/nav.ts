import {
  LayoutDashboard,
  FileCheck2,
  HandCoins,
  Wallet,
  CheckCircle2,
  BarChart3,
  Bell,
  Settings,
  User,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const customerNav: NavItem[] = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/verification", label: "Verification", icon: FileCheck2 },
  { href: "/customer/request", label: "Request Loan", icon: HandCoins },
  { href: "/customer/loans", label: "My Loans", icon: Wallet },
  { href: "/customer/profile", label: "Profile", icon: User },
  { href: "/customer/notifications", label: "Notifications", icon: Bell },
  { href: "/customer/settings", label: "Settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/verifications", label: "Verifications", icon: FileCheck2 },
  { href: "/admin/loans", label: "Loan Requests", icon: HandCoins },
  { href: "/admin/active", label: "Active Loans", icon: Wallet },
  { href: "/admin/completed", label: "Completed Loans", icon: CheckCircle2 },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export const superadminNav: NavItem[] = [
  { href: "/superadmin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/superadmin/organizations", label: "Organizations", icon: FileText },
  { href: "/superadmin/users", label: "Global Users", icon: User },
  { href: "/superadmin/audit", label: "Audit & Security Logs", icon: Bell },
  { href: "/admin/dashboard", label: "Org Admin View", icon: Settings },
];
