"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan } from "@/types/database";
import Link from "next/link";

export default function AdminCompletedLoansPage() {
  const [loans, setLoans] = useState<(Loan & { customer?: { full_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadLoans() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!myProfile?.org_id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("loans")
        .select("*, customer:profiles!loans_customer_id_fkey(full_name)")
        .eq("org_id", myProfile.org_id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      setLoans((data as any) || []);
      setLoading(false);
    }

    loadLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Completed Loans</h2>
      {!loading && loans.length === 0 ? (
        <EmptyState title="No completed loans yet" />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Customer</Th>
              <Th>Amount repaid</Th>
              <Th>Completed on</Th>
              <Th>Status</Th>
            </tr>
          </Thead>
          <tbody>
            {loans.map((loan) => (
              <Tr key={loan.id}>
                <Td>
                  <Link href={`/lender/loans/${loan.id}`} className="font-medium hover:text-accent">
                    {(loan as any).customer?.full_name || "—"}
                  </Link>
                </Td>
                <Td>{formatINR(loan.total_repayment)}</Td>
                <Td>{loan.completed_at ? formatDate(loan.completed_at) : "—"}</Td>
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
