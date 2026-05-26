'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import {
  funnelEventExamples,
  funnelTrackingRequirements,
} from '@/lib/mock-data';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  createSupabaseFunnelEvent,
  getSupabaseFunnelData,
} from '@/lib/funnel/supabase-funnel';
import type {
  FunnelEvent,
  FunnelEventSource,
  FunnelEventStage,
  FunnelRequirementStatus,
} from '@/types';

const STAGE_OPTIONS: FunnelEventStage[] = [
  'lead',
  'qualified_lead',
  'opportunity',
  'proposal_sent',
  'sale_won',
  'sale_lost',
  'disqualified',
];

const SOURCE_OPTIONS: FunnelEventSource[] = [
  'google_ads',
  'meta_ads',
  'organic',
  'whatsapp',
  'marketplace',
  'direct',
  'referral',
  'crm',
  'other',
];

const stageLabel: Record<FunnelEventStage, string> = {
  lead: 'Lead',
  qualified_lead: 'Lead qualificado',
  opportunity: 'Oportunidade',
  proposal_sent: 'Proposta enviada',
  sale_won: 'Venda ganha',
  sale_lost: 'Venda perdida',
  disqualified: 'Desqualificado',
};

const sourceLabel: Record<FunnelEventSource, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  organic: 'Organico',
  whatsapp: 'WhatsApp',
  marketplace: 'Marketplace',
  direct: 'Direto',
  referral: 'Indicacao',
  crm: 'CRM',
  other: 'Outro',
};

const statusLabel: Record<FunnelRequirementStatus, string> = {
  done: 'Pronto',
  missing: 'Pendente',
  planned: 'Planejado',
};

const statusVariant: Record<FunnelRequirementStatus, 'green' | 'yellow' | 'blue'> = {
  done: 'green',
  missing: 'yellow',
  planned: 'blue',
};

