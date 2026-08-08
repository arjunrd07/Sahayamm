"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile, Organization, UserRole } from "@/types/database";
import { toggleUserAccess, updateUserRoleAndOrg, purgeUserAccount } from "./actions";

interface UserProfileWithOrg extends Profile {
  organization_name?: string;
  organizations?: { name: string; code: string };
}

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<UserProfileWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Detail Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfileWithOrg | null>(null);

  // Access Confirmation Modal
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [userForAccessToggle, setUserForAccessToggle] = useState<UserProfileWithOrg | null>(null);
  const [revocationReason, setRevocationReason] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit Role/Org Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfileWithOrg | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("borrower");
  const [newOrgId, setNewOrgId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Delete User Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfileWithOrg | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { push } = useToast();
  const supabase = createClient();

  async function loadUsersData() {
    setLoading(true);
    const [{ data: profiles }, { data: orgsData }] = await Promise.all([
      supabase.from("profiles").select("*, organizations!org_id(name, code)").order("created_at", { ascending: false }),
      supabase.from("organizations").select("*").order("name"),
    ]);

    if (profiles) {
      const formatted = profiles.map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name || "Global / Unassigned",
      }));
      setUsers(formatted);
    }
    if (orgsData) {
      setOrganizations(orgsData as Organization[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAccessModal(user: UserProfileWithOrg) {
    setUserForAccessToggle(user);
    setRevocationReason("");
    setAccessModalOpen(true);
  }

  async function executeDirectStatusChange(user: UserProfileWithOrg, targetStatus: "verified" | "rejected", reason?: string) {
    setUpdatingId(user.id);
    const result = await toggleUserAccess(user.id, targetStatus, reason);
    setUpdatingId(null);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    const actionText = targetStatus === "verified" ? "Access approved/restored" : "Access revoked";
    push("success", `${actionText} for ${user.full_name || user.email}`);
    loadUsersData();
  }

  async function executeAccessToggle() {
    if (!userForAccessToggle) return;
    const user = userForAccessToggle;
    setUpdatingId(user.id);
    const targetStatus = user.verification_status === "rejected" ? "verified" : "rejected";
    const result = await toggleUserAccess(user.id, targetStatus, revocationReason);
    setUpdatingId(null);
    setAccessModalOpen(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    const actionText = targetStatus === "verified" ? "Access restored" : "Access revoked";
    push("success", `${actionText} for ${user.full_name || user.email}`);
    loadUsersData();
  }

  function openEditModal(user: UserProfileWithOrg) {
    setEditingUser(user);
    setNewRole(
      (user.role as string) === "admin"
        ? "lender"
        : (user.role as string) === "customer"
        ? "borrower"
        : user.role || "borrower"
    );
    setNewOrgId(user.org_id || "");
    setEditModalOpen(true);
  }

  async function handleSaveUserEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    const result = await updateUserRoleAndOrg(editingUser.id, newRole, newOrgId);
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Updated role & organization for ${editingUser.full_name || editingUser.email}`);
    setEditModalOpen(false);
    loadUsersData();
  }

  function openDeleteModal(user: UserProfileWithOrg) {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  }

  async function executeDeleteUser() {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    const result = await purgeUserAccount(userToDelete.id);
    setDeletingId(null);
    setDeleteModalOpen(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Permanently deleted account ${userToDelete.email}`);
    loadUsersData();
  }

  const filtered = users.filter((u) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.pan_number || "").toLowerCase().includes(searchLower) ||
      (u.mobile_number || u.phone || "").toLowerCase().includes(searchLower) ||
      (u.organization_name || "").toLowerCase().includes(searchLower);

    const matchesRole =
      roleFilter === "all"
        ? true
        : roleFilter === "lender"
        ? u.role === "lender" || (u.role as string) === "admin"
        : roleFilter === "borrower"
        ? u.role === "borrower" || (u.role as string) === "customer"
        : u.role === roleFilter;

    const matchesOrg = orgFilter === "all" ? true : u.org_id === orgFilter;

    return matchesSearch && matchesRole && matchesOrg;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedUsers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink dark:text-white">Global User Directory</h2>
          <p className="text-sm text-ink-slate">Cross-organization user profiles, roles, and access revocation controls.</p>
        </div>
      </div>

      <Card className="p-6 border border-slate-200 dark:border-surface-border-dark">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-slate" />
            <input
              type="text"
              placeholder="Search name, email, PAN, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-slate">
              <Filter className="h-3.5 w-3.5" /> Role:
              {["all", "lender", "borrower", "superadmin"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRoleFilter(r);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    roleFilter === r
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-surface-pebble dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Org Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-slate">
              <Building2 className="h-3.5 w-3.5" /> Org:
              <select
                value={orgFilter}
                onChange={(e) => {
                  setOrgFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1 px-2 rounded-md bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-xs focus:outline-none"
              >
                <option value="all">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : paginatedUsers.length === 0 ? (
          <p className="text-center py-10 text-sm text-ink-slate">No users found matching your search and filter criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border dark:border-surface-border-dark text-xs uppercase tracking-wider text-ink-slate">
                  <th className="pb-3 font-bold">User Profile</th>
                  <th className="pb-3 font-bold">Organization</th>
                  <th className="pb-3 font-bold">Role</th>
                  <th className="pb-3 font-bold">Verification</th>
                  <th className="pb-3 font-bold">Joined</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-surface-border-dark">
                {paginatedUsers.map((u) => {
                  const isRevoked = u.verification_status === "rejected";
                  const displayRole =
                    (u.role as string) === "admin" ? "lender" : (u.role as string) === "customer" ? "borrower" : u.role;

                  return (
                    <tr key={u.id} className="hover:bg-surface-pebble dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-semibold text-ink dark:text-white">
                        <div className="flex items-center gap-2">
                          <div>
                            <div>{u.full_name || "—"}</div>
                            <div className="text-xs font-normal text-ink-slate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-ink-slate font-medium">{u.organization_name}</td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            displayRole === "superadmin"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                              : displayRole === "lender"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {displayRole}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isRevoked
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              : u.verification_status === "verified"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}
                        >
                          {isRevoked ? "Revoked Access" : u.verification_status}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-ink-slate">{formatDate(u.created_at)}</td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => setSelectedUserDetail(u)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {u.role !== "superadmin" && (
                            <>
                              {/* Edit Role/Org */}
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                title="Edit Role or Organization"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Revoke / Restore / Approve Access */}
                              {u.verification_status === "pending" || u.verification_status === "unverified" ? (
                                <>
                                  <Button
                                    variant="primary"
                                    className="text-xs py-1 px-2 text-white bg-emerald-600 hover:bg-emerald-700"
                                    disabled={updatingId === u.id}
                                    onClick={() => executeDirectStatusChange(u, "verified")}
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    variant="danger"
                                    className="text-xs py-1 px-2"
                                    disabled={updatingId === u.id}
                                    onClick={() => openAccessModal(u)}
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Reject
                                  </Button>
                                </>
                              ) : isRevoked ? (
                                <Button
                                  variant="primary"
                                  className="text-xs py-1 px-2.5"
                                  disabled={updatingId === u.id}
                                  onClick={() => executeDirectStatusChange(u, "verified")}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Restore
                                </Button>
                              ) : (
                                <Button
                                  variant="danger"
                                  className="text-xs py-1 px-2.5"
                                  disabled={updatingId === u.id}
                                  onClick={() => openAccessModal(u)}
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Revoke
                                </Button>
                              )}

                              {/* Delete User */}
                              <button
                                onClick={() => openDeleteModal(u)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-surface-border-dark mt-6">
            <span className="text-xs font-semibold text-ink-slate">
              Page {currentPage} of {totalPages} ({filtered.length} total users)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="text-xs py-1.5 px-3"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="secondary"
                className="text-xs py-1.5 px-3"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal 1: User Full Profile Details */}
      {selectedUserDetail && (
        <Modal open={Boolean(selectedUserDetail)} onClose={() => setSelectedUserDetail(null)} title="Global User Details">
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">{selectedUserDetail.full_name || "N/A"}</h3>
                <p className="text-xs text-slate-300 font-mono">{selectedUserDetail.email}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white uppercase">
                {selectedUserDetail.role}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark">
              <div>
                <p className="text-xs text-ink-slate font-medium">Organization</p>
                <p className="font-bold text-ink dark:text-white mt-0.5">{selectedUserDetail.organization_name}</p>
              </div>
              <div>
                <p className="text-xs text-ink-slate font-medium">Mobile / Phone</p>
                <p className="font-bold text-ink dark:text-white mt-0.5">{selectedUserDetail.mobile_number || selectedUserDetail.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-slate font-medium">PAN Number</p>
                <p className="font-mono font-bold text-ink dark:text-white mt-0.5">{selectedUserDetail.pan_number || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-ink-slate font-medium">CIBIL Score</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedUserDetail.cibil_score || "—"}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-ink-slate">Address Information</h4>
              <p className="text-xs text-ink-slate">
                Residential Address: <strong className="text-ink dark:text-white">{selectedUserDetail.address || "—"}</strong>
              </p>
            </div>

            {selectedUserDetail.emergency_name && (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 text-xs">
                <p className="font-bold">Emergency Contact:</p>
                <p>{selectedUserDetail.emergency_name} ({selectedUserDetail.emergency_relation}) &bull; {selectedUserDetail.emergency_phone}</p>
              </div>
            )}

            <div className="pt-2">
              <Button variant="secondary" className="w-full" onClick={() => setSelectedUserDetail(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Access Revocation / Restoration Confirmation */}
      <Modal open={accessModalOpen} onClose={() => setAccessModalOpen(false)} title="Confirm Access Status Change">
        <div className="space-y-4">
          <p className="text-sm text-ink-slate">
            Are you sure you want to{" "}
            <strong>{userForAccessToggle?.verification_status === "rejected" ? "restore access" : "revoke access"}</strong> for user{" "}
            <strong>&quot;{userForAccessToggle?.full_name || userForAccessToggle?.email}&quot;</strong>?
          </p>

          {userForAccessToggle?.verification_status !== "rejected" && (
            <Field label="Revocation Reason / Note" htmlFor="reason">
              <textarea
                id="reason"
                rows={2}
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                placeholder="State reason for access revocation (logged to audit)..."
                className="w-full p-2.5 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-xs focus:outline-none"
              />
            </Field>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAccessModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={userForAccessToggle?.verification_status === "rejected" ? "primary" : "danger"}
              className="flex-1"
              loading={updatingId === userForAccessToggle?.id}
              onClick={executeAccessToggle}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Edit Role / Org */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Role & Org: ${editingUser?.full_name || editingUser?.email}`}>
        <form onSubmit={handleSaveUserEdit} className="space-y-4">
          <Field label="Role" htmlFor="roleSelect">
            <select
              id="roleSelect"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none"
            >
              <option value="borrower">Borrower</option>
              <option value="lender">Lender</option>
              <option value="admin">Admin</option>
            </select>
          </Field>

          <Field label="Assigned Organization" htmlFor="orgSelect">
            <select
              id="orgSelect"
              value={newOrgId}
              onChange={(e) => setNewOrgId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none"
            >
              <option value="">Unassigned / Global</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </Field>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" loading={submitting} type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Delete User Confirmation */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Permanently Delete Account">
        <div className="space-y-4">
          <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 font-semibold">
            Warning: This action will permanently delete user profile and auth account for &quot;{userToDelete?.email}&quot;.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" loading={deletingId === userToDelete?.id} onClick={executeDeleteUser}>
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
