import type {
  BusinessContext,
  CompetitorInsight,
  CompetitorProfile,
  ContextAnswer,
  ContextGap,
  ContextMemoryItem,
  ContextQuestion,
  ContextResearchFinding,
  FunnelEvent,
} from '@/lib/domain/types';

type AnswerMap = Map<string, string>;

export type CmoReadinessInput = {
  context: BusinessContext | null;
  questions: ContextQuestion[];
  answers: ContextAnswer[];
  gaps: ContextGap[];
  findings: ContextResearchFinding[];
  competitors: CompetitorProfile[];
  competitorInsights: CompetitorInsight[];
  memoryItems: ContextMemoryItem[];
  funnelEvents: FunnelEvent[];
};

export type FunnelScenario = {
  closeRateLabel: string;
  closeRate: number;
  maxCpl: number;
  leadsNeeded: number;
  withinCapacity: boolean;
};

export type StrategyBlocker = {
  title: string;
  detail: string;
  severity: 'warning' | 'critical';
};

export type ScoreBreakdownItem = {
  label: string;
  score: number;
  maxScore: number;
  status: 'complete' | 'partial' | 'missing';
  action: string;
};

export type CmoReadiness = {
  score: number;
  statusLabel: string;
  verdict: string;
  answerByKey: AnswerMap;
  scoreBreakdown: ScoreBreakdownItem[];
  economics: {
    averageTicket: number | null;
    marginPct: number | null;
    grossProfitPerSale: number | null;
    targetCac: number | null;
    grossAfterCac: number | null;
    monthlyBudget: number | null;
    targetCustomersPerMonth: number | null;
    targetRevenuePerMonth: number | null;
    targetGrossProfitPerMonth: number | null;
    leadCapacityPerDay: number | null;
    leadCapacityPerMonth: number | null;
    salesCycleDays: number | null;
    predictabilityDays: number | null;
  };
  funnelScenarios: FunnelScenario[];
  strategicRules: string[];
  blockers: StrategyBlocker[];
  evidence: {
    contextCompleteness: number;
    activeMemoryCount: number;
    activeCompetitorCount: number;
    reviewedFindingCount: number;
    acceptedCompetitorInsightCount: number;
    openGapCount: number;
    funnelEventCount: number;
    funnelSourceCount: number;
    funnelStageCount: number;
    funnelQualifiedCount: number;
    funnelOpportunityCount: number;
    funnelProposalCount: number;
    funnelSaleWonCount: number;
    funnelValueMarginCount: number;
  };
};

function answerTextByKey(questions: ContextQuestion[], answers: ContextAnswer[]): AnswerMap {
  const questionKeyById = new Map(questions.map((question) => [question.id, question.questionKey]));
  const map: AnswerMap = new Map();

  answers.forEach((answer) => {
    const key = questionKeyById.get(answer.questionId);
    if (key && answer.answerText?.trim()) {
      map.set(key, answer.answerText.trim());
    }
  });

  return map;
}

