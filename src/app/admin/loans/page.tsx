"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, MetricCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, Thead, Th, Tr, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import {
  Search,
  Building2,
  MapPin,
  Eye,
  Wallet,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  FileText,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { Organization, Campus } from "@/types/database";
import { adminOverrideLoanStatus, getAdminLoansData } from "./actions";
import { AgreementTemplateViewer, AgreementData } from "@/components/agreements/AgreementTemplateViewer";

interface LoanDetail {
  id: string;
  amount: number;
  purpose: string;
  duration_days: number;
  calculated_interest: number;
  interest_rate_annual: number;
  total_repayment: number;
  due_date?: string | null;
  status: string;
  created_at: string;
  org_id: string;
  customer_id: string;
  admin_id?: string;
  disbursal_proof_url?: string;
  repayment_proof_url?: string;
  rejection_reason?: string;
  borrower?: {
    full_name: string;
    email: string;
    phone?: string | null;
    mobile_number?: string | null;
    pan_number?: string | null;
    employee_id?: string | null;
  };
  lender?: {
    full_name: string;
    email: string;
  };
  organization?: {
    name: string;
    code: string;
  };
  campus?: {
    name: string;
    code: string;
  };
  agreement?: {
    id: string;
    agreement_number: string;
    created_at: string;
  };
}

