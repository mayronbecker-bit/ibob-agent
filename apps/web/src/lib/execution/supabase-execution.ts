import type { SupabaseClient } from '@supabase/supabase-js';
import type { Approval, ExecutionLog, Proposal } from '@/lib/domain/types';
import type { Database, Json } from '@/lib/supabase/database.types';

type ProposalRow = Database['public']['Tables']['proposals']['Row'];
type ApprovalRow = Database['public']['Tables']['approvals']['Row'];
type ExecutionLogRow = Database['public']['Tables']['execution_logs']['Row'];

type ActiveMembership = {
  clientId: string;
  userId: string;
};

export type ExecutionCandidate = {
  proposal: Proposal;
  approval: Approval;
  alreadySimulated: boolean;
  canDryRun: boolean;
  preflightChecks: ExecutionPreflightCheck[];
  rollbackPlan: ExecutionRollbackStep[];
};

export type SupabaseExecutionData = {
  candidates: ExecutionCandidate[];
  executionLogs: ExecutionLog[];
};

export type ExecutionPreflightStatus = 'passed' | 'warning' | 'blocked';

export type ExecutionPreflightCheck = {
  id: string;
  title: string;
  status: ExecutionPreflightStatus;
  detail: string;
};

export type ExecutionRollbackStep = {
  order: number;
  title: string;
  detail: string;
};

function asObject(value: Json | null): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function mapProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    channel: row.channel,
    type: row.type,
    reasoning: row.reasoning,
    expectedImpact: row.expected_impact,
    status: row.status,
    riskLevel: row.risk_level,
    ruleValidatorPassed: row.rule_validator_passed,
    ruleValidatorNotes: row.rule_validator_notes ?? undefined,
    createdAt: row.created_at,
    budgetDeltaBrl: row.budget_delta_brl ?? undefined,
    agentVersion: row.agent_version,
    promptVersion: row.prompt_version,
  };
}

function mapExecutionLog(row: ExecutionLogRow): ExecutionLog {
  return {
    id: row.id,
    clientId: row.client_id,
    proposalId: row.proposal_id,
    approvalId: row.approval_id,
    executedAt: row.executed_at,
    result: row.result,
    channel: row.channel,
    action: row.action,
    stateBefore: asObject(row.state_before),
    stateAfter: asObject(row.state_after),
    errorMessage: row.error_message ?? undefined,
    isDryRun: row.is_dry_run,
  };
}

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

function proposalAction(proposal: Proposal) {
  const channel = proposal.channel === 'google_ads' ? 'Google Ads' : 'Meta Ads';

  switch (proposal.type) {
    case 'budget_increase':
      return `DRY_RUN: aumentar budget em ${channel} (${proposal.title})`;
    case 'budget_decrease':
      return `DRY_RUN: reduzir budget em ${channel} (${proposal.title})`;
    case 'bid_adjustment':
      return `DRY_RUN: ajustar bid em ${channel} (${proposal.title})`;
    case 'audience_expansion':
      return `DRY_RUN: simular expansao de audiencia em ${channel} (${proposal.title})`;
    case 'campaign_pause':
      return `DRY_RUN: simular pausa em ${channel} (${proposal.title})`;
    case 'creative_rotation':
      return `DRY_RUN: simular rotacao de criativos em ${channel} (${proposal.title})`;
  }
}

