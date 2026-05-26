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
  dataTrustState as mockDataTrustState,
  funnelEventExamples as mockFunnelEvents,
  mockBusinessContext,
} from '@/lib/mock-data';
import { getSupabaseContextIntelligenceData } from '@/lib/context-intelligence/supabase-context-intelligence';
import { getSupabaseContextResearchData } from '@/lib/context-research/supabase-context-research';
import { getSupabaseDataTrustState } from '@/lib/data-trust/supabase-data-trust';
import { getSupabaseFunnelData } from '@/lib/funnel/supabase-funnel';
import {
  buildDecisionReadiness,
  type DecisionGate,
  type DecisionGateStatus,
  type DecisionReadiness,
} from '@/lib/decision/supervised-decision-engine';
import { buildCmoReadiness } from '@/lib/strategy/cmo-readiness';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type BrowserSupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;

async function loadRealDecisionReadiness(supabase: BrowserSupabaseClient) {
  const [contextData, researchData, funnelData, dataTrustState] = await Promise.all([
    getSupabaseContextIntelligenceData(supabase),
    getSupabaseContextResearchData(supabase),
    getSupabaseFunnelData(supabase),
    getSupabaseDataTrustState(supabase),
  ]);

  const cmoReadiness = buildCmoReadiness({
    context: contextData.context,
    questions: contextData.questions,
    answers: contextData.answers,
    gaps: contextData.gaps,
    findings: researchData.findings,
    competitors: researchData.competitors,
    competitorInsights: researchData.competitorInsights,
    memoryItems: researchData.memoryItems,
    funnelEvents: funnelData.events,
  });

  return buildDecisionReadiness({
    context: contextData.context,
    questions: contextData.questions,
    answers: contextData.answers,
    gaps: contextData.gaps,
    findings: researchData.findings,
    competitors: researchData.competitors,
    competitorInsights: researchData.competitorInsights,
    memoryItems: researchData.memoryItems,
    funnelEvents: funnelData.events,
    dataTrustState,
    cmoReadiness,
  });
}

function buildFallbackDecisionReadiness() {
  const cmoReadiness = buildCmoReadiness({
    context: mockBusinessContext,
    questions: mockContextQuestions,
    answers: mockContextAnswers,
    gaps: mockContextGaps,
    findings: mockContextResearchFindings,
    competitors: mockCompetitorProfiles,
    competitorInsights: mockCompetitorInsights,
    memoryItems: mockContextMemoryItems,
    funnelEvents: mockFunnelEvents,
  });

  return buildDecisionReadiness({
    context: mockBusinessContext,
    questions: mockContextQuestions,
    answers: mockContextAnswers,
    gaps: mockContextGaps,
    findings: mockContextResearchFindings,
    competitors: mockCompetitorProfiles,
    competitorInsights: mockCompetitorInsights,
    memoryItems: mockContextMemoryItems,
    funnelEvents: mockFunnelEvents,
    dataTrustState: mockDataTrustState,
    cmoReadiness,
  });
}

const gateVariant: Record<DecisionGateStatus, 'green' | 'yellow' | 'red'> = {
  passed: 'green',
  warning: 'yellow',
  blocked: 'red',
};

const gateLabel: Record<DecisionGateStatus, string> = {
  passed: 'Liberado',
  warning: 'Atencao',
  blocked: 'Bloqueado',
};

