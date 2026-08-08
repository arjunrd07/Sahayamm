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

type TabValue = "pending" | "verified" | "rejected" | "all";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myProfile } = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();
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
    push("success", approve ? "Borrower verified & loan requests unlocked." : "Verification rejected.");
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
          <p className="text-xs text-muted">Review borrower details (sensitive PAN/Aadhaar information hidden per privacy policy).</p>
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
                <Td>{p.updated_at ? formatDate(p.updated_at) : "—"}</Td>
                <Td>
                  <VerificationBadge status={p.verification_status} />
                </Td>
                <Td>
                  <Button variant="secondary" onClick={() => openApplicant(p)}>
                    Review
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.full_name || "Borrower Profile"}>
        {selected && (
          <div className="space-y-4 text-sm">
            {/* Non-sensitive Disclosure Only: Name, Email, Phone */}
            <div className="grid grid-cols-2 gap-3 bg-surface-pebble dark:bg-white/5 p-4 rounded-xl border border-surface-border dark:border-surface-border-dark">
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
                <span className="text-xs text-muted block font-semibold">Verification Status</span>
                <VerificationBadge status={selected.verification_status} />
              </div>
            </div>

            {/* Submitted Proof Documents */}
            <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-ink dark:text-white block mb-1">Submitted Identity &amp; Employment Proofs</span>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-white/5">
                <span className="font-medium">• Government ID Proof:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selected.id_proof_url ? "Uploaded & Available" : "On Record"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1">
                <span className="font-medium">• Employee Pay Slip (Salary Slip ID Proof):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selected.employment_proof_url ? "Uploaded & Available" : "On Record"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-800 dark:text-blue-200">
              🔒 Sensitive identifiers (PAN, Aadhaar, CIBIL) are encrypted and restricted from lender view per privacy compliance rules.
            </div>

            {selected.verification_status === "pending" && (
              <>
                {rejecting && (
                  <Textarea
                    placeholder="Reason for rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                )}
                <div className="flex gap-3 pt-2">
                  {rejecting ? (
                    <>
                      <Button variant="secondary" className="flex-1" onClick={() => setRejecting(false)}>
                        Cancel
                      </Button>
                      <Button variant="danger" className="flex-1" loading={submitting} onClick={() => handleDecision(false)}>
                        Confirm Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="danger" className="flex-1" onClick={() => setRejecting(true)}>
                        Disapprove / Reject
                      </Button>
                      <Button variant="primary" className="flex-1" loading={submitting} onClick={() => handleDecision(true)}>
                        Approve & Unlock Credit
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
