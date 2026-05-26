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
  proposals as mockProposals,
} from '@/lib/mock-data';
import { getSupabaseContextIntelligenceData } from '@/lib/context-intelligence/supabase-context-intelligence';
import { getSupabaseContextResearchData } from '@/lib/context-research/supabase-context-research';
import { getSupabaseDataTrustState } from '@/lib/data-trust/supabase-data-trust';
import { buildDecisionReadiness, type DecisionReadiness } from '@/lib/decision/supervised-decision-engine';
import { getSupabaseFunnelData } from '@/lib/funnel/supabase-funnel';
import { getSupabaseProposals } from '@/lib/proposals/supabase-proposals';
import {
  runSupervisedRuleValidator,
  supervisedRuleCatalog,
  severityLabel,
  type RuleValidatorDryRun,
} from '@/lib/rule-validator/supervised-rule-validator';
import { getSupabaseRuleValidatorRules } from '@/lib/rule-validator/supabase-rule-validator';
import { buildCmoReadiness } from '@/lib/strategy/cmo-readiness';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  Proposal,
  RuleValidatorResult,
  RuleValidatorRule,
  RuleValidatorSeverity,
} from '@/types';

type BrowserSupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;

type RuleValidatorPageData = {
  readiness: DecisionReadiness;
  proposals: Proposal[];
  rules: RuleValidatorRule[];
};

