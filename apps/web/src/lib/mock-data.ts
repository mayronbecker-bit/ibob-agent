import type {
  Client,
  User,
  AgentVersion,
  AgentState,
  DataTrustState,
  BusinessContext,
  ContextQuestion,
  ContextAnswer,
  ContextGap,
  ContextResearchRun,
  ContextResearchSource,
  ContextResearchFinding,
  CompetitorProfile,
  CompetitorInsight,
  ContextMemoryItem,
  FunnelEvent,
  FunnelTrackingRequirement,
  Proposal,
  Approval,
  DecisionMemory,
  AuditEvent,
  RoadmapStage,
  OverviewMetric,
} from '@/lib/domain/types';

// ── Active client reference ───────────────────────────────────────────────────
const CLIENT_ID = 'client-ibob';

// ── Client & users ────────────────────────────────────────────────────────────

export const mockClient: Client = {
  id: CLIENT_ID,
  name: 'iBob',
  slug: 'ibob',
  status: 'active',
  plan: 'pilot',
  createdAt: '2026-05-12T00:00:00-03:00',
};

export const mockUsers: User[] = [
  {
    id: 'user-mayron',
    clientId: CLIENT_ID,
    name: 'Mayron',
    email: 'mayron.becker@gmail.com',
    role: 'admin',
  },
  {
    id: 'user-cassiano',
    clientId: CLIENT_ID,
    name: 'Cassiano',
    email: 'cassiano@ibob.com.br',
    role: 'approver',
  },
];

// ── Agent version ─────────────────────────────────────────────────────────────

export const mockAgentVersion: AgentVersion = {
  version: '0.1.0',
  releasedAt: '2026-05-12T00:00:00-03:00',
  promptVersion: 'v1.0',
  thresholdVersion: 'v1.0',
  changelog: 'MVP local — dados mockados, sem integrações reais, DRY_RUN ativo.',
  isActive: true,
};

// ── Data Trust State ──────────────────────────────────────────────────────────

export const dataTrustState: DataTrustState = {
  clientId: CLIENT_ID,
  overallStatus: 'yellow',
  checkedAt: '2026-05-12T14:30:00-03:00',
  sources: [
    {
      id: 'google-ads',
      clientId: CLIENT_ID,
      name: 'Google Ads API',
      type: 'google_ads',
      status: 'green',
      lastSync: '2026-05-12T14:18:00-03:00',
    },
    {
      id: 'meta-ads',
      clientId: CLIENT_ID,
      name: 'Meta Marketing API',
      type: 'meta_ads',
      status: 'yellow',
      lastSync: '2026-05-12T12:15:00-03:00',
      issue:
        'Latência elevada. Última sincronização há 2h15min. Dados podem estar desatualizados.',
    },
    {
      id: 'ga4',
      clientId: CLIENT_ID,
      name: 'GA4 / Analytics',
      type: 'ga4',
      status: 'green',
      lastSync: '2026-05-12T14:25:00-03:00',
    },
    {
      id: 'orbita',
      clientId: CLIENT_ID,
      name: 'Orbita (margem)',
      type: 'custom',
      status: 'green',
      lastSync: '2026-05-12T13:30:00-03:00',
    },
    {
      id: 'crm',
      clientId: CLIENT_ID,
      name: 'CRM / Leads',
      type: 'crm',
      status: 'green',
      lastSync: '2026-05-12T14:00:00-03:00',
    },
  ],
  blockingReason:
    'Meta Ads com dados possivelmente desatualizados. Propostas que dependem de Meta serão sinalizadas com aviso.',
};

// ── Agent State (derived from Data Trust State) ───────────────────────────────

export const mockAgentState: AgentState = {
  clientId: CLIENT_ID,
  status: dataTrustState.overallStatus,
  mode: 'DRY_RUN',
  checkedAt: dataTrustState.checkedAt,
  blockingReason: dataTrustState.blockingReason,
  agentVersion: mockAgentVersion.version,
};

// ── Context Intelligence ─────────────────────────────────────────────────────

export const mockBusinessContext: BusinessContext = {
  id: 'ctx-ibob',
  clientId: CLIENT_ID,
  name: 'Contexto comercial iBob',
  status: 'draft',
  summary:
    'Contexto comercial inicial da iBob. Aguardando migracao das respostas ja levantadas para estrutura versionada.',
  completenessScore: 21.05,
  createdAt: '2026-05-19T13:30:00-03:00',
  updatedAt: '2026-05-19T13:30:00-03:00',
};

