import type { CmoReadiness } from '@/lib/strategy/cmo-readiness';
import type {
  BusinessContext,
  ContextGap,
  ContextMemoryItem,
  ContextResearchFinding,
  FunnelEvent,
} from '@/types';

export type AgentChatRole = 'user' | 'assistant';

export type AgentChatMessage = {
  id: string;
  role: AgentChatRole;
  content: string;
  createdAt: string;
};

export type AgentChatResponse = {
  title: string;
  summary: string;
  diagnosis: string[];
  actions: string[];
  evidence: string[];
  nextScreens: Array<{
    label: string;
    href: string;
    reason: string;
  }>;
};

export type AgentChatContext = {
  businessContext: BusinessContext | null;
  cmoReadiness: CmoReadiness;
  funnelEvents: FunnelEvent[];
  gaps: ContextGap[];
  findings: ContextResearchFinding[];
  memoryItems: ContextMemoryItem[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function money(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 'nao informado';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function sourceLabel(source: FunnelEvent['source']) {
  const labels: Record<FunnelEvent['source'], string> = {
    google_ads: 'Google Ads',
    meta_ads: 'Meta Ads',
    organic: 'Organico',
    whatsapp: 'WhatsApp',
    marketplace: 'Marketplace',
    direct: 'Direto',
    referral: 'Indicacao',
    crm: 'CRM',
    other: 'Outro',
  };

  return labels[source];
}

function lowQualityEvents(events: FunnelEvent[]) {
  return events.filter(
    (event) =>
      event.stage === 'qualified_lead' &&
      typeof event.leadQualityScore === 'number' &&
      event.leadQualityScore <= 5,
  );
}

function sourceSummary(events: FunnelEvent[]) {
  const bySource = new Map<FunnelEvent['source'], number>();

  events.forEach((event) => {
    bySource.set(event.source, (bySource.get(event.source) ?? 0) + 1);
  });

  return Array.from(bySource.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([source, count]) => `${sourceLabel(source)}: ${count}`)
    .join(', ');
}

function activeMemories(memoryItems: ContextMemoryItem[]) {
  return memoryItems.filter((item) => item.status === 'active');
}

function acceptedFindings(findings: ContextResearchFinding[]) {
  return findings.filter(
    (finding) =>
      finding.reviewStatus === 'accepted' ||
      finding.reviewStatus === 'converted_to_context' ||
      finding.reviewStatus === 'converted_to_memory',
  );
}

function leadQualityAnswer(context: AgentChatContext): AgentChatResponse {
  const cmo = context.cmoReadiness;
  const badLeads = lowQualityEvents(context.funnelEvents);
  const badFit =
    cmo.answerByKey.get('audience.bad_fit') ??
    'perfis sem aderencia comercial clara';
  const primaryOffer =
    cmo.answerByKey.get('offer.primary') ?? context.businessContext?.name ?? 'oferta principal';
  const sourceMix = sourceSummary(context.funnelEvents) || 'sem origem suficiente registrada';

  return {
    title: 'Plano para reduzir leads desqualificados',
    summary:
      'Antes de mexer em verba, eu trataria isso como problema de qualidade de entrada: promessa, segmentacao, filtro na landing e criterio comercial precisam ficar alinhados.',
    diagnosis: [
      `A primeira suspeita e desalinhamento entre promessa do anuncio e ICP real da ${primaryOffer}.`,
      `O contexto ja indica que devemos despriorizar: ${badFit}.`,
      'Se a origem/campanha do lead ruim nao estiver marcada, o agente nao consegue separar canal ruim de mensagem ruim.',
      'Lead barato que nao vira oportunidade deve perder prioridade mesmo que o CPL pareca bom.',
    ],
    actions: [
      'Registrar em /funnel todo lead com origem, campanha e nota de qualidade. Sem isso, a decisao fica subjetiva.',
      'Criar uma lista de padroes de lead ruim: tipo de empresa, tamanho, urgencia, produto procurado, orcamento e motivo de desqualificacao.',
      'Ajustar anuncios e landing para pre-qualificar: deixar claro oferta, perfil atendido, restricoes, ticket minimo ou condicoes de compra.',
      'Separar campanhas de alta intencao das campanhas consultivas. Nao misturar quem quer comprar agora com quem so esta pesquisando.',
      'Reduzir ou pausar, em dry-run, campanhas/origens com muitos leads nota 5 ou menos ate aparecer oportunidade real.',
      'Levar a hipotese para /decision e so transformar em proposta depois do /validator.',
    ],
    evidence: [
      `Eventos recentes no funil: ${context.funnelEvents.length}.`,
      `Leads qualificados com nota baixa detectados: ${badLeads.length}.`,
      `Mix de origem atual: ${sourceMix}.`,
      `Nota CMO atual: ${cmo.score}/100.`,
      `Memorias ativas usadas como contexto: ${activeMemories(context.memoryItems).length}.`,
    ],
    nextScreens: [
      {
        label: 'Funil Real',
        href: '/funnel',
        reason: 'Marcar origem, campanha e qualidade de cada lead.',
      },
      {
        label: 'Estrategia CMO',
        href: '/strategy',
        reason: 'Ver impacto em CAC, CPL maximo e capacidade comercial.',
      },
      {
        label: 'Decision Engine',
        href: '/decision',
        reason: 'Transformar a hipotese em proposta supervisionada.',
      },
      {
        label: 'Rule Validator',
        href: '/validator',
        reason: 'Bloquear qualquer acao sem evidencias minimas.',
      },
    ],
  };
}

function scaleAnswer(context: AgentChatContext): AgentChatResponse {
  const cmo = context.cmoReadiness;
  const economics = cmo.economics;

  return {
    title: 'Como crescer vendas sem perder previsibilidade',
    summary:
      'Eu nao escalaria Ads pelo volume de leads. Escalaria por margem, capacidade comercial e evidencia de venda ganha.',
    diagnosis: [
      `CAC alvo estimado: ${money(economics.targetCac)}.`,
      `Lucro bruto por venda estimado: ${money(economics.grossProfitPerSale)}.`,
      `Capacidade mensal de leads: ${
        economics.leadCapacityPerMonth ?? 'nao informada'
      }.`,
      'Se a equipe comercial nao suporta o volume, aumentar midia pode piorar atendimento e conversao.',
    ],
    actions: [
      'Priorizar campanhas que geram oportunidade e venda, nao apenas leads.',
      'Definir limite de CPL por taxa de fechamento. O /strategy ja calcula cenarios.',
      'Antes de aumentar verba, confirmar pelo menos uma venda com margem no /funnel.',
      'Criar proposta supervisionada apenas para a campanha/origem com melhor relacao qualidade x margem.',
      'Rodar execution dry-run antes de qualquer mudanca real.',
    ],
    evidence: [
      `Nota CMO: ${cmo.score}/100.`,
      `Eventos de funil: ${cmo.evidence.funnelEventCount}.`,
      `Vendas com valor e margem: ${cmo.evidence.funnelValueMarginCount}.`,
      `Lacunas abertas: ${cmo.evidence.openGapCount}.`,
    ],
    nextScreens: [
      {
        label: 'Estrategia CMO',
        href: '/strategy',
        reason: 'Checar CAC, margem e cenarios de CPL maximo.',
      },
      {
        label: 'Funil Real',
        href: '/funnel',
        reason: 'Confirmar oportunidade, venda e margem por origem.',
      },
      {
        label: 'Execution Engine',
        href: '/execution',
        reason: 'Simular antes de qualquer execucao real futura.',
      },
    ],
  };
}

function blockersAnswer(context: AgentChatContext): AgentChatResponse {
  const cmo = context.cmoReadiness;
  const blockers = cmo.blockers.slice(0, 4);
  const openCriticalGaps = context.gaps.filter(
    (gap) => gap.status === 'open' && gap.severity === 'critical',
  );

  return {
    title: 'O que resolver antes de escalar',
    summary:
      'Eu resolveria primeiro os bloqueios que impedem previsibilidade comercial. Escalar antes disso tende a comprar mais incerteza.',
    diagnosis:
      blockers.length > 0
        ? blockers.map((blocker) => `${blocker.title}: ${blocker.detail}`)
        : ['A base supervisionada esta boa; a proxima trava e produto escalavel e integracoes em leitura.'],
    actions: [
      'Fechar lacunas criticas do contexto antes de mexer em campanha.',
      'Garantir que os eventos de funil tenham origem e qualidade do lead.',
      'Separar recomendacoes de mensagem, segmentacao e budget em propostas diferentes.',
      'Usar /validator para bloquear qualquer proposta sem evidencia.',
    ],
    evidence: [
      `Nota CMO: ${cmo.score}/100.`,
      `Bloqueios estrategicos: ${cmo.blockers.length}.`,
      `Lacunas criticas abertas: ${openCriticalGaps.length}.`,
      `Achados aceitos na pesquisa: ${acceptedFindings(context.findings).length}.`,
    ],
    nextScreens: [
      {
        label: 'Diagnostico',
        href: '/context',
        reason: 'Resolver respostas e lacunas do contexto.',
      },
      {
        label: 'Pesquisa',
        href: '/research',
        reason: 'Revisar achados e memoria contextual.',
      },
      {
        label: 'Roadmap',
        href: '/roadmap',
        reason: 'Ver a fase atual antes das integracoes externas.',
      },
    ],
  };
}

function defaultAnswer(question: string, context: AgentChatContext): AgentChatResponse {
  const normalized = normalize(question);

  if (
    normalized.includes('lead') ||
    normalized.includes('desqualificado') ||
    normalized.includes('qualidade')
  ) {
    return leadQualityAnswer(context);
  }

  if (
    normalized.includes('vender') ||
    normalized.includes('vendas') ||
    normalized.includes('crescer') ||
    normalized.includes('escala') ||
    normalized.includes('cac') ||
    normalized.includes('custo')
  ) {
    return scaleAnswer(context);
  }

  if (
    normalized.includes('falta') ||
    normalized.includes('resolver') ||
    normalized.includes('bloqueio') ||
    normalized.includes('antes')
  ) {
    return blockersAnswer(context);
  }

  return {
    title: 'Leitura estrategica supervisionada',
    summary:
      'Eu responderia isso olhando primeiro para contexto, qualidade do funil e margem. Ainda nao estou usando IA externa; esta resposta vem do nucleo supervisionado.',
    diagnosis: [
      'Se a pergunta envolve marketing e vendas, a primeira decisao e separar volume de qualidade.',
      'O agente deve proteger margem, capacidade comercial e previsibilidade antes de recomendar mais gasto.',
      'Qualquer hipotese operacional precisa passar por Decision Engine, Rule Validator e aprovacao humana.',
    ],
    actions: [
      'Reescreva a pergunta incluindo objetivo, canal, sintoma, prazo e impacto comercial percebido.',
      'Confira se ha eventos suficientes em /funnel para provar qualidade por origem.',
      'Use /strategy para validar CAC, margem e capacidade antes de criar proposta.',
    ],
    evidence: [
      `Contexto: ${context.businessContext?.completenessScore ?? 0}% completo.`,
      `Nota CMO: ${context.cmoReadiness.score}/100.`,
      `Eventos de funil: ${context.funnelEvents.length}.`,
      `Memorias ativas: ${activeMemories(context.memoryItems).length}.`,
    ],
    nextScreens: [
      {
        label: 'Estrategia CMO',
        href: '/strategy',
        reason: 'Base economica e estrategica.',
      },
      {
        label: 'Funil Real',
        href: '/funnel',
        reason: 'Qualidade por origem e etapa.',
      },
      {
        label: 'Decision Engine',
        href: '/decision',
        reason: 'Transformar conversa em hipotese supervisionada.',
      },
    ],
  };
}

export function buildSupervisedAgentResponse(
  question: string,
  context: AgentChatContext,
): AgentChatResponse {
  return defaultAnswer(question, context);
}

export function formatAgentResponse(response: AgentChatResponse) {
  return [
    `**${response.title}**`,
    response.summary,
    '',
    'Diagnostico:',
    ...response.diagnosis.map((item) => `- ${item}`),
    '',
    'Acoes recomendadas:',
    ...response.actions.map((item) => `- ${item}`),
    '',
    'Evidencias usadas:',
    ...response.evidence.map((item) => `- ${item}`),
  ].join('\n');
}
