'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice } from '@/components/ui/DataStateNotice';
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
  buildSupervisedAgentResponse,
  formatAgentResponse,
  type AgentChatMessage,
  type AgentChatResponse,
} from '@/lib/agent-chat/supervised-agent-chat';
import { getSupabaseContextIntelligenceData } from '@/lib/context-intelligence/supabase-context-intelligence';
import { getSupabaseContextResearchData } from '@/lib/context-research/supabase-context-research';
import { getSupabaseFunnelData } from '@/lib/funnel/supabase-funnel';
import { buildCmoReadiness, type CmoReadiness } from '@/lib/strategy/cmo-readiness';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  BusinessContext,
  ContextGap,
  ContextMemoryItem,
  ContextResearchFinding,
  FunnelEvent,
} from '@/types';

type BrowserSupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;

type AgentPageData = {
  businessContext: BusinessContext | null;
  cmoReadiness: CmoReadiness;
  funnelEvents: FunnelEvent[];
  gaps: ContextGap[];
  findings: ContextResearchFinding[];
  memoryItems: ContextMemoryItem[];
};

type UiMessage = AgentChatMessage & {
  response?: AgentChatResponse;
  mode?: 'openai' | 'fallback';
  model?: string;
};

type ExternalAgentStatus = {
  enabled: boolean;
  configured: boolean;
  model: string;
  candidateModels: string[];
};

const quickPrompts = [
  'Estamos recebendo leads desqualificados. O que podemos fazer?',
  'Como vender mais sem aumentar CAC?',
  'O que falta resolver antes de escalar Ads?',
  'Qual deve ser nossa prioridade comercial nesta semana?',
];

function nowIso() {
  return new Date().toISOString();
}

function compactText(value: string | undefined, maxLength = 420) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}

function buildExternalAnalysisContext(data: AgentPageData, sourceLabel: string) {
  const cmo = data.cmoReadiness;
  const openGaps = data.gaps.filter((gap) => gap.status === 'open');
  const acceptedFindings = data.findings.filter(
    (finding) =>
      finding.reviewStatus === 'accepted' ||
      finding.reviewStatus === 'converted_to_context' ||
      finding.reviewStatus === 'converted_to_memory',
  );
  const activeMemoryItems = data.memoryItems.filter((item) => item.status === 'active');

  return {
    generatedAt: nowIso(),
    dataSource: sourceLabel,
    guardrails: [
      'Nao executar Ads, CRM ou MCP nesta fase.',
      'Usar Decision Engine, Rule Validator, aprovacao humana e execution dry-run antes de qualquer acao real.',
      'Separar volume de leads, qualidade, margem, capacidade comercial e previsibilidade.',
    ],
    businessContext: data.businessContext
      ? {
          name: data.businessContext.name,
          status: data.businessContext.status,
          completenessScore: data.businessContext.completenessScore,
          summary: compactText(data.businessContext.summary, 700),
        }
      : null,
    cmoReadiness: {
      score: cmo.score,
      statusLabel: cmo.statusLabel,
      verdict: cmo.verdict,
      economics: cmo.economics,
      evidence: cmo.evidence,
      scoreBreakdown: cmo.scoreBreakdown,
      blockers: cmo.blockers.slice(0, 6),
      strategicRules: cmo.strategicRules.slice(0, 8),
      keyAnswers: Array.from(cmo.answerByKey.entries())
        .slice(0, 16)
        .map(([key, answer]) => ({
          key,
          answer: compactText(answer, 520),
        })),
    },
    funnel: {
      totalEvents: data.funnelEvents.length,
      recentEvents: data.funnelEvents.slice(0, 20).map((event) => ({
        stage: event.stage,
        source: event.source,
        campaignName: compactText(event.campaignName, 160),
        leadQualityScore: event.leadQualityScore,
        dealValueBrl: event.dealValueBrl,
        grossMarginBrl: event.grossMarginBrl,
        occurredAt: event.occurredAt,
        notes: compactText(event.notes, 260),
      })),
    },
    openGaps: openGaps.slice(0, 12).map((gap) => ({
      severity: gap.severity,
      description: compactText(gap.description, 420),
      recommendation: compactText(gap.recommendation, 420),
    })),
    acceptedFindings: acceptedFindings.slice(0, 12).map((finding) => ({
      type: finding.findingType,
      title: finding.title,
      finding: compactText(finding.finding, 520),
      evidence: compactText(finding.evidence, 420),
      confidence: finding.confidence,
    })),
    activeMemoryItems: activeMemoryItems.slice(0, 12).map((item) => ({
      type: item.memoryType,
      title: item.title,
      content: compactText(item.content, 520),
      confidence: item.confidence,
    })),
  };
}

