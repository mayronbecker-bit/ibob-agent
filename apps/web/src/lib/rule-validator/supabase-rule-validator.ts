import type { SupabaseClient } from '@supabase/supabase-js';
import type { RuleValidatorRule } from '@/lib/domain/types';
import type { RuleValidatorDryRun } from '@/lib/rule-validator/supervised-rule-validator';
import type { Database, Json } from '@/lib/supabase/database.types';

type ActiveMembership = {
  clientId: string;
  userId: string;
};

type RuleRow = Database['public']['Tables']['rule_validator_rules']['Row'];
type RunRow = Database['public']['Tables']['rule_validator_runs']['Row'];
type CheckRow = Database['public']['Tables']['rule_validator_checks']['Row'];

export type RuleValidatorRunLog = {
  id: string;
  clientId: string;
  proposalId?: string;
  result: RunRow['result'];
  canPromoteToProposal: boolean;
  canExecuteExternalAction: boolean;
  summary: string;
  createdBy?: string;
  createdAt: string;
  decisionContext: Record<string, unknown>;
  checks: Array<{
    id: string;
    ruleKey: string;
    result: CheckRow['result'];
    severity: CheckRow['severity'];
    message: string;
    remediation: string;
    evidence: Record<string, unknown>;
  }>;
};

function asObject(value: Json): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
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