export const contextQuestions: ContextQuestion[] = [
  {
    id: 'q-offer-primary',
    questionKey: 'offer.primary',
    category: 'offer',
    question: 'Qual e a oferta principal que mais precisa vender agora?',
    intent: 'Identificar o foco comercial antes de otimizar campanhas.',
    answerType: 'text',
    required: true,
    sortOrder: 10,
    options: [],
    isActive: true,
    createdAt: '2026-05-19T13:30:00-03:00',
    updatedAt: '2026-05-19T13:30:00-03:00',
  },
  {
    id: 'q-economics-average-ticket',
    questionKey: 'economics.average_ticket',
    category: 'economics',
    question: 'Qual e o ticket medio por venda?',
    intent: 'Definir limites economicos para CPA, CAC e ROAS.',
    answerType: 'currency',
    required: true,
    sortOrder: 30,
    options: [],
    isActive: true,
    createdAt: '2026-05-19T13:30:00-03:00',
    updatedAt: '2026-05-19T13:30:00-03:00',
  },
  {
    id: 'q-audience-ideal-customer',
    questionKey: 'audience.ideal_customer',
    category: 'audience',
    question: 'Quem e o cliente ideal?',
    intent: 'Direcionar recomendacoes para qualidade, nao apenas volume.',
    answerType: 'text',
    required: true,
    sortOrder: 50,
    options: [],
    isActive: true,
    createdAt: '2026-05-19T13:30:00-03:00',
    updatedAt: '2026-05-19T13:30:00-03:00',
  },
  {
    id: 'q-capacity-delivery',
    questionKey: 'capacity.delivery_capacity',
    category: 'capacity',
    question: 'Qual capacidade de atendimento ou entrega existe hoje?',
    intent: 'Impedir escala de Ads acima da capacidade operacional.',
    answerType: 'text',
    required: true,
    sortOrder: 110,
    options: [],
    isActive: true,
    createdAt: '2026-05-19T13:30:00-03:00',
    updatedAt: '2026-05-19T13:30:00-03:00',
  },
  {
    id: 'q-goals-primary-metric',
    questionKey: 'goals.primary_metric',
    category: 'goals',
    question:
      'Qual metrica guia crescimento: CAC, CPA, ROAS, margem, receita ou leads qualificados?',
    intent: 'Definir a funcao objetivo do agente.',
    answerType: 'single_choice',
    required: true,
    sortOrder: 120,
    options: ['CAC', 'CPA', 'ROAS', 'Margem', 'Receita', 'Leads qualificados', 'Outro'],
    isActive: true,
    createdAt: '2026-05-19T13:30:00-03:00',
    updatedAt: '2026-05-19T13:30:00-03:00',
  },
];

export const contextAnswers: ContextAnswer[] = [
  {
    id: 'ans-offer-primary',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    questionId: 'q-offer-primary',
    answerText: 'Oferta principal em estruturacao para validacao comercial da iBob.',
    answerValue: { value: 'Oferta principal em estruturacao para validacao comercial da iBob.' },
    confidence: 80,
    source: 'manual_review',
    createdAt: '2026-05-19T13:35:00-03:00',
    updatedAt: '2026-05-19T13:35:00-03:00',
  },
];

export const contextGaps: ContextGap[] = [
  {
    id: 'gap-context-answers-pending',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    gapKey: 'ibob.context_answers_pending',
    severity: 'warning',
    status: 'open',
    description:
      'O contexto comercial ja levantado da iBob ainda precisa ser migrado para respostas versionadas.',
    recommendation:
      'Migrar as respostas existentes para context_answers antes de liberar Decision Engine supervisionado.',
    createdAt: '2026-05-19T13:30:00-03:00',
    updatedAt: '2026-05-19T13:30:00-03:00',
  },
];

// ── Funnel Tracking ─────────────────────────────────────────────────────────

export const funnelTrackingRequirements: FunnelTrackingRequirement[] = [
  {
    id: 'req-funnel-required-fields',
    title: 'Campos obrigatorios',
    description:
      'Toda linha precisa ter data, etapa, origem, empresa/contato e observacao comercial.',
    status: 'missing',
    impactPoints: 2,
  },
  {
    id: 'req-funnel-stage',
    title: 'Etapa do funil',
    description:
      'Classificar cada registro como lead, qualificado, oportunidade, proposta, venda ou desqualificado.',
    status: 'missing',
    impactPoints: 2,
  },
  {
    id: 'req-funnel-source',
    title: 'Origem preservada',
    description:
      'Guardar a origem/campanha quando existir: Google, Meta, WhatsApp, organico, marketplace ou direto.',
    status: 'missing',
    impactPoints: 1,
  },
  {
    id: 'req-funnel-value-margin',
    title: 'Valor e margem',
    description:
      'Registrar valor e margem bruta nas vendas para o agente otimizar por lucro, nao so por lead.',
    status: 'missing',
    impactPoints: 1,
  },
  {
    id: 'req-funnel-first-import',
    title: 'Primeira importacao manual',
    description:
      'Importar uma amostra revisada antes de conectar Google, Meta, GA4 ou CRM por API.',
    status: 'planned',
    impactPoints: 1,
  },
];

