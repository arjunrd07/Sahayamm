import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { Building2, Users, Wallet, Plus, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SuperadminOrganizationsPage() {
  const organizations = [
    {
      id: "org-techcorp",
      name: "TechCorp Solutions Pvt Ltd",
      code: "TECHCORP",
      contactEmail: "admin@techcorp.com",
      members: 342,
      liquidity: 5000000,
      activeLoans: 14,
      totalDisbursed: 1850000,
      status: "Active",
    },
    {
      id: "demo-org",
      name: "Sahayam Demo Organization",
      code: "SAHAYAM-DEMO",
      contactEmail: "admin@sahayam.org",
      members: 85,
      liquidity: 2500000,
      activeLoans: 6,
      totalDisbursed: 650000,
      status: "Active",
    },
    {
      id: "org-apex",
      name: "Apex Global Services",
      code: "APEX-GLOBAL",
      contactEmail: "hr@apexglobal.com",
      members: 520,
      liquidity: 8500000,
      activeLoans: 22,
      totalDisbursed: 3200000,
      status: "Active",
    },
    {
      id: "org-innovate",
      name: "Innovate AI Labs",
      code: "INNOVATE",
      contactEmail: "ops@innovate.io",
      members: 140,
      liquidity: 1500000,
      activeLoans: 3,
      totalDisbursed: 250000,
      status: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Organization Management</h2>
          <p className="text-sm text-ink-slate">Manage registered entities, liquidity limits, and superadmin configurations.</p>
        </div>

        <button className="btn-primary text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Register New Org
        </button>
      </div>

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
                  <p className="text-xs font-mono text-ink-slate">{org.code} · {org.contactEmail}</p>
                </div>
              </div>
              <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {org.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-center my-4">
              <div>
                <p className="text-xs text-ink-slate font-medium">Members</p>
                <p className="text-lg font-bold text-ink dark:text-white mt-0.5">{org.members}</p>
              </div>
              <div>
                <p className="text-xs text-ink-slate font-medium">Liquidity Pool</p>
                <p className="text-sm font-bold text-ink dark:text-white mt-1">{formatINR(org.liquidity)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-slate font-medium">Total Disbursed</p>
                <p className="text-sm font-bold text-signal mt-1">{formatINR(org.totalDisbursed)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-ink-slate pt-2 border-t border-surface-border dark:border-surface-border-dark">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-signal" /> RLS Policy Isolated
              </span>
              <span className="font-semibold text-signal hover:underline cursor-pointer">
                Manage Settings & Admins →
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
