'use client';

import { useState } from 'react';
import { proposals, approvalHistory } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import type { Channel, RiskLevel, Proposal } from '@/types';

function channelLabel(c: Channel) {
  return c === 'google_ads' ? 'Google Ads' : 'Meta Ads';
}

function riskVariant(r: RiskLevel): 'green' | 'yellow' | 'red' {
  return r === 'low' ? 'green' : r === 'medium' ? 'yellow' : 'red';
}

function riskLabel(r: RiskLevel) {
  return r === 'low' ? 'Baixo' : r === 'medium' ? 'Médio' : 'Alto';
}

type LocalDecision = {
  decision: 'approved' | 'rejected' | 'deferred';
  approver: string;
  decidedAt: string;
};

export default function ApprovalsPage() {
  const [decisions, setDecisions] = useState<Record<string, LocalDecision>>({});

  const initialPending = proposals.filter((p) => p.status === 'pending');
  const stillPending = initialPending.filter((p) => !decisions[p.id]);
  const locallyDecided = initialPending.filter((p) => !!decisions[p.id]);

  function decide(
    proposal: Proposal,
    decision: 'approved' | 'rejected' | 'deferred',
    approver: string,
  ) {
    setDecisions((prev) => ({
      ...prev,
      [proposal.id]: { decision, approver, decidedAt: new Date().toISOString() },
    }));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
          iBob Agent
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
          Fila de Aprovação Humana
        </h1>
        <p className="mt-1 text-sm text-[#5c6b61]">
          Nenhuma ação é executada sem decisão explícita de Mayron ou Cassiano
        </p>
      </header>

      {/* Safety banner */}
      <div className="mb-8 rounded-lg border border-[#bed0c5] bg-[#f0f5f1] px-5 py-4 text-sm text-[#34473b]">
        <p className="font-semibold text-[#142116] mb-1">Regra de ouro</p>
        <p className="leading-relaxed">
          O agente sugere. O rule_validator valida. A proposta entra nesta fila.
          O humano decide. O executor age. O log registra. Nenhuma etapa pode ser
          pulada.
        </p>
      </div>

      {/* Pending queue */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Aguardando decisão ({stillPending.length})
        </h2>

        {stillPending.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center shadow-sm">
            <p className="text-sm font-medium text-green-800">
              Fila vazia. Todas as propostas foram decididas.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {stillPending.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm"
              >
                {/* Title & badges */}
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

                {/* Details */}
                <div className="mt-4 grid gap-4 border-t border-[#d7ddd2] pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                      Raciocínio
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

                {/* rule_validator */}
                <div
                  className={`mt-3 flex items-start gap-2 rounded-lg px-4 py-2.5 text-xs ${
                    p.ruleValidatorPassed
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  <StatusDot status={p.ruleValidatorPassed ? 'green' : 'red'} />
                  <span className="font-medium">
                    rule_validator:{' '}
                    {p.ruleValidatorPassed ? 'passou' : 'reprovado'}
                  </span>
                  {p.ruleValidatorNotes && (
                    <span className="opacity-80"> · {p.ruleValidatorNotes}</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 border-t border-[#d7ddd2] pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#5c6b61]">
                    Decidir como:
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(['Mayron', 'Cassiano'] as const).map((approver) => (
                      <div key={approver}>
                        <p className="mb-2 text-xs font-medium text-[#5c6b61]">
                          {approver}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => decide(p, 'approved', approver)}
                            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => decide(p, 'rejected', approver)}
                            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                          >
                            Rejeitar
                          </button>
                          <button
                            onClick={() => decide(p, 'deferred', approver)}
                            className="flex-1 rounded-lg border border-[#d7ddd2] bg-white px-3 py-2 text-xs font-semibold text-[#5c6b61] hover:bg-[#f0f5f1] transition-colors"
                          >
                            Adiar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Locally decided in this session */}
      {locallyDecided.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Decididas nesta sessão ({locallyDecided.length})
          </h2>
          <div className="space-y-3">
            {locallyDecided.map((p) => {
              const d = decisions[p.id];
              if (!d) return null;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#d7ddd2] bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-[#172018]">{p.title}</p>
                    <p className="text-xs text-[#5c6b61]">por {d.approver}</p>
                  </div>
                  <Badge
                    variant={
                      d.decision === 'approved'
                        ? 'green'
                        : d.decision === 'rejected'
                          ? 'red'
                          : 'gray'
                    }
                  >
                    {d.decision === 'approved'
                      ? 'Aprovada'
                      : d.decision === 'rejected'
                        ? 'Rejeitada'
                        : 'Adiada'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Historical approvals */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Histórico de aprovações ({approvalHistory.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[#d7ddd2] bg-white shadow-sm">
          <table className="min-w-[780px] w-full text-sm">
            <thead>
              <tr className="border-b border-[#d7ddd2] bg-[#f6f7f4] text-left">
                <th className="px-5 py-3 font-semibold text-[#5c6b61]">Proposta</th>
                <th className="px-5 py-3 font-semibold text-[#5c6b61]">Aprovador</th>
                <th className="px-5 py-3 font-semibold text-[#5c6b61]">Decisão</th>
                <th className="px-5 py-3 font-semibold text-[#5c6b61]">Justificativa</th>
              </tr>
            </thead>
            <tbody>
              {approvalHistory.map((a, i) => (
                <tr
                  key={a.proposalId}
                  className={`border-b border-[#d7ddd2] last:border-0 ${i % 2 === 1 ? 'bg-[#fafbf9]' : 'bg-white'}`}
                >
                  <td className="px-5 py-4 font-medium text-[#172018] max-w-[200px]">
                    {a.proposalTitle}
                  </td>
                  <td className="px-5 py-4 text-[#34473b]">{a.approver}</td>
                  <td className="px-5 py-4">
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
                  </td>
                  <td className="px-5 py-4 text-[#5c6b61] text-xs max-w-[250px]">
                    {a.justification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
