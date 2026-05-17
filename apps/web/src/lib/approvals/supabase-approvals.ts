import type { SupabaseClient } from '@supabase/supabase-js';
import type { Approval, ApprovalDecision, Proposal } from '@/lib/domain/types';
import type { Database } from '@/lib/supabase/database.types';

export type SupabaseApprovalsData = {
  proposals: Proposal[];
  approvalHistory: Approval[];
  currentApprover: string;
};

type ApprovalRow = Database['public']['Tables']['approvals']['Row'];
type ProfileRow = Database['public']['Tables']['user_profiles']['Row'];

function mapProposal(
  proposal: Database['public']['Tables']['proposals']['Row'],
): Proposal {
  return {
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
  };
}

function getApproverName(profile: ProfileRow | undefined, fallbackEmail?: string | null) {
  return profile?.full_name ?? profile?.email ?? fallbackEmail ?? 'Usuario Supabase';
}

export async function getSupabaseApprovalsData(
  supabase: SupabaseClient<Database>,
): Promise<SupabaseApprovalsData> {
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

  const { data: proposalRows, error: proposalsError } = await supabase
    .from('proposals')
    .select('*')
    .eq('client_id', membership.client_id)
    .order('created_at', { ascending: false });

  if (proposalsError) {
    throw proposalsError;
  }

  const { data: approvalRows, error: approvalsError } = await supabase
    .from('approvals')
    .select('*')
    .eq('client_id', membership.client_id)
    .order('decided_at', { ascending: false });

  if (approvalsError) {
    throw approvalsError;
  }

  const proposals = (proposalRows ?? []).map(mapProposal);
  const proposalsById = new Map(proposals.map((proposal) => [proposal.id, proposal]));
  const approverIds = Array.from(
    new Set((approvalRows ?? []).map((approval) => approval.approver_user_id)),
  );

  const { data: profileRows, error: profilesError } = approverIds.length
    ? await supabase.from('user_profiles').select('*').in('user_id', approverIds)
    : { data: [], error: null };

  if (profilesError) {
    throw profilesError;
  }

  const profilesById = new Map((profileRows ?? []).map((profile) => [profile.user_id, profile]));
  const currentUserProfile = profilesById.get(userData.user.id);

  const approvalHistory: Approval[] = (approvalRows ?? []).map((approval: ApprovalRow) => {
    const proposal = proposalsById.get(approval.proposal_id);

    return {
      id: approval.id,
      proposalId: approval.proposal_id,
      proposalTitle: proposal?.title ?? 'Proposta removida',
      clientId: approval.client_id,
      approver: getApproverName(profilesById.get(approval.approver_user_id)),
      decision: approval.decision,
      justification: approval.justification,
      decidedAt: approval.decided_at,
    };
  });

  return {
    proposals,
    approvalHistory,
    currentApprover: getApproverName(currentUserProfile, userData.user.email),
  };
}

export async function recordSupabaseProposalDecision(
  supabase: SupabaseClient<Database>,
  proposalId: string,
  decision: ApprovalDecision,
  justification: string,
) {
  const { error } = await supabase.rpc('record_proposal_decision', {
    target_proposal_id: proposalId,
    decision,
    justification,
  });

  if (error) {
    throw error;
  }
}
