import type { SupabaseClient } from '@supabase/supabase-js';
import type { DecisionMemory } from '@/lib/domain/types';
import type { Database } from '@/lib/supabase/database.types';

export async function getSupabaseDecisionMemory(
  supabase: SupabaseClient<Database>,
): Promise<DecisionMemory[]> {
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
    .from('decision_memory')
    .select(
      'id, client_id, proposal_id, proposal_title, channel, decision, outcome, impact_measured, learning, logged_at',
    )
    .eq('client_id', membership.client_id)
    .in('decision', ['approved', 'rejected'])
    .order('logged_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((entry) => ({
    id: entry.id,
    clientId: entry.client_id,
    proposalId: entry.proposal_id ?? undefined,
    proposalTitle: entry.proposal_title,
    channel: entry.channel,
    decision: entry.decision === 'approved' ? 'approved' : 'rejected',
    outcome: entry.outcome,
    impactMeasured: entry.impact_measured ?? undefined,
    learning: entry.learning,
    loggedAt: entry.logged_at,
  }));
}
