"use client";

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
import { FileText } from "lucide-react";
import { decideVerification } from "./actions";

type TabValue = "pending" | "verified" | "rejected" | "all";

export default function AdminVerificationsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tab, setTab] = useState<TabValue>("pending");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<{ id?: string; employment?: string }>({});
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

    const { data: myProfile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
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
    const urls: { id?: string; employment?: string } = {};
    if (p.id_proof_url) {
      const { data } = await supabase.storage.from("verification-docs").createSignedUrl(p.id_proof_url, 600);
      urls.id = data?.signedUrl || p.id_proof_url;
    }
    if (p.employment_proof_url) {
      const { data } = await supabase.storage
        .from("verification-docs")
        .createSignedUrl(p.employment_proof_url, 600);
      urls.employment = data?.signedUrl || p.employment_proof_url;
    }
    setDocs(urls);
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
    push("success", approve ? "Borrower verified." : "Verification rejected.");
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
      <h2 className="text-xl font-semibold">Borrower Verifications</h2>
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
            <div className="grid grid-cols-2 gap-3 bg-surface-pebble dark:bg-white/5 p-3 rounded-xl">
              <div>
                <span className="text-xs text-muted block">Full Name</span>
                <span className="font-semibold">{selected.full_name}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">Email</span>
                <span className="font-semibold break-all">{selected.email}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">Phone</span>
                <span className="font-semibold">{selected.phone || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">PAN Number</span>
                <span className="font-mono font-semibold">{selected.pan_number || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">CIBIL Score</span>
                <span className="font-semibold">{selected.cibil_score || "—"}</span>
              </div>
              <div>
                <span className="text-xs text-muted block">Verification Status</span>
                <VerificationBadge status={selected.verification_status} />
              </div>
            </div>

            {selected.address && (
              <div>
                <span className="text-xs text-muted block mb-1">Address</span>
                <p className="p-2.5 bg-surface-pebble dark:bg-white/5 rounded-lg text-xs">{selected.address}</p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <DocLink label="Government ID proof" href={docs.id} />
              <DocLink label="Employment proof" href={docs.employment} />
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
                        Approve Borrower
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

function DocLink({ label, href }: { label: string; href?: string }) {
  if (!href) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <FileText className="h-4 w-4" /> {label} — not uploaded
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-sm text-accent hover:underline font-medium"
    >
      <FileText className="h-4 w-4" /> {label}
    </a>
  );
}