export const funnelEventExamples: FunnelEvent[] = [
  {
    id: 'funnel-example-qualified',
    clientId: CLIENT_ID,
    stage: 'qualified_lead',
    source: 'whatsapp',
    companyName: 'Exemplo Maquinas Industriais',
    campaignName: 'Consulta tecnica motorredutor acima de 10cv',
    leadQualityScore: 85,
    occurredAt: '2026-05-24T10:00:00-03:00',
    notes: 'Fabricante de maquina sob demanda, decisor envolvido e demanda tecnica compativel.',
  },
  {
    id: 'funnel-example-sale',
    clientId: CLIENT_ID,
    stage: 'sale_won',
    source: 'google_ads',
    companyName: 'Exemplo Equipamentos Ltda',
    campaignName: 'Search motorredutor industrial',
    leadQualityScore: 92,
    dealValueBrl: 15000,
    grossMarginBrl: 2250,
    occurredAt: '2026-05-24T11:30:00-03:00',
    notes: 'Venda exemplo para demonstrar estrutura de tracking offline.',
  },
];

export const contextResearchRuns: ContextResearchRun[] = [
  {
    id: 'research-run-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    status: 'needs_review',
    companyUrl: 'https://www.ibob.com.br',
    searchQuery: 'iBob empresa site oficial concorrentes posicionamento ofertas diferenciais',
    scope: {
      company_site: true,
      company_store: true,
      competitor_discovery: true,
      competitor_sites: true,
      ads_execution: false,
      requires_human_review: true,
    },
    summary:
      'Pesquisa publica inicial preparada com fontes do site oficial, loja oficial e concorrentes candidatos. Achados permanecem pendentes de revisao humana.',
    startedAt: '2026-05-20T10:00:00-03:00',
    completedAt: '2026-05-20T10:10:00-03:00',
    createdAt: '2026-05-19T16:30:00-03:00',
    updatedAt: '2026-05-20T10:10:00-03:00',
  },
];

export const contextResearchSources: ContextResearchSource[] = [
  {
    id: 'source-ibob-site',
    researchRunId: 'research-run-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    sourceType: 'company_site',
    title: 'iBob - Motores eletricos, motorredutores e automacao industrial',
    url: 'https://ibob.com.br/',
    publisher: 'iBob',
    accessedAt: '2026-05-20T10:00:00-03:00',
    snippet:
      'Site oficial posiciona a iBob como loja online especializada em motores eletricos, motorredutores e automacao industrial para todo o Brasil.',
    metadata: { role: 'official_company_site' },
    createdAt: '2026-05-20T10:00:00-03:00',
    updatedAt: '2026-05-20T10:00:00-03:00',
  },
  {
    id: 'source-ibob-store',
    researchRunId: 'research-run-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    sourceType: 'company_site',
    title: 'Loja oficial iBob',
    url: 'https://loja.ibob.com.br/',
    publisher: 'iBob',
    accessedAt: '2026-05-20T10:01:00-03:00',
    snippet:
      'Loja oficial apresenta catalogo de motores eletricos, redutores e automacao industrial com compra online e atendimento por WhatsApp.',
    metadata: { role: 'official_store' },
    createdAt: '2026-05-20T10:01:00-03:00',
    updatedAt: '2026-05-20T10:01:00-03:00',
  },
  {
    id: 'source-lotus',
    researchRunId: 'research-run-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    sourceType: 'competitor_site',
    title: 'Lotus Automacao',
    url: 'https://lotusautomacao.com.br/',
    publisher: 'Lotus Automacao',
    accessedAt: '2026-05-20T10:02:00-03:00',
    snippet:
      'Distribuidora de produtos eletricos e automacao industrial, com catalogo de produtos WEG e pedido por orcamento.',
    metadata: { role: 'competitor_candidate' },
    createdAt: '2026-05-20T10:02:00-03:00',
    updatedAt: '2026-05-20T10:02:00-03:00',
  },
  {
    id: 'source-hercules',
    researchRunId: 'research-run-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    sourceType: 'competitor_site',
    title: 'Hercules Motores - Motorredutores',
    url: 'https://loja.herculesmotores.com.br/motorredutores.html',
    publisher: 'Hercules Motores',
    accessedAt: '2026-05-20T10:03:00-03:00',
    snippet:
      'Loja direta de fabrica para motorredutores, com suporte tecnico, customizacao, condicoes comerciais e entrega nacional.',
    metadata: { role: 'competitor_candidate' },
    createdAt: '2026-05-20T10:03:00-03:00',
    updatedAt: '2026-05-20T10:03:00-03:00',
  },
  {
    id: 'source-varivelox',
    researchRunId: 'research-run-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    sourceType: 'competitor_site',
    title: 'Varivelox Industrial',
    url: 'https://www.varivelox.com.br/',
    publisher: 'Varivelox',
    accessedAt: '2026-05-20T10:04:00-03:00',
    snippet:
      'Fabricante brasileira de motores, motovibradores e motorredutores eletricos de inducao monofasico e trifasico.',
    metadata: { role: 'competitor_candidate' },
    createdAt: '2026-05-20T10:04:00-03:00',
    updatedAt: '2026-05-20T10:04:00-03:00',
  },
];

