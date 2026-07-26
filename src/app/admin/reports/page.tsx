"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Table, Thead, Tr, Th, Td } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { ExportCSVButton } from "@/components/reports/export-csv-button";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, LoanStatus } from "@/types/database";

type ReportFilter = "all" | "outstanding" | "completed" | "overdue";

const DEMO_REPORT_LOANS: (Loan & { customer?: { full_name: string; email: string } })[] = [
  {
    id: "rep-1",
    org_id: "demo-org",
    customer_id: "cust-1",
    admin_id: "admin-1",
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
    customer: { full_name: "Sarah Jenkins", email: "sarah.j@company.com" },
  },
  {
    id: "rep-2",
    org_id: "demo-org",
    customer_id: "cust-2",
    admin_id: "admin-1",
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
    customer: { full_name: "David Chen", email: "david.c@company.com" },
  },
  {
    id: "rep-3",
    org_id: "demo-org",
    customer_id: "cust-3",
    admin_id: "admin-1",
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
    customer: { full_name: "Meera Nair", email: "meera.n@company.com" },
  },
  {
    id: "rep-4",
    org_id: "demo-org",
    customer_id: "cust-4",
    admin_id: "admin-1",
    amount: 20000,
    purpose: "Emergency Relocation Expenses",
    duration_days: 30,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 20000,
    due_date: "2026-07-15",
    status: "overdue",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-06-15T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: 5,
    late_fee_amount: 1000,
    created_at: "2026-06-10T10:00:00Z",
    approved_at: "2026-06-12T11:00:00Z",
    active_at: "2026-06-15T10:00:00Z",
    completed_at: null,
    updated_at: "2026-07-16T00:00:00Z",
    customer: { full_name: "Rahul Sharma", email: "rahul.s@company.com" },
  },
];

export default function AdminReportsPage() {
  const [loans, setLoans] = useState<(Loan & { customer?: { full_name: string; email: string } })[]>([]);
  const [filter, setFilter] = useState<ReportFilter>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("loans")
      .select("*, customer:profiles!loans_customer_id_fkey(full_name,email)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLoans(data as any);
        } else {
          setLoans(DEMO_REPORT_LOANS);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customers = Array.from(
    new Map(loans.map((l) => [(l as any).customer?.email, (l as any).customer?.full_name])).entries()
  ).filter(([email]) => email);

  const statusMatch: Record<ReportFilter, (s: LoanStatus) => boolean> = {
    all: () => true,
    outstanding: (s) => s === "active" || s === "approved",
    completed: (s) => s === "completed",
    overdue: (s) => s === "overdue",
  };

  const filtered = loans
    .filter((l) => statusMatch[filter](l.status))
    .filter((l) => customerFilter === "all" || (l as any).customer?.email === customerFilter);

  const rows = filtered.map((l) => ({
    customer: (l as any).customer?.full_name || "",
    email: (l as any).customer?.email || "",
    purpose: l.purpose,
    amount: l.amount,
    interest: l.calculated_interest,
    total_repayment: l.total_repayment,
    status: l.status,
    due_date: l.due_date || "",
    created_at: l.created_at,
    completed_at: l.completed_at || "",
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">Reports & Analytics</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">
            Filterable loan ledger and CSV export for organization finance auditing.
          </p>
        </div>
        <ExportCSVButton rows={rows} filename={`sahayam-report-${filter}`} />
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap gap-3">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as ReportFilter)} className="max-w-xs text-xs font-bold">
            <option value="all">All Loans Ledger</option>
            <option value="outstanding">Outstanding Capital</option>
            <option value="completed">Completed & Settled</option>
            <option value="overdue">Overdue Reminders</option>
          </Select>
          <Select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="max-w-xs text-xs font-bold">
            <option value="all">All Borrowing Customers</option>
            {customers.map(([email, name]) => (
              <option key={email as string} value={email as string}>
                {name as string}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Table>
        <Thead>
          <tr>
            <Th>Customer</Th>
            <Th>Loan Purpose</Th>
            <Th>Principal</Th>
            <Th>Total Repayment</Th>
            <Th>Status</Th>
            <Th>Due Date</Th>
          </tr>
        </Thead>
        <tbody>
          {filtered.map((loan) => (
            <Tr key={loan.id}>
              <Td className="font-extrabold text-ink dark:text-white">
                <div>{(loan as any).customer?.full_name || "Borrower"}</div>
                <div className="text-[11px] font-normal text-ink-slate font-mono">{(loan as any).customer?.email || ""}</div>
              </Td>
              <Td className="text-xs text-ink-slate truncate max-w-xs">{loan.purpose}</Td>
              <Td className="font-semibold">{formatINR(loan.amount)}</Td>
              <Td className="font-extrabold text-signal">{formatINR(loan.total_repayment)}</Td>
              <Td>
                <LoanStatusBadge status={loan.status} />
              </Td>
              <Td className="text-xs">{loan.due_date ? formatDate(loan.due_date) : "—"}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
