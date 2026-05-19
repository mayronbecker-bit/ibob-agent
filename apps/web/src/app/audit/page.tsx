'use client';

import { useEffect, useMemo, useState } from 'react';
import { auditEvents as mockAuditEvents } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabaseAuditEvents } from '@/lib/audit/supabase-audit-events';
import type { AuditEvent, AuditEventSeverity } from '@/types';

function severityLabel(severity: AuditEventSeverity) {
  const labels: Record<AuditEventSeverity, string> = {
    info: 'Info',
    warning: 'Atenção',
    critical: 'Crítico',
  };

  return labels[severity];
}

function severityVariant(severity: AuditEventSeverity): 'blue' | 'yellow' | 'red' {
  if (severity === 'critical') return 'red';
  if (severity === 'warning') return 'yellow';
  return 'blue';
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

function formatActor(actorUserId?: string) {
  if (!actorUserId) return 'Sistema';
  return `${actorUserId.slice(0, 8)}...`;
}

function metadataLabel(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return 'Sem metadata';
  }

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

export default function AuditPage() {
  const [realAuditEvents, setRealAuditEvents] = useState<AuditEvent[] | null>(null);
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

    getSupabaseAuditEvents(supabase)
      .then((events) => {
        if (!isMounted) return;
        setRealAuditEvents(events);
        setDataError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar eventos reais do Supabase.');
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const auditEvents = realAuditEvents ?? mockAuditEvents;
  const criticalCount = auditEvents.filter((event) => event.severity === 'critical').length;
  const warningCount = auditEvents.filter((event) => event.severity === 'warning').length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
              iBob Agent
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
              Auditoria
            </h1>
            <p className="mt-1 text-sm text-[#5c6b61]">
              Trilha operacional de eventos de produto, seguranca e governanca
            </p>
          </div>
          <span className="rounded-full border border-[#d7ddd2] bg-white px-3 py-1 text-xs font-medium text-[#5c6b61]">
            {realAuditEvents ? 'Supabase' : 'Mock'}
          </span>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-6">
          {dataError} A tela esta exibindo eventos mockados para manter a auditoria visivel.
        </DataStateNotice>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Eventos exibidos</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {auditEvents.length}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Atenção</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {warningCount}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Críticos</p>
          <p className="mt-1 text-2xl font-semibold text-[#142116]">
            {criticalCount}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Eventos recentes
          </h2>
          <span className="text-xs text-[#5c6b61]">
            Ordenado do mais recente para o mais antigo
          </span>
        </div>

        {auditEvents.length === 0 ? (
          <EmptyState
            title="Nenhum evento de auditoria"
            description="Eventos de seguranca, produto e operacao aparecem aqui depois de registrados em audit_events."
          />
        ) : (
          <div className="space-y-3">
            {auditEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-[#d7ddd2] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#172018]">{event.description}</p>
                    <p className="mt-1 text-xs text-[#5c6b61]">
                      {formatDateTime(event.occurredAt)} · ator: {formatActor(event.actorUserId)}
                    </p>
                  </div>
                  <Badge variant={severityVariant(event.severity)}>
                    {severityLabel(event.severity)}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 border-t border-[#d7ddd2] pt-4 text-sm sm:grid-cols-[1fr_1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                      Evento
                    </p>
                    <code className="mt-1 inline-block rounded bg-[#f0f5f1] px-1.5 py-0.5 text-xs text-[#34473b]">
                      {event.eventType}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#476454]">
                      Entidade
                    </p>
                    <p className="mt-1 text-[#34473b]">
                      {event.entityType ?? 'n/a'} {event.entityId ? `· ${event.entityId}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-[#f6f7f4] px-4 py-3 text-xs text-[#5c6b61]">
                  {metadataLabel(event.metadata)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
