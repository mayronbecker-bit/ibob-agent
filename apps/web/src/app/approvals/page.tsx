'use client';

import { useEffect, useMemo, useState } from 'react';
import { proposals as mockProposals, approvalHistory as mockApprovalHistory } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  getSupabaseApprovalsData,
  recordSupabaseProposalDecision,
  type SupabaseApprovalsData,
} from '@/lib/approvals/supabase-approvals';
import type { Approval, ApprovalDecision, Channel, Proposal, RiskLevel } from '@/types';

function channelLabel(c: Channel) {
  return c === 'google_ads' ? 'Google Ads' : 'Meta Ads';
}

function riskVariant(r: RiskLevel): 'green' | 'yellow' | 'red' {
  return r === 'low' ? 'green' : r === 'medium' ? 'yellow' : 'red';
}

function riskLabel(r: RiskLevel) {
  return r === 'low' ? 'Baixo' : r === 'medium' ? 'Medio' : 'Alto';
}

function decisionLabel(decision: ApprovalDecision) {
  const labels: Record<ApprovalDecision, string> = {
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    deferred: 'Adiada',
  };

  return labels[decision];
}

function decisionVariant(decision: ApprovalDecision): 'green' | 'red' | 'gray' {
  if (decision === 'approved') return 'green';
  if (decision === 'rejected') return 'red';
  return 'gray';
}

function defaultJustification(decision: ApprovalDecision, proposal: Proposal) {
  if (decision === 'approved') {
    return `Aprovado em fluxo supervisionado para a proposta: ${proposal.title}`;
  }

  if (decision === 'rejected') {
    return `Rejeitado em fluxo supervisionado para a proposta: ${proposal.title}`;
  }

  return `Adiado em fluxo supervisionado para a proposta: ${proposal.title}`;
}

type LocalDecision = {
  decision: ApprovalDecision;
  approver: string;
  justification: string;
};

