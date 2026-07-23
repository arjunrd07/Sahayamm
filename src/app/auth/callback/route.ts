import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.user;
  const admin = createServiceRoleClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const meta = user.user_metadata || {};

    if (!meta.org_id) {
      // Signed in via a plain OTP with no signup metadata attached
      // (e.g. an admin whose row was never created). Send them back
      // rather than creating an incomplete profile.
      return NextResponse.redirect(`${origin}/login?error=no_org_selected`);
    }

    await admin.from("profiles").insert({
      id: user.id,
      org_id: meta.org_id,
      full_name: meta.full_name || user.email,
      email: user.email,
      phone: meta.phone || null,
      role: "customer",
      verification_status: "unverified",
    });

    return NextResponse.redirect(`${origin}/customer/verification`);
  }

  return NextResponse.redirect(
    `${origin}${existingProfile.role === "admin" ? "/admin/dashboard" : "/customer/dashboard"}`
  );
}
