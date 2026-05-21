import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BusinessContext,
  CompetitorInsight,
  CompetitorProfile,
  CompetitorProfileStatus,
  ContextMemoryItem,
  ContextMemoryStatus,
  ContextResearchFinding,
  ContextResearchReviewStatus,
  ContextResearchRun,
  ContextResearchSource,
} from '@/lib/domain/types';
import type { Database, Json } from '@/lib/supabase/database.types';

export type SupabaseContextResearchData = {
  clientId: string;
  context: BusinessContext | null;
  runs: ContextResearchRun[];
  sources: ContextResearchSource[];
  findings: ContextResearchFinding[];
  competitors: CompetitorProfile[];
  competitorInsights: CompetitorInsight[];
  memoryItems: ContextMemoryItem[];
};

type ActiveMembership = {
  clientId: string;
  userId: string;
};

type ScopedEntityInput = {
  id: string;
  contextId: string;
  clientId: string;
  reviewNote?: string;
};

type FindingReviewStatus = Extract<ContextResearchReviewStatus, 'accepted' | 'rejected'>;
type InsightReviewStatus = Extract<ContextResearchReviewStatus, 'accepted' | 'rejected'>;
type EditableCompetitorStatus = Extract<CompetitorProfileStatus, 'active' | 'dismissed'>;
type EditableMemoryStatus = Extract<ContextMemoryStatus, 'active' | 'archived'>;

