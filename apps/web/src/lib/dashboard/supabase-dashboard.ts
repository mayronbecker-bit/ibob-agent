import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AgentStatus,
  Approval,
  DataSource,
  DataTrustState,
  OverviewMetric,
  Proposal,
  RawMetric,
} from '@/lib/domain/types';
import type { Database } from '@/lib/supabase/database.types';

export type SupabaseDashboardData = {
  overviewMetrics: OverviewMetric[];
  metricPeriod: string;
  dataTrustState: DataTrustState;
  proposals: Proposal[];
  approvalHistory: Approval[];
};

type ProfileRow = Database['public']['Tables']['user_profiles']['Row'];

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(value);
}

function signedCurrency(value: number) {
  const formatted = currency(Math.abs(value));
  return `${value >= 0 ? '+' : '-'}${formatted}`;
}

function signedNumber(value: number) {
  return `${value >= 0 ? '+' : ''}${number(value)}`;
}

function sumMetric(metrics: RawMetric[], metricName: string) {
  return metrics
    .filter((metric) => metric.metricName === metricName)
    .reduce((total, metric) => total + metric.value, 0);
}

function groupByPeriod(metrics: RawMetric[]) {
  const periods = Array.from(new Set(metrics.map((metric) => metric.period))).sort().reverse();
  const currentPeriod = periods[0];
  const previousPeriod = periods[1];

  return {
    currentPeriod,
    current: metrics.filter((metric) => metric.period === currentPeriod),
    previous: metrics.filter((metric) => metric.period === previousPeriod),
  };
}

function deriveOverviewMetrics(
  metrics: RawMetric[],
  proposals: Proposal[],
  approvals: Approval[],
): OverviewMetric[] {
  const { current, previous } = groupByPeriod(metrics);

  const currentSpend = sumMetric(current, 'ad_spend_brl');
  const previousSpend = sumMetric(previous, 'ad_spend_brl');
  const currentRevenue = sumMetric(current, 'revenue_brl');
  const previousRevenue = sumMetric(previous, 'revenue_brl');
  const currentLeads = sumMetric(current, 'leads');
  const previousLeads = sumMetric(previous, 'leads');
  const currentRoas = currentSpend > 0 ? currentRevenue / currentSpend : 0;
  const previousRoas = previousSpend > 0 ? previousRevenue / previousSpend : 0;
  const currentCpa = currentLeads > 0 ? currentSpend / currentLeads : 0;
  const previousCpa = previousLeads > 0 ? previousSpend / previousLeads : 0;
  const pendingCount = proposals.filter((proposal) => proposal.status === 'pending').length;
  const approvalsThisWeek = approvals.filter((approval) => {
    const decidedAt = new Date(approval.decidedAt).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return Number.isFinite(decidedAt) && decidedAt >= sevenDaysAgo;
  });
  const rejectedThisWeek = approvalsThisWeek.filter(
    (approval) => approval.decision === 'rejected',
  ).length;

  return [
    {
      label: 'ROAS medio',
      value: `${currentRoas.toFixed(1)}x`,
      trend: `${(currentRoas - previousRoas >= 0 ? '+' : '')}${(currentRoas - previousRoas).toFixed(1)} vs periodo anterior`,
      trendUp: currentRoas >= previousRoas,
    },
    {
      label: 'Gasto total',
      value: currency(currentSpend),
      trend: `${signedCurrency(currentSpend - previousSpend)} vs periodo anterior`,
      trendUp: currentSpend >= previousSpend,
    },
    {
      label: 'CPA medio',
      value: currency(currentCpa),
      trend: `${signedCurrency(currentCpa - previousCpa)} vs periodo anterior`,
      trendUp: currentCpa <= previousCpa,
    },
    {
      label: 'Leads gerados',
      value: number(currentLeads),
      trend: `${signedNumber(currentLeads - previousLeads)} vs periodo anterior`,
      trendUp: currentLeads >= previousLeads,
    },
    {
      label: 'Propostas pendentes',
      value: String(pendingCount),
      trend: `${proposals.length} propostas no pipeline`,
    },
    {
      label: 'Aprovacoes esta semana',
      value: String(approvalsThisWeek.length),
      trend: `${rejectedThisWeek} rejeitadas`,
      trendUp: rejectedThisWeek === 0,
    },
  ];
}

