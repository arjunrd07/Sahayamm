"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Wallet,
  ShieldCheck,
  CheckSquare,
  Square,
} from "lucide-react";
import type { Organization } from "@/types/database";
import { superadminOverrideLoanStatus, superadminBulkUpdateLoanStatus } from "./actions";

interface LoanDetail {
  id: string;
  amount: number;
  purpose: string;
  duration_days: number;
  total_repayment: number;
  status: string;
  created_at: string;
  org_id: string;
  borrower_id: string;
  disbursal_proof_url?: string;
  repayment_proof_url?: string;
  rejection_reason?: string;
  borrowers?: { full_name: string; email: string };
  organizations?: { name: string; code: string };
}

export default function SuperadminLoansPage() {
  const [loans, setLoans] = useState<LoanDetail[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Multi-select for Bulk Actions
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"approved" | "rejected">("approved");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Individual Status Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetLoan, setTargetLoan] = useState<LoanDetail | null>(null);
  const [newStatus, setNewStatus] = useState<string>("approved");
  const [overrideReason, setOverrideReason] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Proof Viewer Modal
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofTitle, setProofTitle] = useState("");

  const { push } = useToast();
  const supabase = createClient();

  async function loadLoansData() {
    setLoading(true);
    const [{ data: loansData }, { data: orgsData }] = await Promise.all([
      supabase
        .from("loans")
        .select("*, borrowers:borrower_id(full_name, email), organizations(name, code)")
        .order("created_at", { ascending: false }),
      supabase.from("organizations").select("*").order("name"),
    ]);

    if (loansData) {
      setLoans(loansData as any[]);
    }
    if (orgsData) {
      setOrganizations(orgsData as Organization[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLoansData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLoans = loans.filter((l) => {
    const searchLower = search.toLowerCase();
    const borrowerName = (l.borrowers?.full_name || "").toLowerCase();
    const borrowerEmail = (l.borrowers?.email || "").toLowerCase();
    const orgName = (l.organizations?.name || "").toLowerCase();
    const purpose = l.purpose.toLowerCase();

    const matchesSearch =
      borrowerName.includes(searchLower) ||
      borrowerEmail.includes(searchLower) ||
      orgName.includes(searchLower) ||
      purpose.includes(searchLower);

    const matchesStatus = statusFilter === "all" ? true : l.status === statusFilter;
    const matchesOrg = orgFilter === "all" ? true : l.org_id === orgFilter;

    return matchesSearch && matchesStatus && matchesOrg;
  });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage) || 1;
  const paginatedLoans = filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function toggleSelectLoan(id: string) {
    setSelectedLoanIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function toggleSelectAllOnPage() {
    const pageIds = paginatedLoans.map((l) => l.id);
    const allSelected = pageIds.every((id) => selectedLoanIds.includes(id));
    if (allSelected) {
      setSelectedLoanIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedLoanIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  }

  function openOverrideModal(loan: LoanDetail, defaultNextStatus: string) {
    setTargetLoan(loan);
    setNewStatus(defaultNextStatus);
    setOverrideReason("");
    setOverrideModalOpen(true);
  }

  async function executeSingleOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!targetLoan) return;
    setUpdatingId(targetLoan.id);
    const result = await superadminOverrideLoanStatus(targetLoan.id, newStatus, overrideReason);
    setUpdatingId(null);
    setOverrideModalOpen(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Loan status overrode to "${newStatus}".`);
    loadLoansData();
  }

  function openBulkModal(type: "approved" | "rejected") {
    if (selectedLoanIds.length === 0) {
      push("error", "No loans selected. Check boxes next to loans to perform bulk action.");
      return;
    }
    setBulkActionType(type);
    setBulkModalOpen(true);
  }

  async function executeBulkOverride() {
    setBulkSubmitting(true);
    const result = await superadminBulkUpdateLoanStatus(selectedLoanIds, bulkActionType);
    setBulkSubmitting(false);
    setBulkModalOpen(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Bulk ${bulkActionType} executed for ${selectedLoanIds.length} loans.`);
    setSelectedLoanIds([]);
    loadLoansData();
  }

  function viewProof(url: string | undefined, title: string) {
    if (!url) {
      push("info", "No proof document attached.");
      return;
    }
    setProofUrl(url);
    setProofTitle(title);
    setProofModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Platform Loans Oversight</h2>
          <p className="text-sm text-ink-slate">Cross-organization liquidity monitoring, status overrides, and bulk approvals.</p>
        </div>
      </div>

      <Card className="p-6 border border-slate-200 dark:border-surface-border-dark">
        {/* Bulk Action Header Bar */}
        {selectedLoanIds.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-md animate-fadeIn">
            <span className="text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              {selectedLoanIds.length} loans selected for bulk action
            </span>
            <div className="flex items-center gap-2">
              <Button variant="primary" className="text-xs py-1.5 px-3 font-bold" onClick={() => openBulkModal("approved")}>
                Bulk Approve ({selectedLoanIds.length})
              </Button>
              <Button variant="danger" className="text-xs py-1.5 px-3 font-bold" onClick={() => openBulkModal("rejected")}>
                Bulk Reject ({selectedLoanIds.length})
              </Button>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-slate" />
            <input
              type="text"
              placeholder="Search borrower, org, or purpose..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs font-semibold text-ink-slate flex-wrap">
              <Filter className="h-3.5 w-3.5" /> Status:
              {["all", "pending", "approved", "active", "completed", "rejected"].map((st) => (
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
                  {st}
                </button>
              ))}
            </div>

            {/* Org Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-slate">
              <Building2 className="h-3.5 w-3.5" /> Org:
              <select
                value={orgFilter}
                onChange={(e) => {
                  setOrgFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1 px-2 rounded-md bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-xs focus:outline-none"
              >
                <option value="all">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : paginatedLoans.length === 0 ? (
          <p className="text-center py-10 text-sm text-ink-slate">No platform loans match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark text-xs uppercase tracking-wider text-ink-slate">
                  <th className="pb-3 w-8">
                    <button onClick={toggleSelectAllOnPage} title="Toggle Select All on Page">
                      {paginatedLoans.every((l) => selectedLoanIds.includes(l.id)) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="pb-3 font-bold">Borrower / Email</th>
                  <th className="pb-3 font-bold">Organization</th>
                  <th className="pb-3 font-bold">Amount & Purpose</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Requested</th>
                  <th className="pb-3 font-bold text-right">Superadmin Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                {paginatedLoans.map((l) => {
                  const isSelected = selectedLoanIds.includes(l.id);

                  return (
                    <tr key={l.id} className="hover:bg-surface-pebble dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5">
                        <button onClick={() => toggleSelectLoan(l.id)}>
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 font-semibold text-ink dark:text-white">
                        <div>{l.borrowers?.full_name || "Borrower"}</div>
                        <div className="text-xs font-normal text-ink-slate">{l.borrowers?.email}</div>
                      </td>
                      <td className="py-3.5 text-ink-slate font-medium">{l.organizations?.name || "Global"}</td>
                      <td className="py-3.5">
                        <div className="font-extrabold text-ink dark:text-white">{formatINR(l.amount)}</div>
                        <div className="text-xs text-ink-slate truncate max-w-[150px]">{l.purpose}</div>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            l.status === "approved" || l.status === "active" || l.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : l.status === "pending"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-ink-slate">{formatDate(l.created_at)}</td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Proof viewer button */}
                          {(l.disbursal_proof_url || l.repayment_proof_url) && (
                            <button
                              onClick={() =>
                                viewProof(
                                  l.disbursal_proof_url || l.repayment_proof_url,
                                  `Proof Document - Loan ₹${l.amount}`
                                )
                              }
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                              title="View Disbursal / Repayment Proof"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {/* Action Overrides */}
                          {l.status === "pending" && (
                            <>
                              <button
                                onClick={() => openOverrideModal(l, "approved")}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => openOverrideModal(l, "rejected")}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}

                          {l.status === "approved" && (
                            <button
                              onClick={() => openOverrideModal(l, "active")}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                            >
                              <Wallet className="w-3.5 h-3.5" /> Disburse / Active
                            </button>
                          )}

                          {l.status === "active" && (
                            <button
                              onClick={() => openOverrideModal(l, "completed")}
                              className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-surface-border-dark mt-6">
            <span className="text-xs font-semibold text-ink-slate">
              Page {currentPage} of {totalPages} ({filteredLoans.length} total loans)
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

      {/* Modal 1: Individual Status Override */}
      <Modal open={overrideModalOpen} onClose={() => setOverrideModalOpen(false)} title="Superadmin Status Override">
        <form onSubmit={executeSingleOverride} className="space-y-4">
          <p className="text-xs text-ink-slate">
            Overriding loan for borrower <strong>{targetLoan?.borrowers?.full_name || targetLoan?.borrowers?.email}</strong> (
            {formatINR(targetLoan?.amount || 0)}).
          </p>

          <Field label="Target Status" htmlFor="targetStatus">
            <select
              id="targetStatus"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none"
            >
              <option value="approved">Approved</option>
              <option value="active">Disbursed / Active</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>

          {newStatus === "rejected" && (
            <Field label="Rejection Reason" htmlFor="overrideReason">
              <input
                id="overrideReason"
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State administrative reason for rejection..."
                className="w-full py-2 px-3 rounded-lg bg-surface-pebble dark:bg-white/5 border text-xs focus:outline-none"
              />
            </Field>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" loading={updatingId === targetLoan?.id} type="submit">
              Apply Override
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Bulk Action Confirmation */}
      <Modal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title={`Confirm Bulk ${bulkActionType}`}>
        <div className="space-y-4">
          <p className="text-sm text-ink-slate">
            Are you sure you want to perform bulk <strong>{bulkActionType}</strong> on{" "}
            <strong>{selectedLoanIds.length} selected loans</strong>?
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={bulkActionType === "approved" ? "primary" : "danger"}
              className="flex-1"
              loading={bulkSubmitting}
              onClick={executeBulkOverride}
            >
              Confirm Bulk Action
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Proof Viewer */}
      <Modal open={proofModalOpen} onClose={() => setProofModalOpen(false)} title={proofTitle}>
        <div className="space-y-4">
          {proofUrl && (
            <div className="aspect-video w-full rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center p-2">
              <img src={proofUrl} alt="Proof" className="max-h-full object-contain rounded-lg" />
            </div>
          )}
          <Button variant="secondary" className="w-full" onClick={() => setProofModalOpen(false)}>
            Close Proof Document
          </Button>
        </div>
      </Modal>
    </div>
  );
}
