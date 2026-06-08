'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataStateNotice, EmptyState } from '@/components/ui/DataStateNotice';
import type {
  GoogleAdsCampaignAnalysis,
  GoogleAdsCredentialStatus,
} from '@/lib/integrations/google-ads';

type CampaignResponse = {
  analysis?: GoogleAdsCampaignAnalysis;
  error?: string;
};

function formatMoney(value: number | null | undefined, currencyCode = 'BRL') {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '-';
  }

  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(value * 100)}%`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  });
}

function statusBadge(status: GoogleAdsCredentialStatus | null) {
  if (!status) {
    return { label: 'Verificando', variant: 'gray' as const };
  }

  if (!status.enabled) {
    return { label: 'Leitura desativada', variant: 'yellow' as const };
  }

  if (!status.configured) {
    return { label: 'Credenciais pendentes', variant: 'yellow' as const };
  }

  return { label: 'Google Ads pronto', variant: 'green' as const };
}

export default function GoogleAdsPage() {
  const [status, setStatus] = useState<GoogleAdsCredentialStatus | null>(null);
  const [analysis, setAnalysis] = useState<GoogleAdsCampaignAnalysis | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const badge = statusBadge(status);
  const currencyCode = analysis?.currencyCode ?? 'BRL';
  const canAnalyze = Boolean(status?.enabled && status.configured && !isLoading);
  const missingKeys = status?.missingKeys ?? [];
  const sortedCampaigns = useMemo(
    () => [...(analysis?.campaigns ?? [])].sort((a, b) => b.cost - a.cost),
    [analysis],
  );

  useEffect(() => {
    let isMounted = true;

    fetch('/api/integrations/google-ads/status')
      .then(async (response) => {
        const payload = (await response.json()) as GoogleAdsCredentialStatus;
        if (!response.ok) {
          throw new Error('Nao foi possivel verificar Google Ads.');
        }
        return payload;
      })
      .then((payload) => {
        if (!isMounted) return;
        setStatus(payload);
        setStatusError(null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setStatusError(
          error instanceof Error
            ? error.message
            : 'Falha ao verificar status do Google Ads.',
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function analyzeCampaigns() {
    setIsLoading(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/integrations/google-ads/campaigns', {
        method: 'POST',
      });
      const payload = (await response.json().catch(() => ({}))) as CampaignResponse;

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error ?? 'Nao foi possivel analisar campanhas.');
      }

      setAnalysis(payload.analysis);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Falha inesperada ao analisar Google Ads.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            Integracao de leitura
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#142116]">
            Google Ads
          </h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            Analise campanhas reais antes de qualquer proposta, aprovacao ou execucao.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <Badge variant="blue">Somente leitura</Badge>
          <Badge variant="red">Sem alteracoes em Ads</Badge>
        </div>
      </header>

      {statusError && (
        <DataStateNotice title="Status indisponivel" variant="warning" className="mb-4">
          {statusError}
        </DataStateNotice>
      )}

      {status && !status.enabled && (
        <DataStateNotice title="Leitura desativada" variant="warning" className="mb-4">
          `GOOGLE_ADS_READ_ENABLED` esta como `false`. Altere para `true` para permitir analise.
        </DataStateNotice>
      )}

      {status && status.enabled && !status.configured && (
        <DataStateNotice title="Credenciais pendentes" variant="warning" className="mb-4">
          Configure as variaveis server-side na Hostinger: {missingKeys.join(', ')}.
        </DataStateNotice>
      )}

      {analysisError && (
        <DataStateNotice title="Google Ads nao respondeu" variant="error" className="mb-4">
          {analysisError}
        </DataStateNotice>
      )}

      <section className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Periodo</p>
          <p className="mt-1 text-xl font-semibold text-[#142116]">
            {analysis?.period ?? 'LAST_30_DAYS'}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Gasto</p>
          <p className="mt-1 text-xl font-semibold text-[#142116]">
            {formatMoney(analysis?.totals.cost, currencyCode)}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">Conversoes</p>
          <p className="mt-1 text-xl font-semibold text-[#142116]">
            {formatNumber(analysis?.totals.conversions)}
          </p>
        </div>
        <div className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5c6b61]">CPA / ROAS</p>
          <p className="mt-1 text-xl font-semibold text-[#142116]">
            {formatMoney(analysis?.totals.cpa, currencyCode)} / {formatNumber(analysis?.totals.roas)}x
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
              Leitura de campanhas
            </h2>
            <p className="mt-1 text-sm text-[#5c6b61]">
              A consulta usa Google Ads API via `searchStream`, somente para relatorio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void analyzeCampaigns();
            }}
            disabled={!canAnalyze}
            className="rounded-lg bg-[#476454] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34473b] disabled:cursor-not-allowed disabled:bg-[#8fa093]"
          >
            {isLoading ? 'Analisando' : 'Analisar campanhas'}
          </button>
        </div>
        <div className="mt-4 grid gap-3 text-xs text-[#5c6b61] md:grid-cols-3">
          <p>
            API: <span className="font-semibold text-[#34473b]">{status?.apiVersion ?? 'v22'}</span>
          </p>
          <p>
            Customer ID:{' '}
            <span className="font-semibold text-[#34473b]">
              {status?.customerIdConfigured ? 'configurado' : 'pendente'}
            </span>
          </p>
          <p>
            Login customer:{' '}
            <span className="font-semibold text-[#34473b]">
              {status?.loginCustomerIdConfigured ? 'configurado' : 'opcional/nao informado'}
            </span>
          </p>
        </div>
      </section>

      {analysis && (
        <section className="mb-6 grid gap-3 lg:grid-cols-3">
          {analysis.findings.map((finding, index) => (
            <div
              key={`${finding.title}-${index}`}
              className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
            >
              <Badge variant={finding.severity}>{finding.severity.toUpperCase()}</Badge>
              <p className="mt-3 text-sm font-semibold text-[#172018]">
                {finding.title}
              </p>
              {finding.campaignName && (
                <p className="mt-1 text-xs font-medium text-[#476454]">
                  {finding.campaignName}
                </p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-[#5c6b61]">
                {finding.detail}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-lg border border-[#d7ddd2] bg-white shadow-sm">
        <div className="border-b border-[#d7ddd2] px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c6b61]">
            Campanhas
          </h2>
          {analysis?.checkedAt && (
            <p className="mt-1 text-xs text-[#5c6b61]">
              Ultima leitura: {formatDateTime(analysis.checkedAt)}
            </p>
          )}
        </div>
        {!analysis ? (
          <EmptyState
            title="Nenhuma leitura executada"
            description="Configure as credenciais, clique em Analisar campanhas e o agente mostrara gasto, conversoes, CPA, ROAS e achados."
            className="m-4"
          />
        ) : sortedCampaigns.length === 0 ? (
          <EmptyState
            title="Nenhuma campanha retornada"
            description="A API respondeu, mas nao retornou campanhas para LAST_30_DAYS."
            className="m-4"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#d7ddd2] bg-[#f6f7f4] text-left">
                  {[
                    'Campanha',
                    'Status',
                    'Canal',
                    'Gasto',
                    'Cliques',
                    'CTR',
                    'Conv.',
                    'CPA',
                    'ROAS',
                  ].map((header) => (
                    <th key={header} className="px-4 py-3 font-semibold text-[#5c6b61]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map((campaign, index) => (
                  <tr
                    key={campaign.campaignId || `${campaign.campaignName}-${index}`}
                    className={`border-b border-[#d7ddd2] last:border-0 ${
                      index % 2 === 1 ? 'bg-[#fafbf9]' : 'bg-white'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-[#172018]">
                      {campaign.campaignName}
                    </td>
                    <td className="px-4 py-3 text-[#5c6b61]">{campaign.status}</td>
                    <td className="px-4 py-3 text-[#5c6b61]">{campaign.channelType}</td>
                    <td className="px-4 py-3 text-[#34473b]">
                      {formatMoney(campaign.cost, campaign.currencyCode)}
                    </td>
                    <td className="px-4 py-3 text-[#5c6b61]">
                      {formatNumber(campaign.clicks)}
                    </td>
                    <td className="px-4 py-3 text-[#5c6b61]">
                      {formatPercent(campaign.ctr)}
                    </td>
                    <td className="px-4 py-3 text-[#5c6b61]">
                      {formatNumber(campaign.conversions)}
                    </td>
                    <td className="px-4 py-3 text-[#5c6b61]">
                      {formatMoney(campaign.cpa, campaign.currencyCode)}
                    </td>
                    <td className="px-4 py-3 text-[#5c6b61]">
                      {formatNumber(campaign.roas)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-[#d7ddd2] bg-[#f7f9f6] p-4 text-sm text-[#5c6b61]">
        <p className="font-semibold text-[#172018]">Proximo uso do agente</p>
        <p className="mt-1 leading-relaxed">
          A leitura de Google Ads deve ser cruzada com `/funnel` e `/strategy` antes de virar proposta em `/decision`.
          A plataforma ainda nao altera campanhas, lances, budgets ou anuncios.
        </p>
      </section>
    </div>
  );
}