function buildPreflightChecks(
  proposal: Proposal,
  approval: ApprovalRow,
  alreadySimulated: boolean,
): ExecutionPreflightCheck[] {
  return [
    {
      id: 'proposal_approved',
      title: 'Proposta aprovada',
      status: proposal.status === 'approved' ? 'passed' : 'blocked',
      detail:
        proposal.status === 'approved'
          ? 'A proposta passou pela fila de aprovacao humana.'
          : 'A proposta precisa estar aprovada antes de qualquer simulacao.',
    },
    {
      id: 'rule_validator_certified',
      title: 'Rule Validator certificado',
      status: proposal.ruleValidatorPassed ? 'passed' : 'blocked',
      detail:
        proposal.ruleValidatorPassed
          ? 'A proposta esta certificada pelo rule_validator.'
          : 'Certifique a proposta em /validator antes de simular.',
    },
    {
      id: 'human_approval_recorded',
      title: 'Aprovacao humana registrada',
      status: approval.decision === 'approved' ? 'passed' : 'blocked',
      detail:
        approval.decision === 'approved'
          ? 'Existe aprovacao humana positiva vinculada.'
          : 'A aprovacao vinculada nao libera simulacao.',
    },
    {
      id: 'external_writes_locked',
      title: 'Escrita externa bloqueada',
      status: 'passed',
      detail: 'Google Ads, Meta Ads e MCPs permanecem fora do fluxo de escrita.',
    },
    {
      id: 'duplicate_dry_run',
      title: 'Simulacao repetida',
      status: alreadySimulated ? 'warning' : 'passed',
      detail: alreadySimulated
        ? 'Ja existe execution_log para esta proposta. Repetir gera nova evidencia, nao nova execucao.'
        : 'Nenhuma simulacao anterior encontrada para esta proposta.',
    },
  ];
}

function buildRollbackPlan(proposal: Proposal): ExecutionRollbackStep[] {
  const channel = proposal.channel === 'google_ads' ? 'Google Ads' : 'Meta Ads';

  return [
    {
      order: 1,
      title: 'Capturar estado anterior',
      detail: `Antes de uma execucao real futura, salvar configuracao atual da entidade em ${channel}.`,
    },
    {
      order: 2,
      title: 'Aplicar janela de observacao',
      detail:
        'Acompanhar impacto financeiro e qualidade do funil antes de considerar a execucao como definitiva.',
    },
    {
      order: 3,
      title: 'Reverter se romper limite',
      detail:
        'Se custo, margem ou qualidade passarem do limite aprovado, restaurar o estado anterior e registrar auditoria.',
    },
  ];
}

function canDryRun(preflightChecks: ExecutionPreflightCheck[]) {
  return preflightChecks.every((check) => check.status !== 'blocked');
}

function mapApproval(row: ApprovalRow, proposal: Proposal): Approval {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    proposalTitle: proposal.title,
    clientId: row.client_id,
    approver: row.approver_user_id,
    decision: row.decision,
    justification: row.justification,
    decidedAt: row.decided_at,
  };
}

