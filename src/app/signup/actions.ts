"use server";

import { createServiceRoleClient, createMasterServiceRoleClient } from "@/lib/supabase/server";

export interface CreateUserProfileInput {
  userId: string;
  orgId: string;
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

  let finalCampusId: string | null = input.campusId || null;

  // Create new campus if a custom name is supplied
  if (!finalCampusId && input.campusName && input.campusName.trim()) {
    const code = input.campusName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    try {
      const { data: newCampus } = await servicePublic
        .from("campuses")
        .insert({
          org_id: input.orgId,
          name: input.campusName.trim(),
          code: code || "main",
        })
        .select("id")
        .maybeSingle();

      if (newCampus?.id) {
        finalCampusId = newCampus.id;
      }
    } catch (e) {
      console.warn("Campus creation warning:", e);
    }
  }

  const profilePayload = {
    id: input.userId,
    org_id: input.orgId,
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

  // 2. Multi-tenant sync: Upsert into master_db.profiles
  try {
    await serviceMaster.from("profiles").upsert(profilePayload, { onConflict: "id" });
  } catch (masterErr) {
    console.warn("Notice syncing profile to master_db:", masterErr);
  }

  // 3. Multi-tenant sync: Upsert into org_rmse_waverock.profiles
  try {
    await serviceOrg.from("profiles").upsert(profilePayload, { onConflict: "id" });
  } catch (orgErr) {
    console.warn("Notice syncing profile to org schema:", orgErr);
  }

  // 4. Borrower tables setup
  if (input.role === "borrower") {
    const borrowerPayload = {
      id: input.userId,
      organization_id: input.orgId,
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

  return { data: profile || profilePayload };
}
