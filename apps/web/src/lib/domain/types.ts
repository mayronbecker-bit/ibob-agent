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

export type UserRole = 'owner' | 'admin' | 'approver' | 'viewer';

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

// ===== Context Intelligence =====

export type ContextStatus = 'draft' | 'active' | 'archived';

export type ContextQuestionCategory =
  | 'offer'
  | 'economics'
  | 'audience'
  | 'geography'
  | 'seasonality'
  | 'sales_process'
  | 'capacity'
  | 'goals'
  | 'constraints'
  | 'differentiation'
  | 'lead_quality'
  | 'predictability'
  | 'operations';

export type ContextAnswerType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'single_choice'
  | 'multi_choice'
  | 'currency'
  | 'percentage'
  | 'json';

export type ContextAnswerSource = 'user' | 'imported' | 'agent_inferred' | 'manual_review';
export type ContextGapStatus = 'open' | 'resolved' | 'ignored';
export type ContextGapSeverity = 'info' | 'warning' | 'critical';

export interface BusinessContext {
  id: string;
  clientId: string;
  name: string;
  status: ContextStatus;
  summary?: string;
  completenessScore: number;
  createdBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextQuestion {
  id: string;
  questionKey: string;
  category: ContextQuestionCategory;
  question: string;
  intent: string;
  answerType: ContextAnswerType;
  required: boolean;
  sortOrder: number;
  options: unknown[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContextAnswer {
  id: string;
  contextId: string;
  clientId: string;
  questionId: string;
  answerText?: string;
  answerValue: Record<string, unknown>;
  confidence: number;
  source: ContextAnswerSource;
  answeredBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextVersion {
  id: string;
  contextId: string;
  clientId: string;
  version: number;
  status: ContextStatus;
  summary?: string;
  completenessScore: number;
  snapshot: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  activatedAt?: string;
}

export interface ContextGap {
  id: string;
  contextId: string;
  clientId: string;
  questionId?: string;
  gapKey: string;
  severity: ContextGapSeverity;
  status: ContextGapStatus;
  description: string;
  recommendation?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Context Research =====

export type ContextResearchRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'needs_review';

export type ContextResearchSourceType =
  | 'company_site'
  | 'competitor_site'
  | 'search_result'
  | 'social_profile'
  | 'directory'
  | 'user_supplied'
  | 'other';

export type ContextResearchFindingType =
  | 'positioning'
  | 'offer'
  | 'pricing'
  | 'audience'
  | 'differentiator'
  | 'proof'
  | 'channel'
  | 'competitor'
  | 'gap'
  | 'risk'
  | 'sales_process'
  | 'location'
  | 'product'
  | 'review_signal'
  | 'opportunity';

export type ContextResearchReviewStatus =
  | 'needs_review'
  | 'accepted'
  | 'rejected'
  | 'converted_to_context'
  | 'converted_to_memory';

export type CompetitorProfileStatus = 'candidate' | 'active' | 'dismissed';
export type ContextMemoryType =
  | 'company_context'
  | 'competitor_context'
  | 'market_context'
  | 'risk'
  | 'opportunity'
  | 'constraint';
export type ContextMemoryStatus = 'draft' | 'active' | 'archived';

export interface ContextResearchRun {
  id: string;
  contextId: string;
  clientId: string;
  requestedBy?: string;
  status: ContextResearchRunStatus;
  companyUrl?: string;
  searchQuery?: string;
  scope: Record<string, unknown>;
  summary?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextResearchSource {
  id: string;
  researchRunId: string;
  contextId: string;
  clientId: string;
  sourceType: ContextResearchSourceType;
  title?: string;
  url?: string;
  publisher?: string;
  accessedAt: string;
  snippet?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContextResearchFinding {
  id: string;
  researchRunId: string;
  sourceId?: string;
  contextId: string;
  clientId: string;
  findingType: ContextResearchFindingType;
  title: string;
  finding: string;
  evidence?: string;
  confidence: number;
  reviewStatus: ContextResearchReviewStatus;
  suggestedQuestionId?: string;
  suggestedAnswerText?: string;
  metadata: Record<string, unknown>;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorProfile {
  id: string;
  contextId: string;
  clientId: string;
  name: string;
  websiteUrl?: string;
  status: CompetitorProfileStatus;
  positioning?: string;
  offerSummary?: string;
  strengths?: string;
  weaknesses?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorInsight {
  id: string;
  competitorId: string;
  researchRunId?: string;
  contextId: string;
  clientId: string;
  insightType: ContextResearchFindingType;
  insight: string;
  evidence?: string;
  sourceUrl?: string;
  confidence: number;
  reviewStatus: ContextResearchReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextMemoryItem {
  id: string;
  contextId: string;
  clientId: string;
  sourceFindingId?: string;
  sourceCompetitorInsightId?: string;
  memoryType: ContextMemoryType;
  status: ContextMemoryStatus;
  title: string;
  content: string;
  confidence: number;
  createdBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
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

// ===== Audit =====

export type AuditEventSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  clientId: string;
  actorUserId?: string;
  eventType: string;
  severity: AuditEventSeverity;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
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
