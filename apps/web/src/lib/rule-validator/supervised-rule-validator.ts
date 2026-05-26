import type { DecisionGate, DecisionReadiness } from '@/lib/decision/supervised-decision-engine';
import type {
  Proposal,
  RuleValidatorCheck,
  RuleValidatorResult,
  RuleValidatorRule,
  RuleValidatorSeverity,
} from '@/lib/domain/types';

type RuleKey =
  | 'context.active_minimum'
  | 'context.no_critical_gaps'
  | 'research.memory_reviewed'
  | 'funnel.minimum_truth'
  | 'strategy.cmo_minimum_score'
  | 'data_trust.no_red_sources'
  | 'proposal.no_high_risk_without_review'
  | 'proposal.budget_increase_requires_margin'
  | 'execution.external_action_locked'
  | 'execution.mcp_read_only_until_final_stage';

export type RuleValidatorDryRunInput = {
  decisionReadiness: DecisionReadiness;
  proposal?: Proposal;
};

export type RuleValidatorDryRun = {
  result: RuleValidatorResult;
  resultLabel: string;
  summary: string;
  canPromoteToProposal: boolean;
  canExecuteExternalAction: false;
  selectedProposal?: Proposal;
  passCount: number;
  warningCount: number;
  failCount: number;
  rules: RuleValidatorRule[];
  checks: RuleValidatorCheck[];
};

const now = '2026-05-25T10:00:00-03:00';

export const supervisedRuleCatalog: RuleValidatorRule[] = [
  {
    id: 'local-rule-context-active',
    clientId: 'client-ibob',
    ruleKey: 'context.active_minimum',
    version: 1,
    title: 'Contexto comercial ativo',
    category: 'context',
    severity: 'blocking',
    status: 'active',
    description:
      'Bloqueia propostas quando o contexto comercial nao esta ativo e suficientemente completo.',
    condition: { requiresContextStatus: 'active', minimumCompleteness: 90 },
    failureMessage: 'Contexto comercial insuficiente para gerar proposta supervisionada.',
    remediation: 'Completar e ativar o diagnostico em /context e /strategy.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-no-critical-gaps',
    clientId: 'client-ibob',
    ruleKey: 'context.no_critical_gaps',
    version: 1,
    title: 'Sem lacunas criticas abertas',
    category: 'context',
    severity: 'blocking',
    status: 'active',
    description: 'Impede recomendacoes quando existem lacunas criticas de contexto.',
    condition: { maxOpenCriticalGaps: 0 },
    failureMessage: 'Existem lacunas criticas abertas no contexto.',
    remediation: 'Resolver lacunas criticas antes de gerar proposta.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-research-memory',
    clientId: 'client-ibob',
    ruleKey: 'research.memory_reviewed',
    version: 1,
    title: 'Pesquisa e memoria revisadas',
    category: 'research',
    severity: 'blocking',
    status: 'active',
    description: 'Exige achados aceitos, concorrentes ativos e memoria contextual revisada.',
    condition: {
      minimumActiveMemory: 2,
      minimumActiveCompetitors: 2,
      minimumReviewedFindings: 4,
    },
    failureMessage: 'Pesquisa ou memoria contextual ainda nao sustentam a decisao.',
    remediation: 'Revisar achados e ativar memorias em /research.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-funnel-truth',
    clientId: 'client-ibob',
    ruleKey: 'funnel.minimum_truth',
    version: 1,
    title: 'Funil real minimo',
    category: 'funnel',
    severity: 'blocking',
    status: 'active',
    description: 'Exige eventos reais de qualificado, oportunidade, proposta, venda e margem.',
    condition: {
      requiredStages: ['qualified_lead', 'opportunity', 'proposal_sent', 'sale_won'],
      requiresSaleMargin: true,
    },
    failureMessage: 'Funil real ainda nao prova qualidade, venda e margem.',
    remediation: 'Registrar eventos completos em /funnel antes de propor escala.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-cmo-score',
    clientId: 'client-ibob',
    ruleKey: 'strategy.cmo_minimum_score',
    version: 1,
    title: 'Nota CMO minima',
    category: 'strategy',
    severity: 'blocking',
    status: 'active',
    description: 'Usa a nota de /strategy como consolidacao de economia, ICP, pesquisa e funil.',
    condition: { minimumScore: 90, warningScore: 80 },
    failureMessage: 'A base estrategica ainda nao esta forte o suficiente.',
    remediation: 'Resolver os pontos indicados em /strategy.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-data-trust',
    clientId: 'client-ibob',
    ruleKey: 'data_trust.no_red_sources',
    version: 1,
    title: 'Data Trust sem vermelho',
    category: 'data_trust',
    severity: 'blocking',
    status: 'active',
    description: 'Bloqueia proposta quando alguma fonte de dados esta vermelha.',
    condition: { blockedStatus: 'red' },
    failureMessage: 'Existe fonte de dados em estado vermelho.',
    remediation: 'Corrigir fontes em /data-trust.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-risk',
    clientId: 'client-ibob',
    ruleKey: 'proposal.no_high_risk_without_review',
    version: 1,
    title: 'Risco alto exige revisao extra',
    category: 'proposal',
    severity: 'warning',
    status: 'active',
    description: 'Sinaliza propostas de alto risco antes da fila de aprovacao humana.',
    condition: { highRiskRequiresExtraReview: true },
    failureMessage: 'Proposta de risco alto precisa de revisao extra.',
    remediation: 'Reduzir escopo ou exigir justificativa adicional antes da aprovacao.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-budget-margin',
    clientId: 'client-ibob',
    ruleKey: 'proposal.budget_increase_requires_margin',
    version: 1,
    title: 'Aumento de verba exige margem',
    category: 'proposal',
    severity: 'blocking',
    status: 'active',
    description: 'Aumento de budget so pode ser sugerido quando ha venda ganha com margem no funil.',
    condition: { proposalType: 'budget_increase', requiresSaleMargin: true },
    failureMessage: 'A proposta aumenta verba sem evidencia de margem.',
    remediation: 'Registrar venda com margem ou mudar a recomendacao para diagnostico.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-execution-locked',
    clientId: 'client-ibob',
    ruleKey: 'execution.external_action_locked',
    version: 1,
    title: 'Execucao externa bloqueada',
    category: 'execution',
    severity: 'blocking',
    status: 'active',
    description: 'Garante que nenhuma acao em Ads/MCP seja executada antes de aprovacao e dry-run.',
    condition: { canExecuteExternalAction: false },
    failureMessage: 'Tentativa de execucao externa antes da etapa liberada.',
    remediation: 'Manter SUPERVISED_DRY_RUN ate Execution Engine e aprovacao estarem prontos.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'local-rule-mcp-read-only',
    clientId: 'client-ibob',
    ruleKey: 'execution.mcp_read_only_until_final_stage',
    version: 1,
    title: 'MCPs apenas leitura nas fases finais',
    category: 'execution',
    severity: 'blocking',
    status: 'active',
    description: 'Google Ads MCP e Meta Ads MCP so entram depois da base supervisionada.',
    condition: { mcpModeUntilFinalStage: 'read_only' },
    failureMessage: 'MCP de escrita nao esta liberado nesta fase.',
    remediation: 'Conectar MCPs apenas em modo leitura quando as etapas finais forem autorizadas.',
    createdAt: now,
    updatedAt: now,
  },
];

