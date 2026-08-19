import { createMasterServiceRoleClient } from "@/lib/supabase/server";

export interface AuditLogPayload {
  action: string;
  actor_id?: string;
  entity_type?: "user" | "organization" | "loan" | "agreement" | "system";
  entity_id?: string;
  details: string;
}

export async function logAuditEntry(payload: AuditLogPayload) {
  try {
    const service = createMasterServiceRoleClient();
    const { error } = await service.from("audit_logs").insert({
      action: payload.action,
      actor_id: payload.actor_id || null,
      entity_type: payload.entity_type || "system",
      entity_id: payload.entity_id || null,
      details: payload.details,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Could not insert to master_db audit_logs:", error.message);
    }
  } catch (err) {
    console.warn("Audit logging error:", err);
  }
}