type AuditInput = {
  eventType: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

function asObject(value: Json): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function mapContext(
  context: Database['public']['Tables']['business_contexts']['Row'],
): BusinessContext {
  return {
    id: context.id,
    clientId: context.client_id,
    name: context.name,
    status: context.status,
    summary: context.summary ?? undefined,
    completenessScore: context.completeness_score,
    createdBy: context.created_by ?? undefined,
    reviewedBy: context.reviewed_by ?? undefined,
    reviewedAt: context.reviewed_at ?? undefined,
    createdAt: context.created_at,
    updatedAt: context.updated_at,
  };
}

function mapRun(run: Database['public']['Tables']['context_research_runs']['Row']): ContextResearchRun {
  return {
    id: run.id,
    contextId: run.context_id,
    clientId: run.client_id,
    requestedBy: run.requested_by ?? undefined,
    status: run.status,
    companyUrl: run.company_url ?? undefined,
    searchQuery: run.search_query ?? undefined,
    scope: asObject(run.scope),
    summary: run.summary ?? undefined,
    errorMessage: run.error_message ?? undefined,
    startedAt: run.started_at ?? undefined,
    completedAt: run.completed_at ?? undefined,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  };
}

function mapSource(
  source: Database['public']['Tables']['context_research_sources']['Row'],
): ContextResearchSource {
  return {
    id: source.id,
    researchRunId: source.research_run_id,
    contextId: source.context_id,
    clientId: source.client_id,
    sourceType: source.source_type,
    title: source.title ?? undefined,
    url: source.url ?? undefined,
    publisher: source.publisher ?? undefined,
    accessedAt: source.accessed_at,
    snippet: source.snippet ?? undefined,
    metadata: asObject(source.metadata),
    createdAt: source.created_at,
    updatedAt: source.updated_at,
  };
}

function mapFinding(
  finding: Database['public']['Tables']['context_research_findings']['Row'],
): ContextResearchFinding {
  return {
    id: finding.id,
    researchRunId: finding.research_run_id,
    sourceId: finding.source_id ?? undefined,
    contextId: finding.context_id,
    clientId: finding.client_id,
    findingType: finding.finding_type,
    title: finding.title,
    finding: finding.finding,
    evidence: finding.evidence ?? undefined,
    confidence: finding.confidence,
    reviewStatus: finding.review_status,
    suggestedQuestionId: finding.suggested_question_id ?? undefined,
    suggestedAnswerText: finding.suggested_answer_text ?? undefined,
    metadata: asObject(finding.metadata),
    reviewedBy: finding.reviewed_by ?? undefined,
    reviewedAt: finding.reviewed_at ?? undefined,
    createdAt: finding.created_at,
    updatedAt: finding.updated_at,
  };
}

function mapCompetitor(
  competitor: Database['public']['Tables']['competitor_profiles']['Row'],
): CompetitorProfile {
  return {
    id: competitor.id,
    contextId: competitor.context_id,
    clientId: competitor.client_id,
    name: competitor.name,
    websiteUrl: competitor.website_url ?? undefined,
    status: competitor.status,
    positioning: competitor.positioning ?? undefined,
    offerSummary: competitor.offer_summary ?? undefined,
    strengths: competitor.strengths ?? undefined,
    weaknesses: competitor.weaknesses ?? undefined,
    metadata: asObject(competitor.metadata),
    createdAt: competitor.created_at,
    updatedAt: competitor.updated_at,
  };
}

function mapCompetitorInsight(
  insight: Database['public']['Tables']['competitor_insights']['Row'],
): CompetitorInsight {
  return {
    id: insight.id,
    competitorId: insight.competitor_id,
    researchRunId: insight.research_run_id ?? undefined,
    contextId: insight.context_id,
    clientId: insight.client_id,
    insightType: insight.insight_type,
    insight: insight.insight,
    evidence: insight.evidence ?? undefined,
    sourceUrl: insight.source_url ?? undefined,
    confidence: insight.confidence,
    reviewStatus: insight.review_status,
    reviewedBy: insight.reviewed_by ?? undefined,
    reviewedAt: insight.reviewed_at ?? undefined,
    createdAt: insight.created_at,
    updatedAt: insight.updated_at,
  };
}

function mapMemoryItem(
  item: Database['public']['Tables']['context_memory_items']['Row'],
): ContextMemoryItem {
  return {
    id: item.id,
    contextId: item.context_id,
    clientId: item.client_id,
    sourceFindingId: item.source_finding_id ?? undefined,
    sourceCompetitorInsightId: item.source_competitor_insight_id ?? undefined,
    memoryType: item.memory_type,
    status: item.status,
    title: item.title,
    content: item.content,
    confidence: item.confidence,
    createdBy: item.created_by ?? undefined,
    reviewedBy: item.reviewed_by ?? undefined,
    reviewedAt: item.reviewed_at ?? undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
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

function cleanReviewNote(note?: string) {
  const trimmed = note?.trim();
  return trimmed ? trimmed.slice(0, 1000) : undefined;
}

async function insertAuditEvent(
  supabase: SupabaseClient<Database>,
  membership: ActiveMembership,
  input: AuditInput,
) {
  const { error } = await supabase.from('audit_events').insert({
    client_id: membership.clientId,
    actor_user_id: membership.userId,
    event_type: input.eventType,
    severity: 'info',
    entity_type: input.entityType,
    entity_id: input.entityId,
    description: input.description,
    metadata: (input.metadata ?? {}) as Json,
  });

  if (error) {
    throw error;
  }
}

export async function getSupabaseContextResearchData(
  supabase: SupabaseClient<Database>,
): Promise<SupabaseContextResearchData> {
  const membership = await getActiveMembership(supabase);

  const { data: contexts, error: contextError } = await supabase
    .from('business_contexts')
    .select(
      'id, client_id, name, status, summary, completeness_score, created_by, reviewed_by, reviewed_at, created_at, updated_at',
    )
    .eq('client_id', membership.clientId)
    .order('status', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1);

  if (contextError) {
    throw contextError;
  }

  const context = contexts?.[0] ? mapContext(contexts[0]) : null;

  if (!context) {
    return {
      clientId: membership.clientId,
      context: null,
      runs: [],
      sources: [],
      findings: [],
      competitors: [],
      competitorInsights: [],
      memoryItems: [],
    };
  }

  const [
    { data: runs, error: runsError },
    { data: sources, error: sourcesError },
    { data: findings, error: findingsError },
    { data: competitors, error: competitorsError },
    { data: competitorInsights, error: competitorInsightsError },
    { data: memoryItems, error: memoryItemsError },
  ] = await Promise.all([
    supabase
      .from('context_research_runs')
      .select(
        'id, context_id, client_id, requested_by, status, company_url, search_query, scope, summary, error_message, started_at, completed_at, created_at, updated_at',
      )
      .eq('context_id', context.id)
      .eq('client_id', membership.clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('context_research_sources')
      .select(
        'id, research_run_id, context_id, client_id, source_type, title, url, publisher, accessed_at, snippet, metadata, created_at, updated_at',
      )
      .eq('context_id', context.id)
      .eq('client_id', membership.clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('context_research_findings')
      .select(
        'id, research_run_id, source_id, context_id, client_id, finding_type, title, finding, evidence, confidence, review_status, suggested_question_id, suggested_answer_text, metadata, reviewed_by, reviewed_at, created_at, updated_at',
      )
      .eq('context_id', context.id)
      .eq('client_id', membership.clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('competitor_profiles')
      .select(
        'id, context_id, client_id, name, website_url, status, positioning, offer_summary, strengths, weaknesses, metadata, created_at, updated_at',
      )
      .eq('context_id', context.id)
      .eq('client_id', membership.clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('competitor_insights')
      .select(
        'id, competitor_id, research_run_id, context_id, client_id, insight_type, insight, evidence, source_url, confidence, review_status, reviewed_by, reviewed_at, created_at, updated_at',
      )
      .eq('context_id', context.id)
      .eq('client_id', membership.clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('context_memory_items')
      .select(
        'id, context_id, client_id, source_finding_id, source_competitor_insight_id, memory_type, status, title, content, confidence, created_by, reviewed_by, reviewed_at, created_at, updated_at',
      )
      .eq('context_id', context.id)
      .eq('client_id', membership.clientId)
      .order('created_at', { ascending: false }),
  ]);

  if (runsError) throw runsError;
  if (sourcesError) throw sourcesError;
  if (findingsError) throw findingsError;
  if (competitorsError) throw competitorsError;
  if (competitorInsightsError) throw competitorInsightsError;
  if (memoryItemsError) throw memoryItemsError;

  return {
    clientId: membership.clientId,
    context,
    runs: (runs ?? []).map(mapRun),
    sources: (sources ?? []).map(mapSource),
    findings: (findings ?? []).map(mapFinding),
    competitors: (competitors ?? []).map(mapCompetitor),
    competitorInsights: (competitorInsights ?? []).map(mapCompetitorInsight),
    memoryItems: (memoryItems ?? []).map(mapMemoryItem),
  };
}

export async function createSupabaseContextResearchRun(
  supabase: SupabaseClient<Database>,
  input: {
    contextId: string;
    clientId: string;
    companyUrl: string;
    searchQuery: string;
    reviewNote?: string;
  },
) {
  const membership = await getActiveMembership(supabase);

  if (membership.clientId !== input.clientId) {
    throw new Error('Active membership does not match context client.');
  }

  const { error } = await supabase.from('context_research_runs').insert({
    context_id: input.contextId,
    client_id: input.clientId,
    requested_by: membership.userId,
    status: 'queued',
    company_url: input.companyUrl.trim(),
    search_query: input.searchQuery.trim(),
    scope: {
      company_site: true,
      competitor_discovery: true,
      competitor_sites: true,
      ads_execution: false,
      requires_human_review: true,
    },
    summary:
      'Run criado pela console de pesquisa supervisionada. A execucao externa e a revisao humana continuam obrigatorias.',
  });

  if (error) {
    throw error;
  }

  await insertAuditEvent(supabase, membership, {
    eventType: 'context_research.run_created',
    entityType: 'context_research_run',
    entityId: input.companyUrl.trim(),
    description: 'Run de pesquisa contextual supervisionada criado.',
    metadata: {
      context_id: input.contextId,
      company_url: input.companyUrl.trim(),
      search_query: input.searchQuery.trim(),
      review_note: cleanReviewNote(input.reviewNote),
    },
  });
}

export async function reviewSupabaseContextResearchFinding(
  supabase: SupabaseClient<Database>,
  input: ScopedEntityInput & { status: FindingReviewStatus },
) {
  const membership = await getActiveMembership(supabase);

  if (membership.clientId !== input.clientId) {
    throw new Error('Active membership does not match finding client.');
  }

  const { error } = await supabase
    .from('context_research_findings')
    .update({
      review_status: input.status,
      reviewed_by: membership.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('context_id', input.contextId)
    .eq('client_id', input.clientId);

  if (error) {
    throw error;
  }

  await insertAuditEvent(supabase, membership, {
    eventType: 'context_research.finding_reviewed',
    entityType: 'context_research_finding',
    entityId: input.id,
    description:
      input.status === 'accepted'
        ? 'Achado de pesquisa aceito por revisao humana.'
        : 'Achado de pesquisa rejeitado por revisao humana.',
    metadata: {
      context_id: input.contextId,
      review_status: input.status,
      review_note: cleanReviewNote(input.reviewNote),
    },
  });
}

export async function reviewSupabaseCompetitorInsight(
  supabase: SupabaseClient<Database>,
  input: ScopedEntityInput & { status: InsightReviewStatus },
) {
  const membership = await getActiveMembership(supabase);

  if (membership.clientId !== input.clientId) {
    throw new Error('Active membership does not match insight client.');
  }

  const { error } = await supabase
    .from('competitor_insights')
    .update({
      review_status: input.status,
      reviewed_by: membership.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('context_id', input.contextId)
    .eq('client_id', input.clientId);

  if (error) {
    throw error;
  }

  await insertAuditEvent(supabase, membership, {
    eventType: 'context_research.competitor_insight_reviewed',
    entityType: 'competitor_insight',
    entityId: input.id,
    description:
      input.status === 'accepted'
        ? 'Insight concorrencial aceito por revisao humana.'
        : 'Insight concorrencial rejeitado por revisao humana.',
    metadata: {
      context_id: input.contextId,
      review_status: input.status,
      review_note: cleanReviewNote(input.reviewNote),
    },
  });
}

export async function updateSupabaseCompetitorStatus(
  supabase: SupabaseClient<Database>,
  input: ScopedEntityInput & { status: EditableCompetitorStatus },
) {
  const membership = await getActiveMembership(supabase);

  if (membership.clientId !== input.clientId) {
    throw new Error('Active membership does not match competitor client.');
  }

  const { error } = await supabase
    .from('competitor_profiles')
    .update({ status: input.status })
    .eq('id', input.id)
    .eq('context_id', input.contextId)
    .eq('client_id', input.clientId);

  if (error) {
    throw error;
  }

  await insertAuditEvent(supabase, membership, {
    eventType: 'context_research.competitor_status_updated',
    entityType: 'competitor_profile',
    entityId: input.id,
    description:
      input.status === 'active'
        ? 'Concorrente ativado para uso contextual.'
        : 'Concorrente descartado da memoria contextual ativa.',
    metadata: {
      context_id: input.contextId,
      competitor_status: input.status,
      review_note: cleanReviewNote(input.reviewNote),
    },
  });
}

export async function updateSupabaseContextMemoryStatus(
  supabase: SupabaseClient<Database>,
  input: ScopedEntityInput & {
    status: EditableMemoryStatus;
    sourceFindingId?: string;
    sourceCompetitorInsightId?: string;
  },
) {
  const membership = await getActiveMembership(supabase);

  if (membership.clientId !== input.clientId) {
    throw new Error('Active membership does not match memory client.');
  }

  const reviewedAt = new Date().toISOString();
  const { error: memoryError } = await supabase
    .from('context_memory_items')
    .update({
      status: input.status,
      reviewed_by: membership.userId,
      reviewed_at: reviewedAt,
    })
    .eq('id', input.id)
    .eq('context_id', input.contextId)
    .eq('client_id', input.clientId);

  if (memoryError) {
    throw memoryError;
  }

  if (input.status === 'active' && input.sourceFindingId) {
    const { error } = await supabase
      .from('context_research_findings')
      .update({
        review_status: 'converted_to_memory',
        reviewed_by: membership.userId,
        reviewed_at: reviewedAt,
      })
      .eq('id', input.sourceFindingId)
      .eq('context_id', input.contextId)
      .eq('client_id', input.clientId);

    if (error) {
      throw error;
    }
  }

  if (input.status === 'active' && input.sourceCompetitorInsightId) {
    const { error } = await supabase
      .from('competitor_insights')
      .update({
        review_status: 'converted_to_memory',
        reviewed_by: membership.userId,
        reviewed_at: reviewedAt,
      })
      .eq('id', input.sourceCompetitorInsightId)
      .eq('context_id', input.contextId)
      .eq('client_id', input.clientId);

    if (error) {
      throw error;
    }
  }

  await insertAuditEvent(supabase, membership, {
    eventType: 'context_research.memory_status_updated',
    entityType: 'context_memory_item',
    entityId: input.id,
    description:
      input.status === 'active'
        ? 'Memoria contextual ativada por revisao humana.'
        : 'Memoria contextual arquivada por revisao humana.',
    metadata: {
      context_id: input.contextId,
      memory_status: input.status,
      source_finding_id: input.sourceFindingId,
      source_competitor_insight_id: input.sourceCompetitorInsightId,
      review_note: cleanReviewNote(input.reviewNote),
    },
  });
}
