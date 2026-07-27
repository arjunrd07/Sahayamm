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

export const borrowerNav: NavItem[] = [
  { href: "/borrower/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/borrower/verification", label: "Verification", icon: FileCheck2 },
  { href: "/borrower/request", label: "Request Loan", icon: HandCoins },
  { href: "/borrower/loans", label: "My Loans", icon: Wallet },
  { href: "/borrower/profile", label: "Profile", icon: User },
  { href: "/borrower/notifications", label: "Notifications", icon: Bell },
  { href: "/borrower/settings", label: "Settings", icon: Settings },
];

export const lenderNav: NavItem[] = [
  { href: "/lender/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lender/verifications", label: "Verifications", icon: FileCheck2 },
  { href: "/lender/loans", label: "Loan Requests", icon: HandCoins },
  { href: "/lender/active", label: "Active Loans", icon: Wallet },
  { href: "/lender/completed", label: "Completed Loans", icon: CheckCircle2 },
  { href: "/lender/reports", label: "Reports", icon: BarChart3 },
  { href: "/lender/profile", label: "Profile", icon: User },
  { href: "/lender/notifications", label: "Notifications", icon: Bell },
  { href: "/lender/settings", label: "Settings", icon: Settings },
];

export const customerNav = borrowerNav;
export const adminNav = lenderNav;

export const superadminNav: NavItem[] = [
  { href: "/superadmin/dashboard", label: "Superadmin Overview", icon: LayoutDashboard },
  { href: "/superadmin/organizations", label: "Organizations", icon: FileText },
  { href: "/superadmin/users", label: "Global Users", icon: User },
  { href: "/superadmin/audit", label: "Audit & Security Logs", icon: Bell },
  { href: "/lender/dashboard", label: "Lender View", icon: Settings },
];
