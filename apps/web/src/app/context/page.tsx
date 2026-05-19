'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  contextAnswers as mockContextAnswers,
  contextGaps as mockContextGaps,
  contextQuestions as mockContextQuestions,
  mockBusinessContext,
} from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  getSupabaseContextIntelligenceData,
  upsertSupabaseContextAnswer,
  type SupabaseContextIntelligenceData,
} from '@/lib/context-intelligence/supabase-context-intelligence';
import type {
  BusinessContext,
  ContextAnswer,
  ContextAnswerType,
  ContextGap,
  ContextGapSeverity,
  ContextQuestion,
  ContextQuestionCategory,
  ContextStatus,
} from '@/types';

const categoryLabels: Record<ContextQuestionCategory, string> = {
  offer: 'Oferta',
  economics: 'Economia',
  audience: 'Publico',
  geography: 'Geografia',
  seasonality: 'Sazonalidade',
  sales_process: 'Processo comercial',
  capacity: 'Capacidade',
  goals: 'Metas',
  constraints: 'Restricoes',
  differentiation: 'Diferenciacao',
  lead_quality: 'Qualidade de lead',
  predictability: 'Previsibilidade',
  operations: 'Operacao',
};

const statusLabels: Record<ContextStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};

function statusVariant(status: ContextStatus): 'green' | 'yellow' | 'gray' {
  if (status === 'active') return 'green';
  if (status === 'draft') return 'yellow';
  return 'gray';
}

function gapVariant(severity: ContextGapSeverity): 'blue' | 'yellow' | 'red' {
  if (severity === 'critical') return 'red';
  if (severity === 'warning') return 'yellow';
  return 'blue';
}

function answerPlaceholder(answerType: ContextAnswerType) {
  if (answerType === 'currency') return 'Ex.: R$ 350,00';
  if (answerType === 'percentage') return 'Ex.: 42%';
  if (answerType === 'number') return 'Ex.: 120';
  return 'Digite uma resposta objetiva e revisavel';
}

function toStringOptions(options: unknown[]) {
  return options.filter((option): option is string => typeof option === 'string');
}

