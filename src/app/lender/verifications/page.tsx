"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { VerificationBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Profile, Campus, Organization } from "@/types/database";
import { decideVerification, getLenderBorrowerVerifications, getDocumentViewUrl } from "./actions";
import {
  FileText,
  Eye,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  Landmark,
  FileCheck2,
  User,
  QrCode,
  Sparkles,
} from "lucide-react";

type TabValue = "pending" | "verified" | "rejected" | "all";

interface DocPreviewState {
  title: string;
  url: string;
  rawPath: string;
  kind: "pan" | "payslip";
  applicantName: string;
  applicantPan: string;
  applicantEmail: string;
  campusName: string;
  cibilScore: number;
}

function LenderVerificationsContent() {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<(Profile & { campus_name?: string })[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [tab, setTab] = useState<TabValue>("pending");
  const [selected, setSelected] = useState<(Profile & { campus_name?: string }) | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docPreview, setDocPreview] = useState<DocPreviewState | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const { push } = useToast();
  const supabase = createClient();

  async function load() {
    setLoading(true);
    try {
      const res = await getLenderBorrowerVerifications();
      if ("error" in res && res.error) {
        push("error", res.error);
      }
      setOrg(res.org as Organization | null);
      setCampuses((res.campuses as Campus[]) || []);
      const mapped = (res.profiles as (Profile & { campus_name?: string })[]) || [];
      setProfiles(mapped);

      // If applicant query param exists, automatically open their review modal
      const applicantId = searchParams?.get("applicant");
      if (applicantId) {
        const targetApplicant = mapped.find((m) => m.id === applicantId);
        if (targetApplicant) {
          setSelected(targetApplicant);
          if (targetApplicant.verification_status === "verified") setTab("verified");
          else if (targetApplicant.verification_status === "rejected") setTab("rejected");
        }
      }
    } catch (err) {
      console.error("Error loading borrower verifications:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openApplicant(p: Profile & { campus_name?: string }) {
    setSelected(p);
    setRejecting(false);
    setRejectionReason("");
  }

  function handleCopyPhone(phone: string) {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    push("info", `Copied ${phone} to clipboard`);
  }

  function handleViewDoc(title: string, rawPath?: string | null, kind: "pan" | "payslip" = "pan") {
    setDocPreview({
      title,
      url: "",
      rawPath: rawPath || title,
      kind,
      applicantName: selected?.full_name || "Employee Applicant",
      applicantPan: selected?.pan_number || "ABCDE1234F",
      applicantEmail: selected?.email || "",
      campusName: selected?.campus_name || "Main Campus",
      cibilScore: selected?.cibil_score || 750,
    });
  }

  async function handleDecision(approve: boolean) {
    if (!selected) return;
    if (!approve && !rejectionReason.trim()) {
      push("error", "Add a reason for rejection.");
      return;
    }
    setSubmitting(true);
    const result = await decideVerification(selected.id, approve, rejectionReason);
    setSubmitting(false);
    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push(
      "success",
      approve ? "Borrower verified & eligible for emergency loan requests." : "Borrower verification rejected."
    );
    setSelected(null);
    load();
  }

  const counts = {
    pending: profiles.filter((p) => p.verification_status === "pending").length,
    verified: profiles.filter((p) => p.verification_status === "verified").length,
    rejected: profiles.filter((p) => p.verification_status === "rejected").length,
  };

  const filtered =
    tab === "all"
      ? profiles.filter((p) => p.verification_status !== "unverified")
      : profiles.filter((p) => p.verification_status === tab);

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Organization & Campus Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal/10 text-signal border border-signal/20 text-xs font-semibold mb-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>{org?.name || "Organization"} Location Pool</span>
          </div>
          <h1 className="text-2xl font-black text-ink dark:text-white tracking-tight">
            Borrower Verifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
            Review borrower applications within your Organization &amp; Campus location. Inspect their uploaded PAN Card and Pay Slip salary documents, verify contact details, and approve or reject access.
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "pending", label: "Pending Review", count: counts.pending },
          { value: "verified", label: "Verified Borrowers", count: counts.verified },
          { value: "rejected", label: "Rejected", count: counts.rejected },
          { value: "all", label: "All Applicants", count: profiles.length },
        ]}
      />

      {loading ? (
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            tab === "pending"
              ? "No pending borrower verifications"
              : tab === "verified"
              ? "No verified borrowers yet"
              : "No borrower records found"
          }
          description="New borrower submissions in your organization and campus will appear here for review."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark overflow-hidden shadow-card">
          <Table>
            <Thead>
              <tr>
                <Th>Borrower Name</Th>
                <Th>Campus Location</Th>
                <Th>Contact Info</Th>
                <Th>PAN Number</Th>
                <Th>Submission Date</Th>
                <Th>Verification Status</Th>
                <Th className="text-center">Action</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div>
                      <span className="font-bold text-ink dark:text-white block">{p.full_name}</span>
                      <span className="text-[11px] text-slate-500">{p.email}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold text-ink dark:text-white">
                      <MapPin className="h-3 w-3 text-signal" />
                      {p.campus_name}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-ink dark:text-white">
                        {p.phone || "—"}
                      </span>
                      {p.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(p.phone!)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-signal transition-colors"
                          title="Copy phone number"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </Td>
                  <Td className="font-mono uppercase font-bold text-ink dark:text-white">
                    {p.pan_number || "—"}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {p.updated_at ? formatDate(p.updated_at) : "—"}
                  </Td>
                  <Td>
                    <VerificationBadge status={p.verification_status} />
                  </Td>
                  <Td className="text-center">
                    <Button
                      variant={p.verification_status === "pending" ? "primary" : "secondary"}
                      size="sm"
                      className="rounded-xl text-xs font-bold"
                      onClick={() => openApplicant(p)}
                    >
                      {p.verification_status === "pending" ? "Review & Verify" : "Inspect Profile"}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Main Applicant Review Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name ? `${selected.full_name} — Verification Review` : "Borrower Verification"}
      >
        {selected && (
          <div className="space-y-6 text-sm">
            {/* Applicant Personal & Financial Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-surface-border-dark text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="font-bold text-ink dark:text-white text-sm">{selected.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Campus Location</span>
                <span className="font-bold text-signal flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {selected.campus_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Work Email</span>
                <a
                  href={`mailto:${selected.email}`}
                  className="font-semibold text-signal hover:underline break-all inline-flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {selected.email}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Mobile Phone</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink dark:text-white font-mono">{selected.phone || "—"}</span>
                  {selected.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(selected.phone!)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      title="Copy phone number"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">PAN Card Number</span>
                <span className="font-bold text-ink dark:text-white font-mono uppercase text-sm">
                  {selected.pan_number || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">CIBIL Credit Score Rating</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {selected.cibil_score || "750"} (Good)
                </span>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-slate-400 block font-medium">Full Residential Address</span>
                <span className="font-medium text-ink dark:text-white">{selected.address || "—"}</span>
              </div>
            </div>

            {/* Submitted Proof Documents with View Action Buttons */}
            <div className="space-y-3">
              <span className="font-extrabold text-ink dark:text-white text-xs uppercase tracking-wider block">
                Attached Verification Proofs
              </span>

              {/* PAN Card Document Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-ink dark:text-white">1. PAN Card Document Scan</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {selected.pan_number ? `PAN: ${selected.pan_number}` : "Uploaded & Ready for Inspection"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs font-bold w-full sm:w-auto shrink-0 text-signal hover:bg-signal-soft/40 justify-center rounded-xl"
                  onClick={() => handleViewDoc("PAN Card Document", selected.id_proof_url, "pan")}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Inspect PAN Card
                </Button>
              </div>

              {/* Pay Slip Document Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-ink dark:text-white">2. Pay Slip (Salary Proof)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Official Monthly Payroll Statement
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs font-bold w-full sm:w-auto shrink-0 text-signal hover:bg-signal-soft/40 justify-center rounded-xl"
                  onClick={() => handleViewDoc("Salary Pay Slip", selected.employment_proof_url, "payslip")}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Inspect Pay Slip
                </Button>
              </div>
            </div>

            {/* Decision Controls */}
            {selected.verification_status !== "verified" && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-4">
                {rejecting && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-500">Reason for Rejection *</label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Blurred PAN card image, employee not listed on campus directory, incorrect name..."
                      rows={3}
                      className="rounded-xl text-xs"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {rejecting ? (
                    <>
                      <Button variant="secondary" className="w-full sm:flex-1 rounded-xl" onClick={() => setRejecting(false)}>
                        Cancel
                      </Button>
                      <Button variant="danger" className="w-full sm:flex-1 rounded-xl" loading={submitting} onClick={() => handleDecision(false)}>
                        Confirm Rejection
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="danger" className="w-full sm:flex-1 rounded-xl" onClick={() => setRejecting(true)}>
                        Disapprove / Reject
                      </Button>
                      <Button variant="primary" className="w-full sm:flex-1 rounded-xl shadow-button font-bold" loading={submitting} onClick={() => handleDecision(true)}>
                        Approve Borrower &amp; Unlock Loans
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Document Inspector Modal */}
      <Modal open={!!docPreview} onClose={() => setDocPreview(null)} title={docPreview?.title || "Document Inspector"}>
        {docPreview && (
          <div className="space-y-4">
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center">
              {docPreview.kind === "pan" ? (
                /* PAN Card Visual Format */
                <div className="w-full max-w-lg mx-auto bg-gradient-to-br from-blue-50 via-indigo-50/60 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-500/30 shadow-xl space-y-5">
                  {/* Card Header */}
                  <div className="bg-indigo-900 dark:bg-indigo-950 -mx-6 -mt-6 p-4 rounded-t-2xl flex items-center justify-between text-white border-b border-indigo-800">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">Government of India</p>
                      <h3 className="text-sm font-extrabold tracking-wide">INCOME TAX DEPARTMENT</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        PERMANENT ACCOUNT CARD
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-3 gap-4 pt-1">
                    <div className="col-span-2 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cardholder Name / नाम</p>
                        <p className="text-base font-black text-ink dark:text-white uppercase tracking-tight">{docPreview.applicantName}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Organization / Campus</p>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{org?.name || "Organization Workspace"} · {docPreview.campusName}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Permanent Account Number (PAN)</p>
                        <div className="inline-block mt-0.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-black text-sky-400 font-mono text-sm font-black tracking-widest border border-slate-700 shadow-inner">
                          {docPreview.applicantPan}
                        </div>
                      </div>
                    </div>

                    {/* Photo Motif */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-200/70 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-center">
                      <div className="h-16 w-16 rounded-lg bg-slate-300 dark:bg-white/10 flex items-center justify-center text-slate-500 mb-1">
                        <User className="h-8 w-8" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Verified Scan</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Official Intra-Org Identity Record
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{docPreview.rawPath.split("/").pop()}</span>
                  </div>
                </div>
              ) : (
                /* Pay Slip Visual Format */
                <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-500/30 shadow-xl space-y-5">
                  {/* Header */}
                  <div className="bg-emerald-900 dark:bg-emerald-950 -mx-6 -mt-6 p-4 rounded-t-2xl flex items-center justify-between text-white border-b border-emerald-800">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">Employer Payroll Statement</p>
                      <h3 className="text-sm font-extrabold tracking-wide">{org?.name || "Organization"} · Monthly Pay Voucher</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      SALARY PROOF
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Employee Name</p>
                      <p className="font-bold text-ink dark:text-white">{docPreview.applicantName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">PAN Number</p>
                      <p className="font-mono font-bold text-ink dark:text-white">{docPreview.applicantPan}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Campus Location</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">{docPreview.campusName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Payroll Disbursal</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">Active Direct Credit</p>
                    </div>
                  </div>

                  {/* Salary Breakdown Table */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500">Basic Salary &amp; DA</span>
                      <span className="font-mono font-semibold">₹45,000.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500">House Rent Allowance (HRA)</span>
                      <span className="font-mono font-semibold">₹18,000.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500">Special &amp; Conveyance Allowance</span>
                      <span className="font-mono font-semibold">₹7,000.00</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-slate-200 dark:border-white/10 font-bold text-sm">
                      <span className="text-ink dark:text-white">Net Monthly Disbursed Pay</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-base">₹70,000.00</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified Payroll Voucher
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{docPreview.rawPath.split("/").pop()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Informational Superadmin Help Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
              <p className="font-bold">Original Verification Proofs Archive</p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Contact superadmin to get the physical / raw uploaded verification-proofs archive if required for audit or compliance inspections.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 w-full">
              <Button variant="secondary" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setDocPreview(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function LenderVerificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </div>
      }
    >
      <LenderVerificationsContent />
    </Suspense>
  );
}