function extractNumber(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  if (!normalized) {
    return null;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function money(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return 'Nao informado';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return 'Nao informado';
  }

  return `${Number(value.toFixed(1)).toString().replace('.', ',')}%`;
}

function buildFunnelScenarios(
  targetCac: number | null,
  targetCustomersPerMonth: number | null,
  leadCapacityPerMonth: number | null,
): FunnelScenario[] {
  if (!targetCac || !targetCustomersPerMonth || !leadCapacityPerMonth) {
    return [];
  }

  return [0.03, 0.05, 0.1, 0.2].map((closeRate) => {
    const leadsNeeded = Math.ceil(targetCustomersPerMonth / closeRate);
    return {
      closeRateLabel: `${Math.round(closeRate * 100)}%`,
      closeRate,
      maxCpl: targetCac * closeRate,
      leadsNeeded,
      withinCapacity: leadsNeeded <= leadCapacityPerMonth,
    };
  });
}

function buildStrategicRules(answerByKey: AnswerMap, salesCycleDays: number | null) {
  const primaryOffer = answerByKey.get('offer.primary') ?? 'oferta prioritaria';
  const noFit = answerByKey.get('audience.bad_fit') ?? 'perfis sem aderencia comercial';
  const differentiator =
    answerByKey.get('differentiation.main_advantage') ??
    'atendimento tecnico personalizado';

  return [
    `Separar campanhas de compra direta e campanhas consultivas para ${primaryOffer}.`,
    `Bloquear ou despriorizar ${noFit.toLowerCase()} antes de aumentar verba.`,
    `Transformar "${differentiator}" em promessa central de anuncios, landing pages e abordagem comercial.`,
    'Otimizar por cliente qualificado, oportunidade e venda, nao apenas por lead barato.',
    salesCycleDays
      ? `Avaliar performance com janela minima de ${salesCycleDays} dias para respeitar o ciclo comercial.`
      : 'Avaliar performance com janela minima compativel com o ciclo comercial informado.',
  ];
}

function buildScoreBreakdown(input: {
  context: BusinessContext | null;
  economicFields: number;
  activeMemoryCount: number;
  activeCompetitorCount: number;
  reviewedFindingCount: number;
  acceptedCompetitorInsightCount: number;
  openGapCount: number;
  funnelEvents: FunnelEvent[];
}): ScoreBreakdownItem[] {
  const contextScore = Math.min(30, ((input.context?.completenessScore ?? 0) / 100) * 30);
  const economicsScore = (input.economicFields / 5) * 22;
  const researchScore =
    Math.min(input.activeMemoryCount, 4) * 2 +
    Math.min(input.activeCompetitorCount, 4) * 1.25 +
    Math.min(input.reviewedFindingCount, 6) * (5 / 6) +
    Math.min(input.acceptedCompetitorInsightCount, 4);
  const governanceScore = input.openGapCount === 0 ? 12 : 6;
  const funnelStages = new Set(input.funnelEvents.map((event) => event.stage));
  const funnelSources = new Set(input.funnelEvents.map((event) => event.source));
  const hasQualified = funnelStages.has('qualified_lead');
  const hasOpportunity = funnelStages.has('opportunity');
  const hasProposal = funnelStages.has('proposal_sent');
  const hasSaleWon = funnelStages.has('sale_won');
  const hasQualityScore = input.funnelEvents.some(
    (event) => typeof event.leadQualityScore === 'number',
  );
  const hasValueMargin = input.funnelEvents.some(
    (event) => typeof event.dealValueBrl === 'number' && typeof event.grossMarginBrl === 'number',
  );
  const trackingScore =
    (input.funnelEvents.length > 0 ? 2 : 0) +
    (funnelSources.size > 0 ? 2 : 0) +
    (hasQualityScore ? 2 : 0) +
    (hasQualified ? 1 : 0) +
    (hasOpportunity ? 1 : 0) +
    (hasProposal ? 1 : 0) +
    (hasSaleWon ? 2 : 0) +
    (hasValueMargin ? 2 : 0) +
    (funnelSources.size >= 2 ? 1 : 0);

  return [
    {
      label: 'Contexto comercial',
      score: Math.round(contextScore),
      maxScore: 30,
      status: contextScore >= 30 ? 'complete' : contextScore > 0 ? 'partial' : 'missing',
      action:
        contextScore >= 30
          ? 'Todas as respostas essenciais estao preenchidas.'
          : 'Completar perguntas obrigatorias do diagnostico em /context.',
    },
    {
      label: 'Economia e restricoes',
      score: Math.round(economicsScore),
      maxScore: 22,
      status: economicsScore >= 22 ? 'complete' : economicsScore > 0 ? 'partial' : 'missing',
      action:
        economicsScore >= 22
          ? 'Ticket, margem, CAC, budget e capacidade ja permitem guardrails.'
          : 'Informar ticket, margem, CAC alvo, budget mensal e capacidade comercial.',
    },
    {
      label: 'Pesquisa e memoria',
      score: Math.round(researchScore),
      maxScore: 22,
      status: researchScore >= 22 ? 'complete' : researchScore > 0 ? 'partial' : 'missing',
      action:
        researchScore >= 22
          ? 'Achados, concorrentes e memoria ativa ja sustentam a leitura CMO.'
          : 'Revisar achados, ativar memoria e confirmar concorrentes relevantes em /research.',
    },
    {
      label: 'Governanca do contexto',
      score: governanceScore,
      maxScore: 12,
      status: governanceScore >= 12 ? 'complete' : 'partial',
      action:
        governanceScore >= 12
          ? 'Nao ha lacunas abertas impedindo a leitura estrategica.'
          : 'Resolver ou ignorar lacunas antigas e ativar a versao do contexto aprovado.',
    },
    {
      label: 'Tracking e funil real',
      score: trackingScore,
      maxScore: 14,
      status: trackingScore >= 14 ? 'complete' : trackingScore > 0 ? 'partial' : 'missing',
      action:
        trackingScore >= 14
          ? 'Funil real ja tem eventos suficientes para calibrar o Decision Engine supervisionado.'
          : 'Registrar eventos reais de lead qualificado, oportunidade, proposta e venda por origem em /funnel.',
    },
  ];
}

function buildBlockers(input: CmoReadinessInput, answerByKey: AnswerMap): StrategyBlocker[] {
  const blockers: StrategyBlocker[] = [];
  const openGaps = input.gaps.filter((gap) => gap.status === 'open');
  const contextIsActive = input.context?.status === 'active';
  const hasSalesQualityFields =
    Boolean(answerByKey.get('lead_quality.good_signals')) &&
    Boolean(answerByKey.get('lead_quality.bad_signals'));

  if (!contextIsActive) {
    blockers.push({
      title: 'Contexto ainda em draft',
      detail:
        'O diagnostico esta completo, mas ainda precisa virar versao ativa antes de orientar propostas automaticas.',
      severity: 'warning',
    });
  }

  if (openGaps.length > 0) {
    blockers.push({
      title: `${openGaps.length} lacuna(s) aberta(s)`,
      detail:
        'Revisar lacunas antigas e resolver o que ja foi concluido para nao bloquear o Decision Engine indevidamente.',
      severity: 'warning',
    });
  }

  if (!hasSalesQualityFields) {
    blockers.push({
      title: 'Sinais de lead incompletos',
      detail:
        'Sem sinais de lead bom e ruim, o agente pode confundir volume barato com crescimento de qualidade.',
      severity: 'critical',
    });
  }

  const funnelStages = new Set(input.funnelEvents.map((event) => event.stage));
  const hasSaleWon = funnelStages.has('sale_won');
  const hasPipeline =
    funnelStages.has('qualified_lead') &&
    funnelStages.has('opportunity') &&
    funnelStages.has('proposal_sent');

  if (input.funnelEvents.length === 0) {
    blockers.push({
      title: 'Tracking de qualidade e venda ainda pendente',
      detail:
        'Antes de escalar midia, registre eventos reais em /funnel para diferenciar lead, oportunidade, proposta e venda fechada.',
      severity: 'critical',
    });
  } else if (!hasPipeline || !hasSaleWon) {
    blockers.push({
      title: 'Funil real ainda incompleto',
      detail:
        'Ja existem eventos de funil, mas ainda falta cobrir a cadeia de qualificado, oportunidade, proposta e venda ganha.',
      severity: 'warning',
    });
  }

  return blockers;
}

export function buildCmoReadiness(input: CmoReadinessInput): CmoReadiness {
  const answerByKey = answerTextByKey(input.questions, input.answers);
  const averageTicket = extractNumber(answerByKey.get('economics.average_ticket'));
  const marginPct = extractNumber(answerByKey.get('economics.margin'));
  const targetCac = extractNumber(answerByKey.get('goals.target_cpa'));
  const monthlyBudget = extractNumber(answerByKey.get('constraints.budget'));
  const leadCapacityPerDay = extractNumber(answerByKey.get('capacity.delivery_capacity'));
  const salesCycleDays = extractNumber(answerByKey.get('sales_process.sales_cycle'));
  const predictabilityDays = extractNumber(answerByKey.get('predictability.expected_level'));

  const grossProfitPerSale =
    averageTicket !== null && marginPct !== null ? averageTicket * (marginPct / 100) : null;
  const grossAfterCac =
    grossProfitPerSale !== null && targetCac !== null ? grossProfitPerSale - targetCac : null;
  const targetCustomersPerMonth =
    monthlyBudget !== null && targetCac ? monthlyBudget / targetCac : null;
  const targetRevenuePerMonth =
    targetCustomersPerMonth !== null && averageTicket !== null
      ? targetCustomersPerMonth * averageTicket
      : null;
  const targetGrossProfitPerMonth =
    targetCustomersPerMonth !== null && grossProfitPerSale !== null
      ? targetCustomersPerMonth * grossProfitPerSale
      : null;
  const leadCapacityPerMonth =
    leadCapacityPerDay !== null ? Math.round(leadCapacityPerDay * 30) : null;

  const economicFields = [
    averageTicket,
    marginPct,
    targetCac,
    monthlyBudget,
    leadCapacityPerDay,
  ].filter((value) => value !== null).length;
  const activeMemoryCount = input.memoryItems.filter((item) => item.status === 'active').length;
  const activeCompetitorCount = input.competitors.filter(
    (competitor) => competitor.status === 'active',
  ).length;
  const reviewedFindingCount = input.findings.filter((finding) =>
    ['accepted', 'converted_to_context', 'converted_to_memory'].includes(finding.reviewStatus),
  ).length;
  const acceptedCompetitorInsightCount = input.competitorInsights.filter((insight) =>
    ['accepted', 'converted_to_context', 'converted_to_memory'].includes(insight.reviewStatus),
  ).length;
  const openGapCount = input.gaps.filter((gap) => gap.status === 'open').length;
  const funnelSources = new Set(input.funnelEvents.map((event) => event.source));
  const funnelStages = new Set(input.funnelEvents.map((event) => event.stage));
  const funnelQualifiedCount = input.funnelEvents.filter(
    (event) => event.stage === 'qualified_lead',
  ).length;
  const funnelOpportunityCount = input.funnelEvents.filter(
    (event) => event.stage === 'opportunity',
  ).length;
  const funnelProposalCount = input.funnelEvents.filter(
    (event) => event.stage === 'proposal_sent',
  ).length;
  const funnelSaleWonCount = input.funnelEvents.filter(
    (event) => event.stage === 'sale_won',
  ).length;
  const funnelValueMarginCount = input.funnelEvents.filter(
    (event) => typeof event.dealValueBrl === 'number' && typeof event.grossMarginBrl === 'number',
  ).length;

  const scoreBreakdown = buildScoreBreakdown({
    context: input.context,
    economicFields,
    activeMemoryCount,
    activeCompetitorCount,
    reviewedFindingCount,
    acceptedCompetitorInsightCount,
    openGapCount,
    funnelEvents: input.funnelEvents,
  });
  const score = scoreBreakdown.reduce((total, item) => total + item.score, 0);

  return {
    score,
    statusLabel: score >= 80 ? 'Pronto para estrategia' : 'Precisa de ajuste',
    verdict:
      score >= 80
        ? 'A base estrategica esta forte para orientar o Decision Engine supervisionado, mas a execucao automatica de Ads deve continuar bloqueada ate o tracking de qualidade e venda estar fechado.'
        : 'Ainda faltam insumos para o agente decidir com seguranca estrategica.',
    answerByKey,
    scoreBreakdown,
    economics: {
      averageTicket,
      marginPct,
      grossProfitPerSale,
      targetCac,
      grossAfterCac,
      monthlyBudget,
      targetCustomersPerMonth,
      targetRevenuePerMonth,
      targetGrossProfitPerMonth,
      leadCapacityPerDay,
      leadCapacityPerMonth,
      salesCycleDays,
      predictabilityDays,
    },
    funnelScenarios: buildFunnelScenarios(
      targetCac,
      targetCustomersPerMonth,
      leadCapacityPerMonth,
    ),
    strategicRules: buildStrategicRules(answerByKey, salesCycleDays),
    blockers: buildBlockers(input, answerByKey),
    evidence: {
      contextCompleteness: input.context?.completenessScore ?? 0,
      activeMemoryCount,
      activeCompetitorCount,
      reviewedFindingCount,
      acceptedCompetitorInsightCount,
      openGapCount,
      funnelEventCount: input.funnelEvents.length,
      funnelSourceCount: funnelSources.size,
      funnelStageCount: funnelStages.size,
      funnelQualifiedCount,
      funnelOpportunityCount,
      funnelProposalCount,
      funnelSaleWonCount,
      funnelValueMarginCount,
    },
  };
}

export const formatStrategyMoney = money;
export const formatStrategyPct = pct;