function gateById(readiness: DecisionReadiness, id: string) {
  return readiness.gates.find((gate) => gate.id === id);
}

function outcomeFromGate(gate: DecisionGate | undefined): RuleValidatorResult {
  if (!gate || gate.status === 'blocked') return 'failed';
  if (gate.status === 'warning') return 'warning';
  return 'passed';
}

function messageForOutcome(
  rule: RuleValidatorRule,
  result: RuleValidatorResult,
  passMessage: string,
) {
  if (result === 'passed') return passMessage;
  return rule.failureMessage;
}

function check(
  ruleKey: RuleKey,
  result: RuleValidatorResult,
  evidence: Record<string, unknown>,
  passMessage: string,
): RuleValidatorCheck {
  const rule = supervisedRuleCatalog.find((item) => item.ruleKey === ruleKey);

  if (!rule) {
    throw new Error(`Rule not found: ${ruleKey}`);
  }

  return {
    id: `local-check-${ruleKey}`,
    clientId: rule.clientId,
    ruleId: rule.id,
    ruleKey,
    result,
    severity: rule.severity,
    evidence,
    message: messageForOutcome(rule, result, passMessage),
    remediation: rule.remediation,
    createdAt: now,
  };
}

function proposalRiskResult(proposal?: Proposal): RuleValidatorResult {
  if (!proposal) return 'passed';
  if (proposal.riskLevel === 'high') return 'warning';
  return 'passed';
}

function budgetMarginResult(input: RuleValidatorDryRunInput): RuleValidatorResult {
  if (input.proposal?.type !== 'budget_increase') {
    return 'passed';
  }

  return input.decisionReadiness.evidence.saleWithMarginCount > 0 ? 'passed' : 'failed';
}

function executionResult(canExecute: boolean): RuleValidatorResult {
  return canExecute ? 'failed' : 'passed';
}

function aggregateResult(checks: RuleValidatorCheck[]): RuleValidatorResult {
  const hasBlockingFailure = checks.some(
    (item) => item.result === 'failed' && item.severity === 'blocking',
  );

  if (hasBlockingFailure) return 'failed';

  const hasWarning = checks.some((item) => item.result !== 'passed');
  return hasWarning ? 'warning' : 'passed';
}

function resultLabel(result: RuleValidatorResult) {
  if (result === 'passed') return 'Aprovado para proposta supervisionada';
  if (result === 'warning') return 'Aprovado com alertas';
  return 'Bloqueado pelo rule_validator';
}

