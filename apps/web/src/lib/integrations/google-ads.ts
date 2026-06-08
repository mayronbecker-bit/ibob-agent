export type GoogleAdsCredentialStatus = {
  enabled: boolean;
  configured: boolean;
  apiVersion: string;
  customerIdConfigured: boolean;
  loginCustomerIdConfigured: boolean;
  missingKeys: string[];
};

export type GoogleAdsCampaignMetrics = {
  campaignId: string;
  campaignName: string;
  status: string;
  channelType: string;
  currencyCode: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  averageCpc: number;
  conversionRate: number;
  cpa: number | null;
  roas: number | null;
};

export type GoogleAdsAnalysisFinding = {
  severity: 'green' | 'yellow' | 'red';
  title: string;
  detail: string;
  campaignName?: string;
};

export type GoogleAdsCampaignAnalysis = {
  checkedAt: string;
  period: 'LAST_30_DAYS';
  currencyCode: string;
  totals: {
    campaigns: number;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionValue: number;
    ctr: number;
    averageCpc: number;
    conversionRate: number;
    cpa: number | null;
    roas: number | null;
  };
  campaigns: GoogleAdsCampaignMetrics[];
  findings: GoogleAdsAnalysisFinding[];
};

type GoogleAdsConfig = {
  enabled: boolean;
  apiVersion: string;
  developerToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  customerId?: string;
  loginCustomerId?: string;
};

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type SearchStreamResponse = Array<{
  results?: Array<{
    customer?: {
      currencyCode?: string;
    };
    campaign?: {
      id?: string;
      name?: string;
      status?: string;
      advertisingChannelType?: string;
    };
    metrics?: {
      impressions?: string | number;
      clicks?: string | number;
      costMicros?: string | number;
      conversions?: string | number;
      conversionsValue?: string | number;
      ctr?: string | number;
      averageCpc?: string | number;
    };
  }>;
  requestId?: string;
}>;

const REQUIRED_KEYS = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
];

function cleanCustomerId(value?: string) {
  return value?.replace(/[^0-9]/g, '') || undefined;
}

function toNumber(value: string | number | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyFromMicros(value: number) {
  return value / 1_000_000;
}

function safeRatio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return null;
  }

  return numerator / denominator;
}

function getConfig(): GoogleAdsConfig {
  return {
    enabled: process.env.GOOGLE_ADS_READ_ENABLED?.toLowerCase() !== 'false',
    apiVersion: process.env.GOOGLE_ADS_API_VERSION?.trim() || 'v22',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim(),
    clientId: process.env.GOOGLE_ADS_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim(),
    customerId: cleanCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID),
    loginCustomerId: cleanCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
  };
}

export function getGoogleAdsCredentialStatus(): GoogleAdsCredentialStatus {
  const config = getConfig();
  const envMap: Record<string, string | undefined> = {
    GOOGLE_ADS_DEVELOPER_TOKEN: config.developerToken,
    GOOGLE_ADS_CLIENT_ID: config.clientId,
    GOOGLE_ADS_CLIENT_SECRET: config.clientSecret,
    GOOGLE_ADS_REFRESH_TOKEN: config.refreshToken,
    GOOGLE_ADS_CUSTOMER_ID: config.customerId,
  };
  const missingKeys = REQUIRED_KEYS.filter((key) => !envMap[key]);

  return {
    enabled: config.enabled,
    configured: config.enabled && missingKeys.length === 0,
    apiVersion: config.apiVersion,
    customerIdConfigured: Boolean(config.customerId),
    loginCustomerIdConfigured: Boolean(config.loginCustomerId),
    missingKeys,
  };
}

async function getAccessToken(config: GoogleAdsConfig) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId ?? '',
      client_secret: config.clientSecret ?? '',
      refresh_token: config.refreshToken ?? '',
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as TokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        'Nao foi possivel obter access token do Google OAuth.',
    );
  }

  return payload.access_token;
}

function buildCampaignQuery() {
  return `
    SELECT
      customer.currency_code,
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `;
}

async function searchCampaigns(config: GoogleAdsConfig, accessToken: string) {
  const url = `https://googleads.googleapis.com/${config.apiVersion}/customers/${config.customerId}/googleAds:searchStream`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'developer-token': config.developerToken ?? '',
  };

  if (config.loginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: buildCampaignQuery(),
    }),
  });
  const payload = (await response.json().catch(() => [])) as SearchStreamResponse | {
    error?: { message?: string };
  };

  if (!response.ok) {
    const message =
      !Array.isArray(payload) && typeof payload.error?.message === 'string'
        ? payload.error.message
        : 'A Google Ads API retornou erro ao buscar campanhas.';
    throw new Error(message);
  }

  if (!Array.isArray(payload)) {
    throw new Error('Resposta inesperada da Google Ads API.');
  }

  return payload;
}

function parseCampaignRows(payload: SearchStreamResponse): GoogleAdsCampaignMetrics[] {
  return payload
    .flatMap((chunk) => chunk.results ?? [])
    .map((row) => {
      const metrics = row.metrics ?? {};
      const costMicros = toNumber(metrics.costMicros);
      const cost = moneyFromMicros(costMicros);
      const clicks = toNumber(metrics.clicks);
      const conversions = toNumber(metrics.conversions);
      const conversionValue = toNumber(metrics.conversionsValue);
      const averageCpcMicros = toNumber(metrics.averageCpc);

      return {
        campaignId: String(row.campaign?.id ?? ''),
        campaignName: row.campaign?.name ?? 'Campanha sem nome',
        status: row.campaign?.status ?? 'UNKNOWN',
        channelType: row.campaign?.advertisingChannelType ?? 'UNKNOWN',
        currencyCode: row.customer?.currencyCode ?? 'BRL',
        impressions: toNumber(metrics.impressions),
        clicks,
        costMicros,
        cost,
        conversions,
        conversionValue,
        ctr: toNumber(metrics.ctr),
        averageCpc: moneyFromMicros(averageCpcMicros),
        conversionRate: safeRatio(conversions, clicks) ?? 0,
        cpa: safeRatio(cost, conversions),
        roas: safeRatio(conversionValue, cost),
      };
    });
}

