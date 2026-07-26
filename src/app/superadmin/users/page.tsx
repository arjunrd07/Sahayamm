"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Search, Filter, ShieldAlert, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { toggleUserAccess } from "./actions";

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<(Profile & { organization_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { push } = useToast();
  const supabase = createClient();

  async function loadUsers() {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*, organizations(name)")
      .order("created_at", { ascending: false });

    if (profiles) {
      const formatted = profiles.map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name || "Global / N/A",
      }));
      setUsers(formatted);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleAccess(user: Profile) {
    setUpdatingId(user.id);
    const result = await toggleUserAccess(user.id, user.verification_status);
    setUpdatingId(null);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    const actionText = user.verification_status === "rejected" ? "Access restored" : "Access revoked";
    push("success", `${actionText} for ${user.full_name || user.email}`);
    loadUsers();
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.organization_name || "").toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all"
        ? true
        : roleFilter === "lender"
        ? u.role === "lender" || (u.role as string) === "admin"
        : roleFilter === "borrower"
        ? u.role === "borrower" || (u.role as string) === "customer"
        : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Global User Directory</h2>
          <p className="text-sm text-ink-slate">Cross-organization user profiles, roles, and access revocation controls.</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-slate" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-ink-slate flex-wrap">
            <Filter className="h-4 w-4" /> Filter Role:
            {["all", "lender", "borrower", "superadmin"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  roleFilter === r
                    ? "bg-signal-soft text-signal font-bold"
                    : "bg-surface-pebble dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border dark:border-surface-border-dark text-xs uppercase tracking-wider text-ink-slate">
                <th className="pb-3 font-bold">User Name / Email</th>
                <th className="pb-3 font-bold">Organization</th>
                <th className="pb-3 font-bold">Role</th>
                <th className="pb-3 font-bold">Verification Status</th>
                <th className="pb-3 font-bold">Joined</th>
                <th className="pb-3 font-bold text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
              {filtered.map((u) => {
                const isRevoked = u.verification_status === "rejected";
                const displayRole = (u.role as string) === "admin" ? "lender" : (u.role as string) === "customer" ? "borrower" : u.role;


                return (
                  <tr key={u.id} className="hover:bg-surface-pebble dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-semibold text-ink dark:text-white">
                      <div>{u.full_name || "—"}</div>
                      <div className="text-xs font-normal text-ink-slate">{u.email}</div>
                    </td>
                    <td className="py-3.5 text-ink-slate">{u.organization_name}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          displayRole === "superadmin"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : displayRole === "lender"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}
                      >
                        {displayRole}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isRevoked
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : u.verification_status === "verified"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {isRevoked ? "Revoked Access" : u.verification_status}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-ink-slate">{formatDate(u.created_at)}</td>
                    <td className="py-3.5 text-right">
                      {u.role !== "superadmin" && (
                        <Button
                          variant={isRevoked ? "primary" : "danger"}
                          className="text-xs py-1 px-2.5"
                          loading={updatingId === u.id}
                          onClick={() => handleToggleAccess(u)}
                        >
                          {isRevoked ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Restore Access
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Revoke Access
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

