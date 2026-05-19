/**
 * Re-exports all domain types from the canonical source.
 * Import from here for backward compatibility; prefer
 * importing directly from '@/lib/domain/types' in new files.
 */
export type {
  // Shared primitives
  AgentStatus,
  Channel,
  MetricChannel,

  // Client / Tenant
  ClientStatus,
  ClientPlan,
  Client,

  // User
  UserRole,
  User,

  // Data Source
  DataSourceType,
  DataSource,
  DataTrustState,

  // Raw Metric
  RawMetric,

  // Agent
  AgentMode,
  AgentState,
  AgentVersion,

  // Proposal
  ProposalType,
  ProposalStatus,
  RiskLevel,
  Proposal,

  // Approval
  ApprovalDecision,
  Approval,
  ApprovalRecord,

  // Decision Memory
  DecisionMemory,
  DecisionMemoryEntry,

  // Execution
  ExecutionResult,
  ExecutionLog,

  // Audit
  AuditEventSeverity,
  AuditEvent,

  // Roadmap
  RoadmapStageStatus,
  RoadmapStage,

  // Dashboard
  OverviewMetric,
} from '@/lib/domain/types';
