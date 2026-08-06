"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { ExportCSVButton } from "@/components/reports/export-csv-button";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, LoanStatus } from "@/types/database";

type ReportFilter = "all" | "outstanding" | "completed" | "overdue";

export default function AdminReportsPage() {
  const [loans, setLoans] = useState<(Loan & { customer?: { full_name: string; email: string } })[]>([]);
  const [filter, setFilter] = useState<ReportFilter>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    async function loadReports() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!myProfile?.org_id) return;

      const { data } = await supabase
        .from("loans")
        .select("*, customer:profiles!loans_customer_id_fkey(full_name,email)")
        .eq("org_id", myProfile.org_id)
        .order("created_at", { ascending: false });

      setLoans((data as any) || []);
    }

    loadReports();
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
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted mt-1">Org-scoped loan history, filterable and exportable.</p>
        </div>
        <ExportCSVButton rows={rows} filename={`sahayam-report-${filter}`} />
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap gap-3">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as ReportFilter)} className="max-w-xs">
            <option value="all">All loans</option>
            <option value="outstanding">Outstanding</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </Select>
          <Select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="max-w-xs">
            <option value="all">All customers</option>
            {customers.map(([email, name]) => (
              <option key={email as string} value={email as string}>
                {name as string}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No loans match this filter" />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Customer</Th>
              <Th>Purpose</Th>
              <Th>Amount</Th>
              <Th>Total repayment</Th>
              <Th>Status</Th>
              <Th>Due date</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((loan) => (
              <Tr key={loan.id}>
                <Td>{(loan as any).customer?.full_name || "—"}</Td>
                <Td>{loan.purpose}</Td>
                <Td>{formatINR(loan.amount)}</Td>
                <Td>{formatINR(loan.total_repayment)}</Td>
                <Td>
                  <LoanStatusBadge status={loan.status} />
                </Td>
                <Td>{loan.due_date ? formatDate(loan.due_date) : "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