function resultSummary(result: RuleValidatorResult) {
  if (result === 'passed') {
    return 'Todas as regras ativas passaram. A proposta ainda exige aprovacao humana e nao pode executar Ads.';
  }

  if (result === 'warning') {
    return 'Nao ha bloqueio critico, mas os alertas devem acompanhar a proposta ate a aprovacao humana.';
  }

  return 'Existe pelo menos uma regra bloqueante falhando. O agente deve resolver o ponto antes de gerar proposta.';
}

export function runSupervisedRuleValidator(
  input: RuleValidatorDryRunInput,
): RuleValidatorDryRun {
  const readiness = input.decisionReadiness;
  const contextGate = gateById(readiness, 'context-active');
  const gapGate = gateById(readiness, 'context-governance');
  const researchGate = gateById(readiness, 'research-memory');
  const funnelGate = gateById(readiness, 'funnel-truth');
  const cmoGate = gateById(readiness, 'cmo-readiness');
  const dataTrustGate = gateById(readiness, 'data-trust');

  const checks: RuleValidatorCheck[] = [
    check(
      'context.active_minimum',
      outcomeFromGate(contextGate),
      {
        contextCompleteness: readiness.evidence.contextCompleteness,
        gateStatus: contextGate?.status,
      },
      'Contexto ativo e suficiente para avaliar proposta.',
    ),
    check(
      'context.no_critical_gaps',
      outcomeFromGate(gapGate),
      {
        openCriticalGapCount: readiness.evidence.openCriticalGapCount,
        openGapCount: readiness.evidence.openGapCount,
        gateStatus: gapGate?.status,
      },
      'Nao ha lacunas criticas abertas.',
    ),
    check(
      'research.memory_reviewed',
      outcomeFromGate(researchGate),
      {
        activeMemoryCount: readiness.evidence.activeMemoryCount,
        activeCompetitorCount: readiness.evidence.activeCompetitorCount,
        reviewedFindingCount: readiness.evidence.reviewedFindingCount,
        gateStatus: researchGate?.status,
      },
      'Pesquisa e memoria revisadas sustentam a proposta.',
    ),
    check(
      'funnel.minimum_truth',
      outcomeFromGate(funnelGate),
      {
        funnelEventCount: readiness.evidence.funnelEventCount,
        funnelStageCount: readiness.evidence.funnelStageCount,
        saleWithMarginCount: readiness.evidence.saleWithMarginCount,
        gateStatus: funnelGate?.status,
      },
      'Funil real minimo esta presente.',
    ),
    check(
      'strategy.cmo_minimum_score',
      outcomeFromGate(cmoGate),
      {
        cmoReadinessScore: readiness.evidence.cmoReadinessScore,
        gateStatus: cmoGate?.status,
      },
      'Nota CMO sustenta proposta supervisionada.',
    ),
    check(
      'data_trust.no_red_sources',
      outcomeFromGate(dataTrustGate),
      {
        dataTrustStatus: readiness.evidence.dataTrustStatus,
        gateStatus: dataTrustGate?.status,
      },
      'Data Trust nao tem fonte vermelha.',
    ),
    check(
      'proposal.no_high_risk_without_review',
      proposalRiskResult(input.proposal),
      {
        proposalId: input.proposal?.id ?? null,
        riskLevel: input.proposal?.riskLevel ?? null,
      },
      'Risco da proposta nao exige revisao extra nesta etapa.',
    ),
    check(
      'proposal.budget_increase_requires_margin',
      budgetMarginResult(input),
      {
        proposalId: input.proposal?.id ?? null,
        proposalType: input.proposal?.type ?? null,
        saleWithMarginCount: readiness.evidence.saleWithMarginCount,
      },
      'A proposta nao aumenta verba sem evidencia de margem.',
    ),
    check(
      'execution.external_action_locked',
      executionResult(readiness.canExecuteAds),
      {
        canExecuteAds: readiness.canExecuteAds,
        operatingMode: readiness.operatingMode,
      },
      'Execucao externa segue bloqueada como esperado.',
    ),
    check(
      'execution.mcp_read_only_until_final_stage',
      'passed',
      {
        googleAdsMcp: 'not_connected',
        metaAdsMcp: 'not_connected',
        intendedMode: 'read_only_later',
      },
      'MCPs continuam fora do fluxo de escrita.',
    ),
  ];

  const result = aggregateResult(checks);
  const passCount = checks.filter((item) => item.result === 'passed').length;
  const warningCount = checks.filter((item) => item.result === 'warning').length;
  const failCount = checks.filter((item) => item.result === 'failed').length;

  return {
    result,
    resultLabel: resultLabel(result),
    summary: resultSummary(result),
    canPromoteToProposal: result !== 'failed' && readiness.canGenerateSupervisedProposals,
    canExecuteExternalAction: false,
    selectedProposal: input.proposal,
    passCount,
    warningCount,
    failCount,
    rules: supervisedRuleCatalog,
    checks,
  };
}

export function severityLabel(severity: RuleValidatorSeverity) {
  if (severity === 'blocking') return 'Bloqueante';
  if (severity === 'warning') return 'Alerta';
  return 'Info';
}
