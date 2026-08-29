"use server";

import { createServiceRoleClient, createMasterServiceRoleClient } from "@/lib/supabase/server";

export interface CreateUserProfileInput {
  userId: string;
  orgId: string;
  customOrgName?: string;
  campusId?: string | null;
  campusName?: string;
  fullName: string;
  email: string;
  phone: string;
  panNumber: string;
  cibilScore: number;
  address: string;
  role: "borrower" | "lender" | "admin";
}

export async function createUserProfile(input: CreateUserProfileInput) {
  const servicePublic = createServiceRoleClient();
  const serviceMaster = createMasterServiceRoleClient();
  const serviceOrg = createServiceRoleClient("org_rmse_waverock");

  let targetOrgId: string = input.orgId;

  // 1. Handle New Organization Creation if orgId === "new" or invalid UUID
  if ((targetOrgId === "new" || !targetOrgId || targetOrgId.length !== 36) && input.customOrgName?.trim()) {
    const cleanOrgName = input.customOrgName.trim();
    const generatedCode =
      cleanOrgName.toLowerCase().replace(/[^a-z0-9]/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    try {
      const { data: newOrg } = await servicePublic
        .from("organizations")
        .insert({
          name: cleanOrgName,
          code: generatedCode,
        })
        .select("id")
        .maybeSingle();

      if (newOrg?.id) {
        targetOrgId = newOrg.id;
        // Sync org to master_db and org_rmse_waverock
        try {
          await serviceMaster.from("organizations").upsert({ id: targetOrgId, name: cleanOrgName, code: generatedCode });
          await serviceOrg.from("organizations").upsert({ id: targetOrgId, name: cleanOrgName, code: generatedCode });
        } catch (sErr) {
          console.warn("Org sync warning:", sErr);
        }
      }
    } catch (e) {
      console.warn("Org creation warning:", e);
    }
  }

  // Fallback to DEFAULT_ORG_ID if targetOrgId is still invalid UUID
  if (!targetOrgId || targetOrgId === "new" || targetOrgId.length !== 36) {
    targetOrgId = "00000000-0000-0000-0000-000000000001";
  }

  let finalCampusId: string | null = input.campusId && input.campusId !== "new" && input.campusId.length === 36 ? input.campusId : null;

  // 2. Create new campus if campusName supplied and no valid campusId
  if (!finalCampusId && input.campusName && input.campusName.trim()) {
    const cleanCampusName = input.campusName.trim();
    const code = cleanCampusName.toLowerCase().replace(/[^a-z0-9]/g, "") || "main";
    try {
      const { data: newCampus } = await servicePublic
        .from("campuses")
        .insert({
          org_id: targetOrgId,
          name: cleanCampusName,
          code,
        })
        .select("id")
        .maybeSingle();

      if (newCampus?.id) {
        finalCampusId = newCampus.id;
        // Sync campus to master_db & org_rmse_waverock
        try {
          await serviceMaster.from("campuses").upsert({ id: finalCampusId, org_id: targetOrgId, name: cleanCampusName, code });
          await serviceOrg.from("campuses").upsert({ id: finalCampusId, org_id: targetOrgId, name: cleanCampusName, code });
        } catch (cErr) {
          console.warn("Campus sync warning:", cErr);
        }
      }
    } catch (e) {
      console.warn("Campus creation warning:", e);
    }
  }

  const profilePayload = {
    id: input.userId,
    org_id: targetOrgId,
    campus_id: finalCampusId,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    pan_number: input.panNumber,
    cibil_score: input.cibilScore,
    address: input.address,
    kyc_completed: true,
    role: input.role,
    verification_status: input.role === "admin" ? "verified" : "pending",
    updated_at: new Date().toISOString(),
  };

  // 1. Upsert into public.profiles
  const { data: profile, error: profileErr } = await servicePublic
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (profileErr) {
    console.error("Public profile creation error:", profileErr.message);
  }

  // 2. Sync to master_db.profiles
  try {
    await serviceMaster.from("profiles").upsert(profilePayload, { onConflict: "id" });
  } catch (masterErr) {
    console.warn("Notice syncing profile to master_db:", masterErr);
  }

  // 3. Sync to org_rmse_waverock.profiles
  try {
    await serviceOrg.from("profiles").upsert(profilePayload, { onConflict: "id" });
  } catch (orgErr) {
    console.warn("Notice syncing profile to org schema:", orgErr);
  }

  // 4. Borrower tables setup
  if (input.role === "borrower") {
    const borrowerPayload = {
      id: input.userId,
      organization_id: targetOrgId,
      campus_id: finalCampusId,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      verification_status: "pending",
      updated_at: new Date().toISOString(),
    };

    try {
      await servicePublic.from("borrowers").upsert(borrowerPayload, { onConflict: "id" });
    } catch (e) {
      console.warn("Public borrower upsert notice:", e);
    }

    try {
      await serviceMaster.from("borrowers").upsert(borrowerPayload, { onConflict: "id" });
    } catch (e) {
      console.warn("Master borrower upsert notice:", e);
    }

    try {
      await serviceOrg.from("borrowers").upsert(borrowerPayload, { onConflict: "id" });
    } catch (e) {
      console.warn("Org borrower upsert notice:", e);
    }
  }

  return { success: true, data: profile || profilePayload, orgId: targetOrgId, campusId: finalCampusId };
}
