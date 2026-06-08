# Google Ads Integration

Data: 2026-06-08
Versao: v60

## Objetivo

Conectar Google Ads em modo leitura para que o agente analise campanhas reais antes de sugerir qualquer acao.

Esta etapa substitui temporariamente a prioridade de IA externa OpenAI, porque a necessidade operacional agora e entender campanhas reais.

## Fontes oficiais

- Quickstart Google Ads API: https://developers.google.com/google-ads/api/docs/get-started/make-first-call
- REST authorization and headers: https://developers.google.com/google-ads/api/rest/auth
- Campaign fields and metrics: https://developers.google.com/google-ads/api/fields/v22/campaign
- GAQL query language: https://developers.google.com/google-ads/api/docs/query/overview

## Entrega v60

Criadas as rotas server-side:

```text
/api/integrations/google-ads/status
/api/integrations/google-ads/campaigns
```

Criada a tela:

```text
/google-ads
```

O app agora consegue:

- verificar se as credenciais server-side estao configuradas;
- obter access token via OAuth refresh token;
- consultar campanhas por Google Ads API REST `searchStream`;
- ler metricas dos ultimos 30 dias;
- calcular gasto, cliques, CTR, conversoes, CPA e ROAS;
- gerar achados supervisionados de campanha;
- manter qualquer escrita em Ads bloqueada.

## Variaveis de ambiente

Configurar na Hostinger, nunca no Git:

```text
GOOGLE_ADS_READ_ENABLED=true
GOOGLE_ADS_API_VERSION=v22
GOOGLE_ADS_DEVELOPER_TOKEN=<developer-token>
GOOGLE_ADS_CLIENT_ID=<oauth-client-id>
GOOGLE_ADS_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_ADS_REFRESH_TOKEN=<oauth-refresh-token>
GOOGLE_ADS_CUSTOMER_ID=<customer-id-da-conta-anunciadora>
GOOGLE_ADS_LOGIN_CUSTOMER_ID=<manager-id-opcional>
```

Observacoes:

- `GOOGLE_ADS_CUSTOMER_ID` pode ser informado com ou sem hifens.
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` e opcional quando o OAuth pertence diretamente a conta cliente.
- Se o acesso vier por MCC/manager, preencher `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.
- O app nao mostra tokens, client secret, refresh token ou developer token.

## Consulta usada

A primeira leitura usa `LAST_30_DAYS` com campos de campanha:

```sql
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
```

## Guardrails

A v60 nao:

- altera campanhas;
- altera orcamento;
- altera lances;
- pausa anuncios;
- cria propostas automaticamente;
- usa MCP de escrita;
- grava credenciais no banco.

Qualquer recomendacao deve seguir:

```text
Google Ads leitura -> Funil Real -> Estrategia CMO -> Decision Engine -> Rule Validator -> Aprovacao -> Execution dry-run
```

## Proxima etapa

Depois de validar a leitura:

1. cruzar campanha/origem com eventos de `/funnel`;
2. transformar achados fortes em hipoteses no `/decision`;
3. permitir que o `rule_validator` certifique uma proposta;
4. manter execucao real bloqueada ate autorizacao explicita.
