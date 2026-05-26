'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import {
  contextAnswers as mockContextAnswers,
  contextGaps as mockContextGaps,
  contextQuestions as mockContextQuestions,
  contextResearchFindings as mockContextResearchFindings,
  competitorInsights as mockCompetitorInsights,
  competitorProfiles as mockCompetitorProfiles,
  contextMemoryItems as mockContextMemoryItems,
  funnelEventExamples as mockFunnelEvents,
  mockBusinessContext,
} from '@/lib/mock-data';
import {
  getSupabaseContextIntelligenceData,
  resolveSupabaseContextGovernance,
} from '@/lib/context-intelligence/supabase-context-intelligence';
import { getSupabaseContextResearchData } from '@/lib/context-research/supabase-context-research';
import { getSupabaseFunnelData } from '@/lib/funnel/supabase-funnel';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  buildCmoReadiness,
  formatStrategyMoney,
  formatStrategyPct,
  type CmoReadiness,
} from '@/lib/strategy/cmo-readiness';

const GOVERNANCE_GAP_KEYS = [
  'ibob.context_answers_pending',
  'ibob.research_findings_review_pending',
];

type BrowserSupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;

async function loadRealStrategyData(supabase: BrowserSupabaseClient) {
  const [contextData, researchData, funnelData] = await Promise.all([
    getSupabaseContextIntelligenceData(supabase),
    getSupabaseContextResearchData(supabase),
    getSupabaseFunnelData(supabase),
  ]);

  return {
    readiness: buildCmoReadiness({
      context: contextData.context,
      questions: contextData.questions,
      answers: contextData.answers,
      gaps: contextData.gaps,
      findings: researchData.findings,
      competitors: researchData.competitors,
      competitorInsights: researchData.competitorInsights,
      memoryItems: researchData.memoryItems,
      funnelEvents: funnelData.events,
    }),
    actionContext: contextData.context
      ? {
          contextId: contextData.context.id,
          clientId: contextData.context.clientId,
        }
      : null,
  };
}

