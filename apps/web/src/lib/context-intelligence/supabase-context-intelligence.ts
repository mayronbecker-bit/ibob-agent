import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BusinessContext,
  ContextAnswer,
  ContextGap,
  ContextQuestion,
} from '@/lib/domain/types';
import type { Database, Json } from '@/lib/supabase/database.types';

export type SupabaseContextIntelligenceData = {
  clientId: string;
  context: BusinessContext | null;
  questions: ContextQuestion[];
  answers: ContextAnswer[];
  gaps: ContextGap[];
};

type ActiveMembership = {
  clientId: string;
  userId: string;
};

function asStringArray(value: Json): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function asAnswerValue(value: Json): Record<string, unknown> {
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

function mapQuestion(
  question: Database['public']['Tables']['context_questions']['Row'],
): ContextQuestion {
  return {
    id: question.id,
    questionKey: question.question_key,
    category: question.category,
    question: question.question,
    intent: question.intent,
    answerType: question.answer_type,
    required: question.required,
    sortOrder: question.sort_order,
    options: asStringArray(question.options),
    isActive: question.is_active,
    createdAt: question.created_at,
    updatedAt: question.updated_at,
  };
}

function mapAnswer(answer: Database['public']['Tables']['context_answers']['Row']): ContextAnswer {
  return {
    id: answer.id,
    contextId: answer.context_id,
    clientId: answer.client_id,
    questionId: answer.question_id,
    answerText: answer.answer_text ?? undefined,
    answerValue: asAnswerValue(answer.answer_value),
    confidence: answer.confidence,
    source: answer.source,
    answeredBy: answer.answered_by ?? undefined,
    reviewedBy: answer.reviewed_by ?? undefined,
    reviewedAt: answer.reviewed_at ?? undefined,
    createdAt: answer.created_at,
    updatedAt: answer.updated_at,
  };
}

function mapGap(gap: Database['public']['Tables']['context_gaps']['Row']): ContextGap {
  return {
    id: gap.id,
    contextId: gap.context_id,
    clientId: gap.client_id,
    questionId: gap.question_id ?? undefined,
    gapKey: gap.gap_key,
    severity: gap.severity,
    status: gap.status,
    description: gap.description,
    recommendation: gap.recommendation ?? undefined,
    resolvedBy: gap.resolved_by ?? undefined,
    resolvedAt: gap.resolved_at ?? undefined,
    createdAt: gap.created_at,
    updatedAt: gap.updated_at,
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

async function updateContextCompleteness(
  supabase: SupabaseClient<Database>,
  contextId: string,
  clientId: string,
) {
  const { data: requiredQuestions, error: questionsError } = await supabase
    .from('context_questions')
    .select('id')
    .eq('is_active', true)
    .eq('required', true);

  if (questionsError) {
    throw questionsError;
  }

  const questionIds = (requiredQuestions ?? []).map((question) => question.id);

  if (questionIds.length === 0) {
    return;
  }

  const { data: answers, error: answersError } = await supabase
    .from('context_answers')
    .select('question_id, answer_text')
    .eq('context_id', contextId)
    .eq('client_id', clientId)
    .in('question_id', questionIds);

  if (answersError) {
    throw answersError;
  }

  const answeredRequiredCount = new Set(
    (answers ?? [])
      .filter((answer) => (answer.answer_text ?? '').trim().length > 0)
      .map((answer) => answer.question_id),
  ).size;

  const completenessScore = Number(
    ((answeredRequiredCount / questionIds.length) * 100).toFixed(2),
  );

  const { error: updateError } = await supabase
    .from('business_contexts')
    .update({ completeness_score: completenessScore })
    .eq('id', contextId)
    .eq('client_id', clientId);

  if (updateError) {
    throw updateError;
  }
}

export async function getSupabaseContextIntelligenceData(
  supabase: SupabaseClient<Database>,
): Promise<SupabaseContextIntelligenceData> {
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

  const { data: questions, error: questionsError } = await supabase
    .from('context_questions')
    .select(
      'id, question_key, category, question, intent, answer_type, required, sort_order, options, is_active, created_at, updated_at',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (questionsError) {
    throw questionsError;
  }

  if (!context) {
    return {
      clientId: membership.clientId,
      context: null,
      questions: (questions ?? []).map(mapQuestion),
      answers: [],
      gaps: [],
    };
  }

  const [{ data: answers, error: answersError }, { data: gaps, error: gapsError }] =
    await Promise.all([
      supabase
        .from('context_answers')
        .select(
          'id, context_id, client_id, question_id, answer_text, answer_value, confidence, source, answered_by, reviewed_by, reviewed_at, created_at, updated_at',
        )
        .eq('context_id', context.id)
        .eq('client_id', membership.clientId),
      supabase
        .from('context_gaps')
        .select(
          'id, context_id, client_id, question_id, gap_key, severity, status, description, recommendation, resolved_by, resolved_at, created_at, updated_at',
        )
        .eq('context_id', context.id)
        .eq('client_id', membership.clientId)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false }),
    ]);

  if (answersError) {
    throw answersError;
  }

  if (gapsError) {
    throw gapsError;
  }

  return {
    clientId: membership.clientId,
    context,
    questions: (questions ?? []).map(mapQuestion),
    answers: (answers ?? []).map(mapAnswer),
    gaps: (gaps ?? []).map(mapGap),
  };
}

export async function upsertSupabaseContextAnswer(
  supabase: SupabaseClient<Database>,
  input: {
    contextId: string;
    clientId: string;
    questionId: string;
    answerText: string;
  },
) {
  const membership = await getActiveMembership(supabase);

  if (membership.clientId !== input.clientId) {
    throw new Error('Active membership does not match context client.');
  }

  const cleanAnswer = input.answerText.trim();

  const { error } = await supabase.from('context_answers').upsert(
    {
      context_id: input.contextId,
      client_id: input.clientId,
      question_id: input.questionId,
      answer_text: cleanAnswer,
      answer_value: { value: cleanAnswer },
      source: 'user',
      answered_by: membership.userId,
    },
    {
      onConflict: 'context_id,question_id',
    },
  );

  if (error) {
    throw error;
  }

  await updateContextCompleteness(supabase, input.contextId, input.clientId);
}

export async function resolveSupabaseContextGovernance(
  supabase: SupabaseClient<Database>,
  input: {
    contextId: string;
    clientId: string;
    gapKeys: string[];
  },
) {
  const membership = await getActiveMembership(supabase);

  if (membership.clientId !== input.clientId) {
    throw new Error('Active membership does not match context client.');
  }

  const resolvedAt = new Date().toISOString();

  const { error: contextError } = await supabase
    .from('business_contexts')
    .update({
      status: 'active',
      reviewed_by: membership.userId,
      reviewed_at: resolvedAt,
      summary:
        'Contexto comercial validado para orientar estrategia, rule_validator e Decision Engine supervisionado.',
    })
    .eq('id', input.contextId)
    .eq('client_id', input.clientId);

  if (contextError) {
    throw contextError;
  }

  if (input.gapKeys.length > 0) {
    const { error: gapsError } = await supabase
      .from('context_gaps')
      .update({
        status: 'resolved',
        resolved_by: membership.userId,
        resolved_at: resolvedAt,
      })
      .eq('context_id', input.contextId)
      .eq('client_id', input.clientId)
      .eq('status', 'open')
      .in('gap_key', input.gapKeys);

    if (gapsError) {
      throw gapsError;
    }
  }

  const { error: auditError } = await supabase.from('audit_events').insert({
    client_id: input.clientId,
    actor_user_id: membership.userId,
    event_type: 'context.governance_resolved',
    severity: 'info',
    entity_type: 'business_context',
    entity_id: input.contextId,
    description: 'Governanca do contexto resolvida pela tela de estrategia CMO.',
    metadata: {
      source: 'strategy_ui',
      gap_keys: input.gapKeys,
    },
  });

  if (auditError) {
    throw auditError;
  }
}
