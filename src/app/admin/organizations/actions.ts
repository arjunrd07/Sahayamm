"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";
import type { Organization, Campus, Profile } from "@/types/database";

export async function getAdminOrganizationsData() {
  const service = createServiceRoleClient();

  const [{ data: orgsData }, { data: campusesData }, { data: profilesData }] = await Promise.all([
    service.from("organizations").select("*").order("created_at", { ascending: false }),
    service.from("campuses").select("*").order("name"),
    service.from("profiles").select("id, org_id, role"),
  ]);

  return {
    organizations: (orgsData as Organization[]) || [],
    campuses: (campusesData as Campus[]) || [],
    profiles: (profilesData as Profile[]) || [],
  };
}

export async function createOrganization(name: string, code: string) {
  const service = createServiceRoleClient();
  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  const { data, error } = await service
    .from("organizations")
    .insert({
      name: name.trim(),
      code: cleanCode,
    })
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Create Organization",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: data?.id || cleanCode,
    details: `Organization "${name.trim()}" (${cleanCode}) created by platform admin.`,
  });

  return { data: data || { id: cleanCode, name: name.trim(), code: cleanCode } };
}

export async function createCampus(orgId: string, name: string, code: string) {
  const service = createServiceRoleClient();
  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  const { data, error } = await service
    .from("campuses")
    .insert({
      org_id: orgId,
      name: name.trim(),
      code: cleanCode,
    })
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Create Campus",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: orgId,
    details: `Campus "${name.trim()}" (${cleanCode}) added to organization.`,
  });

  return { data };
}

export async function deleteCampus(campusId: string) {
  const service = createServiceRoleClient();

  const { error } = await service
    .from("campuses")
    .delete()
    .eq("id", campusId);

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Delete Campus",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: campusId,
    details: `Campus ${campusId} removed by admin.`,
  });

  return { success: true };
}

export async function deleteOrganization(orgId: string) {
  const service = createServiceRoleClient();

  // Delete associated campuses first
  await service.from("campuses").delete().eq("org_id", orgId);

  const { error } = await service
    .from("organizations")
    .delete()
    .eq("id", orgId);

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Delete Organization",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: orgId,
    details: `Organization ${orgId} and associated campuses deleted by admin.`,
  });

  return { success: true };
}
