import type {
  BusinessContext,
  CompetitorInsight,
  CompetitorProfile,
  ContextAnswer,
  ContextGap,
  ContextMemoryItem,
  ContextQuestion,
  ContextResearchFinding,
  DataTrustState,
  FunnelEvent,
} from '@/lib/domain/types';
import type { CmoReadiness } from '@/lib/strategy/cmo-readiness';

type AnswerMap = Map<string, string>;

export type DecisionGateStatus = 'passed' | 'warning' | 'blocked';

export type DecisionGate = {
  id: string;
  title: string;
  status: DecisionGateStatus;
  detail: string;
  action: string;
  evidence: string;
};

export type DecisionHypothesis = {
  id: string;
  title: string;
  confidence: number;
  rationale: string;
  guardrail: string;
  nextAction: string;
};

export type DecisionEngineStatus =
  | 'blocked'
  | 'almost_ready'
  | 'ready_for_supervised_proposals';

export type DecisionReadinessInput = {
  context: BusinessContext | null;
  questions: ContextQuestion[];
  answers: ContextAnswer[];
  gaps: ContextGap[];
  findings: ContextResearchFinding[];
  competitors: CompetitorProfile[];
  competitorInsights: CompetitorInsight[];
  memoryItems: ContextMemoryItem[];
  funnelEvents: FunnelEvent[];
  dataTrustState: DataTrustState;
  cmoReadiness: CmoReadiness;
};

export type DecisionReadiness = {
  status: DecisionEngineStatus;
  statusLabel: string;
  verdict: string;
  readinessScore: number;
  canGenerateSupervisedProposals: boolean;
  canExecuteAds: false;
  operatingMode: 'SUPERVISED_DRY_RUN';
  gates: DecisionGate[];
  blockers: DecisionGate[];
  warnings: DecisionGate[];
  hypotheses: DecisionHypothesis[];
  evidence: {
    contextCompleteness: number;
    activeMemoryCount: number;
    activeCompetitorCount: number;
    reviewedFindingCount: number;
    acceptedInsightCount: number;
    openCriticalGapCount: number;
    openGapCount: number;
    funnelEventCount: number;
    funnelStageCount: number;
    funnelSourceCount: number;
    saleWonCount: number;
    saleWithMarginCount: number;
    dataTrustStatus: string;
    cmoReadinessScore: number;
  };
};

function answerTextByKey(questions: ContextQuestion[], answers: ContextAnswer[]): AnswerMap {
  const keyById = new Map(questions.map((question) => [question.id, question.questionKey]));
  const map: AnswerMap = new Map();

  answers.forEach((answer) => {
    const key = keyById.get(answer.questionId);
    if (key && answer.answerText?.trim()) {
      map.set(key, answer.answerText.trim());
    }
  });

  return map;
}

function gateWeight(status: DecisionGateStatus) {
  if (status === 'passed') return 1;
  if (status === 'warning') return 0.5;
  return 0;
}

function reviewed(status: string) {
  return ['accepted', 'converted_to_context', 'converted_to_memory'].includes(status);
}