type NoticeState = {
  title: string;
  detail: string;
  variant: 'success' | 'warning' | 'error';
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function money(value?: number) {
  if (typeof value !== 'number') {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function deriveRequirements(events: FunnelEvent[]) {
  if (events.length === 0) {
    return funnelTrackingRequirements;
  }

  const hasSource = events.some((event) => Boolean(event.source));
  const hasValueMargin = events.some(
    (event) => typeof event.dealValueBrl === 'number' && typeof event.grossMarginBrl === 'number',
  );
  const stageCount = new Set(events.map((event) => event.stage)).size;

  return funnelTrackingRequirements.map((requirement) => {
    if (requirement.id === 'req-funnel-first-import') {
      return { ...requirement, status: 'done' as const };
    }
    if (requirement.id === 'req-funnel-source' && hasSource) {
      return { ...requirement, status: 'done' as const };
    }
    if (requirement.id === 'req-funnel-value-margin' && hasValueMargin) {
      return { ...requirement, status: 'done' as const };
    }
    if (requirement.id === 'req-funnel-stage' && stageCount >= 3) {
      return { ...requirement, status: 'done' as const };
    }

    return requirement;
  });
}

function formatOccurredAt(date: string) {
  return `${date}T12:00:00-03:00`;
}

export default function FunnelPage() {
  const [realEvents, setRealEvents] = useState<FunnelEvent[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    occurredAt: todayInputValue(),
    stage: 'qualified_lead' as FunnelEventStage,
    source: 'whatsapp' as FunnelEventSource,
    companyName: '',
    contactName: '',
    campaignName: '',
    leadQualityScore: '',
    dealValueBrl: '',
    grossMarginBrl: '',
    notes: '',
  });

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

    getSupabaseFunnelData(supabase)
      .then((data) => {
        if (!isMounted) return;
        setRealEvents(data.events);
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

  const events = realEvents ?? funnelEventExamples;
  const requirements = deriveRequirements(realEvents ?? []);
  const totalDealValue = events.reduce((total, event) => total + (event.dealValueBrl ?? 0), 0);
  const totalGrossMargin = events.reduce((total, event) => total + (event.grossMarginBrl ?? 0), 0);
  const wonSalesCount = events.filter((event) => event.stage === 'sale_won').length;
  const qualifiedCount = events.filter((event) => event.stage === 'qualified_lead').length;
  const sourceCount = new Set(events.map((event) => event.source)).size;
  const stageCount = new Set(events.map((event) => event.stage)).size;
  const missingPoints = requirements
    .filter((item) => item.status !== 'done')
    .reduce((total, item) => total + item.impactPoints, 0);

  const requiredColumns = [
    'occurred_at',
    'stage',
    'source',
    'company_name',
    'contact_name',
    'campaign_name',
    'lead_quality_score',
    'deal_value_brl',
    'gross_margin_brl',
    'notes',
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setNotice({
        title: 'Sessao indisponivel',
        detail: 'Entre novamente para registrar eventos reais no Supabase.',
        variant: 'warning',
      });
      return;
    }

    if (!form.companyName.trim() && !form.contactName.trim()) {
      setNotice({
        title: 'Identificacao obrigatoria',
        detail: 'Informe pelo menos empresa ou contato para manter o funil auditavel.',
        variant: 'warning',
      });
      return;
    }

    setIsSaving(true);
    setNotice(null);

    try {
      const created = await createSupabaseFunnelEvent(supabase, {
        stage: form.stage,
        source: form.source,
        occurredAt: formatOccurredAt(form.occurredAt),
        companyName: form.companyName,
        contactName: form.contactName,
        campaignName: form.campaignName,
        leadQualityScore: parseOptionalNumber(form.leadQualityScore),
        dealValueBrl: parseOptionalNumber(form.dealValueBrl),
        grossMarginBrl: parseOptionalNumber(form.grossMarginBrl),
        notes: form.notes,
      });

      setRealEvents((current) => [created, ...(current ?? [])]);
      setNotice({
        title: 'Evento registrado',
        detail: 'O funil real foi atualizado e a acao foi registrada em auditoria.',
        variant: 'success',
      });
      setForm((current) => ({
        ...current,
        companyName: '',
        contactName: '',
        campaignName: '',
        leadQualityScore: '',
        dealValueBrl: '',
        grossMarginBrl: '',
        notes: '',
      }));
    } catch {
      setNotice({
        title: 'Nao foi possivel registrar',
        detail: 'Confira se seu usuario e owner/admin e se a sessao continua ativa.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">Funil Real</h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            Tracking manual-first para qualidade, oportunidade, proposta e venda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="yellow">Sem integracoes externas</Badge>
          <Badge variant="blue">Base 100: +{missingPoints} pts</Badge>
          <Badge variant={realEvents ? 'green' : 'gray'}>{realEvents ? 'Supabase' : 'Mock'}</Badge>
        </div>
      </header>

      {dataError && (
        <DataStateNotice title="Modo fallback ativo" variant="warning" className="mb-4">
          {dataError} A tela esta exibindo exemplos mockados ate a leitura real voltar.
        </DataStateNotice>
      )}

      {notice && (
        <DataStateNotice title={notice.title} variant={notice.variant} className="mb-4">
          {notice.detail}
        </DataStateNotice>
      )}

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
            Proximo gargalo
          </p>
          <h2 className="mt-2 text-xl font-semibold text-yellow-900">
            Fechar tracking e funil real
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-yellow-800">
            A iBob ja tem contexto, economia e pesquisa. Agora o agente precisa
            enxergar quais leads viram oportunidade, proposta e venda para nao
            otimizar midia por volume barato.
          </p>
        </div>

        <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6b61]">
            Caminho de resolucao
          </p>
          <div className="mt-4 grid gap-2 text-sm text-[#34473b]">
            {[
              'Registrar uma amostra manual com os leads recentes.',
              'Marcar a etapa real de cada contato no funil.',
              'Adicionar origem/campanha quando essa informacao existir.',
              'Adicionar valor e margem nas vendas fechadas.',
              'So depois conectar MCPs/API de Ads e CRM.',
            ].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-lg bg-[#f7f9f6] px-3 py-2">
                <span className="font-semibold text-[#476454]">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DataStateNotice title="Regra de seguranca" variant="info" className="mb-8">
        Esta etapa nao executa campanhas, nao conecta Ads e nao envia dados para
        plataformas externas. Ela registra apenas eventos de funil revisados.
      </DataStateNotice>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Resumo do funil
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Eventos registrados', events.length.toString(), `${sourceCount} origem(ns)`],
            ['Etapas cobertas', stageCount.toString(), 'Base para calibrar o funil'],
            ['Leads qualificados', qualifiedCount.toString(), 'Primeiro sinal de qualidade'],
            ['Vendas ganhas', wonSalesCount.toString(), `${money(totalDealValue)} em receita`],
          ].map(([label, value, detail]) => (
            <div
              key={label}
              className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-[#5c6b61]">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#142116]">{value}</p>
              <p className="mt-1 text-xs text-[#5c6b61]">{detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-[#d7ddd2] bg-[#f7f9f6] px-4 py-3 text-sm text-[#34473b]">
          Margem bruta registrada: <strong>{money(totalGrossMargin)}</strong>. Esse numero
          vira o contrapeso comercial para o agente nao escalar leads baratos sem lucro.
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Registrar evento manual
        </h2>
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#34473b]">Data</span>
              <input
                type="date"
                value={form.occurredAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, occurredAt: event.target.value }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#34473b]">Etapa</span>
              <select
                value={form.stage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stage: event.target.value as FunnelEventStage,
                  }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
              >
                {STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {stageLabel[stage]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#34473b]">Origem</span>
              <select
                value={form.source}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    source: event.target.value as FunnelEventSource,
                  }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
              >
                {SOURCE_OPTIONS.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabel[source]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#34473b]">Qualidade</span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.leadQualityScore}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    leadQualityScore: event.target.value,
                  }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
                placeholder="0 a 100"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#34473b]">Empresa</span>
              <input
                value={form.companyName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, companyName: event.target.value }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
                placeholder="Nome da empresa"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#34473b]">Contato</span>
              <input
                value={form.contactName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactName: event.target.value }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
                placeholder="Nome do contato"
              />
            </label>
            <label className="grid gap-1 text-sm lg:col-span-2">
              <span className="font-medium text-[#34473b]">Campanha/origem detalhada</span>
              <input
                value={form.campaignName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, campaignName: event.target.value }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
                placeholder="Ex.: Search motorredutor industrial"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#34473b]">Valor venda</span>
              <input
                inputMode="decimal"
                value={form.dealValueBrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dealValueBrl: event.target.value }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
                placeholder="15000"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#34473b]">Margem bruta</span>
              <input
                inputMode="decimal"
                value={form.grossMarginBrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    grossMarginBrl: event.target.value,
                  }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
                placeholder="2250"
              />
            </label>
            <label className="grid gap-1 text-sm lg:col-span-2">
              <span className="font-medium text-[#34473b]">Nota</span>
              <input
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="rounded-lg border border-[#cbd6cd] px-3 py-2 text-[#172018]"
                placeholder="Sinais comerciais, motivo da qualificacao ou perda"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-relaxed text-[#5c6b61]">
              Campos sensiveis nao sao necessarios aqui. Registre apenas o minimo comercial
              para analise de qualidade.
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[#476454] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34473b] disabled:cursor-not-allowed disabled:bg-[#9fb0a4]"
            >
              {isSaving ? 'Registrando...' : 'Registrar evento'}
            </button>
          </div>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
          Checklist para liberar os 7 pontos
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {requirements.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#172018]">{item.title}</p>
                <Badge variant={statusVariant[item.status]}>
                  {statusLabel[item.status]}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#5c6b61]">
                {item.description}
              </p>
              <p className="mt-3 text-xs font-semibold text-[#476454]">
                +{item.impactPoints} ponto{item.impactPoints !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Colunas obrigatorias
          </h2>
          <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {requiredColumns.map((column) => (
                <code
                  key={column}
                  className="rounded border border-[#d7ddd2] bg-[#f7f9f6] px-2 py-1 text-xs text-[#34473b]"
                >
                  {column}
                </code>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#5c6b61]">
              Template local: <code>docs/templates/funnel_events_import_template.csv</code>
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Eventos registrados
          </h2>
          {events.length === 0 ? (
            <EmptyState
              title="Nenhum evento registrado"
              description="Use o formulario para registrar a primeira amostra de funil real."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#d7ddd2] bg-white shadow-sm">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-[#f0f4ef] text-left text-xs uppercase tracking-wide text-[#5c6b61]">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Etapa</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t border-[#edf1ea]">
                      <td className="px-4 py-3 text-[#34473b]">
                        {dateLabel(event.occurredAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={event.stage === 'sale_won' ? 'green' : 'blue'}>
                          {stageLabel[event.stage]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#34473b]">
                        {sourceLabel[event.source]}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#172018]">
                        {event.companyName ?? event.contactName ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-[#34473b]">
                        {money(event.dealValueBrl)}
                      </td>
                      <td className="px-4 py-3 text-[#34473b]">
                        {money(event.grossMarginBrl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
