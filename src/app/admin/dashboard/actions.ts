"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getAdminDashboardStats() {
  const service = createServiceRoleClient();

  const [
    { count: orgCount },
    { count: campusCount },
    { count: userCount },
    { data: loansData },
    { count: pendingVerifCount },
    { data: recentLoans },
    { data: recentUsers },
  ] = await Promise.all([
    service.from("organizations").select("*", { count: "exact", head: true }),
    service.from("campuses").select("*", { count: "exact", head: true }),
    service.from("profiles").select("*", { count: "exact", head: true }),
    service.from("loans").select("amount, status"),
    service.from("profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    service.from("loans").select("id, amount, status, created_at, customer_id, purpose").order("created_at", { ascending: false }).limit(5),
    service.from("profiles").select("id, full_name, email, role, created_at, org_id").order("created_at", { ascending: false }).limit(5),
  ]);

  const activeVol = (loansData || [])
    .filter((l) => l.status === "active" || l.status === "approved")
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const totalVolume = (loansData || []).reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  return {
    totalOrgs: orgCount || 0,
    totalCampuses: campusCount || 0,
    totalUsers: userCount || 0,
    totalLoans: loansData?.length || 0,
    activeVolume: activeVol,
    totalVolume,
    pendingVerifications: pendingVerifCount || 0,
    recentLoans: recentLoans || [],
    recentUsers: recentUsers || [],
  };
}
