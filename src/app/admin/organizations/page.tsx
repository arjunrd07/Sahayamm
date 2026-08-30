"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Building2,
  Plus,
  ShieldCheck,
  Search,
  MapPin,
  Trash2,
  Users,
  Sparkles,
  School,
} from "lucide-react";
import type { Organization, Campus, Profile } from "@/types/database";
import { getAdminOrganizationsData, createOrganization, createCampus, deleteCampus, deleteOrganization } from "./actions";

interface OrgWithCampuses extends Organization {
  campuses: Campus[];
  borrowerCount: number;
  lenderCount: number;
}

function AdminOrganizationsContent() {
  const [organizations, setOrganizations] = useState<OrgWithCampuses[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Org Modal
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [submittingOrg, setSubmittingOrg] = useState(false);

  // Add Campus Modal
  const [campusModalOpen, setCampusModalOpen] = useState(false);
  const [selectedOrgForCampus, setSelectedOrgForCampus] = useState<OrgWithCampuses | null>(null);
  const [campusName, setCampusName] = useState("");
  const [campusCode, setCampusCode] = useState("");
  const [submittingCampus, setSubmittingCampus] = useState(false);

  // Delete Confirmations
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { push } = useToast();
  const supabase = createClient();

  async function loadData() {
    setLoading(true);
    try {
      const res = await getAdminOrganizationsData();
      const rawOrgs: Organization[] = res.organizations || [];
      const rawCampuses: Campus[] = res.campuses || [];
      const rawProfiles: Profile[] = res.profiles || [];

      const formatted: OrgWithCampuses[] = rawOrgs.map((org) => {
        const orgCampuses = rawCampuses.filter((c) => c.org_id === org.id);
        const orgProfiles = rawProfiles.filter((p) => p.org_id === org.id);
        const borrowerCount = orgProfiles.filter((p) => p.role === "borrower").length;
        const lenderCount = orgProfiles.filter((p) => p.role === "lender" || (p.role as string) === "admin").length;

        return {
          ...org,
          campuses: orgCampuses,
          borrowerCount,
          lenderCount,
        };
      });

      setOrganizations(formatted);
    } catch (err: any) {
      push("error", err.message || "Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || !orgCode.trim()) {
      push("error", "Organization name and code are required.");
      return;
    }
    setSubmittingOrg(true);
    const res = await createOrganization(orgName, orgCode);
    setSubmittingOrg(false);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push("success", `Organization "${orgName.trim()}" created successfully!`);
    setOrgModalOpen(false);
    setOrgName("");
    setOrgCode("");
    loadData();
  }

  async function handleCreateCampus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrgForCampus) return;
    if (!campusName.trim() || !campusCode.trim()) {
      push("error", "Campus name and code are required.");
      return;
    }
    setSubmittingCampus(true);
    const res = await createCampus(selectedOrgForCampus.id, campusName, campusCode);
    setSubmittingCampus(false);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push("success", `Campus "${campusName.trim()}" added to ${selectedOrgForCampus.name}!`);
    setCampusModalOpen(false);
    setCampusName("");
    setCampusCode("");
    loadData();
  }

  async function handleDeleteCampus(campusId: string, campusName: string) {
    if (!confirm(`Are you sure you want to remove campus "${campusName}"?`)) return;
    setDeletingId(campusId);
    const res = await deleteCampus(campusId);
    setDeletingId(null);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push("success", `Campus "${campusName}" removed.`);
    loadData();
  }

  async function handleDeleteOrg(orgId: string, orgName: string) {
    if (!confirm(`Are you sure you want to delete organization "${orgName}" and all its campuses? This action cannot be undone.`)) return;
    setDeletingId(orgId);
    const res = await deleteOrganization(orgId);
    setDeletingId(null);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push("success", `Organization "${orgName}" deleted.`);
    loadData();
  }

  const filtered = organizations.filter((org) => {
    const term = search.toLowerCase();
    const matchesOrg = org.name.toLowerCase().includes(term) || org.code.toLowerCase().includes(term);
    const matchesCampus = org.campuses.some((c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term));
    return matchesOrg || matchesCampus;
  });

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal/10 text-signal border border-signal/20 text-xs font-semibold mb-2">
            <Building2 className="h-3.5 w-3.5" /> Multi-Tenant Ecosystem
          </div>
          <h1 className="text-2xl font-black text-ink dark:text-white tracking-tight">
            Organizations &amp; Campuses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage institutions, universities, enterprise workplaces, and their respective campus hubs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadData} className="rounded-xl text-xs gap-1.5 font-bold">
            <Sparkles className="h-3.5 w-3.5 text-signal" /> Refresh
          </Button>
          <Button
            variant="primary"
            className="rounded-xl text-xs font-bold gap-1.5 shadow-button"
            onClick={() => {
              setOrgName("");
              setOrgCode("");
              setOrgModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Organization
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by organization name, code, or campus location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-ink dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-56 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-signal/10 text-signal flex items-center justify-center mx-auto">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-ink dark:text-white">No Organizations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first organization or university workspace to start onboarding campus members and lenders.
          </p>
          <Button
            variant="primary"
            className="rounded-xl text-xs font-bold gap-1.5 mx-auto shadow-button"
            onClick={() => setOrgModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add Organization
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((org) => (
            <Card key={org.id} className="p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Org Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-signal/10 text-signal font-black text-base flex items-center justify-center border border-signal/20 shrink-0">
                      {org.code.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-ink dark:text-white leading-tight">
                        {org.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-500 mt-0.5">
                        CODE: <strong className="text-signal">{org.code}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteOrg(org.id, org.name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete Organization"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Member Summary Stats */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Borrowers</span>
                    <strong className="text-sm text-ink dark:text-white font-extrabold">{org.borrowerCount} Active</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Lenders &amp; Officers</span>
                    <strong className="text-sm text-signal font-extrabold">{org.lenderCount} Assigned</strong>
                  </div>
                </div>

                {/* Campuses Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <School className="h-3.5 w-3.5 text-signal" /> Campuses &amp; Locations ({org.campuses.length})
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-[11px] font-bold rounded-xl gap-1 py-1 px-2.5 h-auto"
                      onClick={() => {
                        setSelectedOrgForCampus(org);
                        setCampusName("");
                        setCampusCode("");
                        setCampusModalOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3" /> Add Campus
                    </Button>
                  </div>

                  {org.campuses.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
                      No campuses added yet. Click &quot;Add Campus&quot; to set up regional locations.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {org.campuses.map((c) => (
                        <div
                          key={c.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-ink dark:text-white shadow-xs group"
                        >
                          <MapPin className="h-3 w-3 text-signal shrink-0" />
                          <span>{c.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({c.code})</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCampus(c.id, c.name)}
                            className="text-slate-300 hover:text-red-500 transition-colors ml-1"
                            title="Remove campus"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Organization Modal */}
      <Modal open={orgModalOpen} onClose={() => setOrgModalOpen(false)} title="Create New Organization">
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <Field label="Organization / Institution Name">
            <Input
              placeholder="e.g. Indian Institute of Technology Madras"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </Field>

          <Field label="Organization Code">
            <Input
              placeholder="e.g. IITM"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              required
              className="uppercase font-mono"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button variant="secondary" type="button" onClick={() => setOrgModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingOrg} className="font-bold shadow-button">
              Create Organization
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Campus Modal */}
      <Modal
        open={campusModalOpen}
        onClose={() => setCampusModalOpen(false)}
        title={`Add Campus Location · ${selectedOrgForCampus?.name || ""}`}
      >
        <form onSubmit={handleCreateCampus} className="space-y-4">
          <Field label="Campus Location Name">
            <Input
              placeholder="e.g. Main Campus / South Hub / Innovation Block"
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
              required
            />
          </Field>

          <Field label="Campus Identifier Code">
            <Input
              placeholder="e.g. CAMPUS-01 / MAIN"
              value={campusCode}
              onChange={(e) => setCampusCode(e.target.value)}
              required
              className="uppercase font-mono"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button variant="secondary" type="button" onClick={() => setCampusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingCampus} className="font-bold shadow-button">
              Add Campus
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminOrganizationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl pb-16">
          <div className="h-24 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </div>
      }
    >
      <AdminOrganizationsContent />
    </Suspense>
  );
}
