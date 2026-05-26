import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FunnelEvent,
  FunnelEventSource,
  FunnelEventStage,
} from '@/lib/domain/types';
import type { Database, Json } from '@/lib/supabase/database.types';

export type SupabaseFunnelData = {
  clientId: string;
  events: FunnelEvent[];
};

export type CreateFunnelEventInput = {
  stage: FunnelEventStage;
  source: FunnelEventSource;
  companyName?: string;
  contactName?: string;
  campaignName?: string;
  leadQualityScore?: number;
  dealValueBrl?: number;
  grossMarginBrl?: number;
  occurredAt: string;
  notes?: string;
};

type ActiveMembership = {
  clientId: string;
  userId: string;
};

type FunnelEventRow = Pick<
  Database['public']['Tables']['funnel_events']['Row'],
  | 'id'
  | 'client_id'
  | 'stage'
  | 'source'
  | 'company_name'
  | 'contact_name'
  | 'campaign_name'
  | 'lead_quality_score'
  | 'deal_value_brl'
  | 'gross_margin_brl'
  | 'occurred_at'
  | 'notes'
>;

async function getActiveMembership(
  supabase: SupabaseClient<Database>,
): Promise<ActiveMembership> {
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

  return {
    clientId: membership.client_id,
    userId: userData.user.id,
  };
}

function cleanOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanOptionalNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function mapFunnelEvent(row: FunnelEventRow): FunnelEvent {
  return {
    id: row.id,
    clientId: row.client_id,
    stage: row.stage,
    source: row.source,
    companyName: row.company_name ?? undefined,
    contactName: row.contact_name ?? undefined,
    campaignName: row.campaign_name ?? undefined,
    leadQualityScore: row.lead_quality_score ?? undefined,
    dealValueBrl: row.deal_value_brl ?? undefined,
    grossMarginBrl: row.gross_margin_brl ?? undefined,
    occurredAt: row.occurred_at,
    notes: row.notes ?? undefined,
  };
}

export async function getSupabaseFunnelData(
  supabase: SupabaseClient<Database>,
): Promise<SupabaseFunnelData> {
  const membership = await getActiveMembership(supabase);

  const { data, error } = await supabase
    .from('funnel_events')
    .select(
      'id, client_id, stage, source, company_name, contact_name, campaign_name, lead_quality_score, deal_value_brl, gross_margin_brl, occurred_at, notes, created_at, updated_at',
    )
    .eq('client_id', membership.clientId)
    .order('occurred_at', { ascending: false })
    .limit(25);

  if (error) {
    throw error;
  }

  return {
    clientId: membership.clientId,
    events: (data ?? []).map(mapFunnelEvent),
  };
}

export async function createSupabaseFunnelEvent(
  supabase: SupabaseClient<Database>,
  input: CreateFunnelEventInput,
) {
  const membership = await getActiveMembership(supabase);

  const payload: Database['public']['Tables']['funnel_events']['Insert'] = {
    client_id: membership.clientId,
    stage: input.stage,
    source: input.source,
    company_name: cleanOptionalText(input.companyName),
    contact_name: cleanOptionalText(input.contactName),
    campaign_name: cleanOptionalText(input.campaignName),
    lead_quality_score: cleanOptionalNumber(input.leadQualityScore),
    deal_value_brl: cleanOptionalNumber(input.dealValueBrl),
    gross_margin_brl: cleanOptionalNumber(input.grossMarginBrl),
    occurred_at: input.occurredAt,
    notes: cleanOptionalText(input.notes),
    created_by: membership.userId,
    metadata: {
      source: 'manual_entry',
      mode: 'manual_first',
    },
  };

  const { data, error } = await supabase
    .from('funnel_events')
    .insert(payload)
    .select(
      'id, client_id, stage, source, company_name, contact_name, campaign_name, lead_quality_score, deal_value_brl, gross_margin_brl, occurred_at, notes, created_at, updated_at',
    )
    .single();

  if (error) {
    throw error;
  }

  const event = mapFunnelEvent(data);

  const { error: auditError } = await supabase.from('audit_events').insert({
    client_id: membership.clientId,
    actor_user_id: membership.userId,
    event_type: 'funnel.event_created',
    severity: 'info',
    entity_type: 'funnel_event',
    entity_id: event.id,
    description: 'Evento de funil real registrado manualmente.',
    metadata: {
      source: 'funnel_ui',
      stage: event.stage,
      event_source: event.source,
      deal_value_brl: event.dealValueBrl ?? null,
    } as Json,
  });

  if (auditError) {
    throw auditError;
  }

  return event;
}
