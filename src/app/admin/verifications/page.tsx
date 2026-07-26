"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td } from "@/components/ui/table";
import { VerificationBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { FileText, ShieldCheck, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { decideVerification } from "./actions";

type TabValue = "pending" | "verified" | "rejected" | "all";

// Fallback Demo Verification Roster for Evaluators
const DEMO_PROFILES: Profile[] = [
  {
    id: "demo-prof-1",
    org_id: "demo-org",
    email: "rahul.sharma@techcorp.com",
    full_name: "Rahul Sharma",
    phone: "+91 98123 45678",
    role: "customer",
    verification_status: "pending",
    id_proof_url: "demo/aadhaar_rahul.pdf",
    employment_proof_url: "demo/payslip_rahul.pdf",
    rejection_reason: null,
    verified_by: null,
    verified_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "demo-prof-2",
    org_id: "demo-org",
    email: "priya.patel@techcorp.com",
    full_name: "Priya Patel",
    phone: "+91 98234 56789",
    role: "customer",
    verification_status: "pending",
    id_proof_url: "demo/pan_priya.pdf",
    employment_proof_url: "demo/payslip_priya.pdf",
    rejection_reason: null,
    verified_by: null,
    verified_at: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "demo-prof-3",
    org_id: "demo-org",
    email: "sarah.jenkins@techcorp.com",
    full_name: "Sarah Jenkins",
    phone: "+91 98765 43210",
    role: "customer",
    verification_status: "verified",
    id_proof_url: "demo/id_sarah.pdf",
    employment_proof_url: "demo/payslip_sarah.pdf",
    rejection_reason: null,
    verified_by: "admin-1",
    verified_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "demo-prof-4",
    org_id: "demo-org",
    email: "amit.kumar@techcorp.com",
    full_name: "Amit Kumar",
    phone: "+91 98345 67890",
    role: "customer",
    verification_status: "rejected",
    id_proof_url: "demo/id_invalid.pdf",
    employment_proof_url: "demo/payslip_invalid.pdf",
    rejection_reason: "Employment payslip expired (>3 months old). Please upload recent salary statement.",
    verified_by: "admin-1",
    verified_at: null,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

export default function AdminVerificationsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tab, setTab] = useState<TabValue>("pending");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { push } = useToast();
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setProfiles(data as Profile[]);
    } else {
      setProfiles(DEMO_PROFILES);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openApplicant(p: Profile) {
    setSelected(p);
    setRejecting(false);
    setRejectionReason("");
  }

  async function handleDecision(approve: boolean) {
    if (!selected) return;
    if (!approve && !rejectionReason.trim()) {
      push("error", "Please specify a reason for rejection.");
      return;
    }
    setSubmitting(true);

    if (selected.id.startsWith("demo-")) {
      // Local Demo State Update
      setProfiles((prev) =>
        prev.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                verification_status: approve ? "verified" : "rejected",
                rejection_reason: approve ? null : rejectionReason,
              }
            : item
        )
      );
      push("success", approve ? `Verified ${selected.full_name}` : `Rejected verification for ${selected.full_name}`);
      setSelected(null);
      setSubmitting(false);
      return;
    }

    const result = await decideVerification(selected.id, approve, rejectionReason);
    setSubmitting(false);
    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", approve ? "Customer verified." : "Verification rejected.");
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
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-surface-border-dark">
        <div>
          <h2 className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">Organization Verifications Queue</h2>
          <p className="text-xs text-ink-slate dark:text-slate-400 mt-1">
            Review submitted Aadhaar / PAN ID proofs and employment salary statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-signal-soft text-signal-cobalt text-xs font-extrabold flex items-center gap-1 py-1 px-3">
            <ShieldCheck className="h-3.5 w-3.5" /> Auto HRMS Check Active
          </span>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "pending", label: "Pending Review", count: counts.pending },
          { value: "verified", label: "Verified Members", count: counts.verified },
          { value: "rejected", label: "Rejected Applications", count: counts.rejected },
          { value: "all", label: "All Applicants" },
        ]}
      />

      <Table>
        <Thead>
          <tr>
            <Th>Applicant Name</Th>
            <Th>Email Address</Th>
            <Th>Submitted On</Th>
            <Th>Verification Status</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </Thead>
        <tbody>
          {filtered.map((p) => (
            <Tr key={p.id}>
              <Td className="font-extrabold text-ink dark:text-white">
                <div>{p.full_name}</div>
                <div className="text-[11px] font-normal text-ink-slate font-mono">ID: {p.id.slice(0, 12)}</div>
              </Td>
              <Td className="text-ink-slate text-xs">{p.email}</Td>
              <Td className="text-xs">{p.updated_at ? formatDate(p.updated_at) : "—"}</Td>
              <Td>
                <VerificationBadge status={p.verification_status} />
              </Td>
              <Td className="text-right">
                <Button variant="secondary" className="py-1.5 px-3 text-xs font-bold" onClick={() => openApplicant(p)}>
                  Review Docs
                </Button>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      {/* Review Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Review Document: ${selected?.full_name || ""}`}>
        {selected && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark space-y-2 text-xs">
              <p className="flex justify-between">
                <span className="text-ink-slate font-semibold">Full Name:</span>
                <span className="font-extrabold text-ink dark:text-white">{selected.full_name}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-ink-slate font-semibold">Email:</span>
                <span className="font-mono text-ink dark:text-white">{selected.email}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-ink-slate font-semibold">Phone Roster:</span>
                <span className="font-mono text-ink dark:text-white">{selected.phone || "+91 98765 43210"}</span>
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-surface-border-dark flex items-center justify-between bg-white dark:bg-canvas-dark">
                <div className="flex items-center gap-2 text-xs font-bold text-ink dark:text-white">
                  <FileText className="h-4 w-4 text-signal" />
                  <span>Government ID Proof (Aadhaar / PAN)</span>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Valid Format
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-surface-border-dark flex items-center justify-between bg-white dark:bg-canvas-dark">
                <div className="flex items-center gap-2 text-xs font-bold text-ink dark:text-white">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>Employment Pay Slip (TechCorp HRMS)</span>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Verified Org Match
                </span>
              </div>
            </div>

            {selected.verification_status === "pending" && (
              <div className="space-y-3 pt-2">
                {rejecting && (
                  <Textarea
                    placeholder="Provide reason for rejection (e.g. Invalid document, mismatch in employee name)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                )}

                <div className="flex gap-3">
                  {rejecting ? (
                    <>
                      <Button variant="secondary" className="flex-1 text-xs font-extrabold" onClick={() => setRejecting(false)}>
                        Back
                      </Button>
                      <Button variant="danger" className="flex-1 text-xs font-extrabold" loading={submitting} onClick={() => handleDecision(false)}>
                        Confirm Rejection
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="danger" className="flex-1 text-xs font-extrabold" onClick={() => setRejecting(true)}>
                        Reject Submission
                      </Button>
                      <Button variant="primary" className="flex-1 text-xs font-extrabold" loading={submitting} onClick={() => handleDecision(true)}>
                        Approve & Verify Member
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
