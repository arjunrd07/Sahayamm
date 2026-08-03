"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export interface CreateUserProfileInput {
  userId: string;
  orgId: string;
  fullName: string;
  email: string;
  phone: string;
  panNumber: string;
  cibilScore: number;
  address: string;
  role: "borrower" | "lender";
}

export async function createUserProfile(input: CreateUserProfileInput) {
  const service = createServiceRoleClient();

  const { data: profile, error: profileErr } = await service
    .from("profiles")
    .upsert(
      {
        id: input.userId,
        org_id: input.orgId,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        pan_number: input.panNumber,
        cibil_score: input.cibilScore,
        address: input.address,
        kyc_completed: true,
        role: input.role,
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle();

  if (profileErr) {
    console.error("Profile creation error:", profileErr.message);
    return { error: profileErr.message };
  }

  if (input.role === "borrower") {
    const { error: borrowerErr } = await service.from("borrowers").upsert(
      {
        id: input.userId,
        organization_id: input.orgId,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (borrowerErr) {
      console.error("Borrower creation error:", borrowerErr.message);
    }
  }

  return { data: profile };
}
