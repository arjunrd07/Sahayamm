"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, LoanStatus } from "@/types/database";
import Link from "next/link";
import { Wallet, Sparkles } from "lucide-react";

type TabValue = "all" | LoanStatus;

const DEMO_CUSTOMER_LOANS: Loan[] = [
  {
    id: "cust-loan-1",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 50000,
    purpose: "Emergency Family Medical Expenses",
    duration_days: 90,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 50000,
    due_date: "2026-10-15",
    status: "active",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-07-15T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-07-10T14:30:00Z",
    approved_at: "2026-07-12T09:00:00Z",
    active_at: "2026-07-15T10:00:00Z",
    completed_at: null,
    updated_at: "2026-07-15T10:00:00Z",
  },
  {
    id: "cust-loan-2",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: null,
    amount: 25000,
    purpose: "Home Refurbishment Advance",
    duration_days: 60,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 25000,
    due_date: null,
    status: "pending",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-07-20T11:15:00Z",
    approved_at: null,
    active_at: null,
    completed_at: null,
    updated_at: "2026-07-20T11:15:00Z",
  },
  {
    id: "cust-loan-3",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 35000,
    purpose: "Workstation Laptop & Equipment Upgrade",
    duration_days: 120,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 35000,
    due_date: "2026-11-20",
    status: "approved",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-07-22T09:00:00Z",
    approved_at: "2026-07-23T14:00:00Z",
    active_at: null,
    completed_at: null,
    updated_at: "2026-07-23T14:00:00Z",
  },
  {
    id: "cust-loan-4",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 15000,
    purpose: "Course & Certification Fee",
    duration_days: 30,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 15000,
    due_date: "2026-06-30",
    status: "completed",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-05-30T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: "2026-06-28T16:00:00Z",
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-05-25T08:20:00Z",
    approved_at: "2026-05-27T12:00:00Z",
    active_at: "2026-05-30T10:00:00Z",
    completed_at: "2026-06-28T16:00:00Z",
    updated_at: "2026-06-28T16:00:00Z",
  },
  {
    id: "cust-loan-5",
    org_id: "demo-org",
    customer_id: "demo-cust",
    admin_id: "demo-admin",
    amount: 40000,
    purpose: "Personal Travel Expense",
    duration_days: 30,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 40000,
    due_date: null,
    status: "rejected",
    rejection_reason: "Exceeds maximum allowable intra-org credit limit for current tenure.",
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-04-10T10:00:00Z",
    approved_at: null,
    active_at: null,
    completed_at: null,
    updated_at: "2026-04-12T11:00:00Z",
  },
];

export default function CustomerLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tab, setTab] = useState<TabValue>("all");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("loans")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLoans(data as Loan[]);
        } else {
          setLoans(DEMO_CUSTOMER_LOANS);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = {
    pending: loans.filter((l) => l.status === "pending").length,
    approved: loans.filter((l) => l.status === "approved").length,
    active: loans.filter((l) => l.status === "active").length,
    completed: loans.filter((l) => l.status === "completed").length,
    rejected: loans.filter((l) => l.status === "rejected").length,
  };

  const filtered = tab === "all" ? loans : loans.filter((l) => l.status === tab);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">My Loans & Advance Portfolio</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">
            Track active intra-org loans, repayment due dates, and settlement receipts.
          </p>
        </div>
        <Link
          href="/customer/request"
          className="btn-primary py-2 px-4 text-xs font-extrabold rounded-full shadow-button shrink-0"
        >
          + Request New Loan
        </Link>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "All Loans", count: loans.length },
          { value: "pending", label: "Pending", count: counts.pending },
          { value: "approved", label: "Approved", count: counts.approved },
          { value: "active", label: "Active", count: counts.active },
          { value: "completed", label: "Completed", count: counts.completed },
          { value: "rejected", label: "Rejected", count: counts.rejected },
        ]}
      />

      <Table>
        <Thead>
          <tr>
            <Th>Loan Purpose</Th>
            <Th>Principal Amount</Th>
            <Th>Repayment Due Date</Th>
            <Th>Loan Status</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </Thead>
        <tbody>
          {filtered.map((loan) => (
            <Tr key={loan.id}>
              <Td className="font-extrabold text-ink dark:text-white">
                <Link href={`/customer/loans/${loan.id}`} className="hover:text-signal transition-colors">
                  {loan.purpose}
                </Link>
                <div className="text-[11px] font-normal text-ink-slate font-mono">Tenure: {loan.duration_days} Days</div>
              </Td>
              <Td className="font-extrabold text-signal">{formatINR(loan.amount)}</Td>
              <Td className="text-xs">{loan.due_date ? formatDate(loan.due_date) : "—"}</Td>
              <Td>
                <LoanStatusBadge status={loan.status} />
              </Td>
              <Td className="text-right">
                <Link
                  href={`/customer/loans/${loan.id}`}
                  className="btn-secondary py-1.5 px-3 text-xs font-bold inline-block"
                >
                  View Details
                </Link>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