function mapRule(row: RuleRow): RuleValidatorRule {
  return {
    id: row.id,
    clientId: row.client_id,
    ruleKey: row.rule_key,
    version: row.version,
    title: row.title,
    category: row.category,
    severity: row.severity,
    status: row.status,
    description: row.description,
    condition: asObject(row.condition),
    failureMessage: row.failure_message,
    remediation: row.remediation,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSupabaseRuleValidatorRules(
  supabase: SupabaseClient<Database>,
): Promise<RuleValidatorRule[]> {
  const membership = await getActiveMembership(supabase);

  const { data, error } = await supabase
    .from('rule_validator_rules')
    .select(
      'id, client_id, rule_key, version, title, category, severity, status, description, condition, failure_message, remediation, created_by, created_at, updated_at',
    )
    .eq('client_id', membership.clientId)
    .eq('status', 'active')
    .order('category', { ascending: true })
    .order('rule_key', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRule);
}

export async function getSupabaseRuleValidatorRunLogs(
  supabase: SupabaseClient<Database>,
  limit = 5,
): Promise<RuleValidatorRunLog[]> {
  const membership = await getActiveMembership(supabase);

  const { data: runs, error: runsError } = await supabase
    .from('rule_validator_runs')
    .select(
      'id, client_id, proposal_id, decision_context, result, can_promote_to_proposal, can_execute_external_action, summary, created_by, created_at',
    )
    .eq('client_id', membership.clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (runsError) {
    throw runsError;
  }

  const runRows = runs ?? [];
  const runIds = runRows.map((run) => run.id);

  if (runIds.length === 0) {
    return [];
  }

  const { data: checks, error: checksError } = await supabase
    .from('rule_validator_checks')
    .select(
      'id, run_id, client_id, rule_id, rule_key, result, severity, evidence, message, remediation, created_at',
    )
    .in('run_id', runIds)
    .order('created_at', { ascending: true });

  if (checksError) {
    throw checksError;
  }

  const checksByRun = new Map<string, CheckRow[]>();

  (checks ?? []).forEach((checkRow) => {
    const existing = checksByRun.get(checkRow.run_id) ?? [];
    existing.push(checkRow);
    checksByRun.set(checkRow.run_id, existing);
  });

  return runRows.map((run) => ({
    id: run.id,
    clientId: run.client_id,
    proposalId: run.proposal_id ?? undefined,
    result: run.result,
    canPromoteToProposal: run.can_promote_to_proposal,
    canExecuteExternalAction: run.can_execute_external_action,
    summary: run.summary,
    createdBy: run.created_by ?? undefined,
    createdAt: run.created_at,
    decisionContext: asObject(run.decision_context),
    checks: (checksByRun.get(run.id) ?? []).map((checkRow) => ({
      id: checkRow.id,
      ruleKey: checkRow.rule_key,
      result: checkRow.result,
      severity: checkRow.severity,
      message: checkRow.message,
      remediation: checkRow.remediation,
      evidence: asObject(checkRow.evidence),
    })),
  }));
}

function uuidOrNull(value?: string) {
  if (!value) {
    return null;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export async function recordSupabaseRuleValidatorRun(
  supabase: SupabaseClient<Database>,
  dryRun: RuleValidatorDryRun,
) {
  const membership = await getActiveMembership(supabase);
  const proposalId = uuidOrNull(dryRun.selectedProposal?.id);

  const { data: run, error: runError } = await supabase
    .from('rule_validator_runs')
    .insert({
      client_id: membership.clientId,
      proposal_id: proposalId,
      decision_context: {
        source: 'validator_ui',
        mode: 'supervised_dry_run',
        selected_proposal_id: dryRun.selectedProposal?.id ?? null,
        selected_proposal_title: dryRun.selectedProposal?.title ?? null,
        result_label: dryRun.resultLabel,
        pass_count: dryRun.passCount,
        warning_count: dryRun.warningCount,
        fail_count: dryRun.failCount,
        rules_count: dryRun.rules.length,
      } as Json,
      result: dryRun.result,
      can_promote_to_proposal: dryRun.canPromoteToProposal,
      can_execute_external_action: false,
      summary: dryRun.summary,
      created_by: membership.userId,
    })
    .select('id')
    .single();

  if (runError) {
    throw runError;
  }

  const checkPayload: Database['public']['Tables']['rule_validator_checks']['Insert'][] =
    dryRun.checks.map((check) => ({
      run_id: run.id,
      client_id: membership.clientId,
      rule_id: uuidOrNull(check.ruleId),
      rule_key: check.ruleKey,
      result: check.result,
      severity: check.severity,
      evidence: check.evidence as Json,
      message: check.message,
      remediation: check.remediation,
    }));

  const { error: checksError } = await supabase
    .from('rule_validator_checks')
    .insert(checkPayload);

  if (checksError) {
    throw checksError;
  }

  const { error: auditError } = await supabase.from('audit_events').insert({
    client_id: membership.clientId,
    actor_user_id: membership.userId,
    event_type: 'rule_validator.run_recorded',
    severity: dryRun.result === 'failed' ? 'warning' : 'info',
    entity_type: 'rule_validator_run',
    entity_id: run.id,
    description: 'Dry-run do rule_validator registrado pela UI.',
    metadata: {
      source: 'validator_ui',
      result: dryRun.result,
      can_promote_to_proposal: dryRun.canPromoteToProposal,
      selected_proposal_id: dryRun.selectedProposal?.id ?? null,
      pass_count: dryRun.passCount,
      warning_count: dryRun.warningCount,
      fail_count: dryRun.failCount,
    } as Json,
  });

  if (auditError) {
    throw auditError;
  }

  return {
    runId: run.id,
  };
}

export async function certifySupabaseProposalWithRuleValidator(
  supabase: SupabaseClient<Database>,
  dryRun: RuleValidatorDryRun,
) {
  const membership = await getActiveMembership(supabase);
  const proposalId = uuidOrNull(dryRun.selectedProposal?.id);

  if (!proposalId) {
    throw new Error('A valid proposal id is required to certify a proposal.');
  }

  if (!dryRun.canPromoteToProposal) {
    throw new Error('The dry-run cannot be promoted to a supervised proposal.');
  }

  const { runId } = await recordSupabaseRuleValidatorRun(supabase, dryRun);
  const noteParts = [
    `Certificada pelo rule_validator em dry-run ${runId.slice(0, 8)}.`,
    `Resultado: ${dryRun.result}.`,
    `Passou ${dryRun.passCount}/${dryRun.checks.length} regras.`,
  ];

  if (dryRun.warningCount > 0) {
    noteParts.push(`${dryRun.warningCount} alerta(s) devem acompanhar a aprovacao humana.`);
  }

  const { error: proposalError } = await supabase
    .from('proposals')
    .update({
      rule_validator_passed: true,
      rule_validator_notes: noteParts.join(' '),
    })
    .eq('id', proposalId)
    .eq('client_id', membership.clientId)
    .select('id')
    .single();

  if (proposalError) {
    throw proposalError;
  }

  const { error: auditError } = await supabase.from('audit_events').insert({
    client_id: membership.clientId,
    actor_user_id: membership.userId,
    event_type: 'rule_validator.proposal_certified',
    severity: 'info',
    entity_type: 'proposal',
    entity_id: proposalId,
    description: 'Proposta certificada pelo rule_validator para aprovacao humana.',
    metadata: {
      source: 'validator_ui',
      run_id: runId,
      proposal_id: proposalId,
      result: dryRun.result,
      can_promote_to_proposal: dryRun.canPromoteToProposal,
      can_execute_external_action: false,
      warning_count: dryRun.warningCount,
    } as Json,
  });

  if (auditError) {
    throw auditError;
  }

  return {
    proposalId,
    runId,
  };
}
