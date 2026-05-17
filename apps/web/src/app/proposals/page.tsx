'use client';

import { useEffect, useMemo, useState } from 'react';
import { proposals as mockProposals } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabaseProposals } from '@/lib/proposals/supabase-proposals';
import type { Channel, Proposal, ProposalStatus, RiskLevel, ProposalType } from '@/types';

function channelLabel(c: Channel) {
  return c === 'google_ads' ? 'Google Ads' : 'Meta Ads';
}

function typeLabel(t: ProposalType) {
  const map: Record<ProposalType, string> = {
    budget_increase: 'Aumento de budget',
    budget_decrease: 'Redução de budget',
    bid_adjustment: 'Ajuste de bid',
    audience_expansion: 'Expansão de audiência',
    campaign_pause: 'Pausa de campanha',
    creative_rotation: 'Rotação de criativos',
  };
  return map[t];
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

function statusVariant(s: ProposalStatus): 'yellow' | 'green' | 'red' | 'blue' | 'gray' {
  const map: Record<ProposalStatus, 'yellow' | 'green' | 'red' | 'blue' | 'gray'> = {
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    executed: 'blue',
    deferred: 'gray',
  };
  return map[s];
}

function riskLabel(r: RiskLevel) {
  const map: Record<RiskLevel, string> = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
  };
  return map[r];
}

function riskVariant(r: RiskLevel): 'green' | 'yellow' | 'red' {
  const map: Record<RiskLevel, 'green' | 'yellow' | 'red'> = {
    low: 'green',
    medium: 'yellow',
    high: 'red',
  };
  return map[r];
}

type TabFilter = 'all' | ProposalStatus;

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovadas' },
  { key: 'rejected', label: 'Rejeitadas' },
  { key: 'executed', label: 'Executadas' },
];

export default function ProposalsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [realProposals, setRealProposals] = useState<Proposal[] | null>(null);
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

    getSupabaseProposals(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealProposals(data);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar propostas reais do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const sourceProposals = realProposals ?? mockProposals;

  const filtered =
    activeTab === 'all'
      ? sourceProposals
      : sourceProposals.filter((p) => p.status === activeTab);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
          iBob Agent
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[#142116]">Propostas</h1>
        <p className="mt-1 text-sm text-[#5c6b61]">
          Sugestões geradas pelo agente e validadas pelo rule_validator
        </p>
      </header>

      {dataError && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span className="font-medium">Fallback:</span> {dataError}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-[#d7ddd2]">
        {TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? sourceProposals.length
              : sourceProposals.filter((p) => p.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key
                  ? 'border-[#476454] text-[#142116]'
                  : 'border-transparent text-[#5c6b61] hover:text-[#172018]',
              ].join(' ')}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab.key
                    ? 'bg-[#142116] text-white'
                    : 'bg-[#e8ede9] text-[#5c6b61]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        <span className="ml-auto mb-2 rounded-full border border-[#d7ddd2] bg-white px-3 py-1 text-xs font-medium text-[#5c6b61]">
          {realProposals ? 'Supabase' : 'Mock'}
        </span>
      </div>

      {/* Proposal cards */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[#d7ddd2] bg-white px-6 py-12 text-center text-sm text-[#5c6b61] shadow-sm">
          Nenhuma proposta nesta categoria.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-[#d7ddd2] bg-white p-5 shadow-sm"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-[#172018]">{p.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant={p.channel === 'google_ads' ? 'blue' : 'purple'}>
                      {channelLabel(p.channel)}
                    </Badge>
                    <Badge variant="gray">{typeLabel(p.type)}</Badge>
                    <Badge variant={riskVariant(p.riskLevel)}>
                      Risco {riskLabel(p.riskLevel)}
                    </Badge>
                  </div>
                </div>
                <Badge variant={statusVariant(p.status)}>
                  {statusLabel(p.status)}
                </Badge>
              </div>

              {/* Body */}
              <div className="mt-4 grid gap-4 border-t border-[#d7ddd2] pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                    Raciocínio do agente
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
                  {p.budgetDeltaBrl !== undefined && (
                    <p className="mt-1 text-xs font-medium text-[#142116]">
                      Delta de budget: R$ {p.budgetDeltaBrl.toLocaleString('pt-BR')}/dia
                    </p>
                  )}
                </div>
              </div>

              {/* rule_validator */}
              <div
                className={`mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
                  p.ruleValidatorPassed
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <StatusDot
                  status={p.ruleValidatorPassed ? 'green' : 'red'}
                />
                <div>
                  <span className="font-medium">
                    rule_validator:{' '}
                    {p.ruleValidatorPassed ? 'passou' : 'reprovado'}
                  </span>
                  {p.ruleValidatorNotes && (
                    <p className="mt-0.5 text-xs opacity-90">
                      {p.ruleValidatorNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