export const contextResearchFindings: ContextResearchFinding[] = [
  {
    id: 'finding-positioning',
    researchRunId: 'research-run-ibob-site',
    sourceId: 'source-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    findingType: 'positioning',
    title: 'Referencia nacional em motores e automacao',
    finding:
      'A iBob deve ser tratada como loja online especializada e operacao nacional para motores eletricos, motorredutores, inversores e automacao industrial.',
    evidence:
      'Fonte oficial informa foco em motores eletricos, motorredutores e automacao industrial para todo o Brasil.',
    confidence: 86,
    reviewStatus: 'needs_review',
    suggestedAnswerText:
      'Posicionar a iBob como operacao nacional especializada em motores eletricos, motorredutores, inversores e automacao industrial.',
    metadata: { suggested_use: 'context_answer_or_positioning_memory' },
    createdAt: '2026-05-20T10:05:00-03:00',
    updatedAt: '2026-05-20T10:05:00-03:00',
  },
  {
    id: 'finding-sales-process',
    researchRunId: 'research-run-ibob-site',
    sourceId: 'source-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    findingType: 'sales_process',
    title: 'Operacao hibrida: compra online e venda consultiva',
    finding:
      'O funil da iBob precisa separar compra direta de itens padronizados e demanda consultiva para motores, inversores, motorredutores e projetos especiais.',
    evidence: 'Fonte oficial oferece caminhos separados para comprar online e falar com especialista.',
    confidence: 88,
    reviewStatus: 'needs_review',
    suggestedAnswerText:
      'Separar campanhas de compra direta de campanhas consultivas para especificacao e suporte tecnico.',
    metadata: { suggested_use: 'context_answer_or_rule_validator_constraint' },
    createdAt: '2026-05-20T10:06:00-03:00',
    updatedAt: '2026-05-20T10:06:00-03:00',
  },
  {
    id: 'finding-channels',
    researchRunId: 'research-run-ibob-site',
    sourceId: 'source-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    findingType: 'channel',
    title: 'Canais proprios e marketplaces',
    finding:
      'A iBob combina loja oficial, atendimento especialista e presenca em marketplaces como Shopee, Mercado Livre e Magazine Luiza.',
    evidence: 'Fonte oficial cita loja oficial e marketplaces como caminhos de compra.',
    confidence: 82,
    reviewStatus: 'needs_review',
    suggestedAnswerText:
      'Mapear site/WhatsApp como canais proprios e marketplaces como canais de alcance, com metas e margem separadas.',
    metadata: { suggested_use: 'channel_strategy' },
    createdAt: '2026-05-20T10:07:00-03:00',
    updatedAt: '2026-05-20T10:07:00-03:00',
  },
  {
    id: 'finding-intent',
    researchRunId: 'research-run-ibob-site',
    sourceId: 'source-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    findingType: 'opportunity',
    title: 'Segmentacao por intencao comercial',
    finding:
      'Antes de conectar Ads, o agente deve segmentar intencao de compra direta versus intencao de especificacao tecnica para reduzir desperdicio e melhorar previsibilidade.',
    evidence:
      'A experiencia oficial ja diferencia itens padronizados de apoio especialista para aplicacoes industriais.',
    confidence: 80,
    reviewStatus: 'needs_review',
    suggestedAnswerText:
      'Criar perguntas de contexto e futuras campanhas separadas por compra direta, reposicao, especificacao tecnica e projeto especial.',
    metadata: { suggested_use: 'decision_engine_input' },
    createdAt: '2026-05-20T10:08:00-03:00',
    updatedAt: '2026-05-20T10:08:00-03:00',
  },
];

