'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StatusDot } from '@/components/ui/StatusDot';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import {
  overviewMetrics as mockOverviewMetrics,
  proposals as mockProposals,
  dataTrustState as mockDataTrustState,
  approvalHistory as mockApprovalHistory,
} from '@/lib/mock-data';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  getSupabaseDashboardData,
  type SupabaseDashboardData,
} from '@/lib/dashboard/supabase-dashboard';
import type { Channel, ProposalStatus } from '@/types';

function channelLabel(c: Channel) {
  return c === 'google_ads' ? 'Google Ads' : 'Meta Ads';
}

function statusBadgeVariant(s: ProposalStatus) {
  const map: Record<ProposalStatus, 'yellow' | 'green' | 'red' | 'blue' | 'gray'> = {
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    executed: 'blue',
    deferred: 'gray',
  };
  return map[s];
}

function statusLabel(s: ProposalStatus) {
  const map: Record<ProposalStatus, string> = {
    pending: 'Pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    executed: 'Executada',
    deferred: 'Adiada',
  };
  return map[s];
}

function formatPeriod(period: string) {
  return new Date(`${period}T12:00:00-03:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export default function HomePage() {
  const [realDashboard, setRealDashboard] = useState<SupabaseDashboardData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    getSupabaseDashboardData(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealDashboard(data);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar o dashboard real do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const overviewMetrics = realDashboard?.overviewMetrics ?? mockOverviewMetrics;
  const proposals = realDashboard?.proposals ?? mockProposals;
  const dataTrustState = realDashboard?.dataTrustState ?? mockDataTrustState;
  const approvalHistory = realDashboard?.approvalHistory ?? mockApprovalHistory;
  const pendingCount = proposals.filter((p) => p.status === 'pending').length;
  const recentProposals = proposals.slice(0, 4);
  const recentApprovals = approvalHistory.slice(0, 3);
  const periodLabel = realDashboard
    ? `${formatPeriod(realDashboard.metricPeriod)} - Supabase`
    : 'Dados mockados';

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
            Visao Geral
          </h1>
          <p className="mt-1 text-sm text-[#5c6b61]">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#d7ddd2] bg-white px-3 py-1 text-xs font-medium text-[#5c6b61]">
            {realDashboard ? 'Supabase' : 'Mock'}
          </span>
          <div className="flex items-center gap-2 rounded-lg border border-[#d7ddd2] bg-white px-4 py-2.5 text-sm shadow-sm">
            <StatusDot status={dataTrustState.overallStatus} />
            <span className="text-[#34473b] font-medium">
              Agente{' '}
              {dataTrustState.overallStatus === 'green'
                ? 'operacional'
                : dataTrustState.overallStatus === 'yellow'
                  ? 'com alertas'
                  : 'bloqueado'}
            </span>
          </div>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A tela esta exibindo dados mockados para manter a operacao visivel.
        </DataStateNotice>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Metricas do periodo
        </h2>
        {overviewMetrics.length === 0 ? (
          <EmptyState
            title="Nenhuma metrica disponivel"
            description="Quando raw_metrics tiver dados validos, os cards do periodo aparecem aqui."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overviewMetrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
              >
                <p className="text-xs text-[#5c6b61]">{m.label}</p>
                <p className="mt-1 text-2xl font-semibold text-[#142116]">
                  {m.value}
                </p>
                {m.trend && (
                  <p
                    className={`mt-1 text-xs ${
                      m.trendUp === true ? 'text-green-600' : 'text-[#5c6b61]'
                    }`}
                  >
                    {m.trend}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Propostas recentes
            </h2>
            <Link
              href="/proposals"
              className="text-xs font-medium text-[#476454] hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {recentProposals.length === 0 ? (
            <EmptyState
              title="Sem propostas recentes"
              description="Novas sugestoes aprovaveis aparecem aqui depois de passarem pelo rule_validator."
            />
          ) : (
            <div className="space-y-2">
              {recentProposals.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[#172018] leading-snug">
                    {p.title}
                  </p>
                  <Badge variant={statusBadgeVariant(p.status)}>
                    {statusLabel(p.status)}
                  </Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant={p.channel === 'google_ads' ? 'blue' : 'purple'}>
                    {channelLabel(p.channel)}
                  </Badge>
                  {p.status === 'pending' && (
                    <span className="text-xs text-[#5c6b61]">
                      Aguarda aprovacao
                    </span>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
                Data Trust Layer
              </h2>
              <Link
                href="/data-trust"
                className="text-xs font-medium text-[#476454] hover:underline"
              >
                Detalhes
              </Link>
            </div>
            <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <StatusDot status={dataTrustState.overallStatus} showLabel />
                <span className="text-xs text-[#5c6b61]">
                  verificado as {formatTime(dataTrustState.checkedAt)}
                </span>
              </div>
              {dataTrustState.sources.length === 0 ? (
                <EmptyState
                  title="Nenhuma fonte configurada"
                  description="As fontes de dados aparecem aqui quando estiverem cadastradas para o cliente."
                  className="py-5"
                />
              ) : (
                <div className="space-y-2">
                  {dataTrustState.sources.map((src) => (
                    <div
                      key={src.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#34473b]">{src.name}</span>
                      <StatusDot status={src.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
                Aguardando aprovacao
              </h2>
              <Link
                href="/approvals"
                className="text-xs font-medium text-[#476454] hover:underline"
              >
                Fila
              </Link>
            </div>
            {pendingCount === 0 ? (
              <EmptyState
                title="Nenhuma proposta pendente"
                description="A fila de aprovacao esta limpa neste momento."
                className="py-6"
              />
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-yellow-800">
                  {pendingCount}{' '}
                  {pendingCount === 1
                    ? 'proposta aguarda'
                    : 'propostas aguardam'}{' '}
                  aprovacao humana
                </p>
                <p className="mt-0.5 text-xs text-yellow-700">
                  Nenhuma acao e executada automaticamente.
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
                Decisoes recentes
              </h2>
              <Link
                href="/memory"
                className="text-xs font-medium text-[#476454] hover:underline"
              >
                Memoria
              </Link>
            </div>
            {recentApprovals.length === 0 ? (
              <EmptyState
                title="Sem decisoes recentes"
                description="A memoria de decisoes sera alimentada conforme propostas forem avaliadas."
              />
            ) : (
              <div className="space-y-2">
                {recentApprovals.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[#172018] font-medium">
                      {a.proposalTitle}
                    </span>
                    <Badge
                      variant={
                        a.decision === 'approved'
                          ? 'green'
                          : a.decision === 'rejected'
                            ? 'red'
                            : 'gray'
                      }
                    >
                      {a.decision === 'approved'
                        ? 'Aprovada'
                        : a.decision === 'rejected'
                          ? 'Rejeitada'
                          : 'Adiada'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[#5c6b61]">
                    por {a.approver}
                  </p>
                </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
