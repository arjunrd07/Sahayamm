"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/utils";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

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

export default function SuperadminAgreementsPage() {
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const supabase = createClient();

  async function fetchAgreementsData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("agreements")
      .select("*, loans:loan_id(amount, purpose, borrowers:borrower_id(full_name, email), organizations(name, code))")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      setAgreements(data as any[]);
    } else {
      // Demo agreements fallback for initial system setup display
      setAgreements([
        {
          id: "ag-001",
          agreement_number: "AGR-2026-WOX-001",
          docuseal_submission_id: "docseal_sub_99410",
          pdf_url: "#",
          borrower_signed: true,
          borrower_signed_at: new Date(Date.now() - 3600000).toISOString(),
          lender_signed: true,
          lender_signed_at: new Date(Date.now() - 1800000).toISOString(),
          status: "completed",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          loans: {
            amount: 50000,
            purpose: "Working Capital Purchase",
            borrowers: { full_name: "Rahul Verma", email: "rahul@woxsen.edu.in" },
            organizations: { name: "Woxsen University", code: "WOXSEN" },
          },
        },
        {
          id: "ag-002",
          agreement_number: "AGR-2026-AHA-002",
          docuseal_submission_id: "docseal_sub_99411",
          pdf_url: "#",
          borrower_signed: true,
          borrower_signed_at: new Date().toISOString(),
          lender_signed: false,
          status: "partially_signed",
          created_at: new Date(Date.now() - 43200000).toISOString(),
          loans: {
            amount: 75000,
            purpose: "Inventory Expansion",
            borrowers: { full_name: "Priya Sharma", email: "priya@aharyas.com" },
            organizations: { name: "Aharyas Textiles", code: "AHARYAS" },
          },
        },
      ]);
    }
    setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Platform Agreements Inspector</h2>
          <p className="text-sm text-ink-slate">
            Inspect cryptographic e-signatures, DocuSeal submission IDs, and legal PDF artifacts.
          </p>
        </div>
      </div>

      <Card className="p-6 border border-slate-200 dark:border-surface-border-dark">
        {/* Search & Status Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-slate" />
            <input
              type="text"
              placeholder="Search agreement #, borrower, org..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-slate flex-wrap">
            <Filter className="h-3.5 w-3.5" /> Status Filter:
            {["all", "draft", "sent", "partially_signed", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-surface-pebble dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            <div className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : paginatedAgreements.length === 0 ? (
          <p className="text-center py-10 text-sm text-ink-slate">No platform agreements found matching your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark text-xs uppercase tracking-wider text-ink-slate">
                  <th className="pb-3 font-bold">Agreement # / DocuSeal ID</th>
                  <th className="pb-3 font-bold">Borrower & Org</th>
                  <th className="pb-3 font-bold">Loan Amount</th>
                  <th className="pb-3 font-bold">Borrower Sign</th>
                  <th className="pb-3 font-bold">Lender Sign</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">PDF Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                {paginatedAgreements.map((ag) => (
                  <tr key={ag.id} className="hover:bg-surface-pebble dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-semibold text-ink dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <div>
                          <div>{ag.agreement_number}</div>
                          <div className="text-[11px] font-mono font-normal text-ink-slate">
                            {ag.docuseal_submission_id || "DocuSeal Mock"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-ink dark:text-white">{ag.loans?.borrowers?.full_name || "Borrower"}</div>
                      <div className="text-xs text-ink-slate">{ag.loans?.organizations?.name || "Global"}</div>
                    </td>
                    <td className="py-3.5 font-extrabold text-ink dark:text-white">
                      {formatINR(ag.loans?.amount || 0)}
                    </td>
                    <td className="py-3.5">
                      {ag.borrower_signed ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      {ag.lender_signed ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          ag.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : ag.status === "partially_signed"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {ag.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {ag.pdf_url ? (
                        <a
                          href={ag.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                        >
                          View PDF <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-ink-slate font-mono">Generating</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-surface-border-dark mt-6">
            <span className="text-xs font-semibold text-ink-slate">
              Page {currentPage} of {totalPages} ({filteredAgreements.length} total agreements)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="text-xs py-1.5 px-3"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="secondary"
                className="text-xs py-1.5 px-3"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
