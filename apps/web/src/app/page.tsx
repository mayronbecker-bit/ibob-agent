import Link from 'next/link';
import { StatusDot } from '@/components/ui/StatusDot';
import { Badge } from '@/components/ui/Badge';
import {
  overviewMetrics,
  proposals,
  dataTrustState,
  approvalHistory,
} from '@/lib/mock-data';
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

export default function HomePage() {
  const pendingCount = proposals.filter((p) => p.status === 'pending').length;
  const recentProposals = proposals.slice(0, 4);
  const recentApprovals = approvalHistory.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
            Visão Geral
          </h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            12 de maio de 2026 · Dados mockados
          </p>
        </div>
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
      </header>

      {/* Metrics grid */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Métricas do período
        </h2>
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
                  className={`mt-1 text-xs ${m.trendUp === true ? 'text-green-600' : 'text-[#5c6b61]'}`}
                >
                  {m.trend}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Recent proposals */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Propostas recentes
            </h2>
            <Link
              href="/proposals"
              className="text-xs font-medium text-[#476454] hover:underline"
            >
              Ver todas →
            </Link>
          </div>
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
                      Aguarda aprovação
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6">
          {/* Data Trust status */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
                Data Trust Layer
              </h2>
              <Link
                href="/data-trust"
                className="text-xs font-medium text-[#476454] hover:underline"
              >
                Detalhes →
              </Link>
            </div>
            <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <StatusDot status={dataTrustState.overallStatus} showLabel />
                <span className="text-xs text-[#5c6b61]">
                  · verificado às 14:30
                </span>
              </div>
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
            </div>
          </section>

          {/* Pending approvals */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
                Aguardando aprovação
              </h2>
              <Link
                href="/approvals"
                className="text-xs font-medium text-[#476454] hover:underline"
              >
                Fila →
              </Link>
            </div>
            {pendingCount === 0 ? (
              <div className="rounded-lg border border-[#d7ddd2] bg-white px-4 py-6 text-center text-sm text-[#5c6b61] shadow-sm">
                Nenhuma proposta pendente.
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-yellow-800">
                  {pendingCount}{' '}
                  {pendingCount === 1
                    ? 'proposta aguarda'
                    : 'propostas aguardam'}{' '}
                  aprovação humana
                </p>
                <p className="mt-0.5 text-xs text-yellow-700">
                  Nenhuma ação é executada automaticamente.
                </p>
              </div>
            )}
          </section>

          {/* Recent decisions */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
                Decisões recentes
              </h2>
              <Link
                href="/memory"
                className="text-xs font-medium text-[#476454] hover:underline"
              >
                Memória →
              </Link>
            </div>
            <div className="space-y-2">
              {recentApprovals.map((a) => (
                <div
                  key={a.proposalId}
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
          </section>
        </div>
      </div>
    </div>
  );
}