async function requestExternalAgentAnalysis(
  question: string,
  context: ReturnType<typeof buildExternalAnalysisContext>,
) {
  const response = await fetch('/api/agent/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, context }),
  });

  const payload = (await response.json().catch(() => null)) as {
    content?: unknown;
    model?: unknown;
    error?: unknown;
    failures?: unknown;
  } | null;

  if (!response.ok) {
    const failureSummary = Array.isArray(payload?.failures)
      ? payload.failures
          .map((failure) => {
            if (typeof failure !== 'object' || failure === null) {
              return null;
            }

            const item = failure as {
              model?: unknown;
              status?: unknown;
              message?: unknown;
            };
            const model = typeof item.model === 'string' ? item.model : 'modelo';
            const status =
              typeof item.status === 'number' ? `HTTP ${item.status}` : 'sem status';
            const message =
              typeof item.message === 'string' ? item.message : 'erro nao informado';

            return `${model} (${status}): ${message}`;
          })
          .filter(Boolean)
          .join(' | ')
      : '';

    throw new Error(
      typeof payload?.error === 'string'
        ? `${payload.error}${failureSummary ? ` Detalhe: ${failureSummary}` : ''}`
        : 'IA externa indisponivel no momento.',
    );
  }

  if (typeof payload?.content !== 'string' || !payload.content.trim()) {
    throw new Error('A IA externa nao retornou uma resposta valida.');
  }

  return {
    content: payload.content.trim(),
    model: typeof payload.model === 'string' ? payload.model : undefined,
  };
}

async function requestExternalAgentStatus(): Promise<ExternalAgentStatus> {
  const response = await fetch('/api/agent/analyze', {
    method: 'GET',
  });

  const payload = (await response.json().catch(() => null)) as {
    enabled?: unknown;
    configured?: unknown;
    model?: unknown;
    candidateModels?: unknown;
  } | null;

  if (!response.ok || !payload) {
    throw new Error('Nao foi possivel verificar o status da IA externa.');
  }

  return {
    enabled: payload.enabled === true,
    configured: payload.configured === true,
    model: typeof payload.model === 'string' ? payload.model : 'modelo nao informado',
    candidateModels: Array.isArray(payload.candidateModels)
      ? payload.candidateModels.filter(
          (model): model is string => typeof model === 'string',
        )
      : [],
  };
}

function buildFallbackData(): AgentPageData {
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
    businessContext: mockBusinessContext,
    cmoReadiness,
    funnelEvents: mockFunnelEvents,
    gaps: mockContextGaps,
    findings: mockContextResearchFindings,
    memoryItems: mockContextMemoryItems,
  };
}

