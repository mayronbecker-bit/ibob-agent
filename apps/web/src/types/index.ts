export type AgentStatus = 'green' | 'yellow' | 'red';

export type Channel = 'google_ads' | 'meta_ads';

export type ProposalType =
  | 'budget_increase'
  | 'budget_decrease'
  | 'bid_adjustment'
  | 'audience_expansion'
  | 'campaign_pause'
  | 'creative_rotation';

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'deferred';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RoadmapStageStatus = 'done' | 'in_progress' | 'planned';

export interface DataSource {
  id: string;
  name: string;
  status: AgentStatus;
  lastSync: string;
  issue?: string;
}

export interface DataTrustState {
  overallStatus: AgentStatus;
  checkedAt: string;
  sources: DataSource[];
  blockingReason?: string;
}

export interface Proposal {
  id: string;
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
}

export interface ApprovalRecord {
  proposalId: string;
  proposalTitle: string;
  approver: string;
  decision: 'approved' | 'rejected' | 'deferred';
  justification: string;
  decidedAt: string;
}

export interface DecisionMemoryEntry {
  id: string;
  proposalTitle: string;
  channel: Channel;
  decision: 'approved' | 'rejected';
  outcome: string;
  impactMeasured?: string;
  learning: string;
  loggedAt: string;
}

export interface RoadmapStage {
  number: number;
  title: string;
  status: RoadmapStageStatus;
  description: string;
}

export interface OverviewMetric {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}
