import type {
  Client,
  User,
  AgentVersion,
  AgentState,
  DataTrustState,
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
    status: 'in_progress',
    description:
      'Antes das integracoes externas: fortalecer seguranca, estados vazios/erro, auditoria, testes, backup e experiencia. Ja aplicados: redirect pos-login seguro, estados padronizados, headers defensivos, audit_events com RLS, UI de auditoria e checklist de backup/recuperacao.',
  },
  {
    number: 6,
    title: 'Context Intelligence',
    status: 'planned',
    description:
      'Diagnostico inteligente da empresa antes de analisar Ads: perguntas e respostas sobre oferta, margem, publico, capacidade, metas, restricoes, sazonalidade e previsibilidade comercial.',
  },
  {
    number: 7,
    title: 'Decision Engine supervisionado',
    status: 'planned',
    description:
      'Gerar sugestoes com IA usando dados reais, contexto comercial estruturado, mocks controlados ou importacoes manuais. Modelo nunca executa diretamente e consulta contexto e memoria antes de sugerir.',
  },
  {
    number: 8,
    title: 'Validação determinística',
    status: 'planned',
    description:
      'Limites de budget, estoque, margem, tracking, capacidade comercial e risco. Uma sugestao so vira proposta se passar por todas as regras deterministicas e pelo contexto da empresa.',
  },
  {
    number: 9,
    title: 'Execution Engine (dry run)',
    status: 'planned',
    description:
      'Executor separado do Decision Engine. Simulacao completa antes de tocar contas reais. Logs, estado anterior e rollback desenhados antes de qualquer escrita externa.',
  },
  {
    number: 10,
    title: 'Produto escalável',
    status: 'planned',
    description:
      'Generalizar configuracoes da iBob. Onboarding de novos clientes, diagnostico de contexto por cliente, papeis por usuario, modelo de cobranca, limites por plano e operacao multi-cliente.',
  },
  {
    number: 11,
    title: 'Integrações em modo leitura',
    status: 'planned',
    description:
      'Etapa final de conexao externa: automatizar ingestao real de Google Ads, Meta, GA4, Orbita e CRM sem escrita externa, apos contexto, produto e governanca estarem validados.',
  },
  {
    number: 12,
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
