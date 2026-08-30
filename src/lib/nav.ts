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
  Building2,
  FileText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  items?: NavSubItem[];
}

export const borrowerNav: NavItem[] = [
  { href: "/borrower/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/borrower/verification", label: "Verification Status", icon: FileCheck2 },
  {
    href: "/borrower/loans",
    label: "Credit & Loans",
    icon: Wallet,
    items: [
      { href: "/borrower/request", label: "Request Loan", icon: HandCoins },
      { href: "/borrower/loans", label: "My Loans History", icon: Wallet },
    ],
  },
  { href: "/borrower/agreements", label: "My Agreements", icon: FileText },
  { href: "/borrower/profile", label: "Profile", icon: User },
  { href: "/borrower/notifications", label: "Notifications", icon: Bell },
  { href: "/borrower/settings", label: "Settings", icon: Settings },
];

export const lenderNav: NavItem[] = [
  { href: "/lender/dashboard", label: "Lender Overview", icon: LayoutDashboard },
  { href: "/lender/verifications", label: "Verifications", icon: FileCheck2 },
  {
    href: "/lender/loans",
    label: "Loan Requests",
    icon: HandCoins,
    items: [
      { href: "/lender/loans", label: "Incoming Requests", icon: HandCoins },
      { href: "/lender/active", label: "Active Loans", icon: Wallet },
      { href: "/lender/completed", label: "Settled Loans", icon: CheckCircle2 },
    ],
  },
  { href: "/lender/agreements", label: "Agreement Inspection", icon: FileText },
  { href: "/lender/notifications", label: "Notifications", icon: Bell },
  {
    href: "/lender/settings",
    label: "Settings",
    icon: Settings,
    items: [
      { href: "/lender/profile", label: "Lender Profile", icon: User },
      { href: "/lender/settings", label: "Lending Preferences", icon: Settings },
    ],
  },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Admin Overview", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations & Campuses", icon: Building2 },
  { href: "/admin/users", label: "User Management", icon: User },
  {
    href: "/admin/loans",
    label: "Platform Oversight",
    icon: Wallet,
    items: [
      { href: "/admin/loans", label: "Platform Loans Oversight", icon: Wallet },
      { href: "/admin/agreements", label: "Agreements Inspector", icon: FileText },
      { href: "/admin/audit", label: "Audit Logs & Security", icon: ShieldCheck },
    ],
  },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

export const customerNav = borrowerNav;