export async function getSupabaseExecutionData(
  supabase: SupabaseClient<Database>,
): Promise<SupabaseExecutionData> {
  const membership = await getActiveMembership(supabase);

  const [{ data: proposalRows, error: proposalsError }, { data: approvalRows, error: approvalsError }, { data: logRows, error: logsError }] =
    await Promise.all([
      supabase
        .from('proposals')
        .select('*')
        .eq('client_id', membership.clientId)
        .eq('status', 'approved')
        .eq('rule_validator_passed', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('approvals')
        .select('*')
        .eq('client_id', membership.clientId)
        .eq('decision', 'approved')
        .order('decided_at', { ascending: false }),
      supabase
        .from('execution_logs')
        .select('*')
        .eq('client_id', membership.clientId)
        .order('executed_at', { ascending: false })
        .limit(50),
    ]);

  if (proposalsError) throw proposalsError;
  if (approvalsError) throw approvalsError;
  if (logsError) throw logsError;

  const proposals = (proposalRows ?? []).map(mapProposal);
  const proposalsById = new Map(proposals.map((proposal) => [proposal.id, proposal]));
  const logs = (logRows ?? []).map(mapExecutionLog);
  const simulatedProposalIds = new Set(logs.map((log) => log.proposalId));

  const candidates: ExecutionCandidate[] = (approvalRows ?? [])
    .map((approval) => {
      const proposal = proposalsById.get(approval.proposal_id);
      if (!proposal) return null;
      const alreadySimulated = simulatedProposalIds.has(proposal.id);
      const preflightChecks = buildPreflightChecks(proposal, approval, alreadySimulated);

      return {
        proposal,
        approval: mapApproval(approval, proposal),
        alreadySimulated,
        canDryRun: canDryRun(preflightChecks),
        preflightChecks,
        rollbackPlan: buildRollbackPlan(proposal),
      };
    })
    .filter((candidate): candidate is ExecutionCandidate => candidate !== null);

  return {
    candidates,
    executionLogs: logs,
  };
}

export async function recordSupabaseExecutionDryRun(
  supabase: SupabaseClient<Database>,
  proposalId: string,
  approvalId: string,
) {
  const membership = await getActiveMembership(supabase);

  const { data: proposalRow, error: proposalError } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .eq('client_id', membership.clientId)
    .eq('status', 'approved')
    .eq('rule_validator_passed', true)
    .single();

  if (proposalError) {
    throw proposalError;
  }

  const { data: approvalRow, error: approvalError } = await supabase
    .from('approvals')
    .select('*')
    .eq('id', approvalId)
    .eq('proposal_id', proposalId)
    .eq('client_id', membership.clientId)
    .eq('decision', 'approved')
    .single();

  if (approvalError) {
    throw approvalError;
  }

  const proposal = mapProposal(proposalRow);
  const existingLogsResult = await supabase
    .from('execution_logs')
    .select('id')
    .eq('client_id', membership.clientId)
    .eq('proposal_id', proposalId)
    .limit(1);

  if (existingLogsResult.error) {
    throw existingLogsResult.error;
  }

  const preflightChecks = buildPreflightChecks(
    proposal,
    approvalRow,
    (existingLogsResult.data ?? []).length > 0,
  );

  if (!canDryRun(preflightChecks)) {
    throw new Error('Execution dry-run preflight is blocked.');
  }

  const rollbackPlan = buildRollbackPlan(proposal);
  const action = proposalAction(proposal);
  const stateBefore = {
    source: 'execution_engine_ui',
    version: 'v53',
    mode: 'dry_run',
    external_write: false,
    proposal_status: proposal.status,
    rule_validator_passed: proposal.ruleValidatorPassed,
    approval_decision: approvalRow.decision,
    preflight_checks: preflightChecks,
    rollback_plan: rollbackPlan,
  };
  const stateAfter = {
    simulated: true,
    external_write: false,
    mcp_called: false,
    google_ads_called: false,
    meta_ads_called: false,
    preflight_status: 'passed',
    rollback_plan_registered: true,
    rollback_plan: rollbackPlan,
    next_required_step: 'manual_review_before_any_real_execution',
  };

  const { data: logRow, error: logError } = await supabase
    .from('execution_logs')
    .insert({
      client_id: membership.clientId,
      proposal_id: proposalId,
      approval_id: approvalId,
      result: 'simulated',
      channel: proposal.channel,
      action,
      state_before: stateBefore as Json,
      state_after: stateAfter as Json,
      error_message: null,
      is_dry_run: true,
    })
    .select('*')
    .single();

  if (logError) {
    throw logError;
  }

  const { error: auditError } = await supabase.from('audit_events').insert({
    client_id: membership.clientId,
    actor_user_id: membership.userId,
    event_type: 'execution.dry_run_recorded',
    severity: 'info',
    entity_type: 'execution_log',
    entity_id: logRow.id,
    description: 'Execution Engine registrou simulacao sem escrita externa.',
    metadata: {
      source: 'execution_engine_ui',
      proposal_id: proposalId,
      approval_id: approvalId,
      result: 'simulated',
      is_dry_run: true,
      external_write: false,
      preflight_status: 'passed',
      preflight_warnings: preflightChecks.filter((check) => check.status === 'warning').length,
      rollback_steps: rollbackPlan.length,
    } as Json,
  });

  if (auditError) {
    throw auditError;
  }

  return mapExecutionLog(logRow);
}
