'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  competitorInsights as mockCompetitorInsights,
  competitorProfiles as mockCompetitorProfiles,
  contextMemoryItems as mockContextMemoryItems,
  contextResearchFindings as mockContextResearchFindings,
  contextResearchRuns as mockContextResearchRuns,
  contextResearchSources as mockContextResearchSources,
  mockBusinessContext,
} from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  createSupabaseContextResearchRun,
  getSupabaseContextResearchData,
  reviewSupabaseCompetitorInsight,
  reviewSupabaseContextResearchFinding,
  updateSupabaseCompetitorStatus,
  updateSupabaseContextMemoryStatus,
  type SupabaseContextResearchData,
} from '@/lib/context-research/supabase-context-research';
import type {
  CompetitorInsight,
  CompetitorProfile,
  CompetitorProfileStatus,
  ContextMemoryItem,
  ContextMemoryStatus,
  ContextResearchFinding,
  ContextResearchReviewStatus,
  ContextResearchRun,
  ContextResearchRunStatus,
  ContextResearchSource,
} from '@/types';

const runStatusLabels: Record<ContextResearchRunStatus, string> = {
  queued: 'Enfileirado',
  running: 'Em execucao',
  completed: 'Concluido',
  failed: 'Falhou',
  cancelled: 'Cancelado',
  needs_review: 'Precisa revisao',
};

const reviewStatusLabels: Record<ContextResearchReviewStatus, string> = {
  needs_review: 'Precisa revisao',
  accepted: 'Aceito',
  rejected: 'Rejeitado',
  converted_to_context: 'Virou contexto',
  converted_to_memory: 'Virou memoria',
};

const competitorStatusLabels: Record<CompetitorProfileStatus, string> = {
  candidate: 'Candidato',
  active: 'Ativo',
  dismissed: 'Descartado',
};

const memoryStatusLabels: Record<ContextMemoryStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  archived: 'Arquivada',
};

function runStatusVariant(status: ContextResearchRunStatus): 'green' | 'yellow' | 'red' | 'gray' {
  if (status === 'completed') return 'green';
  if (status === 'failed' || status === 'cancelled') return 'red';
  if (status === 'queued' || status === 'running' || status === 'needs_review') return 'yellow';
  return 'gray';
}

