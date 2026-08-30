"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, Thead, Th, Tr, Td, TableToolbar, TablePagination, EmptyState } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { formatINR, formatDate } from "@/lib/utils";
import {
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Filter,
  Eye,
  Building2,
  Download,
  Check,
} from "lucide-react";
import Link from "next/link";

interface AgreementItem {
  id: string;
  agreement_number: string;
  docuseal_submission_id?: string;
  pdf_url?: string;
  borrower_signed: boolean;
  borrower_signed_at?: string;
  lender_signed: boolean;
  lender_signed_at?: string;
  status: string;
  created_at: string;
  loan_id: string;
  loans?: {
    amount: number;
    purpose: string;
    borrowers?: { full_name: string; email: string };
    organizations?: { name: string; code: string };
  };
}

export default function LenderAgreementsPage() {
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgr, setSelectedAgr] = useState<AgreementItem | null>(null);
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);
  const itemsPerPage = 8;
  const supabase = createClient();

  async function fetchAgreementsData() {
    setLoading(true);
    try {
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

      const [
        { data: agreementsData },
        { data: loansData },
        { data: profilesData },
        { data: orgsData },
      ] = await Promise.all([
        supabase
          .from("agreements")
          .select("*")
          .eq("org_id", myProfile.org_id)
          .order("created_at", { ascending: false }),
        supabase.from("loans").select("*").eq("org_id", myProfile.org_id),
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("organizations").select("id, name, code").eq("id", myProfile.org_id),
      ]);

      const loansMap = new Map((loansData || []).map((l: any) => [l.id, l]));
      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      const orgsMap = new Map((orgsData || []).map((o: any) => [o.id, o]));

      if (agreementsData) {
        const mapped = agreementsData.map((ag: any) => {
          const loan = loansMap.get(ag.loan_id);
          const borrower = loan ? profilesMap.get(loan.customer_id) : undefined;
          const org = loan ? orgsMap.get(loan.org_id) : undefined;
          return {
            ...ag,
            loans: {
              amount: loan?.amount || 0,
              purpose: loan?.purpose || "Emergency Loan Facility",
              borrowers: borrower ? { full_name: borrower.full_name, email: borrower.email } : undefined,
              organizations: org ? { name: org.name, code: org.code } : undefined,
            },
          };
        });
        setAgreements(mapped);
      }
    } catch (err) {
      console.error("Error fetching lender agreements data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgreementsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = agreements.filter((ag) => {
    const matchSearch =
      ag.agreement_number.toLowerCase().includes(search.toLowerCase()) ||
      ag.loans?.borrowers?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      ag.loans?.purpose?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === "signed") return ag.borrower_signed && ag.lender_signed;
    if (statusFilter === "pending") return !ag.borrower_signed || !ag.lender_signed;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedAgreements = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal/10 text-signal border border-signal/20 text-xs font-semibold mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Legally Binding Agreement Vault</span>
          </div>
          <h1 className="text-2xl font-black text-ink dark:text-white tracking-tight">
            Lending Agreements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-medium">
            Inspect legal lending contracts and digital signature audit trails between your capital pool and approved borrowers.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Agreements</span>
          <p className="text-2xl font-black text-ink dark:text-white">{agreements.length}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark space-y-1">
          <span className="text-xs text-slate-400 font-medium">Fully Signed</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {agreements.filter((a) => a.borrower_signed && a.lender_signed).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark space-y-1">
          <span className="text-xs text-slate-400 font-medium">Pending Signatures</span>
          <p className="text-2xl font-black text-amber-500">
            {agreements.filter((a) => !a.borrower_signed || !a.lender_signed).length}
          </p>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <TableToolbar
          searchPlaceholder="Search by agreement #, borrower, or purpose..."
          searchQuery={search}
          onSearchChange={setSearch}
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-ink dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-signal"
          >
            <option value="all">All Statuses ({agreements.length})</option>
            <option value="signed">Fully Executed</option>
            <option value="pending">Pending Signatures</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No agreements found"
          description="Legal loan agreements generated upon loan approvals will show up here."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark overflow-hidden shadow-card">
          <Table>
            <Thead>
              <tr>
                <Th>Agreement Number</Th>
                <Th>Borrower Name</Th>
                <Th>Loan Amount</Th>
                <Th>Signatures Status</Th>
                <Th>Created Date</Th>
                <Th className="text-center">Action</Th>
              </tr>
            </Thead>
            <tbody>
              {paginatedAgreements.map((ag) => (
                <Tr key={ag.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-signal shrink-0" />
                      <span className="font-mono text-xs font-bold text-ink dark:text-white">
                        {ag.agreement_number}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <span className="font-bold text-ink dark:text-white block">
                        {ag.loans?.borrowers?.full_name || "Borrower"}
                      </span>
                      <span className="text-[11px] text-slate-500">{ag.loans?.borrowers?.email}</span>
                    </div>
                  </Td>
                  <Td className="font-mono font-bold text-ink dark:text-white">
                    {formatINR(ag.loans?.amount || 0)}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          ag.borrower_signed
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {ag.borrower_signed ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        Borrower {ag.borrower_signed ? "Signed" : "Pending"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          ag.lender_signed
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                        }`}
                      >
                        {ag.lender_signed ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        Lender {ag.lender_signed ? "Signed" : "Pending"}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {formatDate(ag.created_at)}
                  </Td>
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl text-xs font-bold"
                        onClick={() => setSelectedAgr(ag)}
                      >
                        Inspect
                      </Button>
                      <Link
                        href={`/lender/loans/${ag.loan_id}`}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-signal hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        title="Go to loan detail"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-surface-border-dark">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Agreement Inspector Modal */}
      <Modal
        open={!!selectedAgr}
        onClose={() => setSelectedAgr(null)}
        title={selectedAgr ? `Agreement #${selectedAgr.agreement_number}` : "Agreement Inspector"}
      >
        {selectedAgr && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-surface-border-dark grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block font-medium">Borrower</span>
                <span className="font-bold text-ink dark:text-white text-sm">
                  {selectedAgr.loans?.borrowers?.full_name || "Borrower"}
                </span>
                <span className="text-slate-500 block">{selectedAgr.loans?.borrowers?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Loan Capital</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-base">
                  {formatINR(selectedAgr.loans?.amount || 0)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Borrower Signature</span>
                <span className={`font-bold ${selectedAgr.borrower_signed ? "text-emerald-600" : "text-amber-500"}`}>
                  {selectedAgr.borrower_signed ? `Signed on ${formatDate(selectedAgr.borrower_signed_at || selectedAgr.created_at)}` : "Pending Signature"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Lender Signature</span>
                <span className={`font-bold ${selectedAgr.lender_signed ? "text-emerald-600" : "text-slate-400"}`}>
                  {selectedAgr.lender_signed ? `Signed on ${formatDate(selectedAgr.lender_signed_at || selectedAgr.created_at)}` : "Pending"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-canvas-dark space-y-2">
              <span className="font-bold text-ink dark:text-white block uppercase tracking-wider text-[11px]">
                Contract Details
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                This document constitutes a binding intra-organizational peer-to-peer loan agreement under Sahayam platform guidelines. It confirms the voluntary zero/low-interest advance disbursed directly between the parties.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-end pt-2">
              <Button variant="secondary" className="rounded-xl" onClick={() => setSelectedAgr(null)}>
                Close
              </Button>
              <Link
                href={`/lender/loans/${selectedAgr.loan_id}`}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-signal hover:bg-signal-hover text-white text-xs font-bold shadow-button gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Loan Dossier
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
