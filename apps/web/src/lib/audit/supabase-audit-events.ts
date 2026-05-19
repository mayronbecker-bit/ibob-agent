import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditEvent } from '@/lib/domain/types';
import type { Database, Json } from '@/lib/supabase/database.types';

function asMetadata(value: Json): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export async function getSupabaseAuditEvents(
  supabase: SupabaseClient<Database>,
): Promise<AuditEvent[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error('Authenticated user was not found.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('client_memberships')
    .select('client_id')
    .eq('user_id', userData.user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    throw membershipError ?? new Error('Active membership was not found.');
  }

  const { data, error } = await supabase
    .from('audit_events')
    .select(
      'id, client_id, actor_user_id, event_type, severity, entity_type, entity_id, description, metadata, occurred_at',
    )
    .eq('client_id', membership.client_id)
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []).map((event) => ({
    id: event.id,
    clientId: event.client_id,
    actorUserId: event.actor_user_id ?? undefined,
    eventType: event.event_type,
    severity: event.severity,
    entityType: event.entity_type ?? undefined,
    entityId: event.entity_id ?? undefined,
    description: event.description,
    metadata: asMetadata(event.metadata),
    occurredAt: event.occurred_at,
  }));
}
