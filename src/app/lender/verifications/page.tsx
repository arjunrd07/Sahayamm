"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { VerificationBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { decideVerification } from "./actions";
import { FileText, Eye, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react";

type TabValue = "pending" | "verified" | "rejected" | "all";

export default function AdminVerificationsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tab, setTab] = useState<TabValue>("pending");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docPreview, setDocPreview] = useState<{ title: string; url: string; rawPath: string } | null>(null);

  const { push } = useToast();
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
    if (!myProfile) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("org_id", myProfile.org_id)
      .in("role", ["borrower", "customer"])
      .order("created_at", { ascending: false });
    setProfiles((data as Profile[]) || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openApplicant(p: Profile) {
    setSelected(p);
    setRejecting(false);
    setRejectionReason("");
  }

  function handleViewDoc(title: string, rawPath?: string | null) {
    if (!rawPath) {
      push("error", `No ${title} file uploaded yet.`);
      return;
    }

    let finalUrl = rawPath;
    if (!rawPath.startsWith("http") && !rawPath.startsWith("data:")) {
      const { data } = supabase.storage.from("verification-docs").getPublicUrl(rawPath);
      finalUrl = data?.publicUrl || rawPath;
    }

    setDocPreview({ title, url: finalUrl, rawPath });
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
      approve ? "Borrower verified & loan requests unlocked." : "Verification rejected."
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Borrower Verifications</h2>
          <p className="text-xs text-muted">
            Inspect applicant details, view PAN card and pay slip documents, and approve or reject verification requests.
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "pending", label: "Pending", count: counts.pending },
          { value: "verified", label: "Verified", count: counts.verified },
          { value: "rejected", label: "Rejected", count: counts.rejected },
          { value: "all", label: "All" },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" description="Borrower submissions will show up in this view." />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>PAN Number</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium">{p.full_name}</Td>
                <Td>{p.email}</Td>
                <Td>{p.phone || "—"}</Td>
                <Td className="font-mono uppercase font-semibold">{p.pan_number || "—"}</Td>
                <Td>{p.updated_at ? formatDate(p.updated_at) : "—"}</Td>
                <Td>
                  <VerificationBadge status={p.verification_status} />
                </Td>
                <Td>
                  <Button variant="secondary" onClick={() => openApplicant(p)}>
                    Review Documents
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Main Applicant Review Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.full_name || "Borrower Profile Review"}>
        {selected && (
          <div className="space-y-5 text-sm">
            {/* Applicant Personal & Financial Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-pebble dark:bg-white/5 p-4 rounded-xl border border-surface-border dark:border-surface-border-dark text-xs">
              <div>
                <span className="text-xs text-muted block font-semibold">Full Name</span>
                <span className="font-bold text-ink dark:text-white">{selected.full_name}</span>
              </div>
              <div>
                <span className="text-xs text-muted block font-semibold">Work Email</span>
                <span className="font-semibold text-ink dark:text-white break-all">{selected.email}</span>
              </div>
              <div>
                <span className="text-xs text-muted block font-semibold">Phone Number</span>
                <span className="font-semibold text-ink dark:text-white">{selected.phone || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-muted block font-semibold">PAN Card Number</span>
                <span className="font-bold text-ink dark:text-white font-mono uppercase">{selected.pan_number || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-muted block font-semibold">CIBIL Credit Score</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{selected.cibil_score || "750"}</span>
              </div>
              <div>
                <span className="text-xs text-muted block font-semibold">Verification Status</span>
                <VerificationBadge status={selected.verification_status} />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-xs text-muted block font-semibold">Residential Address</span>
                <span className="font-medium text-ink dark:text-white">{selected.address || "—"}</span>
              </div>
            </div>

            {/* Submitted Proof Documents with View Action Buttons */}
            <div className="space-y-3">
              <span className="font-bold text-ink dark:text-white text-xs block">
                Uploaded Proof Documents
              </span>

              {/* PAN Card Document Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-ink dark:text-white">1. PAN Card Document</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {selected.id_proof_url ? "File Attached & Available" : "No file uploaded"}
                    </p>
                  </div>
                </div>

                {selected.id_proof_url ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs font-bold w-full sm:w-auto shrink-0 text-signal hover:bg-signal-soft/40 justify-center"
                    onClick={() => handleViewDoc("PAN Card Document", selected.id_proof_url)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View PAN Card
                  </Button>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Not Uploaded</span>
                )}
              </div>

              {/* Employee Pay Slip Document Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-ink dark:text-white">2. Employee Pay Slip (Salary Slip)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {selected.employment_proof_url ? "File Attached & Available" : "No file uploaded"}
                    </p>
                  </div>
                </div>

                {selected.employment_proof_url ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs font-bold w-full sm:w-auto shrink-0 text-signal hover:bg-signal-soft/40 justify-center"
                    onClick={() => handleViewDoc("Employee Pay Slip Document", selected.employment_proof_url)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View Pay Slip
                  </Button>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Not Uploaded</span>
                )}
              </div>
            </div>

            {/* Approval & Rejection Decision Actions */}
            {selected.verification_status === "pending" && (
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-3">
                {rejecting && (
                  <Textarea
                    placeholder="Reason for rejection (e.g. Unclear document scan, invalid salary slip)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  {rejecting ? (
                    <>
                      <Button variant="secondary" className="w-full sm:flex-1" onClick={() => setRejecting(false)}>
                        Cancel
                      </Button>
                      <Button variant="danger" className="w-full sm:flex-1" loading={submitting} onClick={() => handleDecision(false)}>
                        Confirm Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="danger" className="w-full sm:flex-1" onClick={() => setRejecting(true)}>
                        Disapprove / Reject
                      </Button>
                      <Button variant="primary" className="w-full sm:flex-1" loading={submitting} onClick={() => handleDecision(true)}>
                        Approve &amp; Unlock Credit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Document File Viewer Modal */}
      <Modal open={!!docPreview} onClose={() => setDocPreview(null)} title={docPreview?.title || "Document Viewer"}>
        {docPreview && (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 min-h-[200px] flex flex-col items-center justify-center space-y-3">
              {docPreview.url.startsWith("data:image") || docPreview.url.endsWith(".png") || docPreview.url.endsWith(".jpg") || docPreview.url.endsWith(".jpeg") ? (
                <img
                  src={docPreview.url}
                  alt={docPreview.title}
                  className="max-h-[320px] object-contain rounded-xl shadow-md border"
                />
              ) : (
                <div className="p-6 text-center space-y-2">
                  <FileText className="h-12 w-12 text-signal mx-auto" />
                  <p className="text-sm font-bold text-ink dark:text-white">{docPreview.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all max-w-md mx-auto">
                    {docPreview.rawPath}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-end pt-2 w-full">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setDocPreview(null)}>
                Close Preview
              </Button>

              <a
                href={docPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-signal hover:bg-signal-hover text-white text-xs font-bold shadow-sm gap-1.5 w-full sm:w-auto"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open File in New Tab
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
