"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, Thead, Th, Tr, Td, EmptyState } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { formatINR, formatDate } from "@/lib/utils";
import {
  FileText,
  ShieldCheck,
  Search,
  ExternalLink,
  Printer,
  Sparkles,
  Eye,
  FileSignature,
  Building2,
  Calendar,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { AgreementTemplateViewer, AgreementData } from "@/components/agreements/AgreementTemplateViewer";

interface BorrowerAgreementItem {
  id: string;
  agreement_number: string;
  pdf_url?: string;
  status: string;
  created_at: string;
  loan_id: string;
  loan?: {
    id: string;
    amount: number;
    interest_rate_annual: number;
    calculated_interest: number;
    duration_days: number;
    total_repayment: number;
    due_date?: string | null;
    purpose: string;
    status: string;
    created_at: string;
    admin_id?: string;
  };
  borrower?: {
    full_name: string;
    email: string;
    employee_id?: string;
    pan_number?: string;
  };
  lender?: {
    full_name: string;
    email: string;
  };
  organization?: {
    name: string;
  };
}

function BorrowerAgreementsContent() {
  const [agreements, setAgreements] = useState<BorrowerAgreementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementData | null>(null);
  const supabase = createClient();

  async function loadAgreements() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: borrowerProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!borrowerProfile) return;

      const [{ data: agsData }, { data: loansData }, { data: orgData }, { data: lendersData }] = await Promise.all([
        supabase
          .from("agreements")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("loans").select("*").eq("customer_id", user.id),
        supabase.from("organizations").select("*").eq("id", borrowerProfile.org_id).maybeSingle(),
        supabase.from("profiles").select("id, full_name, email").in("role", ["lender", "admin"]),
      ]);

      const loansMap = new Map((loansData || []).map((l: any) => [l.id, l]));
      const lendersMap = new Map((lendersData || []).map((l: any) => [l.id, l]));
      const defaultLender = lendersData?.[0];

      // Filter agreements belonging to this borrower's loans
      const userAgreements: BorrowerAgreementItem[] = [];

      for (const ag of agsData || []) {
        const loan = loansMap.get(ag.loan_id);
        if (loan) {
          const lender = loan.admin_id ? lendersMap.get(loan.admin_id) : defaultLender;
          userAgreements.push({
            ...ag,
            loan,
            borrower: borrowerProfile,
            lender: lender || { full_name: "Authorized Organization Lender", email: "" },
            organization: orgData || { name: "Sahayam Organization" },
          });
        }
      }

      setAgreements(userAgreements);
    } catch (err) {
      console.error("Error loading borrower agreements:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgreements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = agreements.filter((ag) => {
    const term = search.toLowerCase();
    return (
      !term ||
      ag.agreement_number.toLowerCase().includes(term) ||
      ag.loan?.purpose.toLowerCase().includes(term) ||
      ag.lender?.full_name.toLowerCase().includes(term)
    );
  });

  function openInspector(item: BorrowerAgreementItem) {
    const l = item.loan;
    const agData: AgreementData = {
      id: item.id,
      agreement_number: item.agreement_number,
      agreement_date: item.created_at
        ? new Date(item.created_at).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN"),
      organization_name: item.organization?.name || "Sahayam Organization",
      lender_name: item.lender?.full_name || "Authorized Organization Lender",
      lender_email: item.lender?.email,
      borrower_name: item.borrower?.full_name || item.borrower?.email || "Borrower",
      borrower_email: item.borrower?.email,
      employee_id: item.borrower?.employee_id || "EMP-8842",
      pan_number: item.borrower?.pan_number,
      loan_id: l ? `LN-${l.id.slice(0, 8)}` : `LN-${item.loan_id.slice(0, 8)}`,
      loan_amount: l?.amount || 0,
      interest_rate: l?.interest_rate_annual || 0,
      interest_amount: l?.calculated_interest,
      loan_duration: `${l?.duration_days || 30} Days`,
      repayment_amount: l?.total_repayment || l?.amount || 0,
      due_date: l?.due_date
        ? new Date(l.due_date).toLocaleDateString("en-IN")
        : `${l?.duration_days || 30} Days from disbursal`,
    };
    setSelectedAgreement(agData);
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal/10 text-signal border border-signal/20 text-xs font-semibold mb-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Legal Records &amp; Contracts
          </div>
          <h1 className="text-2xl font-black text-ink dark:text-white tracking-tight">
            My Lending Agreements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access, inspect, and print your binding peer-to-peer lending agreements and repayment schedules.
          </p>
        </div>

        <Button variant="secondary" onClick={loadAgreements} className="rounded-xl text-xs gap-1.5 font-bold self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5 text-signal" /> Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="card p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search agreements by reference number or loan purpose..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-ink dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Agreements Table */}
      <Table>
        <Thead>
          <Tr>
            <Th>Agreement Reference</Th>
            <Th>Lender</Th>
            <Th>Loan Purpose &amp; Amount</Th>
            <Th>Total Repayment</Th>
            <Th>Due Date</Th>
            <Th>Date Executed</Th>
            <Th className="text-right">Action</Th>
          </Tr>
        </Thead>
        <tbody>
          {filtered.length === 0 ? (
            <Tr>
              <Td colSpan={7}>
                <EmptyState
                  title="No agreements found"
                  description="Agreements generated for your loan requests will appear here."
                />
              </Td>
            </Tr>
          ) : (
            filtered.map((ag) => (
              <Tr key={ag.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-signal/10 text-signal flex items-center justify-center font-bold shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-ink dark:text-white text-xs">{ag.agreement_number}</p>
                      <p className="text-[11px] text-slate-400 font-mono">Ref: #{ag.loan_id.slice(0, 8)}</p>
                    </div>
                  </div>
                </Td>

                <Td>
                  <div className="text-xs">
                    <p className="font-bold text-ink dark:text-white">{ag.lender?.full_name || "Organization Lender"}</p>
                    <p className="text-[11px] text-slate-400">{ag.organization?.name}</p>
                  </div>
                </Td>

                <Td>
                  <div className="text-xs">
                    <p className="font-medium text-ink dark:text-white truncate max-w-[160px]">{ag.loan?.purpose || "Emergency Loan"}</p>
                    <p className="font-black text-signal text-xs">{formatINR(ag.loan?.amount || 0)}</p>
                  </div>
                </Td>

                <Td>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                    {formatINR(ag.loan?.total_repayment || ag.loan?.amount || 0)}
                  </span>
                </Td>

                <Td>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {ag.loan?.due_date ? formatDate(ag.loan.due_date) : "—"}
                  </span>
                </Td>

                <Td>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatDate(ag.created_at)}
                  </span>
                </Td>

                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openInspector(ag)}
                      className="rounded-xl text-xs gap-1 font-bold shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5 text-signal" /> View Agreement
                    </Button>
                    <Link
                      href={`/borrower/loans/${ag.loan_id}`}
                      className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-signal hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      title="View loan details"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Full Agreement Inspector Modal */}
      <Modal
        open={!!selectedAgreement}
        onClose={() => setSelectedAgreement(null)}
        title={selectedAgreement ? `Internal Lending Agreement - ${selectedAgreement.agreement_number}` : "Agreement Document"}
      >
        {selectedAgreement && (
          <div className="space-y-4">
            <AgreementTemplateViewer agreement={selectedAgreement} />
            <div className="flex justify-end pt-2">
              <Button variant="secondary" className="rounded-xl font-bold" onClick={() => setSelectedAgreement(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function BorrowerAgreementsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-12">
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </div>
      }
    >
      <BorrowerAgreementsContent />
    </Suspense>
  );
}
