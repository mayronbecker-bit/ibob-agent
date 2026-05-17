import type { SupabaseClient } from '@supabase/supabase-js';
import type { Proposal } from '@/lib/domain/types';
import type { Database } from '@/lib/supabase/database.types';

export async function getSupabaseProposals(
  supabase: SupabaseClient<Database>,
): Promise<Proposal[]> {
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
    .from('proposals')
    .select(
      'id, client_id, title, channel, type, reasoning, expected_impact, status, risk_level, rule_validator_passed, rule_validator_notes, created_at, budget_delta_brl, agent_version, prompt_version',
    )
    .eq('client_id', membership.client_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((proposal) => ({
    id: proposal.id,
    clientId: proposal.client_id,
    title: proposal.title,
    channel: proposal.channel,
    type: proposal.type,
    reasoning: proposal.reasoning,
    expectedImpact: proposal.expected_impact,
    status: proposal.status,
    riskLevel: proposal.risk_level,
    ruleValidatorPassed: proposal.rule_validator_passed,
    ruleValidatorNotes: proposal.rule_validator_notes ?? undefined,
    createdAt: proposal.created_at,
    budgetDeltaBrl: proposal.budget_delta_brl ?? undefined,
    agentVersion: proposal.agent_version,
    promptVersion: proposal.prompt_version,
  }));
}
