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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[860px] rounded-lg border px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'border-[#476454] bg-[#476454] text-white'
            : 'border-[#d7ddd2] bg-white text-[#34473b]'
        }`}
      >
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

  const data = realData ?? fallbackData;
  const sourceLabel = realData ? 'Supabase' : 'Mock';

  function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;

    const response = buildSupervisedAgentResponse(trimmed, data);
    const timestamp = nowIso();

    setMessages((current) => [
      ...current,
      {
        id: `user-${timestamp}`,
        role: 'user',
        content: trimmed,
        createdAt: timestamp,
      },
      {
        id: `assistant-${timestamp}`,
        role: 'assistant',
        content: formatAgentResponse(response),
        createdAt: timestamp,
        response,
      },
    ]);
    setInput('');
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuestion(input);
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
          <Badge variant="blue">Supervisionado</Badge>
          <Badge variant="red">Sem escrita externa</Badge>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A conversa esta usando dados mockados para manter a experiencia visivel.
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
            onClick={() => submitQuestion(prompt)}
            className="rounded-full border border-[#d7ddd2] bg-white px-3 py-1.5 text-xs font-medium text-[#34473b] transition hover:border-[#476454] hover:bg-[#f0f5f1]"
          >
            {prompt}
          </button>
        ))}
      </section>

      <section className="mb-4 flex-1 space-y-4 rounded-lg border border-[#d7ddd2] bg-[#f7f9f6] p-4 shadow-sm">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
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
          />
          <button
            type="submit"
            className="rounded-lg bg-[#476454] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#34473b]"
          >
            Enviar
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#5c6b61]">
          Esta versao responde com regras supervisionadas. Persistencia do historico e IA externa entram em uma etapa autorizada separada.
        </p>
      </form>
    </div>
  );
}
