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
      business_contexts: TableDefinition<
        TimestampColumns & {
          id: string;
          client_id: string;
          name: string;
          status: Database['public']['Enums']['context_status'];
          summary: string | null;
          completeness_score: number;
          created_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        },
        {
          id?: string;
          client_id: string;
          name: string;
          status?: Database['public']['Enums']['context_status'];
          summary?: string | null;
          completeness_score?: number;
          created_by?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          client_id: string;
          name: string;
          status: Database['public']['Enums']['context_status'];
          summary: string | null;
          completeness_score: number;
          created_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        }>
      >;
      context_questions: TableDefinition<
        TimestampColumns & {
          id: string;
          question_key: string;
          category: Database['public']['Enums']['context_question_category'];
          question: string;
          intent: string;
          answer_type: Database['public']['Enums']['context_answer_type'];
          required: boolean;
          sort_order: number;
          options: Json;
          is_active: boolean;
        },
        {
          id?: string;
          question_key: string;
          category: Database['public']['Enums']['context_question_category'];
          question: string;
          intent: string;
          answer_type?: Database['public']['Enums']['context_answer_type'];
          required?: boolean;
          sort_order?: number;
          options?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          question_key: string;
          category: Database['public']['Enums']['context_question_category'];
          question: string;
          intent: string;
          answer_type: Database['public']['Enums']['context_answer_type'];
          required: boolean;
          sort_order: number;
          options: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }>
      >;
      context_answers: TableDefinition<
        TimestampColumns & {
          id: string;
          context_id: string;
          client_id: string;
          question_id: string;
          answer_text: string | null;
          answer_value: Json;
          confidence: number;
          source: Database['public']['Enums']['context_answer_source'];
          answered_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        },
        {
          id?: string;
          context_id: string;
          client_id: string;
          question_id: string;
          answer_text?: string | null;
          answer_value?: Json;
          confidence?: number;
          source?: Database['public']['Enums']['context_answer_source'];
          answered_by?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          context_id: string;
          client_id: string;
          question_id: string;
          answer_text: string | null;
          answer_value: Json;
          confidence: number;
          source: Database['public']['Enums']['context_answer_source'];
          answered_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        }>
      >;
      context_versions: TableDefinition<
        {
          id: string;
          context_id: string;
          client_id: string;
          version: number;
          status: Database['public']['Enums']['context_status'];
          summary: string | null;
          completeness_score: number;
          snapshot: Json;
          created_by: string | null;
          created_at: string;
          activated_at: string | null;
        },
        {
          id?: string;
          context_id: string;
          client_id: string;
          version: number;
          status?: Database['public']['Enums']['context_status'];
          summary?: string | null;
          completeness_score?: number;
          snapshot?: Json;
          created_by?: string | null;
          created_at?: string;
          activated_at?: string | null;
        },
        Partial<{
          id: string;
          context_id: string;
          client_id: string;
          version: number;
          status: Database['public']['Enums']['context_status'];
          summary: string | null;
          completeness_score: number;
          snapshot: Json;
          created_by: string | null;
          created_at: string;
          activated_at: string | null;
        }>
      >;
      context_gaps: TableDefinition<
        TimestampColumns & {
          id: string;
          context_id: string;
          client_id: string;
          question_id: string | null;
          gap_key: string;
          severity: Database['public']['Enums']['context_gap_severity'];
          status: Database['public']['Enums']['context_gap_status'];
          description: string;
          recommendation: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
        },
        {
          id?: string;
          context_id: string;
          client_id: string;
          question_id?: string | null;
          gap_key: string;
          severity?: Database['public']['Enums']['context_gap_severity'];
          status?: Database['public']['Enums']['context_gap_status'];
          description: string;
          recommendation?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          context_id: string;
          client_id: string;
          question_id: string | null;
          gap_key: string;
          severity: Database['public']['Enums']['context_gap_severity'];
          status: Database['public']['Enums']['context_gap_status'];
          description: string;
          recommendation: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        }>
      >;
      context_research_runs: TableDefinition<
        TimestampColumns & {
          id: string;
          context_id: string;
          client_id: string;
          requested_by: string | null;
          status: Database['public']['Enums']['context_research_run_status'];
          company_url: string | null;
          search_query: string | null;
          scope: Json;
          summary: string | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
        },
        {
          id?: string;
          context_id: string;
          client_id: string;
          requested_by?: string | null;
          status?: Database['public']['Enums']['context_research_run_status'];
          company_url?: string | null;
          search_query?: string | null;
          scope?: Json;
          summary?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          context_id: string;
          client_id: string;
          requested_by: string | null;
          status: Database['public']['Enums']['context_research_run_status'];
          company_url: string | null;
          search_query: string | null;
          scope: Json;
          summary: string | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        }>
      >;
      context_research_sources: TableDefinition<
        TimestampColumns & {
          id: string;
          research_run_id: string;
          context_id: string;
          client_id: string;
          source_type: Database['public']['Enums']['context_research_source_type'];
          title: string | null;
          url: string | null;
          publisher: string | null;
          accessed_at: string;
          snippet: string | null;
          metadata: Json;
        },
        {
          id?: string;
          research_run_id: string;
          context_id: string;
          client_id: string;
          source_type: Database['public']['Enums']['context_research_source_type'];
          title?: string | null;
          url?: string | null;
          publisher?: string | null;
          accessed_at?: string;
          snippet?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          research_run_id: string;
          context_id: string;
          client_id: string;
          source_type: Database['public']['Enums']['context_research_source_type'];
          title: string | null;
          url: string | null;
          publisher: string | null;
          accessed_at: string;
          snippet: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        }>
      >;
      context_research_findings: TableDefinition<
        TimestampColumns & {
          id: string;
          research_run_id: string;
          source_id: string | null;
          context_id: string;
          client_id: string;
          finding_type: Database['public']['Enums']['context_research_finding_type'];
          title: string;
          finding: string;
          evidence: string | null;
          confidence: number;
          review_status: Database['public']['Enums']['context_research_review_status'];
          suggested_question_id: string | null;
          suggested_answer_text: string | null;
          metadata: Json;
          reviewed_by: string | null;
          reviewed_at: string | null;
        },
        {
          id?: string;
          research_run_id: string;
          source_id?: string | null;
          context_id: string;
          client_id: string;
          finding_type: Database['public']['Enums']['context_research_finding_type'];
          title: string;
          finding: string;
          evidence?: string | null;
          confidence?: number;
          review_status?: Database['public']['Enums']['context_research_review_status'];
          suggested_question_id?: string | null;
          suggested_answer_text?: string | null;
          metadata?: Json;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          research_run_id: string;
          source_id: string | null;
          context_id: string;
          client_id: string;
          finding_type: Database['public']['Enums']['context_research_finding_type'];
          title: string;
          finding: string;
          evidence: string | null;
          confidence: number;
          review_status: Database['public']['Enums']['context_research_review_status'];
          suggested_question_id: string | null;
          suggested_answer_text: string | null;
          metadata: Json;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        }>
      >;
      competitor_profiles: TableDefinition<
        TimestampColumns & {
          id: string;
          context_id: string;
          client_id: string;
          name: string;
          website_url: string | null;
          status: Database['public']['Enums']['competitor_profile_status'];
          positioning: string | null;
          offer_summary: string | null;
          strengths: string | null;
          weaknesses: string | null;
          metadata: Json;
        },
        {
          id?: string;
          context_id: string;
          client_id: string;
          name: string;
          website_url?: string | null;
          status?: Database['public']['Enums']['competitor_profile_status'];
          positioning?: string | null;
          offer_summary?: string | null;
          strengths?: string | null;
          weaknesses?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          context_id: string;
          client_id: string;
          name: string;
          website_url: string | null;
          status: Database['public']['Enums']['competitor_profile_status'];
          positioning: string | null;
          offer_summary: string | null;
          strengths: string | null;
          weaknesses: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        }>
      >;
      competitor_insights: TableDefinition<
        TimestampColumns & {
          id: string;
          competitor_id: string;
          research_run_id: string | null;
          context_id: string;
          client_id: string;
          insight_type: Database['public']['Enums']['context_research_finding_type'];
          insight: string;
          evidence: string | null;
          source_url: string | null;
          confidence: number;
          review_status: Database['public']['Enums']['context_research_review_status'];
          reviewed_by: string | null;
          reviewed_at: string | null;
        },
        {
          id?: string;
          competitor_id: string;
          research_run_id?: string | null;
          context_id: string;
          client_id: string;
          insight_type: Database['public']['Enums']['context_research_finding_type'];
          insight: string;
          evidence?: string | null;
          source_url?: string | null;
          confidence?: number;
          review_status?: Database['public']['Enums']['context_research_review_status'];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          competitor_id: string;
          research_run_id: string | null;
          context_id: string;
          client_id: string;
          insight_type: Database['public']['Enums']['context_research_finding_type'];
          insight: string;
          evidence: string | null;
          source_url: string | null;
          confidence: number;
          review_status: Database['public']['Enums']['context_research_review_status'];
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        }>
      >;
      context_memory_items: TableDefinition<
        TimestampColumns & {
          id: string;
          context_id: string;
          client_id: string;
          source_finding_id: string | null;
          source_competitor_insight_id: string | null;
          memory_type: Database['public']['Enums']['context_memory_type'];
          status: Database['public']['Enums']['context_memory_status'];
          title: string;
          content: string;
          confidence: number;
          created_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        },
        {
          id?: string;
          context_id: string;
          client_id: string;
          source_finding_id?: string | null;
          source_competitor_insight_id?: string | null;
          memory_type: Database['public']['Enums']['context_memory_type'];
          status?: Database['public']['Enums']['context_memory_status'];
          title: string;
          content: string;
          confidence?: number;
          created_by?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          id: string;
          context_id: string;
          client_id: string;
          source_finding_id: string | null;
          source_competitor_insight_id: string | null;
          memory_type: Database['public']['Enums']['context_memory_type'];
          status: Database['public']['Enums']['context_memory_status'];
          title: string;
          content: string;
          confidence: number;
          created_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
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
      audit_events: TableDefinition<
        {
          id: string;
          client_id: string;
          actor_user_id: string | null;
          event_type: string;
          severity: Database['public']['Enums']['audit_event_severity'];
          entity_type: string | null;
          entity_id: string | null;
          description: string;
          metadata: Json;
          occurred_at: string;
        },
        {
          id?: string;
          client_id: string;
          actor_user_id?: string | null;
          event_type: string;
          severity?: Database['public']['Enums']['audit_event_severity'];
          entity_type?: string | null;
          entity_id?: string | null;
          description: string;
          metadata?: Json;
          occurred_at?: string;
        },
        Partial<{
          id: string;
          client_id: string;
          actor_user_id: string | null;
          event_type: string;
          severity: Database['public']['Enums']['audit_event_severity'];
          entity_type: string | null;
          entity_id: string | null;
          description: string;
          metadata: Json;
          occurred_at: string;
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
      record_proposal_decision: {
        Args: {
          target_proposal_id: string;
          decision: Database['public']['Enums']['approval_decision'];
          justification: string;
        };
        Returns: Database['public']['Tables']['approvals']['Row'];
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
      audit_event_severity: 'info' | 'warning' | 'critical';
      context_status: 'draft' | 'active' | 'archived';
      context_question_category:
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
      context_answer_type:
        | 'text'
        | 'number'
        | 'boolean'
        | 'single_choice'
        | 'multi_choice'
        | 'currency'
        | 'percentage'
        | 'json';
      context_answer_source: 'user' | 'imported' | 'agent_inferred' | 'manual_review';
      context_gap_status: 'open' | 'resolved' | 'ignored';
      context_gap_severity: 'info' | 'warning' | 'critical';
      context_research_run_status:
        | 'queued'
        | 'running'
        | 'completed'
        | 'failed'
        | 'cancelled'
        | 'needs_review';
      context_research_source_type:
        | 'company_site'
        | 'competitor_site'
        | 'search_result'
        | 'social_profile'
        | 'directory'
        | 'user_supplied'
        | 'other';
      context_research_finding_type:
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
      context_research_review_status:
        | 'needs_review'
        | 'accepted'
        | 'rejected'
        | 'converted_to_context'
        | 'converted_to_memory';
      competitor_profile_status: 'candidate' | 'active' | 'dismissed';
      context_memory_type:
        | 'company_context'
        | 'competitor_context'
        | 'market_context'
        | 'risk'
        | 'opportunity'
        | 'constraint';
      context_memory_status: 'draft' | 'active' | 'archived';
    };
    CompositeTypes: Record<string, never>;
  };
};
