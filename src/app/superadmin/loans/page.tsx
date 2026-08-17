"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, MetricCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, Thead, Th, Tr, Td, TableToolbar, TablePagination, EmptyState } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Eye,
  Wallet,
  ShieldCheck,
  CheckSquare,
  Square,
  TrendingUp,
  Clock,
  ArrowUpRight,
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
  customer_id: string;
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
    try {
      const [{ data: loansData }, { data: orgsData }, { data: profilesData }] = await Promise.all([
        supabase.from("loans").select("*").order("created_at", { ascending: false }),
        supabase.from("organizations").select("*").order("name"),
        supabase.from("profiles").select("id, full_name, email"),
      ]);

      const orgsMap = new Map((orgsData || []).map((o: any) => [o.id, o]));
      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

      if (loansData) {
        const mapped = loansData.map((l: any) => {
          const org = orgsMap.get(l.org_id);
          const borrower = profilesMap.get(l.customer_id);
          return {
            ...l,
            borrowers: borrower ? { full_name: borrower.full_name, email: borrower.email } : undefined,
            organizations: org ? { name: org.name, code: org.code } : undefined,
          };
        });
        setLoans(mapped);
      }

      if (orgsData) {
        setOrganizations(orgsData as Organization[]);
      }
    } catch (err) {
      console.error("Error loading loans oversight:", err);
    } finally {
      setLoading(false);
    }
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

  const totalCapitalDeployed = loans
    .filter((l) => l.status === "active" || l.status === "approved")
    .reduce((sum, l) => sum + l.amount, 0);

  const pendingCount = loans.filter((l) => l.status === "pending").length;

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
    setLoans((prev) =>
      prev.map((l) => (l.id === targetLoan.id ? { ...l, status: newStatus } : l))
    );
    setOverrideModalOpen(false);

    const result = await superadminOverrideLoanStatus(targetLoan.id, newStatus, overrideReason);
    setUpdatingId(null);

    if ("error" in result && result.error) {
      push("error", result.error);
      loadLoansData();
      return;
    }

    push("success", `Loan status updated to "${newStatus}".`);
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
    setLoans((prev) =>
      prev.map((l) => (selectedLoanIds.includes(l.id) ? { ...l, status: bulkActionType } : l))
    );
    setBulkModalOpen(false);

    const result = await superadminBulkUpdateLoanStatus(selectedLoanIds, bulkActionType);
    setBulkSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      loadLoansData();
      return;
    }

    push("success", `Bulk ${bulkActionType} executed for ${selectedLoanIds.length} loans.`);
    setSelectedLoanIds([]);
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
      {/* Clean Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-surface-border-dark pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink dark:text-white">
            Platform Operations
          </h1>
          <p className="text-xs sm:text-sm text-ink-slate font-medium mt-1">
            Cross-organization loan monitoring, status overrides, and disbursal approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/40">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Admin Liquidity Engine Active
          </span>
        </div>
      </div>

      {/* Metric KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-xs space-y-1">
          <span className="text-xs font-bold text-ink-slate">Total Tracked Loans</span>
          <p className="text-2xl font-black text-ink dark:text-white">{loans.length}</p>
          <p className="text-[11px] text-ink-slate font-medium">Multi-tenant liquidity pool</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-xs space-y-1">
          <span className="text-xs font-bold text-ink-slate">Capital Deployed</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatINR(totalCapitalDeployed)}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">0.0% Intra-org interest benefit</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-canvas-dark border border-slate-200/80 dark:border-surface-border-dark shadow-xs space-y-1">
          <span className="text-xs font-bold text-ink-slate">Pending Reviews</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-300 font-bold">Action required by administrator</p>
        </div>
      </div>

      {/* Bulk Action Sticky Control Bar */}
      {selectedLoanIds.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-md border border-slate-800 animate-in fade-in">
          <span className="text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            {selectedLoanIds.length} loans selected for admin override
          </span>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => openBulkModal("approved")}>
              Bulk Approve ({selectedLoanIds.length})
            </Button>
            <Button variant="danger" size="sm" onClick={() => openBulkModal("rejected")}>
              Bulk Reject ({selectedLoanIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Table Toolbar & Operations Grid */}
      <div className="space-y-4">
        <TableToolbar
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search borrower name, organization, or loan purpose..."
          filters={
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-slate flex-wrap">
                <Filter className="h-3.5 w-3.5" /> Status:
                {["all", "pending", "approved", "active", "completed", "rejected"].map((st) => (
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
                    {st}
                  </button>
                ))}
              </div>

              {organizations.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-slate">
                  <Building2 className="h-3.5 w-3.5" /> Org:
                  <select
                    value={orgFilter}
                    onChange={(e) => {
                      setOrgFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-ink dark:text-white focus:outline-none"
                  >
                    <option value="all">All Organizations</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          }
        />

        <Table>
          <Thead>
            <Tr>
              <Th className="w-8">
                <button onClick={toggleSelectAllOnPage} title="Toggle Select All">
                  {paginatedLoans.every((l) => selectedLoanIds.includes(l.id)) ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </Th>
              <Th>Borrower / Contact</Th>
              <Th>Organization</Th>
              <Th>Amount &amp; Purpose</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th className="text-center">Actions</Th>
            </Tr>
          </Thead>
          <tbody>
            {loading ? (
              <Tr>
                <Td colSpan={7} className="py-12 text-center text-slate-400">
                  Loading platform loans oversight...
                </Td>
              </Tr>
            ) : paginatedLoans.length === 0 ? (
              <Tr>
                <Td colSpan={7}>
                  <EmptyState title="No loans match query" description="Try adjusting search parameters or status filters." />
                </Td>
              </Tr>
            ) : (
              paginatedLoans.map((l) => {
                const isSelected = selectedLoanIds.includes(l.id);

                return (
                  <Tr key={l.id}>
                    <Td>
                      <button onClick={() => toggleSelectLoan(l.id)}>
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </Td>
                    <Td>
                      <div className="font-bold text-ink dark:text-white">{l.borrowers?.full_name || "Borrower"}</div>
                      <div className="text-xs text-ink-slate font-medium">{l.borrowers?.email}</div>
                    </Td>
                    <Td className="font-semibold text-slate-700 dark:text-slate-300">
                      {l.organizations?.name || "Global Tenant"}
                    </Td>
                    <Td>
                      <div className="font-extrabold text-ink dark:text-white">{formatINR(l.amount)}</div>
                      <div className="text-xs text-ink-slate truncate max-w-[180px] font-medium">{l.purpose}</div>
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          l.status === "approved" || l.status === "active" || l.status === "completed"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                            : l.status === "pending"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40"
                        }`}
                      >
                        {l.status}
                      </span>
                    </Td>
                    <Td className="text-xs text-ink-slate font-medium">{formatDate(l.created_at)}</Td>
                    <Td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {(l.disbursal_proof_url || l.repayment_proof_url) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              viewProof(
                                l.disbursal_proof_url || l.repayment_proof_url,
                                `Proof Artifact - Loan ₹${l.amount}`
                              )
                            }
                          >
                            <Eye className="h-3.5 w-3.5" /> Proof
                          </Button>
                        )}

                        {l.status === "pending" && (
                          <>
                            <Button variant="primary" size="sm" onClick={() => openOverrideModal(l, "approved")}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => openOverrideModal(l, "rejected")}>
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}

                        {l.status === "approved" && (
                          <Button variant="accent" size="sm" onClick={() => openOverrideModal(l, "active")}>
                            <Wallet className="h-3.5 w-3.5" /> Disburse
                          </Button>
                        )}

                        {l.status === "active" && (
                          <Button variant="secondary" size="sm" onClick={() => openOverrideModal(l, "completed")}>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Complete
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredLoans.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal 1: Status Override */}
      <Modal open={overrideModalOpen} onClose={() => setOverrideModalOpen(false)} title="Admin Status Override">
        <form onSubmit={executeSingleOverride} className="space-y-4">
          <p className="text-xs text-ink-slate font-medium">
            Overriding status for <strong>{targetLoan?.borrowers?.full_name || targetLoan?.borrowers?.email}</strong> (
            {formatINR(targetLoan?.amount || 0)}).
          </p>

          <Field label="Target Status" htmlFor="targetStatus">
            <Select
              id="targetStatus"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="approved">Approved</option>
              <option value="active">Disbursed / Active</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Field>

          {newStatus === "rejected" && (
            <Field label="Rejection Reason" htmlFor="overrideReason">
              <Input
                id="overrideReason"
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Enter administrative rejection note..."
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

      {/* Modal 2: Bulk Action */}
      <Modal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title={`Confirm Bulk ${bulkActionType}`}>
        <div className="space-y-4">
          <p className="text-sm text-ink-slate leading-relaxed font-medium">
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