function buildGates(input: DecisionReadinessInput): DecisionGate[] {
  const activeMemoryCount = input.memoryItems.filter((item) => item.status === 'active').length;
  const activeCompetitorCount = input.competitors.filter(
    (competitor) => competitor.status === 'active',
  ).length;
  const reviewedFindingCount = input.findings.filter((finding) =>
    reviewed(finding.reviewStatus),
  ).length;
  const acceptedInsightCount = input.competitorInsights.filter((insight) =>
    reviewed(insight.reviewStatus),
  ).length;
  const openGaps = input.gaps.filter((gap) => gap.status === 'open');
  const criticalGaps = openGaps.filter((gap) => gap.severity === 'critical');
  const funnelStages = new Set(input.funnelEvents.map((event) => event.stage));
  const funnelSources = new Set(input.funnelEvents.map((event) => event.source));
  const hasCorePipeline =
    funnelStages.has('qualified_lead') &&
    funnelStages.has('opportunity') &&
    funnelStages.has('proposal_sent');
  const saleWonCount = input.funnelEvents.filter((event) => event.stage === 'sale_won').length;
  const saleWithMarginCount = input.funnelEvents.filter(
    (event) => event.stage === 'sale_won' && typeof event.grossMarginBrl === 'number',
  ).length;

  return [
    {
      id: 'context-active',
      title: 'Contexto comercial ativo',
      status:
        input.context?.status === 'active' && input.context.completenessScore >= 90
          ? 'passed'
          : input.context && input.context.completenessScore >= 75
            ? 'warning'
            : 'blocked',
      detail:
        'O cerebro do agente so pode propor quando entende oferta, publico, economia, capacidade e restricoes.',
      action:
        input.context?.status === 'active'
          ? 'Completar respostas restantes em /context para aumentar a confianca.'
          : 'Ativar o diagnostico validado em /strategy antes de gerar propostas.',
      evidence: `${input.context?.completenessScore ?? 0}% completo, status ${input.context?.status ?? 'ausente'}.`,
    },
    {
      id: 'context-governance',
      title: 'Lacunas criticas resolvidas',
      status:
        criticalGaps.length === 0 && openGaps.length === 0
          ? 'passed'
          : criticalGaps.length === 0
            ? 'warning'
            : 'blocked',
      detail:
        'Lacunas abertas viram risco de decisao porque podem esconder margem, no-fit, sazonalidade ou capacidade.',
      action:
        criticalGaps.length > 0
          ? 'Resolver lacunas criticas em /context ou /strategy.'
          : 'Revisar lacunas nao criticas e manter apenas o que ainda for risco real.',
      evidence: `${criticalGaps.length} critica(s), ${openGaps.length} aberta(s).`,
    },
    {
      id: 'research-memory',
      title: 'Pesquisa e memoria revisadas',
      status:
        activeMemoryCount >= 2 && activeCompetitorCount >= 2 && reviewedFindingCount >= 4
          ? 'passed'
          : activeMemoryCount > 0 && reviewedFindingCount > 0
            ? 'warning'
            : 'blocked',
      detail:
        'O agente usa apenas achados aceitos, concorrentes ativos e memoria contextual revisada.',
      action:
        'Revisar achados, ativar memorias e confirmar concorrentes em /research antes de confiar em hipoteses.',
      evidence: `${activeMemoryCount} memoria(s), ${activeCompetitorCount} concorrente(s), ${reviewedFindingCount} achado(s), ${acceptedInsightCount} insight(s).`,
    },
    {
      id: 'funnel-truth',
      title: 'Funil real minimo',
      status:
        hasCorePipeline && saleWonCount > 0 && saleWithMarginCount > 0
          ? 'passed'
          : input.funnelEvents.length > 0
            ? 'warning'
            : 'blocked',
      detail:
        'Sem CRM/funil, o agente pode otimizar lead barato em vez de venda com margem.',
      action:
        'Registrar em /funnel lead qualificado, oportunidade, proposta, venda ganha, origem e margem.',
      evidence: `${input.funnelEvents.length} evento(s), ${funnelStages.size} etapa(s), ${funnelSources.size} origem(ns), ${saleWithMarginCount} venda(s) com margem.`,
    },
    {
      id: 'cmo-readiness',
      title: 'Prontidao CMO validada',
      status:
        input.cmoReadiness.score >= 90
          ? 'passed'
          : input.cmoReadiness.score >= 80
            ? 'warning'
            : 'blocked',
      detail:
        'A leitura CMO consolida economia, ICP, pesquisa, governanca e tracking antes de qualquer proposta.',
      action:
        'Resolver os pontos abertos em /strategy ate a base ficar forte o suficiente para recomendacoes supervisionadas.',
      evidence: `${input.cmoReadiness.score}/100 em /strategy; ${input.cmoReadiness.blockers.length} bloqueio(s) estrategico(s).`,
    },
    {
      id: 'data-trust',
      title: 'Data Trust sem bloqueio vermelho',
      status:
        input.dataTrustState.overallStatus === 'green'
          ? 'passed'
          : input.dataTrustState.overallStatus === 'yellow'
            ? 'warning'
            : 'blocked',
      detail:
        'Fontes com erro vermelho impedem recomendacao operacional porque os numeros podem estar errados.',
      action:
        input.dataTrustState.overallStatus === 'red'
          ? 'Corrigir fontes vermelhas em /data-trust antes de gerar proposta.'
          : 'Manter alertas amarelos visiveis nas recomendacoes.',
      evidence: `Status ${input.dataTrustState.overallStatus}; ${input.dataTrustState.sources.length} fonte(s) cadastrada(s).`,
    },
    {
      id: 'supervision',
      title: 'Execucao externa bloqueada',
      status: 'passed',
      detail:
        'Nesta etapa, o Decision Engine nao chama Google Ads, Meta Ads ou qualquer MCP de escrita.',
      action:
        'Manter modo supervisionado ate rule_validator, aprovacao humana e dry-run de execucao ficarem prontos.',
      evidence: 'Modo SUPERVISED_DRY_RUN, sem MCP e sem escrita externa.',
    },
  ];
}