async function loadAgentPageData(supabase: BrowserSupabaseClient): Promise<AgentPageData> {
  const [contextData, researchData, funnelData] = await Promise.all([
    getSupabaseContextIntelligenceData(supabase),
    getSupabaseContextResearchData(supabase),
    getSupabaseFunnelData(supabase),
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
    businessContext: contextData.context,
    cmoReadiness,
    funnelEvents: funnelData.events,
    gaps: contextData.gaps,
    findings: researchData.findings,
    memoryItems: researchData.memoryItems,
  };
}

function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user';
  const modeLabel =
    message.mode === 'openai'
      ? `OpenAI${message.model ? ` - ${message.model}` : ''}`
      : message.mode === 'fallback'
        ? 'Fallback supervisionado'
        : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[860px] rounded-lg border px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'border-[#476454] bg-[#476454] text-white'
            : 'border-[#d7ddd2] bg-white text-[#34473b]'
        }`}
      >
        {!isUser && modeLabel && (
          <div className="mb-2 inline-flex rounded-full border border-[#d7ddd2] bg-[#f7f9f6] px-2 py-0.5 text-[11px] font-semibold text-[#5c6b61]">
            {modeLabel}
          </div>
        )}
        <div className="whitespace-pre-line leading-relaxed">{message.content}</div>
        {message.response && (
          <div className="mt-4 grid gap-2 border-t border-[#d7ddd2] pt-3 sm:grid-cols-2">
            {message.response.nextScreens.map((screen) => (
              <Link
                key={screen.href}
                href={screen.href}
                className="rounded-lg border border-[#d7ddd2] bg-[#f7f9f6] px-3 py-2 text-xs text-[#34473b] transition hover:border-[#476454]"
              >
                <span className="font-semibold text-[#172018]">{screen.label}</span>
                <span className="mt-1 block leading-relaxed text-[#5c6b61]">
                  {screen.reason}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentPage() {
  const [realData, setRealData] = useState<AgentPageData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [externalNotice, setExternalNotice] = useState<string | null>(null);
  const [externalStatus, setExternalStatus] = useState<ExternalAgentStatus | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'assistant-opening',
      role: 'assistant',
      content:
        'Pode conversar comigo sobre vendas e marketing. Eu vou responder usando contexto, funil, estrategia e regras supervisionadas ja cadastradas.',
      createdAt: nowIso(),
    },
  ]);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const fallbackData = useMemo(() => buildFallbackData(), []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    loadAgentPageData(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealData(data);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar o contexto real do agente.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    requestExternalAgentStatus()
      .then((status) => {
        if (!isMounted) return;
        setExternalStatus(status);
      })
      .catch(() => {
        if (!isMounted) return;
        setExternalStatus(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const data = realData ?? fallbackData;
  const sourceLabel = realData ? 'Supabase' : 'Mock';
  const externalStatusLabel = externalStatus
    ? !externalStatus.enabled
      ? 'OpenAI desativada'
      : externalStatus.configured
        ? `OpenAI pronta - ${externalStatus.model}`
        : 'OpenAI sem chave'
    : 'OpenAI verificando';
  const externalStatusVariant =
    externalStatus?.enabled && externalStatus.configured
      ? 'green'
      : externalStatus
        ? 'yellow'
        : 'gray';
  const candidateModelText =
    externalStatus?.candidateModels.length
      ? externalStatus.candidateModels.join(', ')
      : 'gpt-5-mini, gpt-4.1-mini';

  async function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isAnalyzing) return;

    const fallbackResponse = buildSupervisedAgentResponse(trimmed, data);
    const timestamp = nowIso();

    setMessages((current) => [
      ...current,
      {
        id: `user-${timestamp}`,
        role: 'user',
        content: trimmed,
        createdAt: timestamp,
      },
    ]);
    setInput('');
    setExternalNotice(null);
    setIsAnalyzing(true);

    try {
      const externalResponse = await requestExternalAgentAnalysis(
        trimmed,
        buildExternalAnalysisContext(data, sourceLabel),
      );

      setMessages((current) => [
        ...current,
        {
          id: `assistant-openai-${timestamp}`,
          role: 'assistant',
          content: externalResponse.content,
          createdAt: nowIso(),
          response: fallbackResponse,
          mode: 'openai',
          model: externalResponse.model,
        },
      ]);
    } catch (error) {
      setExternalNotice(
        error instanceof Error
          ? `${error.message} Usei o nucleo supervisionado local como fallback.`
          : 'IA externa indisponivel. Usei o nucleo supervisionado local como fallback.',
      );
      setMessages((current) => [
        ...current,
        {
          id: `assistant-fallback-${timestamp}`,
          role: 'assistant',
          content: formatAgentResponse(fallbackResponse),
          createdAt: nowIso(),
          response: fallbackResponse,
          mode: 'fallback',
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(input);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-6 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
            Conversar com o Agente
          </h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            Consultoria supervisionada para vendas, marketing, funil, CAC e qualidade de leads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={realData ? 'green' : 'gray'}>{sourceLabel}</Badge>
          <Badge variant={externalStatusVariant}>{externalStatusLabel}</Badge>
          <Badge variant="blue">Supervisionado</Badge>
          <Badge variant="red">Sem escrita externa</Badge>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A conversa esta usando dados mockados para manter a experiencia visivel.
        </DataStateNotice>
      )}

      {externalNotice && (
        <DataStateNotice title="Fallback do agente" variant="warning" className="mb-4">
          {externalNotice}
        </DataStateNotice>
      )}

      {externalStatus && externalStatus.enabled && !externalStatus.configured && (
        <DataStateNotice title="OpenAI nao configurada" variant="warning" className="mb-4">
          Cadastre `OPENAI_API_KEY` nas variaveis de ambiente da Hostinger e reimplante para a analise externa entrar em uso. Modelos de tentativa: {candidateModelText}.
        </DataStateNotice>
      )}

      {externalStatus && !externalStatus.enabled && (
        <DataStateNotice title="OpenAI desativada" variant="warning" className="mb-4">
          `OPENAI_ANALYSIS_ENABLED` esta como `false`. Altere para `true` e reimplante se quiser usar a IA externa.
        </DataStateNotice>
      )}

      <section className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Base CMO</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {data.cmoReadiness.score}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Eventos de funil</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {data.funnelEvents.length}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Lacunas abertas</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {data.gaps.filter((gap) => gap.status === 'open').length}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Memorias ativas</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {data.memoryItems.filter((item) => item.status === 'active').length}
          </p>
        </div>
      </section>

      <section className="mb-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              void submitQuestion(prompt);
            }}
            disabled={isAnalyzing}
            className="rounded-full border border-[#d7ddd2] bg-white px-3 py-1.5 text-xs font-medium text-[#34473b] transition hover:border-[#476454] hover:bg-[#f0f5f1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </section>

      <section className="mb-4 flex-1 space-y-4 rounded-lg border border-[#d7ddd2] bg-[#f7f9f6] p-4 shadow-sm">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 text-sm text-[#5c6b61] shadow-sm">
              Analisando contexto, funil e estrategia...
            </div>
          </div>
        )}
      </section>

      <form onSubmit={onSubmit} className="rounded-lg border border-[#d7ddd2] bg-white p-3 shadow-sm">
        <label
          htmlFor="agent-question"
          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#5c6b61]"
        >
          Pergunta para o agente
        </label>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            id="agent-question"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ex.: Estamos recebendo leads desqualificados. O que podemos fazer?"
            className="min-h-24 resize-y rounded-lg border border-[#d7ddd2] bg-white px-3 py-2 text-sm text-[#172018] outline-none transition-colors focus:border-[#476454]"
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            disabled={isAnalyzing}
            className="rounded-lg bg-[#476454] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#34473b] disabled:cursor-not-allowed disabled:bg-[#8fa093]"
          >
            {isAnalyzing ? 'Analisando' : 'Enviar'}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#5c6b61]">
          Esta versao usa IA externa quando `OPENAI_API_KEY` estiver configurada no servidor. O agente tenta o modelo configurado e depois fallbacks seguros. MCPs e escrita em Ads seguem bloqueados.
        </p>
      </form>
    </div>
  );
}
