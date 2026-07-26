"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Table, Thead, Tr, Th, Td } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, Profile } from "@/types/database";
import Link from "next/link";
import { HandCoins, Sparkles } from "lucide-react";

const DEMO_LOAN_REQUESTS: (Loan & { customer?: Profile })[] = [
  {
    id: "admin-req-1",
    org_id: "demo-org",
    customer_id: "demo-cust-1",
    admin_id: null,
    amount: 75000,
    purpose: "Higher Education Fee Advance",
    duration_days: 120,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 75000,
    due_date: null,
    status: "pending",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    approved_at: null,
    active_at: null,
    completed_at: null,
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    customer: {
      id: "cust-1",
      org_id: "demo-org",
      email: "rahul.sharma@techcorp.com",
      full_name: "Rahul Sharma",
      phone: "+91 98123 45678",
      role: "customer",
      verification_status: "verified",
      rejection_reason: null,
      id_proof_url: null,
      employment_proof_url: null,
      verified_by: null,
      verified_at: null,
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "admin-req-2",
    org_id: "demo-org",
    customer_id: "demo-cust-2",
    admin_id: null,
    amount: 30000,
    purpose: "Vehicle Repair & Transport Maintenance",
    duration_days: 60,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 30000,
    due_date: null,
    status: "pending",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    approved_at: null,
    active_at: null,
    completed_at: null,
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    customer: {
      id: "cust-2",
      org_id: "demo-org",
      email: "priya.patel@techcorp.com",
      full_name: "Priya Patel",
      phone: "+91 98234 56789",
      role: "customer",
      verification_status: "verified",
      rejection_reason: null,
      id_proof_url: null,
      employment_proof_url: null,
      verified_by: null,
      verified_at: null,
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "admin-req-3",
    org_id: "demo-org",
    customer_id: "demo-cust-3",
    admin_id: null,
    amount: 50000,
    purpose: "Emergency Family Medical Advance",
    duration_days: 90,
    interest_rate_annual: 0,
    calculated_interest: 0,
    total_repayment: 50000,
    due_date: null,
    status: "pending",
    rejection_reason: null,
    disbursal_proof_url: null,
    disbursed_at: null,
    repayment_proof_url: null,
    repayment_submitted_at: null,
    late_fee_rate: null,
    late_fee_amount: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    approved_at: null,
    active_at: null,
    completed_at: null,
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    customer: {
      id: "cust-3",
      org_id: "demo-org",
      email: "sarah.jenkins@techcorp.com",
      full_name: "Sarah Jenkins",
      phone: "+91 98765 43210",
      role: "customer",
      verification_status: "verified",
      rejection_reason: null,
      id_proof_url: null,
      employment_proof_url: null,
      verified_by: null,
      verified_at: null,
      created_at: "",
      updated_at: "",
    },
  },
];

export default function AdminLoanRequestsPage() {
  const [loans, setLoans] = useState<(Loan & { customer?: Profile })[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("loans")
      .select("*, customer:profiles!loans_customer_id_fkey(full_name,email)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLoans(data as any);
        } else {
          setLoans(DEMO_LOAN_REQUESTS);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">Loan Requests Queue</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">
            Review and approve intra-org zero-interest loan applications from employees.
          </p>
        </div>
        <span className="badge bg-signal-soft text-signal-cobalt text-xs font-extrabold flex items-center gap-1 py-1 px-3">
          <HandCoins className="h-3.5 w-3.5" /> {loans.length} Applications Pending
        </span>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Applicant Customer</Th>
            <Th>Loan Purpose</Th>
            <Th>Requested Amount</Th>
            <Th>Requested On</Th>
            <Th>Status</Th>
          </tr>
        </Thead>
        <tbody>
          {loans.map((loan) => (
            <Tr key={loan.id}>
              <Td className="font-extrabold text-ink dark:text-white">
                <Link href={`/admin/loans/${loan.id}`} className="hover:text-signal transition-colors">
                  {(loan as any).customer?.full_name || "Borrower"}
                </Link>
                <div className="text-[11px] font-normal text-ink-slate font-mono">{(loan as any).customer?.email || ""}</div>
              </Td>
              <Td className="text-xs text-ink-slate truncate max-w-xs">{loan.purpose}</Td>
              <Td className="font-extrabold text-signal">{formatINR(loan.amount)}</Td>
              <Td className="text-xs">{formatDate(loan.created_at)}</Td>
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