async function loadRealRuleValidatorData(
  supabase: BrowserSupabaseClient,
): Promise<RuleValidatorPageData> {
  const [contextData, researchData, funnelData, dataTrustState, proposals, rules] =
    await Promise.all([
      getSupabaseContextIntelligenceData(supabase),
      getSupabaseContextResearchData(supabase),
      getSupabaseFunnelData(supabase),
      getSupabaseDataTrustState(supabase),
      getSupabaseProposals(supabase),
      getSupabaseRuleValidatorRules(supabase),
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

  return {
    readiness: buildDecisionReadiness({
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
    }),
    proposals,
    rules,
  };
}

function buildFallbackRuleValidatorData(): RuleValidatorPageData {
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

  return {
    readiness: buildDecisionReadiness({
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
    }),
    proposals: mockProposals,
    rules: supervisedRuleCatalog,
  };
}

const resultVariant: Record<RuleValidatorResult, 'green' | 'yellow' | 'red'> = {
  passed: 'green',
  warning: 'yellow',
  failed: 'red',
};

const resultLabel: Record<RuleValidatorResult, string> = {
  passed: 'Passou',
  warning: 'Alerta',
  failed: 'Falhou',
};

const severityVariant: Record<RuleValidatorSeverity, 'red' | 'yellow' | 'blue'> = {
  blocking: 'red',
  warning: 'yellow',
  info: 'blue',
};

function chooseProposal(proposals: Proposal[]) {
  return proposals.find((proposal) => proposal.status === 'pending') ?? proposals[0];
}

function formatCategory(value: string) {
  return value
    .replace('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ValidatorPage() {
  const [realData, setRealData] = useState<RuleValidatorPageData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const fallbackData = useMemo(() => buildFallbackRuleValidatorData(), []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    loadRealRuleValidatorData(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealData(data);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar o dry-run real do rule_validator.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const data = realData ?? fallbackData;
  const selectedProposal = chooseProposal(data.proposals);
  const dryRun: RuleValidatorDryRun = runSupervisedRuleValidator({
    decisionReadiness: data.readiness,
    proposal: selectedProposal,
    rules: data.rules,
  });
  const sourceLabel = realData ? 'Supabase' : 'Mock';

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
            Rule Validator
          </h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            Regras deterministicas antes de propostas, aprovacao humana e execucao.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={realData ? 'green' : 'gray'}>{sourceLabel}</Badge>
          <Badge variant={resultVariant[dryRun.result]}>{dryRun.resultLabel}</Badge>
          <Badge variant="blue">Dry-run local</Badge>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A tela esta exibindo regras e propostas mockadas para manter a validacao visivel.
        </DataStateNotice>
      )}

      <DataStateNotice title="Rule Validator aplicado no Supabase" variant="success" className="mb-6">
        A v47 aplicou <code>20260525100000_create_rule_validator.sql</code> no remoto.
        Esta tela agora le o catalogo ativo de regras quando a sessao Supabase esta disponivel.
      </DataStateNotice>

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b61]">
            Resultado do dry-run
          </p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-5xl font-semibold text-[#142116]">
              {dryRun.passCount}
            </span>
            <span className="pb-2 text-sm font-medium text-[#5c6b61]">
              /{dryRun.checks.length} regras passaram
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#34473b]">{dryRun.summary}</p>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-[#f7f9f6] px-3 py-2">
              <span className="text-[#5c6b61]">Pode virar proposta</span>
              <Badge variant={dryRun.canPromoteToProposal ? 'green' : 'red'}>
                {dryRun.canPromoteToProposal ? 'Sim, supervisionada' : 'Nao'}
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
            Proposta usada como amostra
          </p>
          {selectedProposal ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#172018]">
                    {selectedProposal.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c6b61]">
                    {selectedProposal.reasoning}
                  </p>
                </div>
                <Badge variant={selectedProposal.riskLevel === 'low' ? 'green' : 'yellow'}>
                  Risco {selectedProposal.riskLevel}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-[#f7f9f6] px-3 py-2">
                  <p className="text-xs text-[#5c6b61]">Canal</p>
                  <p className="text-sm font-semibold text-[#172018]">
                    {selectedProposal.channel}
                  </p>
                </div>
                <div className="rounded-lg bg-[#f7f9f6] px-3 py-2">
                  <p className="text-xs text-[#5c6b61]">Tipo</p>
                  <p className="text-sm font-semibold text-[#172018]">
                    {selectedProposal.type}
                  </p>
                </div>
                <div className="rounded-lg bg-[#f7f9f6] px-3 py-2">
                  <p className="text-xs text-[#5c6b61]">Status</p>
                  <p className="text-sm font-semibold text-[#172018]">
                    {selectedProposal.status}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Nenhuma proposta para testar"
              description="O rule_validator continua mostrando regras globais; a validacao por proposta entrara quando houver proposta pendente."
            />
          )}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Resultado das regras
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Cada regra explica evidencia, falha e caminho de correcao.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="green">{dryRun.passCount} passaram</Badge>
            <Badge variant="yellow">{dryRun.warningCount} alertas</Badge>
            <Badge variant="red">{dryRun.failCount} falhas</Badge>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {dryRun.checks.map((check) => (
            <div
              key={check.ruleKey}
              className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#172018]">{check.ruleKey}</p>
                  <p className="mt-1 text-xs text-[#5c6b61]">
                    {severityLabel(check.severity)}
                  </p>
                </div>
                <Badge variant={resultVariant[check.result]}>
                  {resultLabel[check.result]}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#34473b]">
                {check.message}
              </p>
              {check.result !== 'passed' && (
                <p className="mt-2 text-xs leading-relaxed text-[#5c6b61]">
                  Resolver: {check.remediation}
                </p>
              )}
              <pre className="mt-3 max-h-28 overflow-auto rounded-lg bg-[#f7f9f6] p-3 text-xs text-[#34473b]">
                {JSON.stringify(check.evidence, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Catalogo versionado
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Regras v1 que serao persistidas quando a migration for autorizada.
            </p>
          </div>
          <Badge variant={realData ? 'green' : 'blue'}>
            {dryRun.rules.length} regras {realData ? 'Supabase' : 'locais'}
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#d7ddd2] bg-white shadow-sm">
          <table className="min-w-[920px] w-full text-sm">
            <thead>
              <tr className="border-b border-[#d7ddd2] bg-[#f6f7f4] text-left">
                <th className="px-4 py-3 font-semibold text-[#5c6b61]">Regra</th>
                <th className="px-4 py-3 font-semibold text-[#5c6b61]">Categoria</th>
                <th className="px-4 py-3 font-semibold text-[#5c6b61]">Severidade</th>
                <th className="px-4 py-3 font-semibold text-[#5c6b61]">Condicao</th>
              </tr>
            </thead>
            <tbody>
              {dryRun.rules.map((rule, index) => (
                <tr
                  key={rule.ruleKey}
                  className={`border-b border-[#edf1ea] last:border-0 ${
                    index % 2 === 1 ? 'bg-[#fafbf9]' : 'bg-white'
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#172018]">{rule.title}</p>
                    <p className="mt-1 text-xs text-[#5c6b61]">
                      {rule.ruleKey} · v{rule.version}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[#34473b]">
                    {formatCategory(rule.category)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={severityVariant[rule.severity]}>
                      {severityLabel(rule.severity)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-[#34473b]">
                      {JSON.stringify(rule.condition)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
