"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, LoanStatus } from "@/types/database";
import Link from "next/link";
import { PlusCircle, HandCoins } from "lucide-react";

type TabValue = "all" | LoanStatus;

export default function CustomerLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tab, setTab] = useState<TabValue>("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("loans")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLoans((data as Loan[]) || []);
        setLoading(false);
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
    <div className="space-y-6">
      {/* Header with Prominent New Loan Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2">
            <HandCoins className="h-6 w-6 text-signal" /> My Loans
          </h2>
          <p className="text-xs text-ink-slate mt-0.5">
            Track your borrowing history, active loans, and repayment schedules.
          </p>
        </div>

        <Link
          href="/borrower/request"
          className="btn-primary py-2.5 px-5 rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-button shrink-0 hover:scale-[1.02] transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Request New Loan</span>
        </Link>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "All", count: loans.length },
          { value: "pending", label: "Pending", count: counts.pending },
          { value: "approved", label: "Approved", count: counts.approved },
          { value: "active", label: "Active", count: counts.active },
          { value: "completed", label: "Completed", count: counts.completed },
          { value: "rejected", label: "Rejected", count: counts.rejected },
        ]}
      />

      {!loading && filtered.length === 0 ? (
        <div className="space-y-4 text-center py-8">
          <EmptyState title="No loans in this view" description="You have no loans listed under this status filter." />
          <Link
            href="/borrower/request"
            className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 rounded-full text-xs font-bold shadow-button"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Request a Loan Now</span>
          </Link>
        </div>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Purpose</Th>
              <Th>Amount</Th>
              <Th>Due date</Th>
              <Th>Status</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((loan) => (
              <Tr key={loan.id}>
                <Td>
                  <Link href={`/borrower/loans/${loan.id}`} className="font-semibold text-ink dark:text-white hover:text-signal transition-colors">
                    {loan.purpose}
                  </Link>
                </Td>
                <Td className="font-bold text-ink dark:text-white">{formatINR(loan.amount)}</Td>
                <Td>{loan.due_date ? formatDate(loan.due_date) : "—"}</Td>
                <Td>
                  <LoanStatusBadge status={loan.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
