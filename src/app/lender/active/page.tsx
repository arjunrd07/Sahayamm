"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs } from "@/components/ui/tabs";
import { Table, Thead, Tr, Th, Td, EmptyState } from "@/components/ui/table";
import { LoanStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import type { Loan } from "@/types/database";
import { UploadCloud, FileText } from "lucide-react";
import { uploadDisbursalProof, verifyRepaymentAndComplete } from "../loans/actions";
import Link from "next/link";

type TabValue = "awaiting_disbursal" | "active";

export default function AdminActiveLoansPage() {
  const [loans, setLoans] = useState<(Loan & { customer?: { full_name: string } })[]>([]);
  const [tab, setTab] = useState<TabValue>("awaiting_disbursal");
  const [disbursing, setDisbursing] = useState<Loan | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { push } = useToast();
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("loans")
      .select("*, customer:profiles!loans_customer_id_fkey(full_name)")
      .in("status", ["approved", "active"])
      .order("created_at", { ascending: false });
    setLoans((data as any) || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const awaiting = loans.filter((l) => l.status === "approved");
  const active = loans.filter((l) => l.status === "active");
  const filtered = tab === "awaiting_disbursal" ? awaiting : active;

  async function handleDisburse() {
    if (!disbursing || !file) {
      push("error", "Choose a proof-of-payment file.");
      return;
    }
    setSubmitting(true);
    try {
      const path = `${disbursing.org_id}/${disbursing.customer_id}/disbursal-${disbursing.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (uploadError) throw uploadError;

      const result = await uploadDisbursalProof(disbursing.id, path);
      if ("error" in result && result.error) throw new Error(result.error);

      push("success", "Loan marked active. Customer notified.");
      setDisbursing(null);
      setFile(null);
      load();
    } catch (err: any) {
      push("error", err.message || "Could not upload proof.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(loan: Loan) {
    setSubmitting(true);
    const result = await verifyRepaymentAndComplete(loan.id);
    setSubmitting(false);
    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }
    push("success", "Loan marked completed.");
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Active Loans</h2>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "awaiting_disbursal", label: "Awaiting disbursal", count: awaiting.length },
          { value: "active", label: "Active", count: active.length },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" description="Approved loans waiting for disbursal, or active loans, show up here." />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Customer</Th>
              <Th>Amount</Th>
              <Th>Due date</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((loan) => (
              <Tr key={loan.id}>
                <Td>
                  <Link href={`/admin/loans/${loan.id}`} className="font-medium hover:text-accent">
                    {(loan as any).customer?.full_name || "—"}
                  </Link>
                </Td>
                <Td>{formatINR(loan.amount)}</Td>
                <Td>{loan.due_date ? formatDate(loan.due_date) : "—"}</Td>
                <Td>
                  <LoanStatusBadge status={loan.status} />
                </Td>
                <Td>
                  {loan.status === "approved" && (
                    <Button variant="secondary" onClick={() => setDisbursing(loan)}>
                      Upload disbursal proof
                    </Button>
                  )}
                  {loan.status === "active" && loan.repayment_proof_url && (
                    <Button variant="primary" loading={submitting} onClick={() => handleComplete(loan)}>
                      Verify & complete
                    </Button>
                  )}
                  {loan.status === "active" && !loan.repayment_proof_url && (
                    <span className="text-xs text-muted">Awaiting repayment proof</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={!!disbursing}
        onClose={() => setDisbursing(null)}
        title="Upload disbursal proof"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisbursing(null)}>
              Cancel
            </Button>
            <Button loading={submitting} onClick={handleDisburse}>
              Confirm & activate loan
            </Button>
          </>
        }
      >
        <label className="flex items-center gap-3 rounded-xl border border-dashed border-surface-border dark:border-surface-border-dark px-4 py-4 cursor-pointer hover:bg-surface/60 dark:hover:bg-white/5">
          {file ? (
            <FileText className="h-5 w-5 text-accent shrink-0" />
          ) : (
            <UploadCloud className="h-5 w-5 text-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">Proof of payment</p>
            <p className="text-xs text-muted truncate">{file ? file.name : "UTR screenshot or receipt"}</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </label>
      </Modal>
    </div>
  );
}
