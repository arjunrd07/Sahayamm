"use server";

import { createServiceRoleClient, createMasterServiceRoleClient } from "@/lib/supabase/server";
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
  const masterService = createMasterServiceRoleClient();
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

  try {
    if (data?.id) {
      await masterService.from("campuses").insert({
        id: data.id,
        org_id: orgId,
        name: name.trim(),
        code: cleanCode,
      });
    }
  } catch (err) {
    console.warn("Master DB sync campus notice:", err);
  }

  await logAuditEntry({
    action: "Create Campus",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: orgId,
    details: `Campus "${name.trim()}" (${cleanCode}) added to organization.`,
  });

  return { data };
}

export async function updateOrganization(orgId: string, name: string, code: string) {
  const service = createServiceRoleClient();
  const masterService = createMasterServiceRoleClient();
  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  const updatePayload = {
    name: name.trim(),
    code: cleanCode,
  };

  const { data, error } = await service
    .from("organizations")
    .update(updatePayload)
    .eq("id", orgId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  try {
    await masterService.from("organizations").update(updatePayload).eq("id", orgId);
  } catch (err) {
    console.warn("Master DB sync update org notice:", err);
  }

  await logAuditEntry({
    action: "Update Organization",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: orgId,
    details: `Organization "${name.trim()}" (${cleanCode}) updated by platform admin.`,
  });

  return { data };
}

export async function deleteCampus(campusId: string) {
  const service = createServiceRoleClient();
  const masterService = createMasterServiceRoleClient();

  // 1. Unlink profiles and borrowers from this campus
  await Promise.allSettled([
    service.from("profiles").update({ campus_id: null }).eq("campus_id", campusId),
    masterService.from("profiles").update({ campus_id: null }).eq("campus_id", campusId),
    service.from("borrowers").update({ campus_id: null }).eq("campus_id", campusId),
    masterService.from("borrowers").update({ campus_id: null }).eq("campus_id", campusId),
    service.from("loans").update({ campus_id: null }).eq("campus_id", campusId),
    masterService.from("loans").update({ campus_id: null }).eq("campus_id", campusId),
    service.from("agreements").update({ campus_id: null }).eq("campus_id", campusId),
    masterService.from("agreements").update({ campus_id: null }).eq("campus_id", campusId),
  ]);

  const { error } = await service
    .from("campuses")
    .delete()
    .eq("id", campusId);

  if (error) return { error: error.message };

  try {
    await masterService.from("campuses").delete().eq("id", campusId);
  } catch {}

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
  const masterService = createMasterServiceRoleClient();

  // 1. Check for active/pending loans to prevent accidental financial disruption
  try {
    const { data: activeLoans } = await service
      .from("loans")
      .select("id, status")
      .eq("org_id", orgId)
      .in("status", ["active", "pending", "approved"]);

    if (activeLoans && activeLoans.length > 0) {
      return {
        error: `Cannot delete organization: There are ${activeLoans.length} active or pending loan(s) associated with this organization. Please resolve or cancel them first.`,
      };
    }
  } catch (err) {
    console.warn("Check loans notice:", err);
  }

  // 2. Unlink profiles from this organization and its campuses to prevent foreign key violation
  await Promise.allSettled([
    service.from("profiles").update({ org_id: null, campus_id: null }).eq("org_id", orgId),
    masterService.from("profiles").update({ org_id: null, campus_id: null }).eq("org_id", orgId),
    service.from("borrowers").update({ organization_id: null, campus_id: null }).eq("organization_id", orgId),
    masterService.from("borrowers").update({ organization_id: null, campus_id: null }).eq("organization_id", orgId),
  ]);

  // 3. Clean up historical loans, agreements, payments, and notifications for this org
  await Promise.allSettled([
    service.from("loan_payments").delete().eq("org_id", orgId),
    service.from("agreements").delete().eq("org_id", orgId),
    service.from("loans").delete().eq("org_id", orgId),
    service.from("notifications").delete().eq("org_id", orgId),
    masterService.from("loan_payments").delete().eq("org_id", orgId),
    masterService.from("agreements").delete().eq("org_id", orgId),
    masterService.from("loans").delete().eq("org_id", orgId),
    masterService.from("notifications").delete().eq("org_id", orgId),
  ]);

  // 4. Delete associated campuses
  await Promise.allSettled([
    service.from("campuses").delete().eq("org_id", orgId),
    masterService.from("campuses").delete().eq("org_id", orgId),
  ]);

  // 5. Delete the organization record
  const { error } = await service
    .from("organizations")
    .delete()
    .eq("id", orgId);

  if (error) return { error: error.message };

  try {
    await masterService.from("organizations").delete().eq("id", orgId);
  } catch {}

  await logAuditEntry({
    action: "Delete Organization",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: orgId,
    details: `Organization ${orgId} and associated campuses deleted by admin.`,
  });

  return { success: true };
}