function reviewVariant(status: ContextResearchReviewStatus): 'green' | 'yellow' | 'red' | 'gray' {
  if (status === 'accepted' || status === 'converted_to_context' || status === 'converted_to_memory') {
    return 'green';
  }
  if (status === 'rejected') return 'red';
  return 'yellow';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function hostFromUrl(url?: string) {
  if (!url) return 'sem URL';

  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function countByRun<T extends { researchRunId?: string }>(items: T[], runId: string) {
  return items.filter((item) => item.researchRunId === runId).length;
}

type ActionButtonVariant = 'primary' | 'secondary' | 'danger';

const actionButtonClasses: Record<ActionButtonVariant, string> = {
  primary: 'border-[#142116] bg-[#142116] text-white hover:bg-[#243a29]',
  secondary: 'border-[#cdd6cf] bg-white text-[#34473b] hover:bg-[#f3f6f2]',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
};

function ActionButton({
  label,
  onClick,
  disabled,
  variant = 'secondary',
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant?: ActionButtonVariant;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${actionButtonClasses[variant]}`}
    >
      {label}
    </button>
  );
}

export default function ContextResearchPage() {
  const [realData, setRealData] = useState<SupabaseContextResearchData | null>(null);
  const [localRuns, setLocalRuns] = useState<ContextResearchRun[]>(mockContextResearchRuns);
  const [companyUrl, setCompanyUrl] = useState('https://www.ibob.com.br');
  const [searchQuery, setSearchQuery] = useState(
    'iBob empresa site oficial concorrentes posicionamento ofertas diferenciais',
  );
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isCreatingRun, setIsCreatingRun] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
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

    getSupabaseContextResearchData(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealData(data);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar a pesquisa contextual real do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase, reloadCount]);

  const context = realData ? realData.context : mockBusinessContext;
  const runs = realData?.runs ?? localRuns;
  const sources: ContextResearchSource[] = realData?.sources ?? mockContextResearchSources;
  const findings: ContextResearchFinding[] = realData?.findings ?? mockContextResearchFindings;
  const competitors: CompetitorProfile[] = realData?.competitors ?? mockCompetitorProfiles;
  const competitorInsights: CompetitorInsight[] =
    realData?.competitorInsights ?? mockCompetitorInsights;
  const memoryItems: ContextMemoryItem[] = realData?.memoryItems ?? mockContextMemoryItems;
  const canReview = Boolean(realData && supabase);
  const latestRun = runs[0];
  const sourcesById = useMemo(() => {
    return new Map(sources.map((source) => [source.id, source]));
  }, [sources]);
  const insightsByCompetitorId = useMemo(() => {
    return competitorInsights.reduce<Map<string, CompetitorInsight[]>>((acc, insight) => {
      const current = acc.get(insight.competitorId) ?? [];
      current.push(insight);
      acc.set(insight.competitorId, current);
      return acc;
    }, new Map());
  }, [competitorInsights]);
  const memoryByFindingId = useMemo(() => {
    return memoryItems.reduce<Map<string, ContextMemoryItem>>((acc, item) => {
      if (item.sourceFindingId) {
        acc.set(item.sourceFindingId, item);
      }
      return acc;
    }, new Map());
  }, [memoryItems]);
  const pendingReviews =
    findings.filter((finding) => finding.reviewStatus === 'needs_review').length +
    competitorInsights.filter((insight) => insight.reviewStatus === 'needs_review').length +
    competitors.filter((competitor) => competitor.status === 'candidate').length +
    memoryItems.filter((item) => item.status === 'draft').length;
  const activeMemoryCount = memoryItems.filter((item) => item.status === 'active').length;

  async function createRun() {
    if (!context) return;

    const cleanUrl = companyUrl.trim();
    const cleanQuery = searchQuery.trim();

    setActionError(null);
    setActionSuccess(null);

    if (!cleanUrl || !cleanQuery) {
      setActionError('Informe o site da empresa e a consulta de pesquisa.');
      return;
    }

    if (realData && supabase) {
      setIsCreatingRun(true);

      try {
        await createSupabaseContextResearchRun(supabase, {
          contextId: context.id,
          clientId: context.clientId,
          companyUrl: cleanUrl,
          searchQuery: cleanQuery,
        });
        setActionSuccess('Run supervisionado criado no Supabase.');
        setReloadCount((count) => count + 1);
      } catch {
        setActionError('Nao foi possivel criar o run no Supabase.');
      } finally {
        setIsCreatingRun(false);
      }

      return;
    }

    setLocalRuns((current) => [
      {
        id: `local-run-${Date.now()}`,
        contextId: context.id,
        clientId: context.clientId,
        status: 'queued',
        companyUrl: cleanUrl,
        searchQuery: cleanQuery,
        scope: {
          company_site: true,
          competitor_discovery: true,
          competitor_sites: true,
          ads_execution: false,
          requires_human_review: true,
        },
        summary: 'Run criado no modo mockado. Nada foi executado externamente.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setActionSuccess('Run criado apenas nesta sessao mockada.');
  }

  async function runReviewAction(
    actionKey: string,
    successMessage: string,
    action: () => Promise<void>,
  ) {
    setActionError(null);
    setActionSuccess(null);

    if (!realData || !supabase) {
      setActionError('Acoes de revisao exigem dados reais do Supabase.');
      return;
    }

    setActiveAction(actionKey);

    try {
      await action();
      setActionSuccess(successMessage);
      setReloadCount((count) => count + 1);
    } catch {
      setActionError('Nao foi possivel aplicar a revisao no Supabase.');
    } finally {
      setActiveAction(null);
    }
  }

  function reviewFinding(
    finding: ContextResearchFinding,
    status: Extract<ContextResearchReviewStatus, 'accepted' | 'rejected'>,
  ) {
    const actionKey = `finding-${status}-${finding.id}`;
    const label = status === 'accepted' ? 'Achado aceito.' : 'Achado rejeitado.';

    void runReviewAction(actionKey, label, () =>
      reviewSupabaseContextResearchFinding(supabase!, {
        id: finding.id,
        contextId: finding.contextId,
        clientId: finding.clientId,
        status,
      }),
    );
  }

  function reviewInsight(
    insight: CompetitorInsight,
    status: Extract<ContextResearchReviewStatus, 'accepted' | 'rejected'>,
  ) {
    const actionKey = `insight-${status}-${insight.id}`;
    const label = status === 'accepted' ? 'Insight aceito.' : 'Insight rejeitado.';

    void runReviewAction(actionKey, label, () =>
      reviewSupabaseCompetitorInsight(supabase!, {
        id: insight.id,
        contextId: insight.contextId,
        clientId: insight.clientId,
        status,
      }),
    );
  }

  function updateCompetitor(
    competitor: CompetitorProfile,
    status: Extract<CompetitorProfileStatus, 'active' | 'dismissed'>,
  ) {
    const actionKey = `competitor-${status}-${competitor.id}`;
    const label = status === 'active' ? 'Concorrente ativado.' : 'Concorrente descartado.';

    void runReviewAction(actionKey, label, () =>
      updateSupabaseCompetitorStatus(supabase!, {
        id: competitor.id,
        contextId: competitor.contextId,
        clientId: competitor.clientId,
        status,
      }),
    );
  }

  function updateMemory(
    item: ContextMemoryItem,
    status: Extract<ContextMemoryStatus, 'active' | 'archived'>,
  ) {
    const actionKey = `memory-${status}-${item.id}`;
    const label = status === 'active' ? 'Memoria ativada.' : 'Memoria arquivada.';

    void runReviewAction(actionKey, label, () =>
      updateSupabaseContextMemoryStatus(supabase!, {
        id: item.id,
        contextId: item.contextId,
        clientId: item.clientId,
        status,
        sourceFindingId: item.sourceFindingId,
        sourceCompetitorInsightId: item.sourceCompetitorInsightId,
      }),
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
              Context Research
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
              Pesquisa supervisionada
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#5c6b61]">
              Console para acompanhar pesquisa do site da empresa, concorrentes, fontes,
              achados e memoria contextual antes do Decision Engine.
            </p>
          </div>
          <span className="rounded-full border border-[#d7ddd2] bg-white px-3 py-1 text-xs font-medium text-[#5c6b61]">
            {realData ? 'Supabase' : 'Mock'}
          </span>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A tela esta exibindo pesquisa mockada ate a leitura real voltar.
        </DataStateNotice>
      )}

      {actionError && (
        <DataStateNotice title="Run nao criado" variant="error" className="mb-4">
          {actionError}
        </DataStateNotice>
      )}

      {actionSuccess && (
        <DataStateNotice title="Pesquisa atualizada" variant="success" className="mb-4">
          {actionSuccess}
        </DataStateNotice>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Runs</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">{runs.length}</p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Fontes</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">{sources.length}</p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Concorrentes</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">{competitors.length}</p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Pendencias</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">{pendingReviews}</p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm md:col-span-4">
          <p className="text-xs text-[#5c6b61]">Memorias ativas</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">{activeMemoryCount}</p>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-[#d7ddd2] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Novo run supervisionado
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Criar um run nao executa busca externa; ele prepara a fila auditavel para o agente.
            </p>
          </div>
          {context && <Badge variant="blue">{context.name}</Badge>}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
              Site oficial
            </span>
            <input
              value={companyUrl}
              onChange={(event) => setCompanyUrl(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#d7ddd2] bg-white px-3 py-2 text-sm text-[#172018] outline-none transition-colors focus:border-[#476454]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
              Consulta
            </span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#d7ddd2] bg-white px-3 py-2 text-sm text-[#172018] outline-none transition-colors focus:border-[#476454]"
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={createRun}
              disabled={isCreatingRun || !context}
              className="w-full rounded-lg bg-[#142116] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#243a29] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingRun ? 'Criando...' : 'Criar run'}
            </button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Runs de pesquisa
          </h2>
          {latestRun && (
            <span className="text-xs text-[#5c6b61]">
              Mais recente: {formatDateTime(latestRun.createdAt)}
            </span>
          )}
        </div>

        {runs.length === 0 ? (
          <EmptyState
            title="Nenhum run de pesquisa"
            description="Crie um run supervisionado para pesquisar site oficial, concorrentes e oportunidades com revisao humana."
          />
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-xl border border-[#d7ddd2] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#172018]">
                      {hostFromUrl(run.companyUrl)}
                    </p>
                    <p className="mt-1 text-xs text-[#5c6b61]">{run.searchQuery}</p>
                  </div>
                  <Badge variant={runStatusVariant(run.status)}>{runStatusLabels[run.status]}</Badge>
                </div>
                <div className="mt-4 grid gap-3 border-t border-[#d7ddd2] pt-4 text-sm sm:grid-cols-4">
                  <p className="text-[#5c6b61]">
                    Fontes: <span className="font-semibold text-[#142116]">{countByRun(sources, run.id)}</span>
                  </p>
                  <p className="text-[#5c6b61]">
                    Achados: <span className="font-semibold text-[#142116]">{countByRun(findings, run.id)}</span>
                  </p>
                  <p className="text-[#5c6b61]">
                    Insights: <span className="font-semibold text-[#142116]">{countByRun(competitorInsights, run.id)}</span>
                  </p>
                  <p className="text-[#5c6b61]">
                    Criado: <span className="font-semibold text-[#142116]">{formatDateTime(run.createdAt)}</span>
                  </p>
                </div>
                {run.summary && <p className="mt-3 text-sm text-[#5c6b61]">{run.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Achados
          </h2>
          {findings.length === 0 ? (
            <EmptyState
              title="Nenhum achado registrado"
              description="Quando o agente pesquisar o site e o mercado, os achados entram aqui com evidencia e confianca."
            />
          ) : (
            <div className="space-y-3">
              {findings.map((finding) => {
                const source = finding.sourceId ? sourcesById.get(finding.sourceId) : undefined;
                const linkedMemory = memoryByFindingId.get(finding.id);

                return (
                  <div key={finding.id} className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-medium text-[#172018]">{finding.title}</p>
                      <Badge variant={reviewVariant(finding.reviewStatus)}>
                        {reviewStatusLabels[finding.reviewStatus]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[#5c6b61]">{finding.finding}</p>
                    {finding.evidence && (
                      <p className="mt-2 text-xs text-[#5c6b61]">Evidencia: {finding.evidence}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5c6b61]">
                      {source?.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#476454] underline-offset-2 hover:underline"
                        >
                          Fonte: {hostFromUrl(source.url)}
                        </a>
                      )}
                      {linkedMemory && (
                        <span>
                          Memoria vinculada: {memoryStatusLabels[linkedMemory.status]}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {finding.reviewStatus === 'needs_review' && (
                        <>
                          <ActionButton
                            label="Aceitar"
                            onClick={() => reviewFinding(finding, 'accepted')}
                            disabled={!canReview || activeAction !== null}
                            variant="primary"
                          />
                          <ActionButton
                            label="Rejeitar"
                            onClick={() => reviewFinding(finding, 'rejected')}
                            disabled={!canReview || activeAction !== null}
                            variant="danger"
                          />
                        </>
                      )}
                      {linkedMemory?.status === 'draft' && (
                        <ActionButton
                          label="Ativar memoria"
                          onClick={() => updateMemory(linkedMemory, 'active')}
                          disabled={!canReview || activeAction !== null}
                          variant="secondary"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Concorrentes
          </h2>
          {competitors.length === 0 ? (
            <EmptyState
              title="Nenhum concorrente mapeado"
              description="Perfis concorrentes ficam aqui como candidatos ate revisao humana."
            />
          ) : (
            <div className="space-y-3">
              {competitors.map((competitor) => {
                const relatedInsights = insightsByCompetitorId.get(competitor.id) ?? [];

                return (
                  <div key={competitor.id} className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-medium text-[#172018]">{competitor.name}</p>
                      <Badge
                        variant={
                          competitor.status === 'active'
                            ? 'green'
                            : competitor.status === 'dismissed'
                              ? 'red'
                              : 'yellow'
                        }
                      >
                        {competitorStatusLabels[competitor.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#5c6b61]">
                      {competitor.websiteUrl ?? 'Sem site registrado'}
                    </p>
                    {competitor.positioning && (
                      <p className="mt-2 text-sm text-[#5c6b61]">{competitor.positioning}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {competitor.status !== 'active' && (
                        <ActionButton
                          label="Ativar"
                          onClick={() => updateCompetitor(competitor, 'active')}
                          disabled={!canReview || activeAction !== null}
                          variant="primary"
                        />
                      )}
                      {competitor.status !== 'dismissed' && (
                        <ActionButton
                          label="Descartar"
                          onClick={() => updateCompetitor(competitor, 'dismissed')}
                          disabled={!canReview || activeAction !== null}
                          variant="danger"
                        />
                      )}
                    </div>
                    {relatedInsights.length > 0 && (
                      <div className="mt-4 space-y-3 border-t border-[#d7ddd2] pt-4">
                        {relatedInsights.map((insight) => (
                          <div key={insight.id} className="rounded-md bg-[#f7f9f6] p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="text-sm text-[#5c6b61]">{insight.insight}</p>
                              <Badge variant={reviewVariant(insight.reviewStatus)}>
                                {reviewStatusLabels[insight.reviewStatus]}
                              </Badge>
                            </div>
                            {insight.evidence && (
                              <p className="mt-2 text-xs text-[#5c6b61]">
                                Evidencia: {insight.evidence}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {insight.sourceUrl && (
                                <a
                                  href={insight.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-medium text-[#476454] underline-offset-2 hover:underline"
                                >
                                  Fonte: {hostFromUrl(insight.sourceUrl)}
                                </a>
                              )}
                              {insight.reviewStatus === 'needs_review' && (
                                <>
                                  <ActionButton
                                    label="Aceitar insight"
                                    onClick={() => reviewInsight(insight, 'accepted')}
                                    disabled={!canReview || activeAction !== null}
                                    variant="primary"
                                  />
                                  <ActionButton
                                    label="Rejeitar"
                                    onClick={() => reviewInsight(insight, 'rejected')}
                                    disabled={!canReview || activeAction !== null}
                                    variant="danger"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Memoria contextual
        </h2>
        {memoryItems.length === 0 ? (
          <EmptyState
            title="Nenhum item de memoria contextual"
            description="Achados aceitos podem virar memoria ativa para o Decision Engine, sempre com revisao."
          />
        ) : (
          <div className="space-y-3">
            {memoryItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-medium text-[#172018]">{item.title}</p>
                  <Badge
                    variant={
                      item.status === 'active' ? 'green' : item.status === 'archived' ? 'red' : 'yellow'
                    }
                  >
                    {memoryStatusLabels[item.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[#5c6b61]">{item.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.status !== 'active' && (
                    <ActionButton
                      label="Ativar"
                      onClick={() => updateMemory(item, 'active')}
                      disabled={!canReview || activeAction !== null}
                      variant="primary"
                    />
                  )}
                  {item.status !== 'archived' && (
                    <ActionButton
                      label="Arquivar"
                      onClick={() => updateMemory(item, 'archived')}
                      disabled={!canReview || activeAction !== null}
                      variant="danger"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
