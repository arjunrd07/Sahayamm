import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ShieldCheck, UserCheck, Search, Filter } from "lucide-react";

export default function SuperadminUsersPage() {
  const users = [
    {
      id: "usr-1",
      name: "Super Admin (Org Lead)",
      email: "admin@sahayam.org",
      org: "Sahayam Demo Organization",
      role: "superadmin",
      verification: "verified",
      joined: "2026-03-10",
    },
    {
      id: "usr-2",
      name: "Sarah Jenkins",
      email: "sarah.j@company.com",
      org: "TechCorp Solutions Pvt Ltd",
      role: "admin",
      verification: "verified",
      joined: "2026-07-01",
    },
    {
      id: "usr-3",
      name: "David Chen",
      email: "david.c@company.com",
      org: "Sahayam Demo Organization",
      role: "customer",
      verification: "pending",
      joined: "2026-07-24",
    },
    {
      id: "usr-4",
      name: "Ananya Sharma",
      email: "ananya@apexglobal.com",
      org: "Apex Global Services",
      role: "customer",
      verification: "verified",
      joined: "2026-06-15",
    },
    {
      id: "usr-5",
      name: "Vikram Singh",
      email: "vikram@innovate.io",
      org: "Innovate AI Labs",
      role: "admin",
      verification: "verified",
      joined: "2026-05-20",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Global User Directory</h2>
          <p className="text-sm text-ink-slate">Cross-organization user profiles, roles, and verification statuses.</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-slate" />
            <input
              type="text"
              placeholder="Search user name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-ink-slate">
            <Filter className="h-4 w-4" /> Filter Role:
            <span className="px-2.5 py-1 rounded-md bg-signal-soft text-signal cursor-pointer">All Roles</span>
            <span className="px-2.5 py-1 rounded-md bg-surface-pebble dark:bg-white/5 cursor-pointer">Superadmin</span>
            <span className="px-2.5 py-1 rounded-md bg-surface-pebble dark:bg-white/5 cursor-pointer">Admin</span>
            <span className="px-2.5 py-1 rounded-md bg-surface-pebble dark:bg-white/5 cursor-pointer">Customer</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border dark:border-surface-border-dark text-xs uppercase tracking-wider text-ink-slate">
                <th className="pb-3 font-bold">User Name / Email</th>
                <th className="pb-3 font-bold">Organization</th>
                <th className="pb-3 font-bold">System Role</th>
                <th className="pb-3 font-bold">Verification</th>
                <th className="pb-3 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-pebble dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 font-semibold text-ink dark:text-white">
                    <div>{u.name}</div>
                    <div className="text-xs font-normal text-ink-slate">{u.email}</div>
                  </td>
                  <td className="py-3.5 text-ink-slate">{u.org}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      u.role === "superadmin"
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : u.role === "admin"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.verification === "verified"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {u.verification}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-ink-slate">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
