"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, LoanStatus } from "@/types/database";
import Link from "next/link";

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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Loans</h2>
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
        <EmptyState title="No loans in this view" description="Try a different tab, or request a new loan." />
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
                  <Link href={`/customer/loans/${loan.id}`} className="font-medium hover:text-accent">
                    {loan.purpose}
                  </Link>
                </Td>
                <Td>{formatINR(loan.amount)}</Td>
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
