import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.user;
  const admin = createServiceRoleClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role, org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const meta = user.user_metadata || {};
    
    // Find default organization if none attached
    let orgId: string = meta.org_id || "";
    if (!orgId || orgId.length !== 36) {
      const { data: firstOrg } = await admin.from("organizations").select("id").limit(1).maybeSingle();
      orgId = firstOrg?.id || "00000000-0000-0000-0000-000000000001";
    }

    const newProfile = {
      id: user.id,
      org_id: orgId,
      full_name: meta.full_name || meta.name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      phone: meta.phone || null,
      role: "borrower",
      verification_status: "unverified",
      updated_at: new Date().toISOString(),
    };

    try {
      await admin.from("profiles").upsert(newProfile, { onConflict: "id" });
    } catch (e) {
      console.warn("OAuth profile creation notice:", e);
    }

    return NextResponse.redirect(`${origin}/borrower/dashboard`);
  }

  const role = existingProfile.role;
  const targetPath =
    role === "admin"
      ? "/admin/dashboard"
      : role === "lender"
      ? "/lender/dashboard"
      : "/borrower/dashboard";

  return NextResponse.redirect(`${origin}${targetPath}`);
}
