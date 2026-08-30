"use server";

import { createServiceRoleClient, createMasterServiceRoleClient } from "@/lib/supabase/server";
import { getAuthUserByEmail } from "@/app/actions/otp";

export interface CreateUserProfileInput {
  userId: string;
  orgId?: string;
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

export interface RegisterUserAccountInput {
  email: string;
  password?: string;
  fullName: string;
  role: "borrower" | "lender" | "admin";
  orgId?: string;
  customOrgName?: string;
  campusId?: string | null;
  campusName?: string;
  phone: string;
  panNumber: string;
  cibilScore: number;
  address: string;
}

export async function ensureValidOrgId(requestedOrgId?: string, customOrgName?: string): Promise<string> {
  const servicePublic = createServiceRoleClient();
  const serviceMaster = createMasterServiceRoleClient();

  // 1. If customOrgName provided, create new organization
  if (customOrgName && customOrgName.trim()) {
    const cleanOrgName = customOrgName.trim();
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
        return newOrg.id;
      }
    } catch (e) {
      console.warn("Notice creating custom organization:", e);
    }
  }

  // 2. Check if requestedOrgId exists in database
  if (requestedOrgId && requestedOrgId !== "new" && requestedOrgId.length === 36) {
    try {
      const { data: existingOrg } = await servicePublic
        .from("organizations")
        .select("id")
        .eq("id", requestedOrgId)
        .maybeSingle();

      if (existingOrg?.id) {
        return existingOrg.id;
      }
    } catch {
      // Continue fallback
    }
  }

  // 3. Query for any first existing organization
  try {
    const { data: firstOrg } = await servicePublic
      .from("organizations")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (firstOrg?.id) {
      return firstOrg.id;
    }
  } catch {
    // Continue fallback
  }

  // 4. Auto-provision default organization row to satisfy foreign key constraint
  const defaultOrgId = "00000000-0000-0000-0000-000000000001";
  const defaultOrgPayload = {
    id: defaultOrgId,
    name: "Sahayam Main Organization",
    code: "sahayam-main",
    updated_at: new Date().toISOString(),
  };

  try {
    await servicePublic.from("organizations").upsert(defaultOrgPayload, { onConflict: "id" });
  } catch (e) {
    console.warn("Public default org upsert notice:", e);
  }

  try {
    await serviceMaster.from("organizations").upsert(defaultOrgPayload, { onConflict: "id" });
  } catch (e) {
    console.warn("Master default org upsert notice:", e);
  }

  return defaultOrgId;
}

