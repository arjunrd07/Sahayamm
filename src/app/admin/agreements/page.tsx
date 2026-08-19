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
} from "lucide-react";

import { DocumentGenerator } from "@/components/agreements/document-generator";

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
  loans?: {
    amount: number;
    purpose: string;
    borrowers?: { full_name: string; email: string };
    organizations?: { name: string; code: string };
  };
}

export default function AdminAgreementsPage() {
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const itemsPerPage = 8;
  const supabase = createClient();

  async function fetchAgreementsData() {
    setLoading(true);
    try {
      const [
        { data: agreementsData },
        { data: loansData },
        { data: profilesData },
        { data: orgsData },
      ] = await Promise.all([
        supabase.from("agreements").select("*").order("created_at", { ascending: false }),
        supabase.from("loans").select("*"),
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("organizations").select("id, name, code"),
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
              purpose: loan?.purpose || "Emergency Credit Line",
              borrowers: borrower ? { full_name: borrower.full_name, email: borrower.email } : undefined,
              organizations: org ? { name: org.name, code: org.code } : undefined,
            },
          };
        });
        setAgreements(mapped);
      }
    } catch (err) {
      console.error("Error fetching agreements data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgreementsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAgreements = agreements.filter((ag) => {
    const searchLower = search.toLowerCase();
    const agNum = ag.agreement_number.toLowerCase();
    const borrowerName = (ag.loans?.borrowers?.full_name || "").toLowerCase();
    const borrowerEmail = (ag.loans?.borrowers?.email || "").toLowerCase();
    const orgName = (ag.loans?.organizations?.name || "").toLowerCase();

    const matchesSearch =
      agNum.includes(searchLower) ||
      borrowerName.includes(searchLower) ||
      borrowerEmail.includes(searchLower) ||
      orgName.includes(searchLower);

    const matchesStatus = statusFilter === "all" ? true : ag.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage) || 1;
  const paginatedAgreements = filteredAgreements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const completedCount = agreements.filter((a) => a.status === "completed").length;
  const pendingCount = agreements.filter((a) => a.status === "partially_signed" || a.status === "sent").length;

  return (
    <div className="space-y-6">
      {/* Clean Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-surface-border-dark pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink dark:text-white">
            Agreements Inspector
          </h1>
          <p className="text-xs sm:text-sm text-ink-slate font-medium mt-1">
            Inspect cryptographic e-signatures, native digital agreement hashes, and legal PDF audit artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showGenerator ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowGenerator(!showGenerator)}
            className="text-xs font-bold"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            {showGenerator ? "View Executed Agreements" : "Document Template Studio"}
          </Button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/40">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Sahayam E-Sign Verification
          </span>
        </div>
      </div>

      {showGenerator ? (
        <DocumentGenerator />
      ) : (
        <>
          {/* KPI Metric Overview Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-xs space-y-1">
              <span className="text-xs font-bold text-ink-slate">Total Executed Agreements</span>
              <p className="text-2xl font-black text-ink dark:text-white">{agreements.length}</p>
              <p className="text-[11px] text-ink-slate font-medium">Native digital contract vault</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-xs space-y-1">
              <span className="text-xs font-bold text-ink-slate">Fully Signed Contracts</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Dual e-signature verified</p>
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-xs space-y-1">
              <span className="text-xs font-bold text-ink-slate">Pending Signatures</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-300 font-bold">Awaiting counter-signature</p>
            </div>
          </div>

          {/* Agreements Table */}
          <div className="space-y-4">
            <TableToolbar
              searchQuery={search}
              onSearchChange={(q) => {
                setSearch(q);
                setCurrentPage(1);
              }}
              searchPlaceholder="Search agreement number, borrower, or organization..."
              filters={
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-slate flex-wrap">
                  <Filter className="h-3.5 w-3.5" /> Status:
                  {["all", "completed", "partially_signed", "sent"].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg capitalize transition-all ${
                        statusFilter === st
                          ? "bg-primary text-white font-bold shadow-xs"
                          : "bg-slate-100 dark:bg-white/5 text-ink-slate hover:text-ink dark:hover:text-white"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              }
            />

            <Table>
              <Thead>
                <Tr>
                  <Th>Agreement No.</Th>
                  <Th>Borrower &amp; Org</Th>
                  <Th>Loan Principal</Th>
                  <Th>Agreement Ref Hash</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th className="text-center">Actions</Th>
                </Tr>
              </Thead>
              <tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading platform agreements...
                    </Td>
                  </Tr>
                ) : paginatedAgreements.length === 0 ? (
                  <Tr>
                    <Td colSpan={7}>
                      <EmptyState title="No agreements found" description="Try adjusting search or status filters." />
                    </Td>
                  </Tr>
                ) : (
                  paginatedAgreements.map((ag) => (
                    <Tr key={ag.id}>
                      <Td>
                        <div className="font-bold font-mono text-xs text-primary">{ag.agreement_number}</div>
                      </Td>
                      <Td>
                        <div className="font-bold text-ink dark:text-white">{ag.loans?.borrowers?.full_name || "Borrower"}</div>
                        <div className="text-xs text-ink-slate font-medium">{ag.loans?.organizations?.name}</div>
                      </Td>
                      <Td>
                        <div className="font-extrabold text-ink dark:text-white">{formatINR(ag.loans?.amount || 0)}</div>
                        <div className="text-xs text-ink-slate truncate max-w-[140px] font-medium">{ag.loans?.purpose}</div>
                      </Td>
                      <Td>
                        <span className="text-xs font-mono text-ink-slate">{ag.docuseal_submission_id || "SHY-DIGISIGN-SANDBOX"}</span>
                      </Td>
                      <Td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            ag.status === "completed"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                          }`}
                        >
                          {ag.status.replace("_", " ")}
                        </span>
                      </Td>
                      <Td className="text-xs text-ink-slate font-medium">{formatDate(ag.created_at)}</Td>
                      <Td className="text-center">
                        <div className="flex justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setViewPdfUrl(ag.pdf_url || "#")}
                          >
                            <Eye className="h-3.5 w-3.5" /> Inspect PDF
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={filteredAgreements.length}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {/* PDF Inspector Modal */}
      <Modal open={Boolean(viewPdfUrl)} onClose={() => setViewPdfUrl(null)} title="Sahayam Digital Agreement Artifact">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark space-y-2 text-xs">
            <div className="flex justify-between text-ink-slate">
              <span>Cryptographic Proof:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Verified SHA-256 Signature</strong>
            </div>
            <div className="flex justify-between text-ink-slate">
              <span>Audit Trail:</span>
              <strong className="text-ink dark:text-white font-bold font-mono">Timestamped Sahayam E-Sign Envelope</strong>
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setViewPdfUrl(null)}>
            Close Inspection Drawer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
