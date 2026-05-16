import type { AgentMode } from '@/lib/domain/types';

/** Configuration contract for a single client/tenant. */
export interface ClientConfig {
  id: string;
  name: string;
  slug: string;
  /** Operational mode of the agent for this client. */
  mode: AgentMode;
  /** Names of users authorized to approve proposals. */
  approvers: readonly string[];
  /** Ad channels active for this client. */
  channels: readonly string[];
  agentVersion: string;
  promptVersion: string;
  thresholdVersion: string;
}