function numberLabel(value: number | null, suffix = '') {
  if (value === null || !Number.isFinite(value)) {
    return 'Nao informado';
  }

  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(value)}${suffix}`;
}

function answerPreview(readiness: CmoReadiness, key: string, fallback: string) {
  return readiness.answerByKey.get(key) ?? fallback;
}

export default function StrategyPage() {
  const [realReadiness, setRealReadiness] = useState<CmoReadiness | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionContext, setActionContext] = useState<{
    contextId: string;
    clientId: string;
  } | null>(null);
  const [isResolvingGovernance, setIsResolvingGovernance] = useState(false);
  const [resolveMessage, setResolveMessage] = useState<{
    title: string;
    detail: string;
    variant: 'success' | 'warning' | 'error';
  } | null>(null);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const fallbackReadiness = useMemo(
    () =>
      buildCmoReadiness({
        context: mockBusinessContext,
        questions: mockContextQuestions,
        answers: mockContextAnswers,
        gaps: mockContextGaps,
        findings: mockContextResearchFindings,
        competitors: mockCompetitorProfiles,
        competitorInsights: mockCompetitorInsights,
        memoryItems: mockContextMemoryItems,
        funnelEvents: mockFunnelEvents,
      }),
    [],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    loadRealStrategyData(supabase)
      .then((data) => {
        if (!isMounted) return;

        setRealReadiness(data.readiness);
        setActionContext(data.actionContext);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar a leitura estrategica real do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function handleResolveGovernance() {
    if (!supabase || !actionContext) {
      setResolveMessage({
        title: 'Acao indisponivel',
        detail: 'Entre com uma sessao Supabase valida para resolver a governanca.',
        variant: 'warning',
      });
      return;
    }

    setIsResolvingGovernance(true);
    setResolveMessage(null);

    try {
      await resolveSupabaseContextGovernance(supabase, {
        ...actionContext,
        gapKeys: GOVERNANCE_GAP_KEYS,
      });

      const data = await loadRealStrategyData(supabase);
      setRealReadiness(data.readiness);
      setActionContext(data.actionContext);
      setResolveMessage({
        title: 'Governanca resolvida',
        detail:
          'Contexto ativado e lacunas antigas marcadas como resolvidas. A nota foi recalculada.',
        variant: 'success',
      });
    } catch {
      setResolveMessage({
        title: 'Nao foi possivel resolver agora',
        detail:
          'Confira se seu usuario e owner/admin e se a sessao continua ativa. Nenhum dado sensivel foi exposto.',
        variant: 'error',
      });
    } finally {
      setIsResolvingGovernance(false);
    }
  }

  const readiness = realReadiness ?? fallbackReadiness;
  const sourceLabel = realReadiness ? 'Supabase' : 'Mock';
  const economics = readiness.economics;
  const missingScoreItems = readiness.scoreBreakdown.filter(
    (item) => item.score < item.maxScore,
  );

  const metricCards = [
    {
      label: 'Ticket medio',
      value: formatStrategyMoney(economics.averageTicket),
      detail: 'Base para CAC e margem.',
    },
    {
      label: 'Margem bruta',
      value: formatStrategyPct(economics.marginPct),
      detail: `${formatStrategyMoney(economics.grossProfitPerSale)} por venda.`,
    },
    {
      label: 'CAC alvo',
      value: formatStrategyMoney(economics.targetCac),
      detail: `${formatStrategyMoney(economics.grossAfterCac)} antes de overhead.`,
    },
    {
      label: 'Budget mensal',
      value: formatStrategyMoney(economics.monthlyBudget),
      detail: `${numberLabel(economics.targetCustomersPerMonth)} vendas alvo pelo CAC.`,
    },
    {
      label: 'Receita alvo',
      value: formatStrategyMoney(economics.targetRevenuePerMonth),
      detail: `${formatStrategyMoney(economics.targetGrossProfitPerMonth)} de margem bruta.`,
    },
    {
      label: 'Capacidade',
      value: numberLabel(economics.leadCapacityPerDay, ' leads/dia'),
      detail: `${numberLabel(economics.leadCapacityPerMonth)} leads por mes.`,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
            Estrategia CMO
          </h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            Contexto comercial, pesquisa e economia antes do Decision Engine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={realReadiness ? 'green' : 'gray'}>{sourceLabel}</Badge>
          <Badge variant={readiness.score >= 80 ? 'green' : 'yellow'}>
            {readiness.statusLabel}
          </Badge>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A tela esta exibindo dados mockados para manter a leitura visivel.
        </DataStateNotice>
      )}

      {resolveMessage && (
        <DataStateNotice
          title={resolveMessage.title}
          variant={resolveMessage.variant}
          className="mb-4"
        >
          {resolveMessage.detail}
        </DataStateNotice>
      )}

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b61]">
            Prontidao estrategica
          </p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-5xl font-semibold text-[#142116]">
              {readiness.score}
            </span>
            <span className="pb-2 text-sm font-medium text-[#5c6b61]">/100</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#34473b]">
            {readiness.verdict}
          </p>
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
            <p className="text-sm font-semibold text-yellow-800">
              Faltam {100 - readiness.score} pontos para a base 100
            </p>
            <p className="mt-1 text-xs leading-relaxed text-yellow-800">
              {missingScoreItems.length > 0
                ? missingScoreItems.map((item) => item.action).join(' ')
                : 'A base estrategica ja esta completa para o proximo bloco supervisionado.'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b61]">
            ICP operacional
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[#172018]">Cliente ideal</p>
              <p className="mt-1 text-sm leading-relaxed text-[#5c6b61]">
                {answerPreview(readiness, 'audience.ideal_customer', 'Nao informado')}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#172018]">Nao vender para</p>
              <p className="mt-1 text-sm leading-relaxed text-[#5c6b61]">
                {answerPreview(readiness, 'audience.bad_fit', 'Nao informado')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Como chegar a 100
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Pontuacao aberta para mostrar exatamente o que ainda falta.
            </p>
          </div>
          <Badge variant={missingScoreItems.length === 0 ? 'green' : 'yellow'}>
            Faltam {100 - readiness.score} pontos
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {readiness.scoreBreakdown.map((item) => {
            const missing = item.maxScore - item.score;
            return (
              <div
                key={item.label}
                className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#172018]">{item.label}</p>
                  <Badge
                    variant={
                      item.status === 'complete'
                        ? 'green'
                        : item.status === 'partial'
                          ? 'yellow'
                          : 'red'
                    }
                  >
                    {item.score}/{item.maxScore}
                  </Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8ede9]">
                  <div
                    className="h-full rounded-full bg-[#476454]"
                    style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#5c6b61]">
                  {missing > 0 ? `+${missing} pts: ` : ''}
                  {item.action}
                </p>
                {missing > 0 && item.label === 'Governanca do contexto' && (
                  <button
                    type="button"
                    onClick={handleResolveGovernance}
                    disabled={isResolvingGovernance || !realReadiness}
                    className="mt-3 w-full rounded-lg bg-[#476454] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#34473b] disabled:cursor-not-allowed disabled:bg-[#9fb0a4]"
                  >
                    {isResolvingGovernance ? 'Resolvendo...' : 'Resolver'}
                  </button>
                )}
                {missing > 0 && item.label === 'Tracking e funil real' && (
                  <a
                    href="#tracking-path"
                    className="mt-3 inline-flex w-full justify-center rounded-lg border border-[#bed0c5] bg-white px-3 py-2 text-xs font-semibold text-[#34473b] transition hover:bg-[#f0f5f1]"
                  >
                    Ver caminho
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section id="tracking-path" className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Plano de resolucao
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#172018]">
                  Governanca do contexto
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#5c6b61]">
                  Caminho: confirmar que o diagnostico esta completo, ativar o contexto e
                  resolver lacunas antigas que ja nao representam risco.
                </p>
              </div>
              <Badge variant="yellow">+6 pts</Badge>
            </div>
            <button
              type="button"
              onClick={handleResolveGovernance}
              disabled={isResolvingGovernance || !realReadiness}
              className="mt-4 rounded-lg bg-[#476454] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34473b] disabled:cursor-not-allowed disabled:bg-[#9fb0a4]"
            >
              {isResolvingGovernance ? 'Resolvendo...' : 'Resolver governanca'}
            </button>
          </div>

          <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#172018]">
                  Tracking e funil real
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#5c6b61]">
                  Caminho: mapear eventos reais antes das integracoes finais. Comece com
                  origem do lead, qualificado, oportunidade, proposta enviada, venda fechada,
                  valor e margem.
                </p>
              </div>
              <Badge variant="yellow">+7 pts</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-[#34473b]">
              {[
                'Definir os campos obrigatorios do CRM ou planilha de controle.',
                'Classificar cada lead como bom, ruim, oportunidade, proposta ou venda.',
                'Guardar origem/campanha quando existir: Google, Meta, orgânico, WhatsApp ou marketplace.',
                'Importar manualmente a primeira amostra antes de conectar APIs externas.',
                'So depois configurar conversoes offline/CRM para Google e Meta.',
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg bg-[#f7f9f6] px-3 py-2">
                  <span className="font-semibold text-[#476454]">{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Economia de crescimento
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-[#5c6b61]">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#142116]">
                {card.value}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#5c6b61]">
                {card.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Cenario de CPL maximo
          </h2>
          {readiness.funnelScenarios.length === 0 ? (
            <EmptyState
              title="Funil sem calculo"
              description="Ticket, CAC, budget e capacidade precisam estar preenchidos para calcular CPL."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#d7ddd2] bg-white shadow-sm">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[#f0f4ef] text-left text-xs uppercase tracking-wide text-[#5c6b61]">
                  <tr>
                    <th className="px-4 py-3">Lead para venda</th>
                    <th className="px-4 py-3">CPL max.</th>
                    <th className="px-4 py-3">Leads/mes</th>
                    <th className="px-4 py-3">Capacidade</th>
                  </tr>
                </thead>
                <tbody>
                  {readiness.funnelScenarios.map((scenario) => (
                    <tr key={scenario.closeRateLabel} className="border-t border-[#edf1ea]">
                      <td className="px-4 py-3 font-medium text-[#172018]">
                        {scenario.closeRateLabel}
                      </td>
                      <td className="px-4 py-3 text-[#34473b]">
                        {formatStrategyMoney(scenario.maxCpl)}
                      </td>
                      <td className="px-4 py-3 text-[#34473b]">
                        {numberLabel(scenario.leadsNeeded)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={scenario.withinCapacity ? 'green' : 'yellow'}>
                          {scenario.withinCapacity ? 'Dentro' : 'Apertado'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Evidencias
          </h2>
          <div className="space-y-2">
            {[
              ['Contexto', `${numberLabel(readiness.evidence.contextCompleteness, '%')} completo`],
              ['Memoria ativa', `${readiness.evidence.activeMemoryCount} itens`],
              ['Concorrentes', `${readiness.evidence.activeCompetitorCount} ativos`],
              ['Achados revisados', `${readiness.evidence.reviewedFindingCount} achados`],
              ['Insights aceitos', `${readiness.evidence.acceptedCompetitorInsightCount} insights`],
              ['Lacunas abertas', `${readiness.evidence.openGapCount} lacuna(s)`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className="text-[#5c6b61]">{label}</span>
                <span className="font-semibold text-[#172018]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Funil conectado a estrategia
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Eventos reais', readiness.evidence.funnelEventCount],
            ['Origens mapeadas', readiness.evidence.funnelSourceCount],
            ['Etapas cobertas', readiness.evidence.funnelStageCount],
            ['Vendas com margem', readiness.evidence.funnelValueMarginCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-[#5c6b61]">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#142116]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          {[
            ['Leads qualificados', readiness.evidence.funnelQualifiedCount],
            ['Oportunidades', readiness.evidence.funnelOpportunityCount],
            ['Propostas', readiness.evidence.funnelProposalCount],
            ['Vendas ganhas', readiness.evidence.funnelSaleWonCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-[#d7ddd2] bg-[#f7f9f6] px-4 py-3 text-sm"
            >
              <span className="text-[#5c6b61]">{label}</span>
              <span className="font-semibold text-[#172018]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Regras estrategicas
          </h2>
          <div className="space-y-2">
            {readiness.strategicRules.map((rule) => (
              <div
                key={rule}
                className="rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 text-sm leading-relaxed text-[#34473b] shadow-sm"
              >
                {rule}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Bloqueios antes de escala
          </h2>
          <div className="space-y-2">
            {readiness.blockers.map((blocker) => (
              <div
                key={blocker.title}
                className="rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#172018]">{blocker.title}</p>
                  <Badge variant={blocker.severity === 'critical' ? 'red' : 'yellow'}>
                    {blocker.severity === 'critical' ? 'Critico' : 'Atencao'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#5c6b61]">
                  {blocker.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