function buildFindings(campaigns: GoogleAdsCampaignMetrics[]) {
  const findings: GoogleAdsAnalysisFinding[] = [];
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'ENABLED');
  const costlyNoConversion = campaigns.filter(
    (campaign) => campaign.cost > 50 && campaign.conversions <= 0,
  );
  const lowCtr = campaigns.filter(
    (campaign) => campaign.impressions >= 500 && campaign.ctr > 0 && campaign.ctr < 0.01,
  );
  const highIntentWinners = campaigns.filter(
    (campaign) => campaign.conversions >= 1 && (campaign.roas ?? 0) >= 3,
  );
  const limitedEvidence = campaigns.filter(
    (campaign) => campaign.clicks > 0 && campaign.clicks < 30 && campaign.cost > 0,
  );

  if (activeCampaigns.length === 0) {
    findings.push({
      severity: 'red',
      title: 'Nenhuma campanha ativa detectada',
      detail:
        'A leitura encontrou campanhas, mas nenhuma em ENABLED. Confirme se a conta certa foi conectada.',
    });
  }

  costlyNoConversion.slice(0, 4).forEach((campaign) => {
    findings.push({
      severity: 'red',
      title: 'Gasto sem conversao atribuida',
      campaignName: campaign.campaignName,
      detail:
        'Campanha consumiu verba nos ultimos 30 dias e nao trouxe conversoes. Precisa checar termos, oferta, landing page, conversao e qualidade dos leads antes de escalar.',
    });
  });

  lowCtr.slice(0, 4).forEach((campaign) => {
    findings.push({
      severity: 'yellow',
      title: 'CTR baixo com amostra relevante',
      campaignName: campaign.campaignName,
      detail:
        'CTR abaixo de 1% com pelo menos 500 impressoes. Pode indicar desalinhamento de mensagem, segmentacao ou termo de busca.',
    });
  });

  limitedEvidence.slice(0, 4).forEach((campaign) => {
    findings.push({
      severity: 'yellow',
      title: 'Dados ainda insuficientes',
      campaignName: campaign.campaignName,
      detail:
        'A campanha tem gasto, mas poucos cliques. Evite decisoes definitivas antes de acumular mais sinal ou cruzar com funil/CRM.',
    });
  });

  highIntentWinners.slice(0, 4).forEach((campaign) => {
    findings.push({
      severity: 'green',
      title: 'Possivel campanha vencedora',
      campaignName: campaign.campaignName,
      detail:
        'Campanha com conversoes e valor/custo acima de 3x. Deve ser cruzada com margem e qualidade real do funil antes de sugerir aumento de verba.',
    });
  });

  if (findings.length === 0) {
    findings.push({
      severity: 'yellow',
      title: 'Leitura inicial sem padrao forte',
      detail:
        'A API retornou campanhas, mas nao apareceu um bloqueio ou vencedor obvio. O proximo passo e cruzar origem/campanha com funil real e CRM.',
    });
  }

  return findings;
}

export function analyzeGoogleAdsCampaigns(
  campaigns: GoogleAdsCampaignMetrics[],
): GoogleAdsCampaignAnalysis {
  const totals = campaigns.reduce(
    (acc, campaign) => ({
      campaigns: acc.campaigns + 1,
      impressions: acc.impressions + campaign.impressions,
      clicks: acc.clicks + campaign.clicks,
      cost: acc.cost + campaign.cost,
      conversions: acc.conversions + campaign.conversions,
      conversionValue: acc.conversionValue + campaign.conversionValue,
    }),
    {
      campaigns: 0,
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      conversionValue: 0,
    },
  );

  return {
    checkedAt: new Date().toISOString(),
    period: 'LAST_30_DAYS',
    currencyCode: campaigns[0]?.currencyCode ?? 'BRL',
    totals: {
      ...totals,
      ctr: safeRatio(totals.clicks, totals.impressions) ?? 0,
      averageCpc: safeRatio(totals.cost, totals.clicks) ?? 0,
      conversionRate: safeRatio(totals.conversions, totals.clicks) ?? 0,
      cpa: safeRatio(totals.cost, totals.conversions),
      roas: safeRatio(totals.conversionValue, totals.cost),
    },
    campaigns,
    findings: buildFindings(campaigns),
  };
}

export async function fetchGoogleAdsCampaignAnalysis() {
  const config = getConfig();
  const status = getGoogleAdsCredentialStatus();

  if (!status.enabled) {
    throw new Error('Leitura Google Ads desativada por GOOGLE_ADS_READ_ENABLED=false.');
  }

  if (!status.configured) {
    throw new Error(`Variaveis ausentes: ${status.missingKeys.join(', ')}`);
  }

  const accessToken = await getAccessToken(config);
  const response = await searchCampaigns(config, accessToken);
  const campaigns = parseCampaignRows(response);

  return analyzeGoogleAdsCampaigns(campaigns);
}
