# Funnel Tracking

Data: 2026-05-24

## Objetivo

Preparar a base de funil real antes das integracoes externas de Ads.

O agente nao deve otimizar por lead barato. Ele precisa enxergar quais leads viram lead qualificado, oportunidade, proposta e venda, com origem e margem quando houver.

## Principio

A primeira versao e manual-first:

- sem conectar Google Ads;
- sem conectar Meta Ads;
- sem escrever em contas externas;
- sem automatizar execucao;
- com formato minimo para importacao revisada.

## Schema local preparado

Migration local criada:

```text
infra/supabase/migrations/20260524100000_create_funnel_tracking.sql
```

Tabelas:

- `funnel_import_batches`
- `funnel_events`

Enums:

- `funnel_event_stage`
- `funnel_event_source`
- `funnel_import_status`

Eventos previstos:

- `lead`
- `qualified_lead`
- `opportunity`
- `proposal_sent`
- `sale_won`
- `sale_lost`
- `disqualified`

Origens previstas:

- `google_ads`
- `meta_ads`
- `organic`
- `whatsapp`
- `marketplace`
- `direct`
- `referral`
- `crm`
- `other`

## Tela do produto

Rota criada:

```text
/funnel
```

Ela mostra:

- checklist para liberar os 7 pontos faltantes da base 100;
- caminho de resolucao manual;
- colunas obrigatorias;
- exemplos de eventos esperados;
- aviso de que nenhuma integracao externa esta ativa.

## Template de importacao

Template local:

```text
docs/templates/funnel_events_import_template.csv
```

Colunas:

- `occurred_at`
- `stage`
- `source`
- `company_name`
- `contact_name`
- `campaign_name`
- `lead_quality_score`
- `deal_value_brl`
- `gross_margin_brl`
- `notes`

## Proxima acao

Migration aplicada no Supabase remoto em 2026-05-24 apos autorizacao do usuario.

Validacoes realizadas:

- `funnel_events` existe no schema `public`;
- `funnel_import_batches` existe no schema `public`;
- enums `funnel_event_stage`, `funnel_event_source` e `funnel_import_status` existem;
- policies RLS de leitura por membros e escrita por owners/admins existem;
- migration `20260524100000` aparece como local/remota no historico do Supabase.

Proxima acao:

V43 implementa a primeira entrada manual em `/funnel`:

- formulario para registrar evento real de funil;
- leitura dos ultimos eventos reais em `funnel_events`;
- fallback para exemplos mockados quando a leitura falhar;
- registro de auditoria `funnel.event_created`;
- checklist ajustado conforme eventos reais comecam a existir.

V44 conecta o funil real a `/strategy`:

- eventos reais passam a compor a nota de tracking/funil;
- `/funnel` ganha resumo de eventos, etapas, vendas, receita e margem;
- `/strategy` exibe evidencias de funil conectado a estrategia.

Proxima acao:

Validar `/strategy` apos registrar eventos reais em `/funnel` e conferir a recalibracao da nota.
