import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Database, FileText, CheckCircle2, Lock } from "lucide-react";

export default function SuperadminAuditPage() {
  const logs = [
    {
      id: "log-101",
      timestamp: "2026-07-25 21:45:12 UTC",
      actor: "System Trigger: handle_first_user_superadmin()",
      action: "Assign Role superadmin",
      target: "user:usr-102 (Apex Global Services)",
      status: "Verified",
      details: "First organization member detected; superadmin permissions automatically granted.",
    },
    {
      id: "log-102",
      timestamp: "2026-07-25 18:30:00 UTC",
      actor: "Supabase Security Engine",
      action: "RLS Multi-Tenant Verification",
      target: "Table: profiles, loans, agreements",
      status: "Passed",
      details: "100% data access isolated per tenant organization ID. Zero leak detected.",
    },
    {
      id: "log-103",
      timestamp: "2026-07-25 14:12:05 UTC",
      actor: "Admin: Sarah Jenkins",
      action: "Disbursement Confirmation",
      target: "Loan: admin-demo-loan-1 (₹75,000)",
      status: "Audited",
      details: "Bank transfer reference proof stored & DocuSeal agreement signature matched.",
    },
    {
      id: "log-104",
      timestamp: "2026-07-24 11:05:40 UTC",
      actor: "DocuSeal Integration Webhook",
      action: "Agreement Sign Completed",
      target: "Agreement: ag-9941",
      status: "Completed",
      details: "Borrower and Org Representative cryptographic signature validated.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink dark:text-white">Security & Audit Logs</h2>
        <p className="text-sm text-ink-slate">System health events, security checks, and Row Level Security audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 flex items-center justify-center font-bold">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-slate">RLS Status</p>
            <p className="text-lg font-bold text-ink dark:text-white">Active & Enforced</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-signal-soft text-signal flex items-center justify-center font-bold">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-slate">Org Isolation</p>
            <p className="text-lg font-bold text-ink dark:text-white">Strict Multi-Tenant</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 flex items-center justify-center font-bold">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-slate">Database Integrity</p>
            <p className="text-lg font-bold text-ink dark:text-white">100% Synced</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardTitle className="text-lg font-bold mb-4 text-ink dark:text-white">Platform Event History</CardTitle>
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <span className="font-bold text-sm text-ink dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-signal" />
                  {log.action}
                </span>
                <span className="text-xs font-mono text-ink-slate">{log.timestamp}</span>
              </div>
              <p className="text-xs text-ink-slate mb-2">{log.details}</p>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-border dark:border-surface-border-dark/50">
                <span className="text-ink-slate">Actor: <strong className="text-ink dark:text-white">{log.actor}</strong></span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
