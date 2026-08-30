"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getAdminAuditLogsData() {
  const service = createServiceRoleClient();

  const [{ data: logsData }, { data: profilesData }] = await Promise.all([
    service.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    service.from("profiles").select("id, full_name, email"),
  ]);

  const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

  const enrichedLogs = (logsData || []).map((log: any) => {
    const actor = profilesMap.get(log.actor_id);
    return {
      ...log,
      actor_email: actor?.email || (log.actor_id === "admin" ? "admin@sahayam.internal" : undefined),
    };
  });

  return { logs: enrichedLogs };
}
