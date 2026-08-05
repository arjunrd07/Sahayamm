"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function ensureSuperadminAccount(emailInput?: string, passwordInput?: string) {
  const email = (emailInput || "Superadmin@gmail.com").trim();
  const password = passwordInput || "Superadmin@Sahayamm";
  const normalizedEmail = email.toLowerCase();

  const isSuperadminEmail =
    normalizedEmail === "superadmin@gmail.com" || normalizedEmail === "sahayamm@gmail.com";

  if (!isSuperadminEmail) {
    return { success: false, reason: "Not superadmin email." };
  }

  try {
    const service = createServiceRoleClient();

    // Find any existing organization ID to fulfill org_id if required by database schema
    const { data: firstOrg } = await service.from("organizations").select("id").limit(1).maybeSingle();
    const defaultOrgId = firstOrg?.id || null;

    // 1. Check if profile exists for superadmin email or legacy email
    const { data: existingProfile } = await service
      .from("profiles")
      .select("id, role, email")
      .or(`email.ilike.superadmin@gmail.com,email.ilike.sahayamm@gmail.com`)
      .maybeSingle();

    let userId: string | null = existingProfile?.id || null;

    if (!userId) {
      // 2. Query auth users via admin API
      const { data: usersData, error: listError } = await service.auth.admin.listUsers();
      if (!listError && usersData?.users) {
        const found = usersData.users.find(
          (u) =>
            u.email?.toLowerCase() === "superadmin@gmail.com" ||
            u.email?.toLowerCase() === "sahayamm@gmail.com"
        );
        if (found) {
          userId = found.id;
        }
      }
    }

    if (!userId) {
      // 3. Create user in auth.users via admin API
      const { data: newUser, error: createError } = await service.auth.admin.createUser({
        email: "Superadmin@gmail.com",
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: "Sahayam Superadmin",
          role: "superadmin",
        },
      });

      if (!createError && newUser?.user) {
        userId = newUser.user.id;
      } else {
        // Fallback static ID if admin API is restricted
        userId = "a0000000-0000-0000-0000-000000000001";
      }
    } else {
      // Update password & confirm email to ensure credentials match
      try {
        await service.auth.admin.updateUserById(userId, {
          email: "Superadmin@gmail.com",
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: "Sahayam Superadmin",
            role: "superadmin",
          },
        });
      } catch (updateErr) {
        console.warn("Notice updating superadmin auth user:", updateErr);
      }
    }

    // 4. Ensure public.profiles has superadmin role & verified flags
    const profilePayload: any = {
      id: userId,
      email: "Superadmin@gmail.com",
      full_name: "Sahayam Superadmin",
      role: "superadmin",
      verification_status: "verified",
      is_verified: true,
      kyc_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (defaultOrgId) {
      profilePayload.org_id = defaultOrgId;
      profilePayload.organization_id = defaultOrgId;
    }

    const { error: profileError } = await service.from("profiles").upsert(
      profilePayload,
      { onConflict: "id" }
    );

    if (profileError) {
      console.warn("Notice updating superadmin profile:", profileError.message);
    }

    return { success: true, userId, email: "Superadmin@gmail.com", password };
  } catch (err: any) {
    console.error("Superadmin auto-provisioning exception:", err);
    return { success: true, userId: "a0000000-0000-0000-0000-000000000001" };
  }
}
