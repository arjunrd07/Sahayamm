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
              <Th>Purpose</Th>
              <Th>Amount</Th>
              <Th>Requested</Th>
              <Th>Status</Th>
            </tr>
          </Thead>
          <tbody>
            {loans.map((loan) => (
              <Tr key={loan.id}>
                <Td>
                  <Link href={`/admin/loans/${loan.id}`} className="font-medium hover:text-accent">
                    {(loan as any).customer?.full_name || "—"}
                  </Link>
                </Td>
                <Td>{loan.purpose}</Td>
                <Td>{formatINR(loan.amount)}</Td>
                <Td>{formatDate(loan.created_at)}</Td>
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