export const competitorProfiles: CompetitorProfile[] = [
  {
    id: 'competitor-lotus',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    name: 'Lotus Automacao',
    websiteUrl: 'https://lotusautomacao.com.br/',
    status: 'candidate',
    positioning: 'Distribuidora de produtos eletricos e automacao industrial.',
    offerSummary:
      'Catalogo de produtos WEG, inversores, soft-starters, materiais eletricos e atendimento por orcamento.',
    strengths: 'Autoridade em automacao industrial, marcas reconhecidas e posicionamento B2B tecnico.',
    weaknesses: 'Pode exigir orcamento em vez de compra direta em alguns fluxos.',
    metadata: { source_id: 'source-lotus' },
    createdAt: '2026-05-20T10:09:00-03:00',
    updatedAt: '2026-05-20T10:09:00-03:00',
  },
  {
    id: 'competitor-hercules',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    name: 'Hercules Motores',
    websiteUrl: 'https://loja.herculesmotores.com.br/motorredutores.html',
    status: 'candidate',
    positioning: 'Fabricante/venda direta de motores e motorredutores.',
    offerSummary:
      'Motorredutores, motores eletricos, suporte tecnico, customizacao, condicoes de fabrica e entrega nacional.',
    strengths: 'Venda direta de fabrica, garantia e suporte tecnico especializado.',
    weaknesses: 'Foco de portfolio mais concentrado que uma loja multimarca.',
    metadata: { source_id: 'source-hercules' },
    createdAt: '2026-05-20T10:09:00-03:00',
    updatedAt: '2026-05-20T10:09:00-03:00',
  },
  {
    id: 'competitor-varivelox',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    name: 'Varivelox',
    websiteUrl: 'https://www.varivelox.com.br/',
    status: 'candidate',
    positioning: 'Fabricante brasileira de motores, motovibradores e motorredutores.',
    offerSummary: 'Motores eletricos, motovibradores, motorredutores e produtos industriais.',
    strengths: 'Fabricacao propria e conteudo tecnico por aplicacao.',
    weaknesses: 'Pode competir mais em linhas especificas do que no sortimento amplo.',
    metadata: { source_id: 'source-varivelox' },
    createdAt: '2026-05-20T10:09:00-03:00',
    updatedAt: '2026-05-20T10:09:00-03:00',
  },
];

export const competitorInsights: CompetitorInsight[] = [
  {
    id: 'insight-lotus',
    competitorId: 'competitor-lotus',
    researchRunId: 'research-run-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    insightType: 'competitor',
    insight:
      'Lotus concorre como distribuidor B2B de automacao industrial e materiais eletricos, com catalogo WEG e processo orientado a orcamento.',
    evidence: 'Fonte publica da Lotus destaca distribuicao de automacao industrial e materiais eletricos.',
    sourceUrl: 'https://lotusautomacao.com.br/',
    confidence: 76,
    reviewStatus: 'needs_review',
    createdAt: '2026-05-20T10:10:00-03:00',
    updatedAt: '2026-05-20T10:10:00-03:00',
  },
  {
    id: 'insight-hercules',
    competitorId: 'competitor-hercules',
    researchRunId: 'research-run-ibob-site',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    insightType: 'competitor',
    insight:
      'Hercules concorre em motores e motorredutores com venda direta de fabrica, suporte tecnico, customizacao e entrega nacional.',
    evidence:
      'Pagina de motorredutores destaca suporte tecnico, customizacao, direto de fabrica e entrega em todo Brasil.',
    sourceUrl: 'https://loja.herculesmotores.com.br/motorredutores.html',
    confidence: 84,
    reviewStatus: 'needs_review',
    createdAt: '2026-05-20T10:10:00-03:00',
    updatedAt: '2026-05-20T10:10:00-03:00',
  },
];

export const contextMemoryItems: ContextMemoryItem[] = [
  {
    id: 'context-memory-hybrid-operation',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    sourceFindingId: 'finding-sales-process',
    memoryType: 'company_context',
    status: 'draft',
    title: 'Operacao hibrida',
    content:
      'A iBob deve ser tratada como operacao hibrida: ecommerce para compra direta e venda tecnica consultiva para aplicacoes industriais.',
    confidence: 84,
    createdAt: '2026-05-20T10:11:00-03:00',
    updatedAt: '2026-05-20T10:11:00-03:00',
  },
  {
    id: 'context-memory-intent-segmentation',
    contextId: mockBusinessContext.id,
    clientId: CLIENT_ID,
    sourceFindingId: 'finding-intent',
    memoryType: 'opportunity',
    status: 'draft',
    title: 'Separar intencao de compra e especificacao',
    content:
      'Campanhas e diagnosticos devem separar quem quer comprar produto especifico de quem precisa de ajuda para especificar solucao.',
    confidence: 82,
    createdAt: '2026-05-20T10:11:00-03:00',
    updatedAt: '2026-05-20T10:11:00-03:00',
  },
];

// ── Proposals ─────────────────────────────────────────────────────────────────