export default function ApprovalsPage() {
  const [localDecisions, setLocalDecisions] = useState<Record<string, LocalDecision>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [realData, setRealData] = useState<SupabaseApprovalsData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingProposalId, setSubmittingProposalId] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

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

    getSupabaseApprovalsData(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealData(data);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar aprovacoes reais do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase, reloadCount]);

  const sourceProposals = realData?.proposals ?? mockProposals;
  const sourceApprovalHistory = realData?.approvalHistory ?? mockApprovalHistory;
  const currentApprover = realData?.currentApprover ?? 'Sessao local';
  const initialPending = sourceProposals.filter((p) => p.status === 'pending');
  const stillPending = initialPending.filter((p) => !localDecisions[p.id]);
  const locallyDecided = initialPending.filter((p) => !!localDecisions[p.id]);

  async function decide(proposal: Proposal, decision: ApprovalDecision) {
    const justification = justifications[proposal.id]?.trim() || defaultJustification(decision, proposal);

    setActionError(null);

    if (realData && supabase) {
      setSubmittingProposalId(proposal.id);

      try {
        await recordSupabaseProposalDecision(supabase, proposal.id, decision, justification);
        setJustifications((prev) => {
          const next = { ...prev };
          delete next[proposal.id];
          return next;
        });
        setReloadCount((count) => count + 1);
      } catch {
        setActionError('Nao foi possivel registrar a decisao no Supabase.');
      } finally {
        setSubmittingProposalId(null);
      }

      return;
    }

    setLocalDecisions((prev) => ({
      ...prev,
      [proposal.id]: {
        decision,
        approver: currentApprover,
        justification,
      },
    }));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
              iBob Agent
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
              Fila de Aprovacao Humana
            </h1>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Nenhuma acao e executada sem decisao explicita de um aprovador
            </p>
          </div>
          <span className="rounded-full border border-[#d7ddd2] bg-white px-3 py-1 text-xs font-medium text-[#5c6b61]">
            {realData ? 'Supabase' : 'Mock'}
          </span>
        </div>
      </header>

      <div className="mb-8 rounded-lg border border-[#bed0c5] bg-[#f0f5f1] px-5 py-4 text-sm text-[#34473b]">
        <p className="font-semibold text-[#142116] mb-1">Regra de ouro</p>
        <p className="leading-relaxed">
          O agente sugere. O rule_validator valida. A proposta entra nesta fila.
          O humano decide. O executor age apenas em etapa futura autorizada. O log registra.
        </p>
      </div>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A fila abaixo esta usando propostas mockadas e decisoes locais.
        </DataStateNotice>
      )}

      {actionError && (
        <DataStateNotice title="Decisao nao registrada" variant="error" className="mb-4">
          {actionError}
        </DataStateNotice>
      )}

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Aguardando decisao ({stillPending.length})
        </h2>

        {stillPending.length === 0 ? (
          <EmptyState
            title="Fila vazia"
            description="Todas as propostas pendentes ja foram decididas ou ainda nao ha novas sugestoes."
          />
        ) : (
          <div className="space-y-5">
            {stillPending.map((p) => {
              const isSubmitting = submittingProposalId === p.id;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-[#172018]">{p.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge variant={p.channel === 'google_ads' ? 'blue' : 'purple'}>
                          {channelLabel(p.channel)}
                        </Badge>
                        <Badge variant={riskVariant(p.riskLevel)}>
                          Risco {riskLabel(p.riskLevel)}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="yellow">Pendente</Badge>
                  </div>

                  <div className="mt-4 grid gap-4 border-t border-[#d7ddd2] pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                        Raciocinio
                      </p>
                      <p className="mt-1 text-sm text-[#34473b] leading-relaxed">
                        {p.reasoning}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                        Impacto esperado
                      </p>
                      <p className="mt-1 text-sm text-[#34473b] leading-relaxed">
                        {p.expectedImpact}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-3 flex items-start gap-2 rounded-lg px-4 py-2.5 text-xs ${
                      p.ruleValidatorPassed
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                    }`}
                  >
                    <StatusDot status={p.ruleValidatorPassed ? 'green' : 'red'} />
                    <span className="font-medium">
                      rule_validator: {p.ruleValidatorPassed ? 'passou' : 'reprovado'}
                    </span>
                    {p.ruleValidatorNotes && (
                      <span className="opacity-80">- {p.ruleValidatorNotes}</span>
                    )}
                  </div>

                  <div className="mt-4 border-t border-[#d7ddd2] pt-4">
                    <label
                      htmlFor={`justification-${p.id}`}
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#5c6b61]"
                    >
                      Justificativa
                    </label>
                    <textarea
                      id={`justification-${p.id}`}
                      value={justifications[p.id] ?? ''}
                      onChange={(event) =>
                        setJustifications((prev) => ({
                          ...prev,
                          [p.id]: event.target.value,
                        }))
                      }
                      placeholder="Opcional. Se ficar vazio, o sistema registra uma justificativa padrao."
                      className="min-h-20 w-full resize-y rounded-lg border border-[#d7ddd2] bg-white px-3 py-2 text-sm text-[#172018] outline-none transition-colors focus:border-[#476454]"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => decide(p, 'approved')}
                        disabled={isSubmitting}
                        className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => decide(p, 'rejected')}
                        disabled={isSubmitting}
                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => decide(p, 'deferred')}
                        disabled={isSubmitting}
                        className="rounded-lg border border-[#d7ddd2] bg-white px-4 py-2 text-xs font-semibold text-[#5c6b61] transition-colors hover:bg-[#f0f5f1] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Adiar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {locallyDecided.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Decididas nesta sessao ({locallyDecided.length})
          </h2>
          <div className="space-y-3">
            {locallyDecided.map((p) => {
              const d = localDecisions[p.id];
              if (!d) return null;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-[#172018]">{p.title}</p>
                    <p className="text-xs text-[#5c6b61]">por {d.approver}</p>
                    <p className="mt-1 text-xs text-[#5c6b61]">{d.justification}</p>
                  </div>
                  <Badge variant={decisionVariant(d.decision)}>
                    {decisionLabel(d.decision)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Historico de aprovacoes ({sourceApprovalHistory.length})
        </h2>
        {sourceApprovalHistory.length === 0 ? (
          <EmptyState
            title="Sem historico de aprovacoes"
            description="As decisoes registradas no Supabase aparecem aqui depois que propostas forem avaliadas."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#d7ddd2] bg-white shadow-sm">
            <table className="min-w-[780px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#d7ddd2] bg-[#f6f7f4] text-left">
                  <th className="px-5 py-3 font-semibold text-[#5c6b61]">Proposta</th>
                  <th className="px-5 py-3 font-semibold text-[#5c6b61]">Aprovador</th>
                  <th className="px-5 py-3 font-semibold text-[#5c6b61]">Decisao</th>
                  <th className="px-5 py-3 font-semibold text-[#5c6b61]">Justificativa</th>
                </tr>
              </thead>
              <tbody>
                {sourceApprovalHistory.map((a: Approval, i) => (
                  <tr
                    key={a.id}
                    className={`border-b border-[#d7ddd2] last:border-0 ${i % 2 === 1 ? 'bg-[#fafbf9]' : 'bg-white'}`}
                  >
                    <td className="px-5 py-4 font-medium text-[#172018] max-w-[200px]">
                      {a.proposalTitle}
                    </td>
                    <td className="px-5 py-4 text-[#34473b]">{a.approver}</td>
                    <td className="px-5 py-4">
                      <Badge variant={decisionVariant(a.decision)}>
                        {decisionLabel(a.decision)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-[#5c6b61] text-xs max-w-[250px]">
                      {a.justification}
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