export async function createUserProfile(input: CreateUserProfileInput) {
  const servicePublic = createServiceRoleClient();
  const serviceMaster = createMasterServiceRoleClient();
  const serviceOrg = createServiceRoleClient("org_rmse_waverock");

  const validOrgId = await ensureValidOrgId(input.orgId, input.customOrgName);
  let finalCampusId: string | null = input.campusId && input.campusId !== "new" && input.campusId.length === 36 ? input.campusId : null;

  // Create new campus if custom campusName supplied
  if (!finalCampusId && input.campusName && input.campusName.trim()) {
    const cleanCampusName = input.campusName.trim();
    const code = cleanCampusName.toLowerCase().replace(/[^a-z0-9]/g, "") || "main";
    try {
      const { data: newCampus } = await servicePublic
        .from("campuses")
        .insert({
          org_id: validOrgId,
          name: cleanCampusName,
          code,
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

  // Verify campus existence if provided to prevent foreign key violation
  if (finalCampusId) {
    try {
      const { data: validCampus } = await servicePublic
        .from("campuses")
        .select("id")
        .eq("id", finalCampusId)
        .maybeSingle();
      if (!validCampus?.id) {
        finalCampusId = null;
      }
    } catch {
      finalCampusId = null;
    }
  }

  const cleanPan = (input.panNumber || "").trim().toUpperCase();
  const cleanPhone = (input.phone || "").replace(/\D/g, "");

  // 1. Check for duplicate PAN Card number with a different user
  if (cleanPan) {
    try {
      const { data: existingPan } = await servicePublic
        .from("profiles")
        .select("id, email")
        .ilike("pan_number", cleanPan)
        .neq("id", input.userId)
        .maybeSingle();

      if (existingPan?.id) {
        return {
          success: false,
          error: "This PAN Card number is already registered with another account.",
          data: null,
        };
      }
    } catch (e) {
      console.warn("PAN duplicate check notice:", e);
    }
  }

  // 2. Check for duplicate Phone number with a different user
  if (cleanPhone) {
    try {
      const { data: existingPhone } = await servicePublic
        .from("profiles")
        .select("id, email")
        .eq("phone", cleanPhone)
        .neq("id", input.userId)
        .maybeSingle();

      if (existingPhone?.id) {
        return {
          success: false,
          error: "This mobile phone number is already registered with another account.",
          data: null,
        };
      }
    } catch (e) {
      console.warn("Phone duplicate check notice:", e);
    }
  }

  const profilePayload = {
    id: input.userId,
    org_id: validOrgId,
    campus_id: finalCampusId,
    full_name: input.fullName,
    email: input.email.toLowerCase().trim(),
    phone: cleanPhone || input.phone,
    pan_number: cleanPan,
    cibil_score: input.cibilScore,
    address: input.address,
    kyc_completed: true,
    role: input.role,
    verification_status: input.role === "admin" || input.role === "lender" ? "verified" : "pending",
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
    return { success: false, error: profileErr.message, data: profilePayload };
  }

  // Update Auth user metadata so user session has role and org_id
  try {
    await servicePublic.auth.admin.updateUserById(input.userId, {
      user_metadata: {
        full_name: input.fullName,
        role: input.role,
        org_id: validOrgId,
      },
    });
  } catch (metaErr) {
    console.warn("Auth user metadata sync notice:", metaErr);
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
      organization_id: validOrgId,
      campus_id: finalCampusId,
      full_name: input.fullName,
      email: input.email.toLowerCase().trim(),
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

  return { success: true, data: profile || profilePayload, orgId: validOrgId, campusId: finalCampusId };
}

export async function registerUserAccount(input: RegisterUserAccountInput) {
  const cleanEmail = input.email.toLowerCase().trim();
  const password = input.password || "Password@123";
  const servicePublic = createServiceRoleClient();

  const validOrgId = await ensureValidOrgId(input.orgId, input.customOrgName);
  let userId: string | null = null;

  // 1. Create or update user in Supabase Auth via Service Role Admin API with email_confirm: true
  try {
    const { data: newUser, error: createError } = await servicePublic.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: input.role,
        org_id: validOrgId,
      },
    });

    if (!createError && newUser?.user) {
      userId = newUser.user.id;
    } else {
      // User already exists in auth.users — find existing user ID, update credentials and confirm email
      const existingUser = await getAuthUserByEmail(servicePublic, cleanEmail);

      if (existingUser?.id) {
        userId = existingUser.id;
        const { error: updateErr } = await servicePublic.auth.admin.updateUserById(existingUser.id, {
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: input.fullName,
            role: input.role,
            org_id: validOrgId,
          },
        });
        if (updateErr) {
          console.warn("Notice updating auth user credentials:", updateErr);
        }
      } else {
        return { success: false, error: createError?.message || "Failed to provision authentication user account." };
      }
    }
  } catch (authErr: any) {
    console.error("Auth admin user creation exception:", authErr);
    return { success: false, error: authErr?.message || "Failed to create authentication user account." };
  }

  if (!userId) {
    return { success: false, error: "Could not provision authentication user ID." };
  }

  // 2. Create Profile records across database schemas
  const profileResult = await createUserProfile({
    userId,
    orgId: validOrgId,
    campusId: input.campusId,
    campusName: input.campusName,
    fullName: input.fullName,
    email: cleanEmail,
    phone: input.phone,
    panNumber: input.panNumber,
    cibilScore: input.cibilScore,
    address: input.address,
    role: input.role,
  });

  if (!profileResult.success) {
    return { success: false, error: profileResult.error || "Failed to persist user profile in database." };
  }

  return { success: true, userId, profile: profileResult.data, validOrgId };
}
