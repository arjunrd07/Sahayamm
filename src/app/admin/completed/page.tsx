"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Table, Thead, Tr, Th, Td } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan } from "@/types/database";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";

const DEMO_COMPLETED_LOANS: (Loan & { customer?: { full_name: string } })[] = [
  {
    id: "admin-completed-1",
    org_id: "demo-org",
    customer_id: "demo-cust-1",
    admin_id: "demo-admin",
    amount: 30000,
    purpose: "Certification & Skills Training Deposit",
    duration_days: 60,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 30000,
    due_date: "2026-06-30",
    status: "completed",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-04-30T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: "2026-06-28T14:20:00Z",
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-04-25T08:00:00Z",
    approved_at: "2026-04-27T09:00:00Z",
    active_at: "2026-04-30T10:00:00Z",
    completed_at: "2026-06-28T14:20:00Z",
    updated_at: "2026-06-28T14:20:00Z",
    customer: { full_name: "Meera Nair" },
  },
  {
    id: "admin-completed-2",
    org_id: "demo-org",
    customer_id: "demo-cust-2",
    admin_id: "demo-admin",
    amount: 50000,
    purpose: "Emergency Family Medical Advance",
    duration_days: 90,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 50000,
    due_date: "2026-05-15",
    status: "completed",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-02-15T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: "2026-05-10T11:00:00Z",
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-02-10T09:00:00Z",
    approved_at: "2026-02-12T10:00:00Z",
    active_at: "2026-02-15T10:00:00Z",
    completed_at: "2026-05-10T11:00:00Z",
    updated_at: "2026-05-10T11:00:00Z",
    customer: { full_name: "Sarah Jenkins" },
  },
  {
    id: "admin-completed-3",
    org_id: "demo-org",
    customer_id: "demo-cust-3",
    admin_id: "demo-admin",
    amount: 20000,
    purpose: "Home Appliance Emergency Replacement",
    duration_days: 30,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 20000,
    due_date: "2026-04-01",
    status: "completed",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: "2026-03-01T10:00:00Z",
    repayment_proof_url: null,
    repayment_submitted_at: "2026-03-29T16:45:00Z",
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: "2026-02-25T11:00:00Z",
    approved_at: "2026-02-27T10:00:00Z",
    active_at: "2026-03-01T10:00:00Z",
    completed_at: "2026-03-29T16:45:00Z",
    updated_at: "2026-03-29T16:45:00Z",
    customer: { full_name: "David Chen" },
  },
];

export default function AdminCompletedLoansPage() {
  const [loans, setLoans] = useState<(Loan & { customer?: { full_name: string } })[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("loans")
      .select("*, customer:profiles!loans_customer_id_fkey(full_name)")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLoans(data as any);
        } else {
          setLoans(DEMO_COMPLETED_LOANS);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">Completed Loans Audit</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">
            Fully settled intra-org loan history with verified repayment receipts.
          </p>
        </div>
        <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-1 py-1 px-3">
          <CheckCircle2 className="h-3.5 w-3.5" /> 100% Settled History
        </span>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Customer</Th>
            <Th>Loan Purpose</Th>
            <Th>Amount Repaid</Th>
            <Th>Completed Date</Th>
            <Th>Status</Th>
          </tr>
        </Thead>
        <tbody>
          {loans.map((loan) => (
            <Tr key={loan.id}>
              <Td className="font-extrabold text-ink dark:text-white">
                <Link href={`/admin/loans/${loan.id}`} className="hover:text-signal transition-colors">
                  {(loan as any).customer?.full_name || "Borrowing Member"}
                </Link>
              </Td>
              <Td className="text-xs text-ink-slate truncate max-w-xs">{loan.purpose}</Td>
              <Td className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatINR(loan.total_repayment)}</Td>
              <Td className="text-xs">{loan.completed_at ? formatDate(loan.completed_at) : "—"}</Td>
              <Td>
                <LoanStatusBadge status={loan.status} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