export const proposals: Proposal[] = [
  {
    id: 'prop-001',
    clientId: CLIENT_ID,
    title: 'Aumentar budget Google Search – Marca',
    channel: 'google_ads',
    type: 'budget_increase',
    reasoning:
      'ROAS da campanha de Marca está em 6.8x nos últimos 7 dias, acima da meta de 4.5x. O budget esgota às 14h diariamente, deixando impressões na mesa.',
    expectedImpact:
      '+R$ 280/dia de gasto; projeção de +42 conversões/semana com ROAS mantido acima de 5x.',
    status: 'pending',
    riskLevel: 'low',
    ruleValidatorPassed: true,
    createdAt: '2026-05-12T08:00:00-03:00',
    budgetDeltaBrl: 280,
    agentVersion: '0.1.0',
    promptVersion: 'v1.0',
  },
  {
    id: 'prop-002',
    clientId: CLIENT_ID,
    title: 'Reduzir bid máx CPA – Campanha Frio',
    channel: 'google_ads',
    type: 'bid_adjustment',
    reasoning:
      'Campanha "Público Frio" com CPA atual de R$ 187; meta é R$ 140. Bid máximo de R$ 95 está gerando lances acima da eficiência esperada.',
    expectedImpact:
      'Redução estimada de 15–20% no CPA; possível queda de 10% no volume de conversões no curto prazo.',
    status: 'pending',
    riskLevel: 'medium',
    ruleValidatorPassed: true,
    ruleValidatorNotes:
      'Volume abaixo do limiar mínimo de 30 conversões/semana. Ajuste pode impactar o aprendizado da campanha.',
    createdAt: '2026-05-12T08:05:00-03:00',
    agentVersion: '0.1.0',
    promptVersion: 'v1.0',
  },
  {
    id: 'prop-003',
    clientId: CLIENT_ID,
    title: 'Pausar anúncio baixo desempenho – Meta Reach',
    channel: 'meta_ads',
    type: 'campaign_pause',
    reasoning:
      'Anúncio "Video_v3_Maio" com CTR de 0.4% vs média de 1.2% no adset. CPM 34% acima dos demais. Sem conversões em 8 dias.',
    expectedImpact:
      'Redistribuição de R$ 90/dia para os anúncios de melhor desempenho no mesmo adset.',
    status: 'approved',
    riskLevel: 'low',
    ruleValidatorPassed: true,
    createdAt: '2026-05-11T10:00:00-03:00',
    agentVersion: '0.1.0',
    promptVersion: 'v1.0',
  },
  {
    id: 'prop-004',
    clientId: CLIENT_ID,
    title: 'Expandir audiência Lookalike 3% – Meta',
    channel: 'meta_ads',
    type: 'audience_expansion',
    reasoning:
      'Lookalike 1% saturando com frequência 4.2 após 14 dias. Testar 3% pode ampliar alcance e reduzir frequência.',
    expectedImpact:
      'Ampliação de ~180k usuários. Possível queda de 10–15% na taxa de conversão durante o período de aprendizado.',
    status: 'rejected',
    riskLevel: 'medium',
    ruleValidatorPassed: false,
    ruleValidatorNotes:
      'Meta Ads com dados desatualizados (>2h). Não é possível validar a performance atual do adset de forma confiável.',
    createdAt: '2026-05-11T14:00:00-03:00',
    agentVersion: '0.1.0',
    promptVersion: 'v1.0',
  },
  {
    id: 'prop-005',
    clientId: CLIENT_ID,
    title: 'Rotação de criativos Google Display',
    channel: 'google_ads',
    type: 'creative_rotation',
    reasoning:
      'Criativo "Banner_B_Abril" com CTR 2.1× maior que "Banner_A_Abril" após 10k impressões. Aumentar peso do B.',
    expectedImpact:
      'Estimativa de +0.3% no CTR geral da campanha Display, sem impacto em gasto.',
    status: 'executed',
    riskLevel: 'low',
    ruleValidatorPassed: true,
    createdAt: '2026-05-10T09:00:00-03:00',
    agentVersion: '0.1.0',
    promptVersion: 'v1.0',
  },
];

// ── Approval history ──────────────────────────────────────────────────────────

export const approvalHistory: Approval[] = [
  {
    id: 'appr-001',
    clientId: CLIENT_ID,
    proposalId: 'prop-003',
    proposalTitle: 'Pausar anúncio baixo desempenho – Meta Reach',
    approver: 'Mayron',
    decision: 'approved',
    justification:
      'Dados claros de baixo desempenho. Risco mínimo de pausa, redistribuição de budget faz sentido.',
    decidedAt: '2026-05-11T11:20:00-03:00',
  },
  {
    id: 'appr-002',
    clientId: CLIENT_ID,
    proposalId: 'prop-004',
    proposalTitle: 'Expandir audiência Lookalike 3% – Meta',
    approver: 'Cassiano',
    decision: 'rejected',
    justification:
      'Dados do Meta desatualizados. Aguardar sincronização antes de qualquer mudança de audiência.',
    decidedAt: '2026-05-11T15:10:00-03:00',
  },
  {
    id: 'appr-003',
    clientId: CLIENT_ID,
    proposalId: 'prop-005',
    proposalTitle: 'Rotação de criativos Google Display',
    approver: 'Mayron',
    decision: 'approved',
    justification:
      'Diferença de CTR expressiva e amostra suficiente. Aprovado para execução imediata.',
    decidedAt: '2026-05-10T10:05:00-03:00',
  },
];

