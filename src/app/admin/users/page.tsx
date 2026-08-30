"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, Thead, Th, Tr, Td, EmptyState } from "@/components/ui/table";
import { VerificationBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  User,
  Users,
  Sparkles,
  PauseCircle,
  PlayCircle,
  Award,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile, Organization, Campus, UserRole } from "@/types/database";
import { getAdminUsersData, toggleUserAccess, updateUserRoleAndOrg, purgeUserAccount } from "./actions";

interface UserProfileWithOrg extends Profile {
  organization_name?: string;
  campus_name?: string;
}

function AdminUsersContent() {
  const [users, setUsers] = useState<UserProfileWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Detail Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfileWithOrg | null>(null);

  // Access Confirmation Modal (Pause / Revoke)
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [userForAccessToggle, setUserForAccessToggle] = useState<UserProfileWithOrg | null>(null);
  const [revocationReason, setRevocationReason] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit Role/Org/Campus Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfileWithOrg | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("borrower");
  const [newOrgId, setNewOrgId] = useState<string>("");
  const [newCampusId, setNewCampusId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Delete User Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfileWithOrg | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { push } = useToast();
  const supabase = createClient();

  async function loadUsersData() {
    setLoading(true);
    try {
      const res = await getAdminUsersData();
      const profiles = res.profiles || [];
      const orgsData = res.organizations || [];
      const campusesData = res.campuses || [];

      const orgsMap = new Map((orgsData || []).map((o: any) => [o.id, o.name]));
      const campusMap = new Map((campusesData || []).map((c: any) => [c.id, c.name]));

      if (profiles) {
        const formatted = profiles.map((p: any) => ({
          ...p,
          organization_name: p.org_id ? orgsMap.get(p.org_id) || "Unassigned" : "Global / Unassigned",
          campus_name: p.campus_id ? campusMap.get(p.campus_id) || "Main Campus" : "Main Campus",
        }));
        setUsers(formatted);
      }
      setOrganizations(orgsData || []);
      setCampuses(campusesData || []);
    } catch (err: any) {
      push("error", err.message || "Failed to load user directory.");
    } finally {
      setLoading(false);
    }
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

  async function handleConfirmAccessToggle() {
    if (!userForAccessToggle) return;
    setUpdatingId(userForAccessToggle.id);
    const targetStatus = userForAccessToggle.verification_status === "rejected" ? "verified" : "rejected";
    const res = await toggleUserAccess(userForAccessToggle.id, targetStatus, revocationReason);
    setUpdatingId(null);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push(
      "success",
      targetStatus === "rejected"
        ? `Access paused/revoked for ${userForAccessToggle.full_name || userForAccessToggle.email}.`
        : `Access restored & verified for ${userForAccessToggle.full_name || userForAccessToggle.email}.`
    );
    setAccessModalOpen(false);
    loadUsersData();
  }

  function openEditModal(user: UserProfileWithOrg) {
    setEditingUser(user);
    setNewRole(user.role || "borrower");
    setNewOrgId(user.org_id || "");
    setNewCampusId(user.campus_id || "");
    setEditModalOpen(true);
  }

  async function handleSaveUserAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    const res = await updateUserRoleAndOrg(editingUser.id, newRole, newOrgId || undefined, newCampusId || undefined);
    setSubmitting(false);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push("success", `Updated role & organization assignment for ${editingUser.full_name || editingUser.email}.`);
    setEditModalOpen(false);
    loadUsersData();
  }

  function openDeleteModal(user: UserProfileWithOrg) {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  }

  async function handleConfirmPurge() {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    const res = await purgeUserAccount(userToDelete.id);
    setDeletingId(null);

    if ("error" in res && res.error) {
      push("error", res.error);
      return;
    }

    push("success", `Permanently purged user account ${userToDelete.full_name || userToDelete.email}.`);
    setDeleteModalOpen(false);
    loadUsersData();
  }

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      u.full_name?.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.pan_number?.toLowerCase().includes(term) ||
      u.organization_name?.toLowerCase().includes(term) ||
      u.campus_name?.toLowerCase().includes(term);

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesOrg = orgFilter === "all" || u.org_id === orgFilter;
    const matchesCampus = campusFilter === "all" || u.campus_id === campusFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "verified" && u.verification_status === "verified") ||
      (statusFilter === "pending" && u.verification_status === "pending") ||
      (statusFilter === "rejected" && u.verification_status === "rejected") ||
      (statusFilter === "unverified" && (!u.verification_status || u.verification_status === "unverified"));

    return matchesSearch && matchesRole && matchesOrg && matchesCampus && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal/10 text-signal border border-signal/20 text-xs font-semibold mb-2">
            <Users className="h-3.5 w-3.5" /> Platform User Authority
          </div>
          <h1 className="text-2xl font-black text-ink dark:text-white tracking-tight">
            User Directory &amp; Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global identity oversight across all organizations, roles (Borrowers, Lenders, Admins), and campuses.
          </p>
        </div>

        <Button variant="secondary" onClick={loadUsersData} className="rounded-xl text-xs gap-1.5 font-bold self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5 text-signal" /> Refresh Directory
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search users by name, email, PAN, organization, or campus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-ink dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium text-ink dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="borrower">Borrowers Only</option>
            <option value="lender">Lenders Only</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium text-ink dark:text-white"
          >
            <option value="all">All Access Statuses</option>
            <option value="verified">Active &amp; Verified</option>
            <option value="pending">Pending KYC Review</option>
            <option value="rejected">Paused / Revoked</option>
            <option value="unverified">Incomplete KYC</option>
          </select>

          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium text-ink dark:text-white"
          >
            <option value="all">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.code})
              </option>
            ))}
          </select>

          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium text-ink dark:text-white"
          >
            <option value="all">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Table>
        <Thead>
          <Tr>
            <Th>User Profile</Th>
            <Th>Role</Th>
            <Th>Organization &amp; Campus</Th>
            <Th>PAN Number</Th>
            <Th>Access Status</Th>
            <Th>Joined</Th>
            <Th className="text-right">Governance Actions</Th>
          </Tr>
        </Thead>
        <tbody>
          {filtered.length === 0 ? (
            <Tr>
              <Td colSpan={7}>
                <EmptyState
                  title="No users match your criteria"
                  description="Try adjusting your search terms or filters."
                />
              </Td>
            </Tr>
          ) : (
            filtered.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-signal/10 text-signal font-black text-sm flex items-center justify-center border border-signal/20 shrink-0">
                      {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-ink dark:text-white text-xs">{u.full_name || "Unnamed User"}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{u.email}</p>
                    </div>
                  </div>
                </Td>

                <Td>
                  <span
                    className={`capitalize px-2.5 py-1 rounded-lg text-xs font-bold ${
                      u.role === "admin"
                        ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                        : u.role === "lender"
                        ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {u.role || "borrower"}
                  </span>
                </Td>

                <Td>
                  <div className="text-xs">
                    <div className="flex items-center gap-1 text-ink dark:text-white font-semibold">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      <span>{u.organization_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{u.campus_name}</span>
                    </div>
                  </div>
                </Td>

                <Td>
                  {u.pan_number ? (
                    <span className="font-mono text-xs font-bold text-ink dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                      {u.pan_number}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Not set</span>
                  )}
                </Td>

                <Td>
                  <VerificationBadge status={u.verification_status || "unverified"} />
                  {u.verification_status === "rejected" && u.rejection_reason && (
                    <p className="text-[10px] text-red-500 mt-1 truncate max-w-[130px]" title={u.rejection_reason}>
                      Reason: {u.rejection_reason}
                    </p>
                  )}
                </Td>

                <Td>
                  <span className="text-xs text-slate-500">{formatDate(u.created_at)}</span>
                </Td>

                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedUserDetail(u)}
                      className="rounded-xl text-xs gap-1 font-bold p-2 h-auto"
                      title="Inspect User Details"
                    >
                      <Eye className="h-3.5 w-3.5 text-signal" />
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(u)}
                      className="rounded-xl text-xs gap-1 font-bold p-2 h-auto"
                      title="Edit Role & Organization"
                    >
                      <Edit className="h-3.5 w-3.5 text-slate-600" />
                    </Button>

                    <Button
                      variant={u.verification_status === "rejected" ? "secondary" : "danger"}
                      size="sm"
                      onClick={() => openAccessModal(u)}
                      className="rounded-xl text-xs gap-1 font-bold p-2 h-auto"
                      title={u.verification_status === "rejected" ? "Restore Access" : "Pause / Revoke Access"}
                    >
                      {u.verification_status === "rejected" ? (
                        <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <PauseCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openDeleteModal(u)}
                      className="rounded-xl text-xs gap-1 font-bold p-2 h-auto hover:bg-red-600"
                      title="Permanently Delete User"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500 hover:text-white" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      {/* User Dossier Modal */}
      <Modal open={!!selectedUserDetail} onClose={() => setSelectedUserDetail(null)} title="User Profile Dossier">
        {selectedUserDetail && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-signal text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                {selectedUserDetail.full_name?.[0]?.toUpperCase() || selectedUserDetail.email[0].toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-ink dark:text-white">{selectedUserDetail.full_name || "User"}</h3>
                  <VerificationBadge status={selectedUserDetail.verification_status || "unverified"} />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Role: <strong className="capitalize">{selectedUserDetail.role}</strong></span>
                  <span>·</span>
                  <span>{selectedUserDetail.organization_name} ({selectedUserDetail.campus_name})</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Email Address</span>
                <p className="font-bold text-ink dark:text-white break-all">{selectedUserDetail.email}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</span>
                <p className="font-mono font-bold text-ink dark:text-white">
                  {selectedUserDetail.phone || selectedUserDetail.mobile_number || "Not provided"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">PAN Number</span>
                <p className="font-mono font-bold text-ink dark:text-white">{selectedUserDetail.pan_number || "Not set"}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">CIBIL Rating</span>
                <p className="font-black text-emerald-600 text-sm">{selectedUserDetail.cibil_score || 750} / 900</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-0.5 col-span-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Residential Address</span>
                <p className="font-medium text-ink dark:text-white">{selectedUserDetail.address || "Not provided"}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" className="rounded-xl font-bold" onClick={() => setSelectedUserDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Role & Org Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Role &amp; Assignment">
        {editingUser && (
          <form onSubmit={handleSaveUserAssignment} className="space-y-4">
            <Field label="System Authority Role">
              <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
                <option value="borrower">Borrower (Employee/Student)</option>
                <option value="lender">Lender (Organization Lending Officer)</option>
                <option value="admin">Administrator (Global Platform Authority)</option>
              </Select>
            </Field>

            <Field label="Assigned Organization">
              <Select value={newOrgId} onChange={(e) => setNewOrgId(e.target.value)}>
                <option value="">Unassigned / Global</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Assigned Campus">
              <Select value={newCampusId} onChange={(e) => setNewCampusId(e.target.value)}>
                <option value="">Main Campus / Unspecified</option>
                {campuses
                  .filter((c) => !newOrgId || c.org_id === newOrgId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
              </Select>
            </Field>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting} className="font-bold shadow-button">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Pause / Revoke Access Modal */}
      <Modal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        title={userForAccessToggle?.verification_status === "rejected" ? "Restore User Access" : "Pause / Revoke Access"}
      >
        {userForAccessToggle && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {userForAccessToggle.verification_status === "rejected"
                ? `Restoring access for ${userForAccessToggle.full_name || userForAccessToggle.email} will enable them to access the platform.`
                : `Pausing access for ${userForAccessToggle.full_name || userForAccessToggle.email} will immediately suspend their lending and borrowing privileges.`}
            </p>

            {userForAccessToggle.verification_status !== "rejected" && (
              <Field label="Reason for Access Revocation / Pause">
                <Input
                  placeholder="e.g. Audit inquiry, KYC discrepancy, or policy suspension"
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  required
                />
              </Field>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button variant="secondary" onClick={() => setAccessModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={userForAccessToggle.verification_status === "rejected" ? "primary" : "danger"}
                onClick={handleConfirmAccessToggle}
                loading={!!updatingId}
                className="font-bold shadow-button"
              >
                {userForAccessToggle.verification_status === "rejected" ? "Restore Access" : "Confirm Pause Access"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Permanently Delete User">
        {userToDelete && (
          <div className="space-y-4">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
              Warning: Deleting user &quot;{userToDelete.full_name || userToDelete.email}&quot; will permanently purge their profile, authentication record, agreements, and loan history from the database.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmPurge}
                loading={!!deletingId}
                className="font-bold shadow-button"
              >
                Permanently Purge User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl pb-16">
          <div className="h-24 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
