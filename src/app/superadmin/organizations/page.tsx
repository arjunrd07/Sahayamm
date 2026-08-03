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
import { Building2, Plus, CheckCircle2, ShieldCheck, Trash2 } from "lucide-react";
import type { Organization } from "@/types/database";
import { createOrganization, revokeOrganization } from "./actions";

export default function SuperadminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { push } = useToast();
  const supabase = createClient();

  async function loadOrgs() {
    setLoading(true);
    const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
    setOrganizations((data as Organization[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      push("error", "Organization name and code are required.");
      return;
    }
    setSubmitting(true);
    const result = await createOrganization(name, code);
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Organization "${name}" created successfully.`);
    setName("");
    setCode("");
    setModalOpen(false);
    loadOrgs();
  }

  async function handleRevoke(org: Organization) {
    if (!confirm(`Are you sure you want to revoke/delete organization "${org.name}"?`)) return;
    setRevokingId(org.id);
    const result = await revokeOrganization(org.id);
    setRevokingId(null);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Organization "${org.name}" revoked.`);
    loadOrgs();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Organization Management</h2>
          <p className="text-sm text-ink-slate">Manage registered entities, liquidity limits, and superadmin configurations.</p>
        </div>

        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Register New Org
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-44 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        </div>
      ) : organizations.length === 0 ? (
        <Card className="p-8 text-center text-ink-slate">
          No organizations registered yet. Click &quot;Register New Org&quot; to add one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="p-6">
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
                  <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                  <button
                    onClick={() => handleRevoke(org)}
                    disabled={revokingId === org.id}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-600 rounded-lg transition-colors"
                    title="Revoke / Delete Organization"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-center my-4">
                <div>
                  <p className="text-xs text-ink-slate font-medium">Liquidity Pool</p>
                  <p className="text-sm font-bold text-ink dark:text-white mt-1">{formatINR(org.capital_pool_limit || 2500000)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-slate font-medium">Created</p>
                  <p className="text-sm font-bold text-signal mt-1">{new Date(org.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-ink-slate pt-2 border-t border-surface-border dark:border-surface-border-dark">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-signal" /> RLS Policy Isolated
                </span>
                <span className="font-semibold text-signal hover:underline cursor-pointer">
                  Manage Settings →
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register New Organization">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Organization Name" htmlFor="orgName">
            <Input
              id="orgName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme FinTech Corp"
            />
          </Field>
          <Field label="Organization Code" htmlFor="orgCode">
            <Input
              id="orgCode"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ACME"
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
    </div>
  );
}