function buildHypotheses(input: DecisionReadinessInput, answerByKey: AnswerMap): DecisionHypothesis[] {
  const noFit = answerByKey.get('audience.bad_fit') ?? 'leads sem aderencia industrial';
  const primaryOffer =
    answerByKey.get('offer.primary') ?? 'motores, motorredutores e automacao industrial';
  const differentiator =
    answerByKey.get('differentiation.main_advantage') ??
    'especializacao tecnica e atendimento consultivo';
  const hasMarketplaceSignal = input.findings.some((finding) =>
    `${finding.finding} ${finding.title}`.toLowerCase().includes('marketplace'),
  );

  const hypotheses: DecisionHypothesis[] = [
    {
      id: 'separate-intent',
      title: 'Separar compra direta de venda consultiva',
      confidence: 86,
      rationale:
        `A oferta ${primaryOffer} tende a misturar busca de produto padronizado com demanda tecnica de especificacao.`,
      guardrail:
        'Nao comparar CPL de ecommerce simples com lead consultivo; medir qualidade, oportunidade e margem separadamente.',
      nextAction:
        'Criar propostas futuras separando campanhas, landing pages e criterios de sucesso por intencao.',
    },
    {
      id: 'optimize-for-margin',
      title: 'Otimizar por margem, nao por volume de lead',
      confidence: 84,
      rationale:
        'O funil real ja esta sendo alimentado para distinguir lead, oportunidade, proposta e venda ganha.',
      guardrail:
        'Bloquear aumento de verba quando venda ganha ou margem estiver ausente, mesmo que o CPL pareca barato.',
      nextAction:
        'Usar vendas com margem em /funnel como evidencia minima antes de escala.',
    },
    {
      id: 'block-no-fit',
      title: 'Transformar no-fit em regra de exclusao',
      confidence: 80,
      rationale:
        `Perfis como ${noFit.toLowerCase()} devem reduzir previsibilidade e consumir atendimento.`,
      guardrail:
        'Toda proposta deve explicar como evita no-fit antes de sugerir verba nova.',
      nextAction:
        'Converter sinais de lead ruim em regra do futuro rule_validator.',
    },
    {
      id: 'message-differentiator',
      title: 'Usar diferencial tecnico como promessa central',
      confidence: 78,
      rationale:
        `A pesquisa e o diagnostico apontam ${differentiator.toLowerCase()} como alavanca de conversao qualificada.`,
      guardrail:
        'Testes criativos devem preservar clareza tecnica e evitar promessa generica de preco baixo.',
      nextAction:
        'Gerar propostas de mensagem primeiro em dry-run, sem tocar contas reais.',
    },
  ];

  if (hasMarketplaceSignal) {
    hypotheses.push({
      id: 'marketplace-channel-split',
      title: 'Separar canais proprietarios de marketplaces',
      confidence: 74,
      rationale:
        'A memoria contextual indica presenca em loja oficial, atendimento especialista e marketplaces.',
      guardrail:
        'Nao misturar margem e objetivo comercial de marketplace com site/WhatsApp.',
      nextAction:
        'Marcar origem de cada evento em /funnel para comparar qualidade por canal.',
    });
  }

  return hypotheses;
}