// ── Decision memory ───────────────────────────────────────────────────────────

export const decisionMemory: DecisionMemory[] = [
  {
    id: 'mem-001',
    clientId: CLIENT_ID,
    proposalTitle: 'Aumentar budget Google Search – Marca (anterior)',
    channel: 'google_ads',
    decision: 'approved',
    outcome: 'Executado em 2026-05-08. ROAS mantido em 6.2× após aumento de R$ 200/dia.',
    impactMeasured: '+38 conversões em 4 dias. CPA estável em R$ 62.',
    learning:
      'Campanhas de Marca com ROAS > 6× e budget esgotando antes das 16h são candidatas seguras para aumento. Manter threshold de ROAS mínimo de 4.5× antes de aprovar.',
    loggedAt: '2026-05-12T07:00:00-03:00',
  },
  {
    id: 'mem-002',
    clientId: CLIENT_ID,
    proposalTitle: 'Testar audiência Interesse "Investimentos" – Meta',
    channel: 'meta_ads',
    decision: 'rejected',
    outcome:
      'Rejeitado por Cassiano em 2026-05-05. Justificativa: fora do perfil de público validado.',
    learning:
      'Audiências de interesse precisam de validação manual pelo time antes de qualquer teste. Não sugerir expansões fora das audiências aprovadas sem sinalização explícita.',
    loggedAt: '2026-05-05T16:00:00-03:00',
  },
  {
    id: 'mem-003',
    clientId: CLIENT_ID,
    proposalTitle: 'Reduzir budget Meta – Campanha Cold',
    channel: 'meta_ads',
    decision: 'approved',
    outcome:
      'Executado em 2026-05-03. Queda de 20% no gasto com manutenção de 85% do volume de leads.',
    impactMeasured: 'CPL reduziu de R$ 48 para R$ 38 (−21%). Meta de CPL < R$ 40 atingida.',
    learning:
      'Campanhas Cold em Meta com CPL > 140% da meta por mais de 7 dias são candidatas a corte de budget. Padrão confirmado como possível regra determinística.',
    loggedAt: '2026-05-07T10:00:00-03:00',
  },
  {
    id: 'mem-004',
    clientId: CLIENT_ID,
    proposalTitle: 'Aumentar frequência de criativos Google Search',
    channel: 'google_ads',
    decision: 'rejected',
    outcome:
      'Rejeitado por Mayron em 2026-04-28. Preocupação com fadiga de audiência em público de remarketing.',
    learning:
      'Aumentar frequência em remarketing sem dados de fadiga (impressões por usuário) é arriscado. Incluir esse dado como pré-requisito antes de sugerir mudanças de frequência.',
    loggedAt: '2026-04-28T14:30:00-03:00',
  },
];

// ── Roadmap ───────────────────────────────────────────────────────────────────

export const auditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    clientId: CLIENT_ID,
    eventType: 'platform.audit_foundation_created',
    severity: 'info',
    entityType: 'system',
    entityId: 'audit_events',
    description: 'Fundacao de auditoria preparada para o piloto iBob.',
    metadata: { source: 'mock', phase: 'hardening' },
    occurredAt: '2026-05-19T09:30:00-03:00',
  },
  {
    id: 'audit-2',
    clientId: CLIENT_ID,
    eventType: 'security.login_redirect_hardened',
    severity: 'info',
    entityType: 'auth',
    entityId: 'login',
    description: 'Redirect pos-login restrito a rotas internas do app.',
    metadata: { package: 'v18' },
    occurredAt: '2026-05-18T13:49:00-03:00',
  },
  {
    id: 'audit-3',
    clientId: CLIENT_ID,
    eventType: 'security.server_headers_hardened',
    severity: 'info',
    entityType: 'server',
    entityId: 'server.js',
    description: 'Headers defensivos adicionados ao servidor Node.',
    metadata: { package: 'v20' },
    occurredAt: '2026-05-18T16:07:00-03:00',
  },
];

