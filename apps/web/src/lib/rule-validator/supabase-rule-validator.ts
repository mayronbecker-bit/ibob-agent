import type { SupabaseClient } from '@supabase/supabase-js';
import type { RuleValidatorRule } from '@/lib/domain/types';
import type { RuleValidatorDryRun } from '@/lib/rule-validator/supervised-rule-validator';
import type { Database, Json } from '@/lib/supabase/database.types';

type ActiveMembership = {
  clientId: string;
  userId: string;
};

type RuleRow = Database['public']['Tables']['rule_validator_rules']['Row'];

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
