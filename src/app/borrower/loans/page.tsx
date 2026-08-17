"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, LoanStatus } from "@/types/database";
import Link from "next/link";
import { Clock, HandCoins, CheckCircle2, FileText } from "lucide-react";

type TabValue = "all" | LoanStatus;

export default function BorrowerLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tab, setTab] = useState<TabValue>("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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

      const { data } = await supabase
        .from("loans")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      setLoans((data as Loan[]) || []);
      setLoading(false);
    }

    loadLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = {
    pending: loans.filter((l) => l.status === "pending").length,
    approved: loans.filter((l) => l.status === "approved").length,
    active: loans.filter((l) => l.status === "active").length,
    completed: loans.filter((l) => l.status === "completed").length,
    rejected: loans.filter((l) => l.status === "rejected").length,
  };

  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "approved");
  const pendingLoans = loans.filter((l) => l.status === "pending");
  const completedLoans = loans.filter((l) => l.status === "completed");

  const totalActiveBalance = activeLoans.reduce((s, l) => s + (l.total_repayment || l.amount), 0);

  const filtered = tab === "all" ? loans : loans.filter((l) => l.status === tab);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">
            My Loan Requests & Borrowings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track active loan balances, repayment schedules, and application status.
          </p>
        </div>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Applications */}
        <Card
          onClick={() => setTab("all")}
          className={`p-4 cursor-pointer transition-all border-2 ${
            tab === "all"
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
            <span className="text-2xl font-black text-ink dark:text-white">{loans.length}</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">All Time</span>
          </div>
        </Card>

        {/* Card 2: Pending Review */}
        <Card
          onClick={() => setTab("pending")}
          className={`p-4 cursor-pointer transition-all border-2 ${
            tab === "pending"
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
            <span className="text-2xl font-black text-ink dark:text-white">{counts.pending}</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Under Review</span>
          </div>
        </Card>

        {/* Card 3: Active Balance */}
        <Card
          onClick={() => setTab("active")}
          className={`p-4 cursor-pointer transition-all border-2 ${
            tab === "active"
              ? "border-signal bg-signal/5 dark:bg-signal/10"
              : "border-slate-200 dark:border-slate-800 hover:border-signal/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Balance</span>
            <div className="p-2 rounded-xl bg-signal/10 text-signal">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{counts.active + counts.approved}</span>
            <span className="text-xs font-semibold text-signal">{formatINR(totalActiveBalance)}</span>
          </div>
        </Card>

        {/* Card 4: Repaid & Completed */}
        <Card
          onClick={() => setTab("completed")}
          className={`p-4 cursor-pointer transition-all border-2 ${
            tab === "completed"
              ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
              : "border-slate-200 dark:border-slate-800 hover:border-emerald-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Repaid & Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{counts.completed}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Closed Loans</span>
          </div>
        </Card>
      </div>

      {/* Tabs Filter */}
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

      {/* Loans Table */}
      {!loading && filtered.length === 0 ? (
        <EmptyState title="No loans in this view" description="Try a different tab, or request a new loan." />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Amount</Th>
              <Th>Purpose / Reason</Th>
              <Th>Plan / Tenure</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th className="text-center">Action</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((loan) => {
              const loanUrl = `/borrower/loans/${loan.id}`;
              const planText = `${loan.duration_days} Days (${loan.interest_rate_annual}% Interest)`;

              return (
                <Tr
                  key={loan.id}
                  onClick={() => router.push(loanUrl)}
                  className="cursor-pointer hover:bg-signal/5 dark:hover:bg-white/5 transition-colors group"
                >
                  {/* Column 1: Amount */}
                  <Td className="font-bold text-ink dark:text-white">
                    <Link href={loanUrl}>{formatINR(loan.amount)}</Link>
                  </Td>

                  {/* Column 2: Purpose */}
                  <Td className="max-w-xs truncate">
                    <Link href={loanUrl} className="font-semibold text-ink dark:text-white group-hover:text-signal transition-colors">
                      {loan.purpose}
                    </Link>
                  </Td>

                  {/* Column 3: Plan / Tenure */}
                  <Td>
                    <Link href={loanUrl}>
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {planText}
                      </span>
                    </Link>
                  </Td>

                  {/* Column 4: Due Date */}
                  <Td className="text-ink-slate dark:text-slate-400">
                    <Link href={loanUrl}>{loan.due_date ? formatDate(loan.due_date) : "—"}</Link>
                  </Td>

                  {/* Column 5: Status */}
                  <Td>
                    <Link href={loanUrl}>
                      <LoanStatusBadge status={loan.status} />
                    </Link>
                  </Td>

                  {/* Column 6: Action */}
                  <Td className="text-center">
                    <div className="flex justify-center">
                      <Link
                        href={loanUrl}
                        className="btn btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1 hover:bg-signal hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        View Details
                      </Link>
                    </div>
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