export const roadmapStages: RoadmapStage[] = [
  {
    number: 0,
    title: 'Base local e deploy inicial',
    status: 'done',
    description:
      'Next.js criado em apps/web, Hostinger como alvo de deploy, blueprint importado e primeiro commit local.',
  },
  {
    number: 1,
    title: 'Produto piloto iBob (MVP)',
    status: 'done',
    description:
      'Dashboard funcional publicado na Hostinger com autenticação, visão geral, Data Trust Layer, propostas, aprovações, memória de decisão e roadmap.',
  },
  {
    number: 2,
    title: 'Fundação de dados',
    status: 'done',
    description:
      'Supabase Auth e RLS ativos. Tabelas reais em uso: clients, memberships, agent_versions, data_sources, raw_metrics, proposals, approvals e decision_memory.',
  },
  {
    number: 3,
    title: 'Data Trust Layer',
    status: 'done',
    description:
      'Leitura real de data_sources com estado verde/amarelo/vermelho no dashboard e em /data-trust, isolada por cliente via RLS.',
  },
  {
    number: 4,
    title: 'Fila de aprovação humana',
    status: 'done',
    description:
      'A tela /approvals le propostas e historico reais no Supabase. Aprovadores podem aprovar, rejeitar ou adiar propostas sem execucao externa.',
  },
  {
    number: 5,
    title: 'Hardening do produto piloto',
    status: 'done',
    description:
      'Concluido no nucleo supervisionado: seguranca, auditoria, deploy supervisionado, backup checklist e estados operacionais validados antes de integracoes externas.',
  },
  {
    number: 6,
    title: 'Context Intelligence',
    status: 'done',
    description:
      'Concluido: diagnostico inteligente da empresa, respostas comerciais, lacunas e memoria de contexto alimentam estrategia, rule_validator e funil antes dos MCPs.',
  },
  {
    number: 7,
    title: 'Context Research Layer',
    status: 'done',
    description:
      'Concluido: pesquisa de site, concorrentes, achados, memorias e revisoes humanas sustentam a nota CMO e as futuras propostas.',
  },
  {
    number: 8,
    title: 'CMO Strategy Readiness',
    status: 'done',
    description:
      'Concluido: /strategy cruza contexto, economia, pesquisa, memoria e funil real para medir a base estrategica antes de qualquer escala de Ads.',
  },
  {
    number: 9,
    title: 'Tracking e Funil Real',
    status: 'done',
    description:
      'Concluido: eventos reais do Supabase calibram /strategy e fecham o ciclo entre CRM/funil, qualidade, margem e decisao estrategica.',
  },
  {
    number: 10,
    title: 'Decision Engine supervisionado',
    status: 'done',
    description:
      'Concluido: /decision valida contexto, pesquisa, funil e Data Trust para formular hipoteses supervisionadas sem IA externa, MCP ou execucao de Ads.',
  },
  {
    number: 11,
    title: 'Validacao deterministica',
    status: 'done',
    description:
      'Concluido: /validator registra dry-runs, mostra historico, certifica propostas existentes e mantem aprovacao humana obrigatoria com Ads/MCPs bloqueados.',
  },
  {
    number: 12,
    title: 'Execution Engine (dry run)',
    status: 'done',
    description:
      'Concluido: /execution registra simulacoes com preflight, plano de rollback, execution_logs e auditoria antes de qualquer integracao de escrita.',
  },
  {
    number: 13,
    title: 'Produto escalável',
    status: 'in_progress',
    description:
      'V58 usa fallback automatico de modelos OpenAI no /agent, mostra erro sanitizado e mantem MCPs reservados para o gran finale.',
  },
  {
    number: 14,
    title: 'Integrações em modo leitura',
    status: 'planned',
    description:
      'Etapa final de conexao externa: automatizar ingestao real de Google Ads, Meta, GA4, Orbita e CRM sem escrita externa, apos contexto, produto e governanca estarem validados.',
  },
  {
    number: 15,
    title: 'Execução controlada',
    status: 'planned',
    description:
      'Acoes reais com escopo limitado, aprovacao humana obrigatoria, monitoramento financeiro e rollback validado para contas conectadas.',
  },
];

// ── Overview metrics ──────────────────────────────────────────────────────────

export const overviewMetrics: OverviewMetric[] = [
  { label: 'ROAS médio', value: '4.2×', trend: '+0.3 vs semana anterior', trendUp: true },
  { label: 'Gasto total (mês)', value: 'R$ 18.400', trend: '+R$ 2.100 vs mês anterior', trendUp: true },
  { label: 'CPA médio', value: 'R$ 68', trend: '−R$ 4 vs semana anterior', trendUp: true },
  { label: 'Leads gerados', value: '271', trend: '+18 vs semana anterior', trendUp: true },
  { label: 'Propostas pendentes', value: '2', trend: '3 criadas esta semana' },
  { label: 'Aprovações esta semana', value: '3', trend: '0 rejeitadas', trendUp: true },
];
