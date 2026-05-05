import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AuditLogEntry {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditLogEntry) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) return;

  await supabase.from("audit_logs").insert({
    user_id: entry.userId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    old_data: entry.oldData ?? null,
    new_data: entry.newData ?? null,
  });
}
