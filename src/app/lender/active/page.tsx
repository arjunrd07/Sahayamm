"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan, Profile } from "@/types/database";
import { 
  UploadCloud, 
  FileText, 
  Clock, 
  HandCoins, 
  CheckCircle2, 
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { uploadDisbursalProof, verifyRepaymentAndComplete } from "../loans/actions";
import Link from "next/link";

type TabValue = "awaiting_disbursal" | "active";

export default function AdminActiveLoansPage() {
  const [loans, setLoans] = useState<(Loan & { customer?: { full_name: string; email: string } })[]>([]);
  const [tab, setTab] = useState<TabValue>("awaiting_disbursal");
  const [disbursing, setDisbursing] = useState<Loan | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const supabase = createClient();

  async function load() {
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
      .in("status", ["approved", "active"])
      .order("created_at", { ascending: false });
    setLoans((data as any) || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const awaiting = loans.filter((l) => l.status === "approved");
  const active = loans.filter((l) => l.status === "active");
  const filtered = tab === "awaiting_disbursal" ? awaiting : active;

  const awaitingLoans = loans.filter((l) => l.status === "approved");
  const activeLoans = loans.filter((l) => l.status === "active");
  const repaymentAwaitingVerify = activeLoans.filter((l) => l.repayment_proof_url);

  const totalAwaitingAmount = awaitingLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalActiveAmount = activeLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalPortfolioAmount = loans.reduce((sum, l) => sum + (l.amount || 0), 0);

  const tabOptions = [
    { value: "awaiting_disbursal" as TabValue, label: "Awaiting Disbursal", count: awaiting.length },
    { value: "active" as TabValue, label: "Active Loans", count: active.length },
  ];

  async function handleDisburse() {
    if (!disbursing || !file) {
      push("error", "Choose a proof-of-payment file.");
      return;
    }
    setSubmitting(true);
    try {
      const path = `${disbursing.org_id}/${disbursing.customer_id}/disbursal-${disbursing.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (uploadError) throw uploadError;

      const result = await uploadDisbursalProof(disbursing.id, path);
      if ("error" in result && result.error) throw new Error(result.error);

      push("success", "Loan marked active. Customer notified.");
      setDisbursing(null);
      setFile(null);
      load();
    } catch (err: any) {
      push("error", err.message || "Could not upload proof.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(loan: Loan) {
    setSubmitting(true);
    const result = await verifyRepaymentAndComplete(loan.id);
    setSubmitting(false);
    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Loan marked completed.");
    load();
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">
            Active Loans Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor approved payouts, track active terms, and verify repayments.
          </p>
        </div>
      </div>

      {/* Top Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio */}
        <Card
          onClick={() => setTab("awaiting_disbursal")}
          className={`p-4 cursor-pointer transition-all duration-150 border-2 ${
            tab === "awaiting_disbursal"
              ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10"
              : "border-slate-200 dark:border-slate-800 hover:border-indigo-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Portfolio</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{loans.length}</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {formatINR(totalPortfolioAmount)}
            </span>
          </div>
        </Card>

        {/* Card 2: Awaiting Disbursal */}
        <Card
          onClick={() => setTab("awaiting_disbursal")}
          className={`p-4 cursor-pointer transition-all duration-150 border-2 ${
            tab === "awaiting_disbursal"
              ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10"
              : "border-slate-200 dark:border-slate-800 hover:border-amber-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Awaiting Disbursal</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{awaitingLoans.length}</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {formatINR(totalAwaitingAmount)}
            </span>
          </div>
        </Card>

        {/* Card 3: Active Loans */}
        <Card
          onClick={() => setTab("active")}
          className={`p-4 cursor-pointer transition-all duration-150 border-2 ${
            tab === "active"
              ? "border-signal bg-signal/5 dark:bg-signal/10"
              : "border-slate-200 dark:border-slate-800 hover:border-signal/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Tenure</span>
            <div className="p-2 rounded-xl bg-signal/10 text-signal">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{activeLoans.length}</span>
            <span className="text-xs font-semibold text-signal">
              {formatINR(totalActiveAmount)}
            </span>
          </div>
        </Card>

        {/* Card 4: Repayments to Verify */}
        <Card
          onClick={() => setTab("active")}
          className={`p-4 cursor-pointer transition-all duration-150 border-2 ${
            repaymentAwaitingVerify.length > 0 && tab === "active"
              ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
              : "border-slate-200 dark:border-slate-800 hover:border-emerald-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Repayments to Verify</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink dark:text-white">{repaymentAwaitingVerify.length}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Action Required</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(val) => setTab(val as TabValue)}
        tabs={tabOptions}
      />

      {filtered.length === 0 ? (
        <EmptyState 
          title="Nothing here" 
          description="Approved loans waiting for disbursal, or active loans, show up here." 
        />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Customer</Th>
              <Th>Amount</Th>
              <Th>Reason / Purpose</Th>
              <Th>Plan / Tenure</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((loan) => {
              const loanUrl = `/lender/loans/${loan.id}`;
              const planText =
                loan.duration_days === 7
                  ? "7 Days (0.4%)"
                  : loan.duration_days === 14
                  ? "14 Days (0.8%)"
                  : loan.duration_days === 21
                  ? "21 Days (1.2%)"
                  : loan.duration_days === 30
                  ? "30 Days (1.5%)"
                  : `${loan.duration_days} days`;

              return (
                <Tr 
                  key={loan.id}
                  onClick={() => router.push(loanUrl)}
                  className="cursor-pointer hover:bg-signal/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <Td>
                    <Link 
                      href={loanUrl} 
                      className="font-semibold text-ink dark:text-white group-hover:text-signal transition-colors flex flex-col"
                    >
                      <span>{loan.customer?.full_name || "—"}</span>
                      {loan.customer?.email && (
                        <span className="text-[11px] font-normal text-slate-400">
                          {loan.customer.email}
                        </span>
                      )}
                    </Link>
                  </Td>
                  <Td className="font-bold text-ink dark:text-white">
                    <Link href={loanUrl}>{formatINR(loan.amount)}</Link>
                  </Td>
                  <Td className="max-w-xs truncate">
                    <Link href={loanUrl} className="text-ink-slate dark:text-slate-300">
                      {loan.purpose}
                    </Link>
                  </Td>
                  <Td>
                    <Link href={loanUrl}>
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {planText}
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-ink-slate dark:text-slate-400">
                    <Link href={loanUrl}>{loan.due_date ? formatDate(loan.due_date) : "—"}</Link>
                  </Td>
                  <Td>
                    <Link href={loanUrl}>
                      <LoanStatusBadge status={loan.status} />
                    </Link>
                  </Td>
                  <Td className="text-right">
                    {loan.status === "approved" && (
                      <Button 
                        variant="secondary" 
                        className="text-xs px-3 py-1.5 inline-flex items-center gap-1 hover:bg-signal hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDisbursing(loan);
                        }}
                      >
                        <UploadCloud className="h-3.5 w-3.5" /> Disburse
                      </Button>
                    )}
                    {loan.status === "active" && loan.repayment_proof_url && (
                      <Button 
                        variant="primary" 
                        className="text-xs px-3 py-1.5 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors animate-pulse"
                        loading={submitting} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete(loan);
                        }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Verify &amp; Complete
                      </Button>
                    )}
                    {loan.status === "active" && !loan.repayment_proof_url && (
                      <span className="text-xs text-slate-400 font-medium px-2">Awaiting Repayment</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Modal
        open={!!disbursing}
        onClose={() => setDisbursing(null)}
        title="Upload disbursal proof"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisbursing(null)}>
              Cancel
            </Button>
            <Button loading={submitting} onClick={handleDisburse}>
              Confirm & activate loan
            </Button>
          </>
        }
      >
        <label className="flex items-center gap-3 rounded-xl border border-dashed border-surface-border dark:border-surface-border-dark px-4 py-4 cursor-pointer hover:bg-surface/60 dark:hover:bg-white/5">
          {file ? (
            <FileText className="h-5 w-5 text-accent shrink-0" />
          ) : (
            <UploadCloud className="h-5 w-5 text-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">Proof of payment</p>
            <p className="text-xs text-muted truncate">{file ? file.name : "UTR screenshot or receipt"}</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </label>
      </Modal>
    </div>
  );
}