function metricLabel(value: number, suffix = '') {
  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(value)}${suffix}`;
}

function GateList({ gates }: { gates: DecisionGate[] }) {
  if (gates.length === 0) {
    return (
      <EmptyState
        title="Nenhum bloqueio critico"
        description="A base pode seguir para proposta supervisionada, mantendo aprovacao humana obrigatoria."
      />
    );
  }

  return (
    <div className="space-y-3">
      {gates.map((gate) => (
        <div
          key={gate.id}
          className="rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#172018]">{gate.title}</p>
            <Badge variant={gateVariant[gate.status]}>{gateLabel[gate.status]}</Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#5c6b61]">{gate.detail}</p>
          <p className="mt-2 text-xs font-medium text-[#34473b]">{gate.evidence}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#5c6b61]">
            Caminho: {gate.action}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function DecisionPage() {
  const [realReadiness, setRealReadiness] = useState<DecisionReadiness | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const fallbackReadiness = useMemo(() => buildFallbackDecisionReadiness(), []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    loadRealDecisionReadiness(supabase)
      .then((readiness) => {
        if (!isMounted) return;
        setRealReadiness(readiness);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar a leitura real do Decision Engine.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const readiness = realReadiness ?? fallbackReadiness;
  const sourceLabel = realReadiness ? 'Supabase' : 'Mock';
  const statusVariant =
    readiness.status === 'ready_for_supervised_proposals'
      ? 'green'
      : readiness.status === 'almost_ready'
        ? 'yellow'
        : 'red';

  const evidenceCards = [
    ['Contexto', metricLabel(readiness.evidence.contextCompleteness, '%')],
    ['Memoria ativa', metricLabel(readiness.evidence.activeMemoryCount)],
    ['Concorrentes', metricLabel(readiness.evidence.activeCompetitorCount)],
    ['Achados revisados', metricLabel(readiness.evidence.reviewedFindingCount)],
    ['Eventos de funil', metricLabel(readiness.evidence.funnelEventCount)],
    ['Vendas com margem', metricLabel(readiness.evidence.saleWithMarginCount)],
    ['Nota CMO', metricLabel(readiness.evidence.cmoReadinessScore, '/100')],
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
            Decision Engine
          </h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            Pre-motor supervisionado para decidir se o agente pode gerar propostas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={realReadiness ? 'green' : 'gray'}>{sourceLabel}</Badge>
          <Badge variant={statusVariant}>{readiness.statusLabel}</Badge>
          <Badge variant="blue">{readiness.operatingMode}</Badge>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A tela esta exibindo dados mockados para manter a validacao visivel.
        </DataStateNotice>
      )}

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b61]">
            Prontidao de decisao
          </p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-5xl font-semibold text-[#142116]">
              {readiness.readinessScore}
            </span>
            <span className="pb-2 text-sm font-medium text-[#5c6b61]">/100</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#34473b]">
            {readiness.verdict}
          </p>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-[#f7f9f6] px-3 py-2">
              <span className="text-[#5c6b61]">Pode gerar propostas</span>
              <Badge variant={readiness.canGenerateSupervisedProposals ? 'green' : 'red'}>
                {readiness.canGenerateSupervisedProposals ? 'Sim, supervisionado' : 'Nao'}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#f7f9f6] px-3 py-2">
              <span className="text-[#5c6b61]">Pode executar Ads/MCP</span>
              <Badge variant="red">Nao</Badge>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b61]">
            Politica da v45
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              {
                title: 'Sem IA externa nesta etapa',
                detail:
                  'A leitura e deterministica para validar gates antes de qualquer modelo gerar proposta.',
              },
              {
                title: 'Sem MCP de Ads',
                detail:
                  'Google Ads e Meta Ads continuam previstos para fase final, primeiro em leitura.',
              },
              {
                title: 'CRM/funil manda no numero',
                detail:
                  'Se Ads e funil divergirem, a decisao fica bloqueada ate reconciliar origem, venda e margem.',
              },
              {
                title: 'Aprovacao humana obrigatoria',
                detail:
                  'Mesmo pronto, o motor so gera proposta revisavel. Execucao vem em outra camada.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg bg-[#f7f9f6] px-4 py-3">
                <p className="text-sm font-semibold text-[#172018]">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5c6b61]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Gates de liberacao
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              O agente so avanca quando contexto, pesquisa, funil e Data Trust estao coerentes.
            </p>
          </div>
          <Badge variant={readiness.blockers.length === 0 ? 'green' : 'red'}>
            {readiness.blockers.length} bloqueio(s)
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {readiness.gates.map((gate) => (
            <div
              key={gate.id}
              className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#172018]">{gate.title}</p>
                <Badge variant={gateVariant[gate.status]}>{gateLabel[gate.status]}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#5c6b61]">
                {gate.detail}
              </p>
              <p className="mt-3 text-xs font-medium text-[#34473b]">{gate.evidence}</p>
              {gate.status !== 'passed' && (
                <p className="mt-3 text-xs leading-relaxed text-[#5c6b61]">
                  Resolver: {gate.action}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            O que impede agora
          </h2>
          <GateList gates={readiness.blockers.length > 0 ? readiness.blockers : readiness.warnings} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Evidencias usadas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {evidenceCards.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className="text-[#5c6b61]">{label}</span>
                <span className="font-semibold text-[#172018]">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 text-sm shadow-sm">
              <span className="text-[#5c6b61]">Data Trust</span>
              <Badge
                variant={
                  readiness.evidence.dataTrustStatus === 'green'
                    ? 'green'
                    : readiness.evidence.dataTrustStatus === 'yellow'
                      ? 'yellow'
                      : 'red'
                }
              >
                {readiness.evidence.dataTrustStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 text-sm shadow-sm">
              <span className="text-[#5c6b61]">Lacunas abertas</span>
              <span className="font-semibold text-[#172018]">
                {readiness.evidence.openGapCount}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Hipoteses que o motor pode levar para proposta
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Ideias deterministicas, sem chamada externa, prontas para virar proposta revisavel.
            </p>
          </div>
          <Badge variant="blue">Dry-run</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {readiness.hypotheses.map((hypothesis) => (
            <div
              key={hypothesis.id}
              className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#172018]">{hypothesis.title}</p>
                <Badge variant="green">{hypothesis.confidence}%</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#5c6b61]">
                {hypothesis.rationale}
              </p>
              <div className="mt-4 grid gap-2 text-xs leading-relaxed text-[#34473b]">
                <p className="rounded-lg bg-[#f7f9f6] px-3 py-2">
                  Regra: {hypothesis.guardrail}
                </p>
                <p className="rounded-lg bg-[#f7f9f6] px-3 py-2">
                  Proximo passo: {hypothesis.nextAction}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
