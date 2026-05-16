// ============================================================
// Domain contracts — canonical types for the iBob Agent platform.
// These are the single source of truth for all entities, shaped
// to map 1-to-1 to future Supabase tables. Keep in sync with
// docs/DATA_FOUNDATION.md when fields change.
// ============================================================

// ===== Client / Tenant =====

export type ClientStatus = 'active' | 'inactive' | 'trial';
export type ClientPlan = 'pilot' | 'starter' | 'growth' | 'enterprise';

export interface Client {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
  plan: ClientPlan;
  createdAt: string;
}

// ===== User =====

export type UserRole = 'admin' | 'approver' | 'viewer';

export interface User {
  id: string;
  clientId: string;
  name: string;
  email: string;
  role: UserRole;
}

// ===== Shared primitives =====

export type AgentStatus = 'green' | 'yellow' | 'red';
export type Channel = 'google_ads' | 'meta_ads';
export type MetricChannel = Channel | 'ga4' | 'crm' | 'orbita';

// ===== Data Source =====

export type DataSourceType = 'google_ads' | 'meta_ads' | 'ga4' | 'crm' | 'erp' | 'custom';

export interface DataSource {
  id: string;
  clientId: string;
  name: string;
  type: DataSourceType;
  status: AgentStatus;
  lastSync: string;
  issue?: string;
}

export interface DataTrustState {
  clientId: string;
  overallStatus: AgentStatus;
  checkedAt: string;
  sources: DataSource[];
  blockingReason?: string;
}

// ===== Raw Metric =====

export interface RawMetric {
  id: string;
  clientId: string;
  channel: MetricChannel;
  metricName: string;
  value: number;
  unit: string;
  collectedAt: string;
  /** ISO date string, e.g. '2026-05-12' */
  period: string;
}

// ===== Agent Mode & State =====

export type AgentMode = 'DRY_RUN' | 'SUPERVISED' | 'AUTONOMOUS';

export interface AgentState {
  clientId: string;
  status: AgentStatus;
  mode: AgentMode;
  checkedAt: string;
  blockingReason?: string;
  agentVersion: string;
}

// ===== Agent Version =====

export interface AgentVersion {
  version: string;
  releasedAt: string;
  promptVersion: string;
  thresholdVersion: string;
  changelog: string;
  isActive: boolean;
}

// ===== Proposal =====

export type ProposalType =
  | 'budget_increase'
  | 'budget_decrease'
  | 'bid_adjustment'
  | 'audience_expansion'
  | 'campaign_pause'
  | 'creative_rotation';

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'deferred';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Proposal {
  id: string;
  clientId: string;
  title: string;
  channel: Channel;
  type: ProposalType;
  reasoning: string;
  expectedImpact: string;
  status: ProposalStatus;
  riskLevel: RiskLevel;
  ruleValidatorPassed: boolean;
  ruleValidatorNotes?: string;
  createdAt: string;
  budgetDeltaBrl?: number;
  agentVersion: string;
  promptVersion: string;
}

// ===== Approval =====

export type ApprovalDecision = 'approved' | 'rejected' | 'deferred';

export interface Approval {
  id: string;
  proposalId: string;
  proposalTitle: string;
  clientId: string;
  approver: string;
  decision: ApprovalDecision;
  justification: string;
  decidedAt: string;
}

/** Backward-compat alias — prefer Approval in new code. */
export type ApprovalRecord = Approval;

// ===== Decision Memory =====

export interface DecisionMemory {
  id: string;
  clientId: string;
  proposalId?: string;
  proposalTitle: string;
  channel: Channel;
  decision: 'approved' | 'rejected';
  outcome: string;
  impactMeasured?: string;
  learning: string;
  loggedAt: string;
}

/** Backward-compat alias — prefer DecisionMemory in new code. */
export type DecisionMemoryEntry = DecisionMemory;

// ===== Execution Log =====

export type ExecutionResult = 'success' | 'failure' | 'skipped' | 'simulated';

export interface ExecutionLog {
  id: string;
  clientId: string;
  proposalId: string;
  approvalId: string;
  executedAt: string;
  result: ExecutionResult;
  channel: Channel;
  action: string;
  stateBefore?: Record<string, unknown>;
  stateAfter?: Record<string, unknown>;
  errorMessage?: string;
  isDryRun: boolean;
}

// ===== Roadmap =====

export type RoadmapStageStatus = 'done' | 'in_progress' | 'planned';

export interface RoadmapStage {
  number: number;
  title: string;
  status: RoadmapStageStatus;
  description: string;
}

// ===== Dashboard =====

export interface OverviewMetric {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}