function AdminLoansContent() {
  const [loans, setLoans] = useState<LoanDetail[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");

  // Selected Loan for Detail Modal
  const [selectedLoan, setSelectedLoan] = useState<LoanDetail | null>(null);

  // Selected Agreement for Agreement Inspector Modal
  const [selectedAgreementData, setSelectedAgreementData] = useState<AgreementData | null>(null);

  // Status Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetLoan, setTargetLoan] = useState<LoanDetail | null>(null);
  const [newStatus, setNewStatus] = useState<string>("approved");
  const [overrideReason, setOverrideReason] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { push } = useToast();
  const supabase = createClient();

  async function loadLoansData() {
    setLoading(true);
    try {
      const res = await getAdminLoansData();
      const loansData = res.loans || [];
      const orgsData = res.organizations || [];
      const campusesData = res.campuses || [];
      const profilesData = res.profiles || [];
      const agreementsData = res.agreements || [];

      const orgsMap = new Map((orgsData || []).map((o: any) => [o.id, o]));
      const campusMap = new Map((campusesData || []).map((c: any) => [c.id, c]));
      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      const agreementsMap = new Map((agreementsData || []).map((a: any) => [a.loan_id, a]));

      if (loansData) {
        const mapped: LoanDetail[] = loansData.map((l: any) => {
          const borrower = profilesMap.get(l.customer_id);
          const lender = l.admin_id ? profilesMap.get(l.admin_id) : undefined;
          const org = orgsMap.get(l.org_id);
          const campus = borrower?.campus_id ? campusMap.get(borrower.campus_id) : undefined;
          const agreement = agreementsMap.get(l.id);

          return {
            ...l,
            borrower: borrower ? {
              full_name: borrower.full_name,
              email: borrower.email,
              phone: borrower.phone,
              mobile_number: borrower.mobile_number,
              pan_number: borrower.pan_number,
              employee_id: borrower.employee_id,
            } : undefined,
            lender: lender ? { full_name: lender.full_name, email: lender.email } : undefined,
            organization: org ? { name: org.name, code: org.code } : undefined,
            campus: campus ? { name: campus.name, code: campus.code } : undefined,
            agreement: agreement ? { id: agreement.id, agreement_number: agreement.agreement_number, created_at: agreement.created_at } : undefined,
          };
        });
        setLoans(mapped);
      }
      setOrganizations(orgsData || []);
      setCampuses(campusesData || []);
    } catch (err: any) {
      push("error", err.message || "Failed to load platform loans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoansData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function inspectAgreement(loan: LoanDetail) {
    const agData: AgreementData = {
      id: loan.agreement?.id,
      agreement_number: loan.agreement?.agreement_number || `SHY-${loan.id.slice(0, 8)}`,
      agreement_date: loan.agreement?.created_at ? new Date(loan.agreement.created_at).toLocaleDateString("en-IN") : new Date(loan.created_at).toLocaleDateString("en-IN"),
      organization_name: loan.organization?.name || "Sahayam Organization",
      lender_name: loan.lender?.full_name || "Authorized Organization Lender",
      lender_email: loan.lender?.email,
      borrower_name: loan.borrower?.full_name || loan.borrower?.email || "Borrower",
      borrower_email: loan.borrower?.email,
      employee_id: loan.borrower?.employee_id || "EMP-8842",
      pan_number: loan.borrower?.pan_number || undefined,
      loan_id: `LN-${loan.id.slice(0, 8)}`,
      loan_amount: loan.amount,
      interest_rate: loan.interest_rate_annual || 0,
      interest_amount: loan.calculated_interest,
      loan_duration: `${loan.duration_days} Days`,
      repayment_amount: loan.total_repayment,
      due_date: loan.due_date ? new Date(loan.due_date).toLocaleDateString("en-IN") : `${loan.duration_days} Days from disbursal`,
    };
    setSelectedAgreementData(agData);
  }

  async function handleExecuteOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!targetLoan) return;
    setUpdatingId(targetLoan.id);
    const res = await adminOverrideLoanStatus(targetLoan.id, newStatus, overrideReason);
    setUpdatingId(null);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push("success", `Loan status overridden to "${newStatus}".`);
    setOverrideModalOpen(false);
    loadLoansData();
  }

  const activeLoans = loans.filter((l) => l.status === "active");
  const overdueLoans = loans.filter((l) => l.status === "overdue" || (l.due_date && new Date(l.due_date) < new Date() && l.status === "active"));
  const totalVolume = loans.reduce((s, l) => s + (l.amount || 0), 0);
  const totalActiveRepayments = activeLoans.reduce((s, l) => s + (l.total_repayment || 0), 0);

  const filtered = loans.filter((l) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      l.purpose?.toLowerCase().includes(term) ||
      l.borrower?.full_name?.toLowerCase().includes(term) ||
      l.borrower?.email?.toLowerCase().includes(term) ||
      l.borrower?.pan_number?.toLowerCase().includes(term) ||
      l.lender?.full_name?.toLowerCase().includes(term) ||
      l.organization?.name?.toLowerCase().includes(term) ||
      l.campus?.name?.toLowerCase().includes(term) ||
      l.agreement?.agreement_number?.toLowerCase().includes(term) ||
      String(l.amount).includes(term);

    const isOverdueMatch = statusFilter === "overdue" && (l.status === "overdue" || (l.due_date && new Date(l.due_date) < new Date() && l.status === "active"));
    const matchesStatus =
      statusFilter === "all" ||
      isOverdueMatch ||
      l.status === statusFilter;

    const matchesOrg = orgFilter === "all" || l.org_id === orgFilter;
    const matchesCampus = campusFilter === "all" || (campuses.find((c) => c.id === campusFilter && c.org_id === l.org_id) !== undefined);

    return matchesSearch && matchesStatus && matchesOrg;
  });

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal/10 text-signal border border-signal/20 text-xs font-semibold mb-2">
            <Wallet className="h-3.5 w-3.5" /> Platform Credit Portfolio
          </div>
          <h1 className="text-2xl font-black text-ink dark:text-white tracking-tight">
            Platform Loans &amp; Agreement Oversight
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track all intra-organization loan requests, agreements, repayment due dates, and default risks.
          </p>
        </div>

        <Button variant="secondary" onClick={loadLoansData} className="rounded-xl text-xs gap-1.5 font-bold self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5 text-signal" /> Refresh Loans
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Volume Disbursed</span>
          <p className="text-2xl font-black text-ink dark:text-white">{formatINR(totalVolume)}</p>
          <p className="text-[11px] text-slate-500">{loans.length} Total Loans Processed</p>
        </div>

        <div className="card p-5 space-y-1 border-l-4 border-l-signal">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Outstanding Capital</span>
          <p className="text-2xl font-black text-signal">{formatINR(totalActiveRepayments)}</p>
          <p className="text-[11px] text-slate-500">{activeLoans.length} Loans Under Repayment</p>
        </div>

        <div className="card p-5 space-y-1 border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {loans.filter((l) => l.status === "pending").length}
          </p>
          <p className="text-[11px] text-amber-600 font-medium">Awaiting Lender Action</p>
        </div>

        <div className="card p-5 space-y-1 border-l-4 border-l-red-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expired / Overdue Loans</span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">{overdueLoans.length}</p>
          <p className="text-[11px] text-red-600 font-medium">Past Due Date Alert</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by borrower, email, phone, PAN, lender, org, campus, agreement ref, or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-ink dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium text-ink dark:text-white"
          >
            <option value="all">All Loan Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved (Awaiting Disbursal)</option>
            <option value="active">Active (Disbursed &amp; Repaying)</option>
            <option value="completed">Completed &amp; Settled</option>
            <option value="overdue">Overdue / Expired</option>
            <option value="rejected">Rejected Requests</option>
          </select>

          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium text-ink dark:text-white"
          >
            <option value="all">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.code})
              </option>
            ))}
          </select>

          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium text-ink dark:text-white"
          >
            <option value="all">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <Table>
        <Thead>
          <Tr>
            <Th>Borrower Contact &amp; Campus</Th>
            <Th>Organization &amp; Lender</Th>
            <Th>Purpose &amp; Agreement Ref</Th>
            <Th>Amount &amp; Interest</Th>
            <Th>Total Due</Th>
            <Th>Due Date &amp; Status</Th>
            <Th className="text-right">Actions</Th>
          </Tr>
        </Thead>
        <tbody>
          {filtered.length === 0 ? (
            <Tr>
              <Td colSpan={7}>
                <EmptyState
                  title="No loans found"
                  description="No loan records matched your search or filtering options."
                />
              </Td>
            </Tr>
          ) : (
            filtered.map((l) => {
              const isPastDue = l.due_date && new Date(l.due_date) < new Date() && (l.status === "active" || l.status === "overdue");
              return (
                <Tr key={l.id}>
                  <Td>
                    <div className="space-y-1">
                      <p className="font-bold text-ink dark:text-white text-xs">{l.borrower?.full_name || "Borrower"}</p>
                      <div className="text-[11px] text-slate-500 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" /> {l.borrower?.email}
                        </span>
                        {(l.borrower?.phone || l.borrower?.mobile_number) && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3 text-slate-400" /> {l.borrower?.phone || l.borrower?.mobile_number}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                          <MapPin className="h-3 w-3 text-signal" /> {l.campus?.name || "Main Campus"}
                        </span>
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1 font-bold text-ink dark:text-white">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{l.organization?.name || "Organization"}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Lender: <strong className="text-slate-700 dark:text-slate-300">{l.lender?.full_name || "Assigned Lender"}</strong>
                      </p>
                    </div>
                  </Td>

                  <Td>
                    <div className="text-xs space-y-0.5">
                      <p className="font-medium text-ink dark:text-white truncate max-w-[150px]">{l.purpose}</p>
                      {l.agreement ? (
                        <button
                          type="button"
                          onClick={() => inspectAgreement(l)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-signal hover:underline"
                        >
                          <FileText className="h-3 w-3" /> {l.agreement.agreement_number}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono italic">Agreement pending</span>
                      )}
                    </div>
                  </Td>

                  <Td>
                    <div className="text-xs space-y-0.5">
                      <p className="font-black text-signal text-sm">{formatINR(l.amount)}</p>
                      <p className="text-[11px] text-slate-500">
                        {l.duration_days} Days · {formatINR(l.calculated_interest || 0)} Int.
                      </p>
                    </div>
                  </Td>

                  <Td>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                      {formatINR(l.total_repayment)}
                    </span>
                  </Td>

                  <Td>
                    <div className="space-y-1">
                      <LoanStatusBadge status={l.status as any} />
                      {l.due_date && (
                        <div
                          className={`text-[11px] font-semibold flex items-center gap-1 ${
                            isPastDue ? "text-red-500 font-bold" : "text-slate-500"
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(l.due_date)}</span>
                          {isPastDue && <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-600 px-1 py-0.2 rounded font-bold">OVERDUE</span>}
                        </div>
                      )}
                    </div>
                  </Td>

                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLoan(l)}
                        className="rounded-xl text-xs gap-1 font-bold p-2 h-auto"
                        title="View Full Loan Record"
                      >
                        <Eye className="h-3.5 w-3.5 text-signal" />
                      </Button>

                      {l.agreement && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => inspectAgreement(l)}
                          className="rounded-xl text-xs gap-1 font-bold p-2 h-auto"
                          title="Inspect Agreement"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setTargetLoan(l);
                          setNewStatus(l.status);
                          setOverrideReason("");
                          setOverrideModalOpen(true);
                        }}
                        className="rounded-xl text-xs font-bold py-1 px-2.5 h-auto"
                        title="Override Loan Status"
                      >
                        Override
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Loan Detail Modal */}
      <Modal open={!!selectedLoan} onClose={() => setSelectedLoan(null)} title="Platform Loan Record Dossier">
        {selectedLoan && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Loan Purpose</span>
                <h3 className="text-base font-extrabold text-ink dark:text-white">{selectedLoan.purpose}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Ref: #{selectedLoan.id}</p>
              </div>
              <LoanStatusBadge status={selectedLoan.status as any} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Borrower</span>
                <strong className="text-ink dark:text-white text-xs">{selectedLoan.borrower?.full_name}</strong>
                <p className="text-slate-500 text-[11px]">{selectedLoan.borrower?.email}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Lender Officer</span>
                <strong className="text-ink dark:text-white text-xs">{selectedLoan.lender?.full_name || "Lender Pool"}</strong>
                <p className="text-slate-500 text-[11px]">{selectedLoan.lender?.email || selectedLoan.organization?.name}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Campus</span>
                <strong className="text-ink dark:text-white text-xs">{selectedLoan.campus?.name || "Main Campus"}</strong>
                <p className="text-slate-500 text-[11px]">{selectedLoan.organization?.name}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Principal Amount</span>
                <p className="text-sm font-black text-signal">{formatINR(selectedLoan.amount)}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Repayment</span>
                <p className="text-sm font-black text-emerald-600">{formatINR(selectedLoan.total_repayment)}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Due Date</span>
                <p className="text-xs font-bold text-ink dark:text-white">
                  {selectedLoan.due_date ? formatDate(selectedLoan.due_date) : "Pending"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" className="rounded-xl font-bold" onClick={() => setSelectedLoan(null)}>
                Close
              </Button>
              {selectedLoan.agreement && (
                <Button
                  variant="primary"
                  className="rounded-xl font-bold shadow-button gap-1.5"
                  onClick={() => {
                    const l = selectedLoan;
                    setSelectedLoan(null);
                    inspectAgreement(l);
                  }}
                >
                  <FileText className="h-4 w-4" /> Open Legal Agreement
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Full Agreement Inspector Modal */}
      <Modal
        open={!!selectedAgreementData}
        onClose={() => setSelectedAgreementData(null)}
        title={selectedAgreementData ? `Internal Lending Agreement · ${selectedAgreementData.agreement_number}` : "Agreement Inspector"}
      >
        {selectedAgreementData && (
          <div className="space-y-4">
            <AgreementTemplateViewer agreement={selectedAgreementData} />
            <div className="flex justify-end pt-2">
              <Button variant="secondary" className="rounded-xl font-bold" onClick={() => setSelectedAgreementData(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Override Status Modal */}
      <Modal open={overrideModalOpen} onClose={() => setOverrideModalOpen(false)} title="Administrative Status Override">
        {targetLoan && (
          <form onSubmit={handleExecuteOverride} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Manually update the lifecycle state of loan <strong>#{targetLoan.id.slice(0, 8)}</strong> ({targetLoan.purpose}).
            </p>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Target Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold text-ink dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="active">Active (Disbursed)</option>
                <option value="completed">Completed (Settled)</option>
                <option value="overdue">Overdue</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Override Directive Reason</label>
              <input
                type="text"
                placeholder="e.g. Audit settlement, manual bank disbursal confirmation, or policy adjustment"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                required
                className="w-full text-xs py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-ink dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button variant="secondary" type="button" onClick={() => setOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={!!updatingId} className="font-bold shadow-button">
                Apply Status Override
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function AdminLoansPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl pb-16">
          <div className="h-24 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </div>
      }
    >
      <AdminLoansContent />
    </Suspense>
  );
}
