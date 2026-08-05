"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils";
import { Building2, Plus, CheckCircle2, ShieldCheck, Power, Wallet, Users, Search } from "lucide-react";
import type { Organization, Profile } from "@/types/database";
import {
  createOrganization,
  toggleOrganizationStatus,
  updateOrganizationLiquidity,
  assignUserToOrganization,
} from "./actions";

interface OrgWithCounts extends Organization {
  borrowerCount: number;
  lenderCount: number;
  status: "active" | "inactive" | string;
}

export default function SuperadminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgWithCounts[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capitalLimit, setCapitalLimit] = useState(2500000);
  const [submitting, setSubmitting] = useState(false);

  // Liquidity Modal
  const [liquidityModalOpen, setLiquidityModalOpen] = useState(false);
  const [selectedOrgForLiquidity, setSelectedOrgForLiquidity] = useState<OrgWithCounts | null>(null);
  const [newLimitInput, setNewLimitInput] = useState(2500000);

  // Member Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrgForAssign, setSelectedOrgForAssign] = useState<OrgWithCounts | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Confirmation Modal for Deactivation
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [orgToToggle, setOrgToToggle] = useState<OrgWithCounts | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { push } = useToast();
  const supabase = createClient();

  async function loadOrgsData() {
    setLoading(true);
    const [{ data: orgsData }, { data: profilesData }] = await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, org_id, full_name, email, role"),
    ]);

    const rawOrgs: Organization[] = (orgsData as Organization[]) || [];
    const rawProfiles: Profile[] = (profilesData as Profile[]) || [];
    setProfiles(rawProfiles);

    const formatted: OrgWithCounts[] = rawOrgs.map((org) => {
      const orgUsers = rawProfiles.filter((p) => p.org_id === org.id);
      const borrowerCount = orgUsers.filter((p) => p.role === "borrower").length;
      const lenderCount = orgUsers.filter((p) => p.role === "lender" || (p.role as string) === "admin").length;

      return {
        ...org,
        status: (org as any).status || "active",
        capital_pool_limit: (org as any).max_loan_amount || org.capital_pool_limit || 2500000,
        borrowerCount,
        lenderCount,
      };
    });

    setOrganizations(formatted);
    setLoading(false);
  }

  useEffect(() => {
    loadOrgsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      push("error", "Organization name and code are required.");
      return;
    }
    setSubmitting(true);
    const result = await createOrganization(name, code, capitalLimit);
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Organization "${name}" registered successfully.`);
    setName("");
    setCode("");
    setCapitalLimit(2500000);
    setModalOpen(false);
    loadOrgsData();
  }

  function promptToggleStatus(org: OrgWithCounts) {
    setOrgToToggle(org);
    setConfirmModalOpen(true);
  }

  async function executeToggleStatus() {
    if (!orgToToggle) return;
    const org = orgToToggle;
    setTogglingId(org.id);
    const result = await toggleOrganizationStatus(org.id, org.status);
    setTogglingId(null);
    setConfirmModalOpen(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    const actionText = org.status === "active" ? "Deactivated (Soft deleted)" : "Reactivated";
    push("success", `Organization "${org.name}" ${actionText}.`);
    loadOrgsData();
  }

  function openLiquidityModal(org: OrgWithCounts) {
    setSelectedOrgForLiquidity(org);
    setNewLimitInput(org.capital_pool_limit || 2500000);
    setLiquidityModalOpen(true);
  }

  async function handleSaveLiquidity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrgForLiquidity) return;
    setSubmitting(true);
    const result = await updateOrganizationLiquidity(selectedOrgForLiquidity.id, Number(newLimitInput));
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Capital pool limit updated to ${formatINR(Number(newLimitInput))}.`);
    setLiquidityModalOpen(false);
    loadOrgsData();
  }

  function openAssignModal(org: OrgWithCounts) {
    setSelectedOrgForAssign(org);
    setSelectedUserId("");
    setAssignModalOpen(true);
  }

  async function handleAssignUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrgForAssign || !selectedUserId) {
      push("error", "Please select a user to assign.");
      return;
    }
    setSubmitting(true);
    const result = await assignUserToOrganization(selectedUserId, selectedOrgForAssign.id);
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", "Member assigned to organization successfully.");
    setAssignModalOpen(false);
    loadOrgsData();
  }

  const filteredOrgs = organizations.filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Organization Management Center</h2>
          <p className="text-sm text-ink-slate">Manage registered entities, soft deactivations, liquidity limits, and members.</p>
        </div>

        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm flex items-center gap-2 shadow-button">
          <Plus className="h-4 w-4" /> Register New Org
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-slate" />
        <input
          type="text"
          placeholder="Search organization name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-signal"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-48 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        </div>
      ) : filteredOrgs.length === 0 ? (
        <Card className="p-8 text-center text-ink-slate">
          No matching organizations found. Click &quot;Register New Org&quot; to add one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrgs.map((org) => {
            const isActive = org.status === "active";

            return (
              <Card key={org.id} className="p-6 border border-slate-200 dark:border-surface-border-dark">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-signal-soft text-signal flex items-center justify-center font-bold">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-ink dark:text-white">{org.name}</h3>
                      <p className="text-xs font-mono text-ink-slate">CODE: {org.code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`badge font-semibold text-xs flex items-center gap-1 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200"
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                      {isActive ? "Active" : "Inactive (Soft-Deleted)"}
                    </span>

                    <button
                      onClick={() => promptToggleStatus(org)}
                      disabled={togglingId === org.id}
                      className={`p-1.5 rounded-lg transition-colors text-xs font-bold ${
                        isActive
                          ? "hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-600"
                          : "hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-emerald-600"
                      }`}
                      title={isActive ? "Deactivate (Soft Delete)" : "Reactivate Organization"}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-center my-4">
                  <div>
                    <p className="text-[11px] text-ink-slate font-medium">Borrowers</p>
                    <p className="text-sm font-bold text-ink dark:text-white mt-0.5">{org.borrowerCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-slate font-medium">Lenders</p>
                    <p className="text-sm font-bold text-ink dark:text-white mt-0.5">{org.lenderCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-slate font-medium">Capital Pool</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatINR(org.capital_pool_limit || 2500000)}
                    </p>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between text-xs text-ink-slate pt-3 border-t border-surface-border dark:border-surface-border-dark gap-2">
                  <button
                    onClick={() => openLiquidityModal(org)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Wallet className="h-3.5 w-3.5" /> Adjust Liquidity
                  </button>

                  <button
                    onClick={() => openAssignModal(org)}
                    className="text-signal hover:underline font-bold flex items-center gap-1"
                  >
                    <Users className="h-3.5 w-3.5" /> Add Member
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Register New Org */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register New Organization">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Organization Name" htmlFor="orgName">
            <Input id="orgName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme FinTech Corp" />
          </Field>
          <Field label="Organization Code" htmlFor="orgCode">
            <Input id="orgCode" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. ACME" />
          </Field>
          <Field label="Capital Pool Limit (₹)" htmlFor="capitalLimit">
            <Input
              id="capitalLimit"
              type="number"
              required
              value={capitalLimit}
              onChange={(e) => setCapitalLimit(Number(e.target.value))}
              placeholder="2500000"
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" loading={submitting} type="submit">
              Register Org
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Adjust Liquidity Pool Limit */}
      <Modal open={liquidityModalOpen} onClose={() => setLiquidityModalOpen(false)} title={`Adjust Liquidity: ${selectedOrgForLiquidity?.name}`}>
        <form onSubmit={handleSaveLiquidity} className="space-y-4">
          <p className="text-xs text-ink-slate">
            Update the maximum capital liquidity pool limit for this organization.
          </p>
          <Field label="New Liquidity Limit (₹)" htmlFor="newLimit">
            <Input
              id="newLimit"
              type="number"
              required
              value={newLimitInput}
              onChange={(e) => setNewLimitInput(Number(e.target.value))}
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setLiquidityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" loading={submitting} type="submit">
              Save Limit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Assign Member to Org */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Add Member to ${selectedOrgForAssign?.name}`}>
        <form onSubmit={handleAssignUser} className="space-y-4">
          <p className="text-xs text-ink-slate">Select a registered global user to assign to this organization.</p>
          <Field label="Select User" htmlFor="userSelect">
            <select
              id="userSelect"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            >
              <option value="">-- Choose User --</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email} ({p.role}) - Current Org: {p.org_id ? "Assigned" : "Unassigned"}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" loading={submitting} type="submit">
              Assign User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Confirmation Modal for Deactivation */}
      <Modal open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Status Change">
        <div className="space-y-4">
          <p className="text-sm text-ink-slate">
            Are you sure you want to {orgToToggle?.status === "active" ? "deactivate (soft-delete)" : "reactivate"} organization{" "}
            <strong>&quot;{orgToToggle?.name}&quot;</strong>?
          </p>
          {orgToToggle?.status === "active" && (
            <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 font-semibold">
              Deactivating will preserve historical records while temporarily setting member verification status to inactive.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={orgToToggle?.status === "active" ? "danger" : "primary"}
              className="flex-1"
              loading={togglingId === orgToToggle?.id}
              onClick={executeToggleStatus}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