export function buildDecisionReadiness(input: DecisionReadinessInput): DecisionReadiness {
  const answerByKey = answerTextByKey(input.questions, input.answers);
  const gates = buildGates(input);
  const blockers = gates.filter((gate) => gate.status === 'blocked');
  const warnings = gates.filter((gate) => gate.status === 'warning');
  const readinessScore = Math.round(
    (gates.reduce((total, gate) => total + gateWeight(gate.status), 0) / gates.length) * 100,
  );
  const funnelStages = new Set(input.funnelEvents.map((event) => event.stage));
  const funnelSources = new Set(input.funnelEvents.map((event) => event.source));
  const activeMemoryCount = input.memoryItems.filter((item) => item.status === 'active').length;
  const activeCompetitorCount = input.competitors.filter(
    (competitor) => competitor.status === 'active',
  ).length;
  const reviewedFindingCount = input.findings.filter((finding) =>
    reviewed(finding.reviewStatus),
  ).length;
  const acceptedInsightCount = input.competitorInsights.filter((insight) =>
    reviewed(insight.reviewStatus),
  ).length;
  const openGaps = input.gaps.filter((gap) => gap.status === 'open');
  const openCriticalGapCount = openGaps.filter((gap) => gap.severity === 'critical').length;
  const saleWonCount = input.funnelEvents.filter((event) => event.stage === 'sale_won').length;
  const saleWithMarginCount = input.funnelEvents.filter(
    (event) => event.stage === 'sale_won' && typeof event.grossMarginBrl === 'number',
  ).length;

  let status: DecisionEngineStatus = 'blocked';
  if (blockers.length === 0 && warnings.length === 0) {
    status = 'ready_for_supervised_proposals';
  } else if (blockers.length === 0) {
    status = 'almost_ready';
  }

  const canGenerateSupervisedProposals = status !== 'blocked';

  return {
    status,
    statusLabel:
      status === 'ready_for_supervised_proposals'
        ? 'Pronto para propostas supervisionadas'
        : status === 'almost_ready'
          ? 'Quase pronto'
          : 'Bloqueado',
    verdict:
      status === 'ready_for_supervised_proposals'
        ? 'O agente pode comecar a gerar propostas supervisionadas em dry-run. Ainda nao ha execucao externa.'
        : status === 'almost_ready'
          ? 'A base nao tem bloqueio critico, mas ainda ha alertas que devem aparecer em qualquer proposta.'
          : 'O agente ainda nao deve gerar propostas. Resolva os gates bloqueados antes do proximo passo.',
    readinessScore,
    canGenerateSupervisedProposals,
    canExecuteAds: false,
    operatingMode: 'SUPERVISED_DRY_RUN',
    gates,
    blockers,
    warnings,
    hypotheses: buildHypotheses(input, answerByKey),
    evidence: {
      contextCompleteness: input.context?.completenessScore ?? 0,
      activeMemoryCount,
      activeCompetitorCount,
      reviewedFindingCount,
      acceptedInsightCount,
      openCriticalGapCount,
      openGapCount: openGaps.length,
      funnelEventCount: input.funnelEvents.length,
      funnelStageCount: funnelStages.size,
      funnelSourceCount: funnelSources.size,
      saleWonCount,
      saleWithMarginCount,
      dataTrustStatus: input.dataTrustState.overallStatus,
      cmoReadinessScore: input.cmoReadiness.score,
    },
  };
}
