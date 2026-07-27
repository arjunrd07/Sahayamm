"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, Profile } from "@/types/database";
import Link from "next/link";

export default function AdminLoanRequestsPage() {
  const [loans, setLoans] = useState<(Loan & { customer?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("loans")
      .select("*, customer:profiles!loans_customer_id_fkey(full_name,email)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLoans((data as any) || []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Loan Requests</h2>
      {!loading && loans.length === 0 ? (
        <EmptyState title="No pending requests" description="New loan requests from your organization will appear here." />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Customer</Th>
              <Th>Reason / Purpose</Th>
              <Th>Amount</Th>
              <Th>Plan</Th>
              <Th>Requested</Th>
              <Th>Status</Th>
            </tr>
          </Thead>
          <tbody>
            {loans.map((loan) => {
              const planText =
                loan.duration_days === 7
                  ? "7 Days (0.4%)"
                  : loan.duration_days === 14
                  ? "14 Days (0.8%)"
                  : loan.duration_days === 21
                  ? "21 Days (1.6%)"
                  : `${loan.duration_days} days`;
              return (
                <Tr key={loan.id}>
                  <Td>
                    <Link href={`/lender/loans/${loan.id}`} className="font-medium hover:text-accent">
                      {(loan as any).customer?.full_name || "—"}
                    </Link>
                  </Td>
                  <Td>{loan.purpose}</Td>
                  <Td className="font-semibold">{formatINR(loan.amount)}</Td>
                  <Td>
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-surface-border/50 dark:bg-white/10">
                      {planText}
                    </span>
                  </Td>
                  <Td>{formatDate(loan.created_at)}</Td>
                  <Td>
                    <LoanStatusBadge status={loan.status} />
                  </Td>
                </Tr>
              );
            })}
          </tbody>

        </Table>
      )}
    </div>
  );
}
