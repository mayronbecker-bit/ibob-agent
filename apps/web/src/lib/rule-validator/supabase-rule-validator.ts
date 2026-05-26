import type { SupabaseClient } from '@supabase/supabase-js';
import type { RuleValidatorRule } from '@/lib/domain/types';
import type { Database, Json } from '@/lib/supabase/database.types';

type ActiveMembership = {
  clientId: string;
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
