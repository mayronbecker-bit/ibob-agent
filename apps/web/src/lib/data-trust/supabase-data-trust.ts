import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentStatus, DataSource, DataTrustState } from '@/lib/domain/types';
import type { Database } from '@/lib/supabase/database.types';

function deriveOverallStatus(sources: DataSource[]): AgentStatus {
  if (sources.some((source) => source.status === 'red')) {
    return 'red';
  }

  if (sources.some((source) => source.status === 'yellow')) {
    return 'yellow';
  }

  return 'green';
}

function deriveCheckedAt(sources: DataSource[]) {
  const timestamps = sources
    .map((source) => new Date(source.lastSync).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return new Date().toISOString();
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function deriveBlockingReason(sources: DataSource[]) {
  const blockingSources = sources.filter((source) => source.status !== 'green');

  if (blockingSources.length === 0) {
    return undefined;
  }

  return blockingSources
    .map((source) => source.issue ?? `${source.name} requer verificacao.`)
    .join(' ');
}

export async function getSupabaseDataTrustState(
  supabase: SupabaseClient<Database>,
): Promise<DataTrustState> {
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
    .from('data_sources')
    .select('id,client_id,name,type,status,last_sync_at,issue')
    .eq('client_id', membership.client_id)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  const sources: DataSource[] = (data ?? []).map((source) => ({
    id: source.id,
    clientId: source.client_id,
    name: source.name,
    type: source.type,
    status: source.status,
    lastSync: source.last_sync_at ?? new Date().toISOString(),
    issue: source.issue ?? undefined,
  }));

  const overallStatus = deriveOverallStatus(sources);

  return {
    clientId: membership.client_id,
    overallStatus,
    checkedAt: deriveCheckedAt(sources),
    sources,
    blockingReason: deriveBlockingReason(sources),
  };
}
