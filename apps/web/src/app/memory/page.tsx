'use client';

import { useEffect, useMemo, useState } from 'react';
import { decisionMemory as mockDecisionMemory } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabaseDecisionMemory } from '@/lib/memory/supabase-decision-memory';
import type { Channel, DecisionMemory } from '@/types';

function channelLabel(c: Channel) {
  return c === 'google_ads' ? 'Google Ads' : 'Meta Ads';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

export default function MemoryPage() {
  const [realDecisionMemory, setRealDecisionMemory] = useState<DecisionMemory[] | null>(null);
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

    getSupabaseDecisionMemory(supabase)
      .then((entries) => {
        if (!isMounted) return;
        setRealDecisionMemory(entries);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar a memoria real do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const decisionMemory = realDecisionMemory ?? mockDecisionMemory;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
              iBob Agent
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
              Memoria de Decisao
            </h1>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Historico de decisoes aprovadas e rejeitadas com aprendizados registrados
            </p>
          </div>
          <span className="rounded-full border border-[#d7ddd2] bg-white px-3 py-1 text-xs font-medium text-[#5c6b61]">
            {realDecisionMemory ? 'Supabase' : 'Mock'}
          </span>
        </div>
      </header>

      <div className="mb-8 rounded-lg border border-[#bed0c5] bg-[#f0f5f1] px-5 py-4 text-sm text-[#34473b]">
        <p className="font-semibold text-[#142116] mb-1">Para que serve</p>
        <p className="leading-relaxed">
          Antes de gerar uma nova proposta, o Decision Engine consulta esta memoria para
          evitar repetir erros, identificar padroes validados e calibrar o nivel de
          confianca de cada sugestao. Cada entrada sera registrada apos uma decisao
          humana e a validacao de impacto.
        </p>
      </div>

      {dataError && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span className="font-medium">Fallback:</span> {dataError}
        </div>
      )}

      <div className="space-y-4">
        {decisionMemory.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-[#d7ddd2] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-[#172018]">
                  {entry.proposalTitle}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant={entry.channel === 'google_ads' ? 'blue' : 'purple'}>
                    {channelLabel(entry.channel)}
                  </Badge>
                  <Badge variant={entry.decision === 'approved' ? 'green' : 'red'}>
                    {entry.decision === 'approved' ? 'Aprovada' : 'Rejeitada'}
                  </Badge>
                  <span className="text-xs text-[#5c6b61]">
                    {formatDate(entry.loggedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t border-[#d7ddd2] pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                  Resultado
                </p>
                <p className="mt-1 text-sm text-[#34473b] leading-relaxed">
                  {entry.outcome}
                </p>
              </div>

              {entry.impactMeasured && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                    Impacto medido
                  </p>
                  <p className="mt-1 text-sm text-[#34473b] leading-relaxed">
                    {entry.impactMeasured}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-[#f0f5f1] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                  Aprendizado registrado
                </p>
                <p className="mt-1 text-sm text-[#34473b] leading-relaxed">
                  {entry.learning}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-[#d7ddd2] bg-white px-5 py-4 text-sm shadow-sm">
        <p className="font-semibold text-[#172018] mb-2">Estrutura da memoria</p>
        <div className="grid gap-2 sm:grid-cols-2 text-xs text-[#5c6b61]">
          {[
            ['Resultado', 'O que aconteceu apos a decisao.'],
            ['Impacto medido', 'Metricas coletadas apos execucao ou simulacao.'],
            ['Aprendizado', 'Regra ou padrao derivado, usado como contexto futuro.'],
            ['Versao do agente', 'Rastreia qual versao do prompt gerou a proposta original.'],
          ].map(([label, desc]) => (
            <div key={label}>
              <span className="font-medium text-[#34473b]">{label}:</span>{' '}
              {desc}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
