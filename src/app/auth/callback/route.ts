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
    .select("id, role, org_id, pan_number, phone, address")
    .eq("id", user.id)
    .maybeSingle();

  // If profile is missing or incomplete (no PAN, phone, or address), redirect to Step 3 profile setup
  if (!existingProfile || !existingProfile.pan_number || !existingProfile.phone || !existingProfile.address) {
    return NextResponse.redirect(`${origin}/signup?step=3&oauth=google`);
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
