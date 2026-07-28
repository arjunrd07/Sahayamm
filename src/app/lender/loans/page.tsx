"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, Profile, LoanStatus } from "@/types/database";
import Link from "next/link";
import {
  HandCoins,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Wallet,
} from "lucide-react";

type FilterStatus = "all" | LoanStatus;

export default function AdminLoanRequestsPage() {
  const [allLoans, setAllLoans] = useState<(Loan & { customer?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("pending");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("loans")
      .select("*, customer:profiles!loans_customer_id_fkey(full_name,email)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAllLoans((data as any) || []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate status counts & amounts
  const pendingLoans = allLoans.filter((l) => l.status === "pending");
  const activeLoans = allLoans.filter((l) => l.status === "active" || l.status === "approved");
  const completedLoans = allLoans.filter((l) => l.status === "completed");
  const rejectedLoans = allLoans.filter((l) => l.status === "rejected");

  const pendingAmount = pendingLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const activeAmount = activeLoans.reduce((sum, l) => sum + (l.amount || 0), 0);

  // Filtered list based on selected filter
  const filteredLoans =
    statusFilter === "all"
      ? allLoans
      : allLoans.filter((l) => {
          if (statusFilter === "approved") {
            return l.status === "approved" || l.status === "active";
          }
          return l.status === statusFilter;
        });

  const tabOptions = [
    { value: "all" as FilterStatus, label: "All Requests", count: allLoans.length },
    { value: "pending" as FilterStatus, label: "Pending Review", count: pendingLoans.length },
    { value: "approved" as FilterStatus, label: "Approved & Active", count: activeLoans.length },
    { value: "completed" as FilterStatus, label: "Completed", count: completedLoans.length },
    { value: "rejected" as FilterStatus, label: "Rejected", count: rejectedLoans.length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">
            Loan Requests Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review and manage intra-organization employee loan applications.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-medium">Click any row to open request details</span>
      </div>

      {/* Top Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Requests */}
        <Card
          onClick={() => setStatusFilter("all")}
          className={`p-4 cursor-pointer transition-all duration-150 border-2 ${
            statusFilter === "all"
              ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10"
              : "border-slate-200 dark:border-slate-800 hover:border-indigo-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-medium">Total Applications</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{allLoans.length}</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">All Records</span>
          </div>
        </Card>

        {/* Card 2: Pending Requests */}
        <Card
          onClick={() => setStatusFilter("pending")}
          className={`p-4 cursor-pointer transition-all duration-150 border-2 ${
            statusFilter === "pending"
              ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10"
              : "border-slate-200 dark:border-slate-800 hover:border-amber-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{pendingLoans.length}</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {formatINR(pendingAmount)}
            </span>
          </div>
        </Card>

        {/* Card 3: Approved & Active */}
        <Card
          onClick={() => setStatusFilter("approved")}
          className={`p-4 cursor-pointer transition-all duration-150 border-2 ${
            statusFilter === "approved"
              ? "border-signal bg-signal/5 dark:bg-signal/10"
              : "border-slate-200 dark:border-slate-800 hover:border-signal/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active & Disbursed</span>
            <div className="p-2 rounded-xl bg-signal/10 text-signal">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{activeLoans.length}</span>
            <span className="text-xs font-semibold text-signal">
              {formatINR(activeAmount)}
            </span>
          </div>
        </Card>

        {/* Card 4: Completed Loans */}
        <Card
          onClick={() => setStatusFilter("completed")}
          className={`p-4 cursor-pointer transition-all duration-150 border-2 ${
            statusFilter === "completed"
              ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
              : "border-slate-200 dark:border-slate-800 hover:border-emerald-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed & Repaid</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{completedLoans.length}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Fully Repaid</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={statusFilter}
        onChange={(val) => setStatusFilter(val as FilterStatus)}
        tabs={tabOptions}
      />

      {/* Loan Requests Table */}
      {!loading && filteredLoans.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter === "all" ? "" : statusFilter} loan requests`}
          description="There are currently no loan applications matching this filter status."
        />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Customer</Th>
              <Th>Amount</Th>
              <Th>Reason / Purpose</Th>
              <Th>Plan / Tenure</Th>
              <Th>Requested Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </Thead>
          <tbody>
            {filteredLoans.map((loan) => {
              const planText =
                loan.duration_days === 7
                  ? "7 Days (0.4%)"
                  : loan.duration_days === 14
                  ? "14 Days (0.8%)"
                  : loan.duration_days === 21
                  ? "21 Days (1.6%)"
                  : `${loan.duration_days} days`;

              const loanUrl = `/lender/loans/${loan.id}`;

              return (
                <Tr
                  key={loan.id}
                  onClick={() => router.push(loanUrl)}
                  className="cursor-pointer hover:bg-signal/5 dark:hover:bg-white/5 transition-colors group"
                >
                  {/* Column 1: Customer */}
                  <Td>
                    <Link
                      href={loanUrl}
                      className="font-semibold text-ink dark:text-white group-hover:text-signal transition-colors flex flex-col"
                    >
                      <span>{(loan as any).customer?.full_name || "—"}</span>
                      {(loan as any).customer?.email && (
                        <span className="text-[11px] font-normal text-slate-400">
                          {(loan as any).customer.email}
                        </span>
                      )}
                    </Link>
                  </Td>

                  {/* Column 2: Amount */}
                  <Td className="font-bold text-ink dark:text-white">
                    <Link href={loanUrl}>{formatINR(loan.amount)}</Link>
                  </Td>

                  {/* Column 3: Reason / Purpose */}
                  <Td className="max-w-xs truncate">
                    <Link href={loanUrl} className="text-ink-slate dark:text-slate-300">
                      {loan.purpose}
                    </Link>
                  </Td>

                  {/* Column 4: Plan / Tenure */}
                  <Td>
                    <Link href={loanUrl}>
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {planText}
                      </span>
                    </Link>
                  </Td>

                  {/* Column 5: Requested Date */}
                  <Td className="text-ink-slate dark:text-slate-400">
                    <Link href={loanUrl}>{formatDate(loan.created_at)}</Link>
                  </Td>

                  {/* Column 6: Status */}
                  <Td>
                    <Link href={loanUrl}>
                      <LoanStatusBadge status={loan.status} />
                    </Link>
                  </Td>

                  {/* Column 7: Action */}
                  <Td className="text-right">
                    <Link
                      href={loanUrl}
                      className="btn btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1 hover:bg-signal hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Review Request
                    </Link>
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
