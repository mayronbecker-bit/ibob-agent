'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import { approvalHistory as mockApprovals, proposals as mockProposals } from '@/lib/mock-data';
import {
  getSupabaseExecutionData,
  recordSupabaseExecutionDryRun,
  type ExecutionCandidate,
  type SupabaseExecutionData,
} from '@/lib/execution/supabase-execution';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Channel, ExecutionLog, Proposal } from '@/types';

type BrowserSupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;

function channelLabel(channel: Channel) {
  return channel === 'google_ads' ? 'Google Ads' : 'Meta Ads';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function actionLabel(proposal: Proposal) {
  const channel = channelLabel(proposal.channel);

  if (proposal.type === 'budget_increase') return `Simular aumento de budget em ${channel}`;
  if (proposal.type === 'budget_decrease') return `Simular reducao de budget em ${channel}`;
  if (proposal.type === 'bid_adjustment') return `Simular ajuste de bid em ${channel}`;
  if (proposal.type === 'audience_expansion') return `Simular expansao de audiencia em ${channel}`;
  if (proposal.type === 'campaign_pause') return `Simular pausa em ${channel}`;
  return `Simular rotacao de criativos em ${channel}`;
}

function buildFallbackData(): SupabaseExecutionData {
  const approvedProposals = mockProposals.filter(
    (proposal) => proposal.status === 'approved' && proposal.ruleValidatorPassed,
  );
  const candidates: ExecutionCandidate[] = approvedProposals
    .map((proposal) => {
      const approval = mockApprovals.find(
        (item) => item.proposalId === proposal.id && item.decision === 'approved',
      );

      if (!approval) return null;

      return {
        proposal,
        approval,
        alreadySimulated: false,
      };
    })
    .filter((candidate): candidate is ExecutionCandidate => candidate !== null);

  const executionLogs: ExecutionLog[] = [
    {
      id: 'mock-exec-001',
      clientId: 'client-ibob',
      proposalId: 'prop-005',
      approvalId: 'appr-003',
      executedAt: '2026-05-10T10:10:00-03:00',
      result: 'simulated',
      channel: 'google_ads',
      action: 'DRY_RUN: simular rotacao de criativos em Google Ads',
      stateBefore: { source: 'mock', external_write: false },
      stateAfter: { simulated: true, external_write: false },
      isDryRun: true,
    },
  ];

  return {
    candidates,
    executionLogs,
  };
}

async function loadExecutionData(
  supabase: BrowserSupabaseClient,
): Promise<SupabaseExecutionData> {
  return getSupabaseExecutionData(supabase);
}

export default function ExecutionPage() {
  const [realData, setRealData] = useState<SupabaseExecutionData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    title: string;
    detail: string;
    variant: 'success' | 'warning' | 'error';
  } | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

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

    loadExecutionData(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealData(data);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar o Execution Engine real do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const data = realData ?? fallbackData;
  const sourceLabel = realData ? 'Supabase' : 'Mock';

  async function handleDryRun(candidate: ExecutionCandidate) {
    if (!supabase || !realData) {
      setActionNotice({
        title: 'Simulacao indisponivel',
        detail:
          'Entre com uma sessao Supabase valida antes de registrar uma simulacao real.',
        variant: 'warning',
      });
      return;
    }

    const key = `${candidate.proposal.id}:${candidate.approval.id}`;
    setSubmittingKey(key);
    setActionNotice(null);

    try {
      const log = await recordSupabaseExecutionDryRun(
        supabase,
        candidate.proposal.id,
        candidate.approval.id,
      );
      const nextData = await getSupabaseExecutionData(supabase);
      setRealData(nextData);
      setActionNotice({
        title: 'Dry-run registrado',
        detail: `Log ${log.id.slice(0, 8)}... salvo em execution_logs. Nenhum MCP ou conta de Ads foi chamado.`,
        variant: 'success',
      });
    } catch {
      setActionNotice({
        title: 'Nao foi possivel simular',
        detail:
          'Confira se a proposta segue aprovada, certificada pelo rule_validator e se seu usuario tem papel owner/admin.',
        variant: 'error',
      });
    } finally {
      setSubmittingKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
            Execution Engine
          </h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            Simulacao controlada depois de rule_validator e aprovacao humana.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={realData ? 'green' : 'gray'}>{sourceLabel}</Badge>
          <Badge variant="blue">DRY_RUN</Badge>
          <Badge variant="red">Ads/MCP bloqueados</Badge>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A tela esta exibindo uma simulacao mockada para manter o fluxo visivel.
        </DataStateNotice>
      )}

      {actionNotice && (
        <DataStateNotice
          title={actionNotice.title}
          variant={actionNotice.variant}
          className="mb-4"
        >
          {actionNotice.detail}
        </DataStateNotice>
      )}

      <DataStateNotice title="Execucao externa bloqueada" variant="success" className="mb-6">
        A v52 registra apenas logs simulados em <code>execution_logs</code>. O app nao chama Google Ads, Meta Ads ou MCPs nesta etapa.
      </DataStateNotice>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Candidatas a dry-run</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {data.candidates.length}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Logs simulados</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {data.executionLogs.filter((log) => log.isDryRun).length}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Escritas externas</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">0</p>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Fila de simulacao
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Apenas propostas aprovadas e certificadas pelo rule_validator aparecem aqui.
            </p>
          </div>
          <Badge variant="blue">{data.candidates.length} itens</Badge>
        </div>

        {data.candidates.length === 0 ? (
          <EmptyState
            title="Nenhuma proposta pronta para dry-run"
            description="Certifique uma proposta em /validator e aprove em /approvals antes de simular execucao."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.candidates.map((candidate) => {
              const key = `${candidate.proposal.id}:${candidate.approval.id}`;
              const isSubmitting = submittingKey === key;

              return (
                <div
                  key={key}
                  className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#172018]">
                        {candidate.proposal.title}
                      </p>
                      <p className="mt-1 text-xs text-[#5c6b61]">
                        {channelLabel(candidate.proposal.channel)} - aprovado em{' '}
                        {formatDateTime(candidate.approval.decidedAt)}
                      </p>
                    </div>
                    <Badge variant={candidate.alreadySimulated ? 'green' : 'yellow'}>
                      {candidate.alreadySimulated ? 'Ja simulado' : 'Pendente'}
                    </Badge>
                  </div>

                  <div className="mt-4 rounded-lg bg-[#f7f9f6] px-4 py-3 text-sm text-[#34473b]">
                    {actionLabel(candidate.proposal)}
                  </div>

                  <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-lg bg-[#f7f9f6] px-3 py-2">
                      <p className="text-[#5c6b61]">Pre-condicao</p>
                      <p className="mt-1 font-semibold text-[#172018]">
                        rule_validator passou
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#f7f9f6] px-3 py-2">
                      <p className="text-[#5c6b61]">Executor</p>
                      <p className="mt-1 font-semibold text-[#172018]">
                        Somente simulacao
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDryRun(candidate)}
                    disabled={isSubmitting || !realData}
                    className="mt-4 w-full rounded-lg bg-[#476454] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#34473b] disabled:cursor-not-allowed disabled:bg-[#9fb0a4]"
                  >
                    {isSubmitting ? 'Simulando...' : 'Simular execucao'}
                  </button>
                  {!realData && (
                    <p className="mt-2 text-xs leading-relaxed text-[#5c6b61]">
                      O registro em banco fica disponivel apenas quando o Supabase real esta ativo.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Execution logs
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Historico de simulacoes registradas, ordenado do mais recente para o mais antigo.
            </p>
          </div>
          <Badge variant="gray">{data.executionLogs.length} logs</Badge>
        </div>

        {data.executionLogs.length === 0 ? (
          <EmptyState
            title="Nenhum execution_log registrado"
            description="Depois de simular, o log aparece aqui e tambem gera evento em /audit."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#d7ddd2] bg-white shadow-sm">
            <table className="min-w-[920px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#d7ddd2] bg-[#f6f7f4] text-left">
                  <th className="px-4 py-3 font-semibold text-[#5c6b61]">Quando</th>
                  <th className="px-4 py-3 font-semibold text-[#5c6b61]">Canal</th>
                  <th className="px-4 py-3 font-semibold text-[#5c6b61]">Acao</th>
                  <th className="px-4 py-3 font-semibold text-[#5c6b61]">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {data.executionLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`border-b border-[#edf1ea] last:border-0 ${
                      index % 2 === 1 ? 'bg-[#fafbf9]' : 'bg-white'
                    }`}
                  >
                    <td className="px-4 py-3 text-[#34473b]">
                      {formatDateTime(log.executedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={log.channel === 'google_ads' ? 'blue' : 'purple'}>
                        {channelLabel(log.channel)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#34473b]">{log.action}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="green">{log.result}</Badge>
                        {log.isDryRun && <Badge variant="blue">dry-run</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
