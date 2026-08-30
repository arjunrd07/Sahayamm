"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getAdminAgreementsData() {
  const service = createServiceRoleClient();

  const [
    { data: agsData },
    { data: loansData },
    { data: orgsData },
    { data: campusesData },
    { data: profilesData },
  ] = await Promise.all([
    service.from("agreements").select("*").order("created_at", { ascending: false }),
    service.from("loans").select("*"),
    service.from("organizations").select("*"),
    service.from("campuses").select("*"),
    service.from("profiles").select("*"),
  ]);

  return {
    agreements: agsData || [],
    loans: loansData || [],
    organizations: orgsData || [],
    campuses: campusesData || [],
    profiles: profilesData || [],
  };
}