function deriveOverallStatus(sources: DataSource[]): AgentStatus {
  if (sources.some((source) => source.status === 'red')) return 'red';
  if (sources.some((source) => source.status === 'yellow')) return 'yellow';
  return 'green';
}

function deriveCheckedAt(sources: DataSource[]) {
  const timestamps = sources
    .map((source) => new Date(source.lastSync).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return new Date().toISOString();
  return new Date(Math.max(...timestamps)).toISOString();
}

function mapProposal(row: Database['public']['Tables']['proposals']['Row']): Proposal {
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

function getApproverName(profile: ProfileRow | undefined) {
  return profile?.full_name ?? profile?.email ?? 'Usuario Supabase';
}

function mapRawMetric(row: Database['public']['Tables']['raw_metrics']['Row']): RawMetric {
  const value = Number(row.value);

  return {
    id: row.id,
    clientId: row.client_id,
    channel: row.channel,
    metricName: row.metric_name,
    value: Number.isFinite(value) ? value : 0,
    unit: row.unit,
    collectedAt: row.collected_at,
    period: row.period,
  };
}

export async function getSupabaseDashboardData(
  supabase: SupabaseClient<Database>,
): Promise<SupabaseDashboardData> {
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

  const [
    rawMetricsResult,
    dataSourcesResult,
    proposalsResult,
    approvalsResult,
  ] = await Promise.all([
    supabase
      .from('raw_metrics')
      .select('*')
      .eq('client_id', membership.client_id)
      .order('period', { ascending: false }),
    supabase
      .from('data_sources')
      .select('id, client_id, name, type, status, last_sync_at, issue')
      .eq('client_id', membership.client_id)
      .order('name', { ascending: true }),
    supabase
      .from('proposals')
      .select('*')
      .eq('client_id', membership.client_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('approvals')
      .select('*')
      .eq('client_id', membership.client_id)
      .order('decided_at', { ascending: false }),
  ]);

  if (rawMetricsResult.error) throw rawMetricsResult.error;
  if (dataSourcesResult.error) throw dataSourcesResult.error;
  if (proposalsResult.error) throw proposalsResult.error;
  if (approvalsResult.error) throw approvalsResult.error;

  const proposals = (proposalsResult.data ?? []).map(mapProposal);
  const proposalsById = new Map(proposals.map((proposal) => [proposal.id, proposal]));
  const approverIds = Array.from(
    new Set((approvalsResult.data ?? []).map((approval) => approval.approver_user_id)),
  );

  const { data: profileRows, error: profilesError } = approverIds.length
    ? await supabase.from('user_profiles').select('*').in('user_id', approverIds)
    : { data: [], error: null };

  if (profilesError) throw profilesError;

  const profilesById = new Map((profileRows ?? []).map((profile) => [profile.user_id, profile]));
  const approvalHistory: Approval[] = (approvalsResult.data ?? []).map((approval) => ({
    id: approval.id,
    proposalId: approval.proposal_id,
    proposalTitle: proposalsById.get(approval.proposal_id)?.title ?? 'Proposta removida',
    clientId: approval.client_id,
    approver: getApproverName(profilesById.get(approval.approver_user_id)),
    decision: approval.decision,
    justification: approval.justification,
    decidedAt: approval.decided_at,
  }));

  const sources: DataSource[] = (dataSourcesResult.data ?? []).map((source) => ({
    id: source.id,
    clientId: source.client_id,
    name: source.name,
    type: source.type,
    status: source.status,
    lastSync: source.last_sync_at ?? new Date().toISOString(),
    issue: source.issue ?? undefined,
  }));
  const rawMetrics = (rawMetricsResult.data ?? []).map(mapRawMetric);
  const { currentPeriod } = groupByPeriod(rawMetrics);

  return {
    overviewMetrics: deriveOverviewMetrics(rawMetrics, proposals, approvalHistory),
    metricPeriod: currentPeriod ?? new Date().toISOString().slice(0, 10),
    dataTrustState: {
      clientId: membership.client_id,
      overallStatus: deriveOverallStatus(sources),
      checkedAt: deriveCheckedAt(sources),
      sources,
    },
    proposals,
    approvalHistory,
  };
}
