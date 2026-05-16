export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      clients: TableDefinition<
        TimestampColumns & {
          id: string;
          name: string;
          slug: string;
          status: Database['public']['Enums']['client_status'];
          plan: Database['public']['Enums']['client_plan'];
        },
        {
          id: string;
          name: string;
          slug: string;
          status?: Database['public']['Enums']['client_status'];
          plan?: Database['public']['Enums']['client_plan'];
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          name: string;
          slug: string;
          status: Database['public']['Enums']['client_status'];
          plan: Database['public']['Enums']['client_plan'];
          created_at: string;
          updated_at: string;
        }>
      >;
      user_profiles: TableDefinition<
        TimestampColumns & {
          user_id: string;
          full_name: string | null;
          email: string | null;
        },
        {
          user_id: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          user_id: string;
          full_name: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        }>
      >;
      client_memberships: TableDefinition<
        TimestampColumns & {
          id: string;
          client_id: string;
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          status: Database['public']['Enums']['membership_status'];
        },
        {
          id?: string;
          client_id: string;
          user_id: string;
          role?: Database['public']['Enums']['app_role'];
          status?: Database['public']['Enums']['membership_status'];
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          client_id: string;
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          status: Database['public']['Enums']['membership_status'];
          created_at: string;
          updated_at: string;
        }>
      >;
      agent_versions: TableDefinition<
        {
          id: string;
          version: string;
          released_at: string;
          prompt_version: string;
          threshold_version: string;
          changelog: string;
          is_active: boolean;
        },
        {
          id?: string;
          version: string;
          released_at?: string;
          prompt_version: string;
          threshold_version: string;
          changelog: string;
          is_active?: boolean;
        },
        Partial<{
          id: string;
          version: string;
          released_at: string;
          prompt_version: string;
          threshold_version: string;
          changelog: string;
          is_active: boolean;
        }>
      >;
      data_sources: TableDefinition<
        TimestampColumns & {
          id: string;
          client_id: string;
          name: string;
          type: Database['public']['Enums']['data_source_type'];
          status: Database['public']['Enums']['agent_status'];
          last_sync_at: string | null;
          issue: string | null;
          metadata: Json;
        },
        {
          id?: string;
          client_id: string;
          name: string;
          type: Database['public']['Enums']['data_source_type'];
          status?: Database['public']['Enums']['agent_status'];
          last_sync_at?: string | null;
          issue?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          client_id: string;
          name: string;
          type: Database['public']['Enums']['data_source_type'];
          status: Database['public']['Enums']['agent_status'];
          last_sync_at: string | null;
          issue: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        }>
      >;
      raw_metrics: TableDefinition<
        {
          id: string;
          client_id: string;
          data_source_id: string | null;
          channel: Database['public']['Enums']['metric_channel'];
          metric_name: string;
          value: number;
          unit: string;
          collected_at: string;
          period: string;
          metadata: Json;
        },
        {
          id?: string;
          client_id: string;
          data_source_id?: string | null;
          channel: Database['public']['Enums']['metric_channel'];
          metric_name: string;
          value: number;
          unit: string;
          collected_at?: string;
          period: string;
          metadata?: Json;
        },
        Partial<{
          id: string;
          client_id: string;
          data_source_id: string | null;
          channel: Database['public']['Enums']['metric_channel'];
          metric_name: string;
          value: number;
          unit: string;
          collected_at: string;
          period: string;
          metadata: Json;
        }>
      >;
      proposals: TableDefinition<
        {
          id: string;
          client_id: string;
          title: string;
          channel: Database['public']['Enums']['ad_channel'];
          type: Database['public']['Enums']['proposal_type'];
          reasoning: string;
          expected_impact: string;
          status: Database['public']['Enums']['proposal_status'];
          risk_level: Database['public']['Enums']['risk_level'];
          rule_validator_passed: boolean;
          rule_validator_notes: string | null;
          created_at: string;
          budget_delta_brl: number | null;
          agent_version: string;
          prompt_version: string;
          metadata: Json;
        },
        {
          id?: string;
          client_id: string;
          title: string;
          channel: Database['public']['Enums']['ad_channel'];
          type: Database['public']['Enums']['proposal_type'];
          reasoning: string;
          expected_impact: string;
          status?: Database['public']['Enums']['proposal_status'];
          risk_level: Database['public']['Enums']['risk_level'];
          rule_validator_passed: boolean;
          rule_validator_notes?: string | null;
          created_at?: string;
          budget_delta_brl?: number | null;
          agent_version: string;
          prompt_version: string;
          metadata?: Json;
        },
        Partial<{
          id: string;
          client_id: string;
          title: string;
          channel: Database['public']['Enums']['ad_channel'];
          type: Database['public']['Enums']['proposal_type'];
          reasoning: string;
          expected_impact: string;
          status: Database['public']['Enums']['proposal_status'];
          risk_level: Database['public']['Enums']['risk_level'];
          rule_validator_passed: boolean;
          rule_validator_notes: string | null;
          created_at: string;
          budget_delta_brl: number | null;
          agent_version: string;
          prompt_version: string;
          metadata: Json;
        }>
      >;
      approvals: TableDefinition<
        {
          id: string;
          proposal_id: string;
          client_id: string;
          approver_user_id: string;
          decision: Database['public']['Enums']['approval_decision'];
          justification: string;
          decided_at: string;
        },
        {
          id?: string;
          proposal_id: string;
          client_id: string;
          approver_user_id: string;
          decision: Database['public']['Enums']['approval_decision'];
          justification: string;
          decided_at?: string;
        },
        Partial<{
          id: string;
          proposal_id: string;
          client_id: string;
          approver_user_id: string;
          decision: Database['public']['Enums']['approval_decision'];
          justification: string;
          decided_at: string;
        }>
      >;
      decision_memory: TableDefinition<
        {
          id: string;
          client_id: string;
          proposal_id: string | null;
          proposal_title: string;
          channel: Database['public']['Enums']['ad_channel'];
          decision: Database['public']['Enums']['approval_decision'];
          outcome: string;
          impact_measured: string | null;
          learning: string;
          logged_at: string;
        },
        {
          id?: string;
          client_id: string;
          proposal_id?: string | null;
          proposal_title: string;
          channel: Database['public']['Enums']['ad_channel'];
          decision: Database['public']['Enums']['approval_decision'];
          outcome: string;
          impact_measured?: string | null;
          learning: string;
          logged_at?: string;
        },
        Partial<{
          id: string;
          client_id: string;
          proposal_id: string | null;
          proposal_title: string;
          channel: Database['public']['Enums']['ad_channel'];
          decision: Database['public']['Enums']['approval_decision'];
          outcome: string;
          impact_measured: string | null;
          learning: string;
          logged_at: string;
        }>
      >;
      execution_logs: TableDefinition<
        {
          id: string;
          client_id: string;
          proposal_id: string;
          approval_id: string;
          executed_at: string;
          result: Database['public']['Enums']['execution_result'];
          channel: Database['public']['Enums']['ad_channel'];
          action: string;
          state_before: Json | null;
          state_after: Json | null;
          error_message: string | null;
          is_dry_run: boolean;
        },
        {
          id?: string;
          client_id: string;
          proposal_id: string;
          approval_id: string;
          executed_at?: string;
          result: Database['public']['Enums']['execution_result'];
          channel: Database['public']['Enums']['ad_channel'];
          action: string;
          state_before?: Json | null;
          state_after?: Json | null;
          error_message?: string | null;
          is_dry_run?: boolean;
        },
        Partial<{
          id: string;
          client_id: string;
          proposal_id: string;
          approval_id: string;
          executed_at: string;
          result: Database['public']['Enums']['execution_result'];
          channel: Database['public']['Enums']['ad_channel'];
          action: string;
          state_before: Json | null;
          state_after: Json | null;
          error_message: string | null;
          is_dry_run: boolean;
        }>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: { target_client_id: string };
        Returns: Database['public']['Enums']['app_role'] | null;
      };
      current_user_has_role: {
        Args: {
          target_client_id: string;
          allowed_roles: Database['public']['Enums']['app_role'][];
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'owner' | 'admin' | 'approver' | 'viewer';
      membership_status: 'active' | 'invited' | 'disabled';
      client_status: 'active' | 'inactive' | 'trial';
      client_plan: 'pilot' | 'starter' | 'growth' | 'enterprise';
      agent_status: 'green' | 'yellow' | 'red';
      ad_channel: 'google_ads' | 'meta_ads';
      metric_channel: 'google_ads' | 'meta_ads' | 'ga4' | 'crm' | 'orbita';
      data_source_type: 'google_ads' | 'meta_ads' | 'ga4' | 'crm' | 'erp' | 'custom';
      proposal_type:
        | 'budget_increase'
        | 'budget_decrease'
        | 'bid_adjustment'
        | 'audience_expansion'
        | 'campaign_pause'
        | 'creative_rotation';
      proposal_status: 'pending' | 'approved' | 'rejected' | 'executed' | 'deferred';
      risk_level: 'low' | 'medium' | 'high';
      approval_decision: 'approved' | 'rejected' | 'deferred';
      execution_result: 'success' | 'failure' | 'skipped' | 'simulated';
    };
    CompositeTypes: Record<string, never>;
  };
};