function QuestionAnswerControl({
  question,
  value,
  disabled,
  onChange,
}: {
  question: ContextQuestion;
  value: string;
  disabled: boolean;
  onChange: (nextValue: string) => void;
}) {
  const options = toStringOptions(question.options);

  if (question.answerType === 'single_choice' && options.length > 0) {
    return (
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-lg border border-[#d7ddd2] bg-white px-3 py-2 text-sm text-[#172018] outline-none transition-colors focus:border-[#476454] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Selecione uma opcao</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (['currency', 'number', 'percentage'].includes(question.answerType)) {
    return (
      <input
        value={value}
        disabled={disabled}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        placeholder={answerPlaceholder(question.answerType)}
        className="mt-3 w-full rounded-lg border border-[#d7ddd2] bg-white px-3 py-2 text-sm text-[#172018] outline-none transition-colors focus:border-[#476454] disabled:cursor-not-allowed disabled:opacity-60"
      />
    );
  }

  return (
    <textarea
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={answerPlaceholder(question.answerType)}
      className="mt-3 min-h-24 w-full resize-y rounded-lg border border-[#d7ddd2] bg-white px-3 py-2 text-sm text-[#172018] outline-none transition-colors focus:border-[#476454] disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

function buildAnswerMap(answers: ContextAnswer[]) {
  return new Map(answers.map((answer) => [answer.questionId, answer]));
}

function computeCompleteness(questions: ContextQuestion[], answers: ContextAnswer[]) {
  const requiredQuestions = questions.filter((question) => question.required);

  if (requiredQuestions.length === 0) {
    return {
      answeredRequiredCount: 0,
      requiredCount: 0,
      score: 0,
    };
  }

  const answerMap = buildAnswerMap(answers);
  const answeredRequiredCount = requiredQuestions.filter((question) => {
    const answer = answerMap.get(question.id);
    return (answer?.answerText ?? '').trim().length > 0;
  }).length;

  return {
    answeredRequiredCount,
    requiredCount: requiredQuestions.length,
    score: Number(((answeredRequiredCount / requiredQuestions.length) * 100).toFixed(2)),
  };
}

function groupQuestions(questions: ContextQuestion[]) {
  return questions.reduce(
    (groups, question) => {
      const current = groups.get(question.category) ?? [];
      current.push(question);
      groups.set(question.category, current);
      return groups;
    },
    new Map<ContextQuestionCategory, ContextQuestion[]>(),
  );
}

export default function ContextIntelligencePage() {
  const [realData, setRealData] = useState<SupabaseContextIntelligenceData | null>(null);
  const [localAnswers, setLocalAnswers] = useState<ContextAnswer[]>(mockContextAnswers);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    getSupabaseContextIntelligenceData(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealData(data);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar o diagnostico real do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase, reloadCount]);

  const context: BusinessContext | null = realData ? realData.context : mockBusinessContext;
  const questions = realData?.questions ?? mockContextQuestions;
  const answers = realData?.answers ?? localAnswers;
  const gaps = realData?.gaps ?? mockContextGaps;
  const answerMap = useMemo(() => buildAnswerMap(answers), [answers]);
  const completeness = useMemo(() => computeCompleteness(questions, answers), [questions, answers]);
  const groupedQuestions = useMemo(() => groupQuestions(questions), [questions]);
  const openGaps = gaps.filter((gap) => gap.status === 'open');

  function updateDraft(questionId: string, value: string) {
    setDraftAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  function draftValue(questionId: string) {
    return draftAnswers[questionId] ?? answerMap.get(questionId)?.answerText ?? '';
  }

  async function saveAnswer(question: ContextQuestion) {
    if (!context) return;

    const answerText = draftValue(question.id).trim();

    setActionError(null);
    setActionSuccess(null);

    if (!answerText) {
      setActionError('Preencha uma resposta antes de salvar.');
      return;
    }

    if (realData && supabase) {
      setSavingQuestionId(question.id);

      try {
        await upsertSupabaseContextAnswer(supabase, {
          contextId: context.id,
          clientId: context.clientId,
          questionId: question.id,
          answerText,
        });
        setActionSuccess('Resposta salva no Supabase.');
        setReloadCount((count) => count + 1);
      } catch {
        setActionError('Nao foi possivel salvar a resposta no Supabase.');
      } finally {
        setSavingQuestionId(null);
      }

      return;
    }

    setLocalAnswers((current) => {
      const existing = current.find((answer) => answer.questionId === question.id);
      const nextAnswer: ContextAnswer = {
        id: existing?.id ?? `local-${question.id}`,
        contextId: context.id,
        clientId: context.clientId,
        questionId: question.id,
        answerText,
        answerValue: { value: answerText },
        confidence: 100,
        source: 'user',
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return existing
        ? current.map((answer) => (answer.questionId === question.id ? nextAnswer : answer))
        : [...current, nextAnswer];
    });
    setActionSuccess('Resposta salva apenas nesta sessao mockada.');
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
              Context Intelligence
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
              Diagnostico inteligente
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#5c6b61]">
              Perguntas intencionais para entender oferta, margem, publico, capacidade,
              restricoes e previsibilidade antes de qualquer sugestao de Ads.
            </p>
          </div>
          <span className="rounded-full border border-[#d7ddd2] bg-white px-3 py-1 text-xs font-medium text-[#5c6b61]">
            {realData ? 'Supabase' : 'Mock'}
          </span>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A tela esta exibindo perguntas mockadas ate a leitura real voltar.
        </DataStateNotice>
      )}

      {actionError && (
        <DataStateNotice title="Resposta nao registrada" variant="error" className="mb-4">
          {actionError}
        </DataStateNotice>
      )}

      {actionSuccess && (
        <DataStateNotice title="Diagnostico atualizado" variant="success" className="mb-4">
          {actionSuccess}
        </DataStateNotice>
      )}

      {!context ? (
        <EmptyState
          title="Nenhum contexto comercial"
          description="Crie um business_contexts para este cliente antes de registrar respostas do diagnostico."
        />
      ) : (
        <>
          <section className="mb-8 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                    Contexto ativo
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#142116]">{context.name}</p>
                </div>
                <Badge variant={statusVariant(context.status)}>{statusLabels[context.status]}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#5c6b61]">
                {context.summary ?? 'Sem resumo registrado.'}
              </p>
            </div>

            <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
              <p className="text-xs text-[#5c6b61]">Completude</p>
              <p className="mt-1 text-2xl font-semibold text-[#142116]">
                {completeness.score.toFixed(0)}%
              </p>
              <p className="mt-1 text-xs text-[#5c6b61]">
                {completeness.answeredRequiredCount} de {completeness.requiredCount} obrigatorias
              </p>
            </div>

            <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
              <p className="text-xs text-[#5c6b61]">Lacunas abertas</p>
              <p className="mt-1 text-2xl font-semibold text-[#142116]">{openGaps.length}</p>
              <p className="mt-1 text-xs text-[#5c6b61]">
                O Decision Engine deve respeitar essas pendencias.
              </p>
            </div>
          </section>

          {openGaps.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
                Lacunas de contexto
              </h2>
              <div className="space-y-3">
                {openGaps.map((gap: ContextGap) => (
                  <div
                    key={gap.id}
                    className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-medium text-[#172018]">{gap.description}</p>
                      <Badge variant={gapVariant(gap.severity)}>{gap.severity}</Badge>
                    </div>
                    {gap.recommendation && (
                      <p className="mt-2 text-sm text-[#5c6b61]">{gap.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
                Perguntas inteligentes
              </h2>
              <span className="text-xs text-[#5c6b61]">
                Respostas salvas alimentam o contexto antes do Decision Engine
              </span>
            </div>

            {questions.length === 0 ? (
              <EmptyState
                title="Nenhuma pergunta ativa"
                description="Cadastre context_questions para iniciar o diagnostico comercial do cliente."
              />
            ) : (
              <div className="space-y-6">
                {Array.from(groupedQuestions.entries()).map(([category, categoryQuestions]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-semibold text-[#142116]">
                      {categoryLabels[category]}
                    </h3>
                    <div className="space-y-4">
                      {categoryQuestions.map((question) => {
                        const savedAnswer = answerMap.get(question.id);
                        const isSaving = savingQuestionId === question.id;

                        return (
                          <div
                            key={question.id}
                            className="rounded-xl border border-[#d7ddd2] bg-white p-5 shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-[#172018]">{question.question}</p>
                                  {question.required && <Badge variant="yellow">Obrigatoria</Badge>}
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-[#5c6b61]">
                                  Intencao: {question.intent}
                                </p>
                              </div>
                              {savedAnswer?.answerText && <Badge variant="green">Respondida</Badge>}
                            </div>

                            <QuestionAnswerControl
                              question={question}
                              value={draftValue(question.id)}
                              disabled={isSaving}
                              onChange={(value) => updateDraft(question.id, value)}
                            />

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <p className="text-xs text-[#5c6b61]">
                                Chave: <code>{question.questionKey}</code>
                              </p>
                              <button
                                onClick={() => saveAnswer(question)}
                                disabled={isSaving}
                                className="rounded-lg bg-[#142116] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#243a29] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isSaving ? 'Salvando...' : 'Salvar resposta'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
