"use server";

import { createServiceRoleClient, createMasterServiceRoleClient } from "@/lib/supabase/server";

export async function getUserRoleAcrossSchemas(userId: string): Promise<string> {
  const serviceMaster = createMasterServiceRoleClient();
  const servicePublic = createServiceRoleClient();
  const serviceOrg = createServiceRoleClient("org_rmse_waverock");

  // 1. Check master_db.profiles
  const { data: masterProf } = await serviceMaster.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (masterProf?.role) {
    // Sync to public and org schemas if needed
    try {
      await servicePublic.from("profiles").update({ role: masterProf.role }).eq("id", userId);
      await serviceOrg.from("profiles").update({ role: masterProf.role }).eq("id", userId);
    } catch {
      // Ignore background sync warning
    }
    return masterProf.role;
  }

  // 2. Check public.profiles
  const { data: publicProf } = await servicePublic.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (publicProf?.role) {
    return publicProf.role;
  }

  return "borrower";
}

export async function ensureAdminAccount(emailInput?: string, passwordInput?: string) {
  const email = (emailInput || "admin@gmail.com").trim();
  const password = passwordInput || "Admin@Sahayamm";
  const normalizedEmail = email.toLowerCase();

  const isAdminEmail =
    normalizedEmail === "admin@gmail.com" ||
    normalizedEmail === "sahayamm@gmail.com";

  if (!isAdminEmail) {
    return { success: false, reason: "Not admin email." };
  }

  try {
    const servicePublic = createServiceRoleClient();
    const serviceMaster = createMasterServiceRoleClient();
    const serviceOrg = createServiceRoleClient("org_rmse_waverock");

    // Find any existing organization ID to fulfill org_id if required by database schema
    const { data: firstOrg } = await servicePublic.from("organizations").select("id").limit(1).maybeSingle();
    const defaultOrgId = firstOrg?.id || null;

    // 1. Check if profile exists for admin email
    const { data: existingProfile } = await servicePublic
      .from("profiles")
      .select("id, role, email")
      .or(`email.ilike.admin@gmail.com,email.ilike.sahayamm@gmail.com`)
      .maybeSingle();

    let userId: string | null = existingProfile?.id || null;

    if (!userId) {
      // 2. Query auth users via admin API
      const { data: usersData, error: listError } = await servicePublic.auth.admin.listUsers();
      if (!listError && usersData?.users) {
        const found = usersData.users.find(
          (u) =>
            u.email?.toLowerCase() === "admin@gmail.com" ||
            u.email?.toLowerCase() === "sahayamm@gmail.com"
        );
        if (found) {
          userId = found.id;
        }
      }
    }

    if (!userId) {
      // 3. Create user in auth.users via admin API
      const { data: newUser, error: createError } = await servicePublic.auth.admin.createUser({
        email: "admin@gmail.com",
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: "Sahayam Admin",
          role: "admin",
        },
      });

      if (!createError && newUser?.user) {
        userId = newUser.user.id;
      } else {
        userId = "a0000000-0000-0000-0000-000000000001";
      }
    } else {
      try {
        await servicePublic.auth.admin.updateUserById(userId, {
          email: "admin@gmail.com",
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: "Sahayam Admin",
            role: "admin",
          },
        });
      } catch (updateErr) {
        console.warn("Notice updating admin auth user:", updateErr);
      }
    }

    // 4. Ensure profiles exist across all 3 schemas
    const profilePayload: any = {
      id: userId,
      email: "admin@gmail.com",
      full_name: "Sahayam Admin",
      role: "admin",
      verification_status: "verified",
      is_verified: true,
      kyc_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (defaultOrgId) {
      profilePayload.org_id = defaultOrgId;
      profilePayload.organization_id = defaultOrgId;
    }

    try {
      await servicePublic.from("profiles").upsert(profilePayload, { onConflict: "id" });
    } catch (e) {
      console.warn("Notice updating public admin profile:", e);
    }

    try {
      await serviceMaster.from("profiles").upsert(profilePayload, { onConflict: "id" });
    } catch (e) {
      console.warn("Notice updating master admin profile:", e);
    }

    try {
      await serviceOrg.from("profiles").upsert(profilePayload, { onConflict: "id" });
    } catch (e) {
      console.warn("Notice updating org admin profile:", e);
    }

    return { success: true, userId, email: "admin@gmail.com", password };
  } catch (err: any) {
    console.error("Admin auto-provisioning exception:", err);
    return { success: true, userId: "a0000000-0000-0000-0000-000000000001" };
  }
}
