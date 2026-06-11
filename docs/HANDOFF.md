# Handoff do Projeto iBob Agent

Data: 2026-06-11  
Versao de referencia: v61  
Status: piloto funcional em evolucao, com nucleo supervisionado pronto e Google Ads em leitura inicial

## Resumo executivo

O iBob Agent e uma plataforma SaaS em desenvolvimento para atuar como um agente estrategico de marketing e vendas. A proposta nao e apenas mostrar metricas de Ads, mas entender o contexto comercial da empresa, cruzar esse contexto com funil/CRM, analisar campanhas, sugerir decisoes supervisionadas e impedir acoes arriscadas sem validacao humana.

A iBob e o primeiro cliente piloto. O produto foi desenhado para depois virar uma solucao vendavel e escalavel para outros clientes.

## Ideia central do software

O software funciona como um CMO/analista operacional com governanca:

1. Entende o contexto da empresa por perguntas, respostas, memoria e pesquisa supervisionada.
2. Analisa funil real, qualidade de leads, margem, capacidade comercial e metas.
3. Le dados de midia e fontes externas em modo leitura.
4. Gera diagnosticos e hipoteses.
5. Passa hipoteses por Decision Engine e Rule Validator.
6. Exige aprovacao humana.
7. Registra dry-run de execucao antes de qualquer acao real.
8. So depois, em etapa futura, podera executar mudancas controladas em Ads.

O principio mais importante: o agente e o cerebro analitico e guardiao dos numeros. Conectores externos, incluindo Google Ads e Meta Ads, sao fontes/adaptadores supervisionados, nao o centro da inteligencia.

## Stack e arquitetura atual

- Frontend/backend web: Next.js em `apps/web`.
- Hospedagem: Hostinger Node.js Web App.
- Deploy atual: ZIP manual gerado por `scripts/build-hostinger-zip.ps1`.
- Banco de dados: Supabase, usando PostgreSQL.
- Autenticacao: Supabase Auth, com RLS por cliente.
- Protecao externa: Basic Auth via `server.js` na Hostinger.
- Dominio de producao: `adsia.ia.br`.
- Repositorio Git: branch `main`.
- Documentacao operacional: pasta `docs/`.

## Banco de dados

O banco principal e Supabase/PostgreSQL. Ele guarda:

- clientes;
- usuarios e memberships;
- versoes do agente;
- fontes de dados;
- metricas brutas;
- propostas;
- aprovacoes;
- memoria de decisao;
- auditoria;
- contexto comercial;
- pesquisa contextual;
- memoria contextual;
- funil real;
- rule validator;
- execution logs.

As migrations ficam em:

```text
infra/supabase/migrations/
```

## O que ja foi feito

### Base do projeto

- Estrutura local criada.
- App Next.js em `apps/web`.
- Scripts root para `dev`, `lint`, `build`.
- Deploy manual por ZIP para Hostinger.
- Documentacao de setup, deploy, Hostinger, decisoes e changelog.
- Blueprint original da Claude importado em `docs/claude-blueprint/`.

### Autenticacao e seguranca

- Basic Auth externo para impedir acesso publico irrestrito.
- Supabase Auth para login real no dashboard.
- RLS no Supabase por cliente.
- Modelo inicial de roles: `owner`, `admin`, `approver`, `viewer`.
- Headers defensivos no servidor Node.
- Fluxo de logout.

### Produto piloto

- Dashboard inicial.
- Tela de configuracoes.
- Data Trust Layer.
- Propostas.
- Aprovacao humana.
- Memoria de decisao.
- Auditoria.
- Roadmap vivo dentro do app.

### Context Intelligence

- Schema de contexto comercial.
- Perguntas intencionais para entender empresa, oferta, publico, economia, capacidade, restricoes e metas.
- Tela `/context` para diagnostico.
- Lacunas de contexto.
- Salvamento de respostas no Supabase.

### Context Research Layer

- Schema para pesquisa supervisionada.
- Console `/research`.
- Registro do site oficial da iBob.
- Achados supervisionados da iBob.
- Concorrentes candidatos.
- Memorias contextuais.
- Revisao humana de achados, insights, concorrentes e memorias.
- Auditoria das revisoes.

### Estrategia CMO

- Tela `/strategy`.
- Nota CMO.
- Breakdown da nota.
- Calculo de CAC, margem, capacidade e cenarios de CPL maximo.
- Indica o que falta para chegar a uma base 100.
- Botao/fluxo de resolucao orientado.

### Funil real

- Schema `funnel_tracking`.
- Tela `/funnel`.
- Entrada manual real no Supabase.
- Eventos de funil com origem, etapa, qualidade do lead, valor e margem.
- Template CSV de importacao manual.

### Decision Engine

- Tela `/decision`.
- Pre-motor deterministico usando contexto, pesquisa, funil e Data Trust.
- Gera hipoteses e bloqueios, mas nao executa nada.

### Rule Validator

- Schema `rule_validator`.
- Tela `/validator`.
- Catalogo de regras.
- Dry-runs registrados.
- Historico de checks.
- Certificacao supervisionada de proposta existente.
- Nenhuma execucao externa liberada.

### Execution Engine

- Tela `/execution`.
- Dry-run de execucao.
- Preflight.
- Plano de rollback.
- Logs em `execution_logs`.
- Auditoria de simulacoes.
- Sem chamada real para Ads/MCP.

### Conversa com agente

- Tela `/agent`.
- Respostas supervisionadas sobre marketing, vendas, CAC, funil e qualidade de leads.
- Tentativa de integrar OpenAI/ChatGPT API.
- A integracao OpenAI esta tecnicamente pronta, mas ficou bloqueada por quota/billing da conta OpenAI.
- O app mostra erro de quota e cai no fallback local.

### Google Ads em modo leitura

- Tela `/google-ads`.
- Rotas server-side:

```text
/api/integrations/google-ads/status
/api/integrations/google-ads/campaigns
```

- Verificacao segura de credenciais.
- Consulta REST `searchStream` da Google Ads API.
- Leitura de campanhas dos ultimos 30 dias.
- Metricas: gasto, cliques, CTR, conversoes, valor de conversao, CPA e ROAS.
- Achados supervisionados iniciais.
- Nenhuma escrita em campanhas, lances, budgets ou anuncios.

## Estado atual

O nucleo supervisionado esta funcional e validado em varias etapas. A fase atual e integracao em modo leitura, com Google Ads iniciado.

Roadmap atual:

- Etapas 0 a 13: concluidas.
- Etapa 14: integracoes em modo leitura, em andamento.
- Etapa 15: execucao controlada, planejada.

A prioridade atual e fazer a leitura real do Google Ads funcionar em producao, validar os dados retornados e cruzar campanhas com funil/CRM antes de gerar qualquer proposta operacional.

## O que falta fazer

### Prioridade 1 - Google Ads leitura real

- Configurar credenciais reais na Hostinger.
- Validar `/google-ads` em producao.
- Corrigir eventuais erros de OAuth, developer token, customer ID ou MCC.
- Confirmar se os dados batem com a interface do Google Ads.
- Cruzar campanhas com eventos de `/funnel`.
- Persistir snapshots de leitura no Supabase, se o time decidir que deve haver historico.

### Prioridade 2 - Analise de campanhas mais profunda

- Adicionar consultas por grupo de anuncio.
- Adicionar termos de busca.
- Adicionar assets/criativos.
- Adicionar conversoes por tipo.
- Separar brand, non-brand, shopping/performance max/search.
- Criar heuristicas por tipo de campanha.
- Transformar achados fortes em hipoteses no `/decision`.

### Prioridade 3 - Meta Ads leitura

- Repetir padrao de Google Ads para Meta Ads.
- Criar tela ou aba equivalente.
- Manter somente leitura.
- Cruzar com funil e estrategia.

### Prioridade 4 - CRM/funil

- Definir origem real dos dados de CRM.
- Automatizar importacao ou sincronizacao.
- Garantir qualidade de lead, status comercial, venda, margem e motivo de desqualificacao.
- Sem isso, Ads sozinho pode otimizar para lead ruim.

### Prioridade 5 - Produto escalavel

- Generalizar configuracoes da iBob para multi-cliente.
- Criar onboarding de novo cliente.
- Definir planos, limites, billing e suporte.
- Melhorar observabilidade e alertas.
- Avaliar se Hostinger continua adequada para escala.

### Prioridade 6 - Execucao controlada

- Liberar escrita externa somente depois de:
  - leitura confiavel;
  - funil/CRM confiavel;
  - rule validator certificado;
  - aprovacao humana;
  - dry-run e rollback testados;
  - autorizacao explicita do usuario.

## Credenciais e variaveis de ambiente

Nunca salvar secrets no Git.

### Hostinger / acesso externo

```text
BASIC_AUTH_ENABLED=true
BASIC_AUTH_USERNAME=
BASIC_AUTH_PASSWORD=
```

### Supabase

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

### OpenAI

Opcional por enquanto. A conta atual apresentou erro de quota/billing.

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
OPENAI_ANALYSIS_ENABLED=true
```

### Google Ads

Necessario para a proxima validacao.

```text
GOOGLE_ADS_READ_ENABLED=true
GOOGLE_ADS_API_VERSION=v22
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
```

`GOOGLE_ADS_LOGIN_CUSTOMER_ID` e opcional para acesso direto. Usar quando o acesso vier por MCC/manager.

## Como rodar localmente

Na raiz do projeto:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

O app principal fica em:

```text
apps/web
```

## Como gerar deploy para Hostinger

Na raiz:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-hostinger-zip.ps1
```

O ZIP padrao gerado:

```text
deploy/hostinger/ibob-agent-web-hostinger.zip
```

Padrao usado no projeto: copiar esse ZIP com nome versionado antes de publicar.

Config Hostinger conhecida:

```text
Framework: Other ou Next.js, conforme tela do hPanel
Node: 24.x
Root: ./
Build command: npm run build
Package manager: npm
Output directory: .next
Entry file: server.js
```

## Rotas principais

```text
/
/agent
/google-ads
/data-trust
/proposals
/approvals
/audit
/context
/research
/strategy
/funnel
/decision
/validator
/execution
/memory
/roadmap
/settings
```

## Riscos e atencoes

- Google Ads ainda nao foi validado com credenciais reais em producao.
- OpenAI esta bloqueada por quota/billing, nao por codigo.
- O app ainda depende de deploy manual por ZIP.
- Parte do produto ainda usa mock/fallback controlado quando Supabase ou credenciais falham.
- O fluxo multi-cliente esta preparado conceitualmente, mas a operacao esta focada no cliente iBob.
- Nao liberar escrita em Ads sem nova decisao tecnica e autorizacao explicita.
- O valor do produto depende de cruzar Ads com funil/CRM; analisar apenas Ads pode levar a conclusoes ruins.

## Recomendacao para o novo time

1. Ler `docs/PRODUCT_STRATEGY.md`.
2. Ler `docs/DECISIONS.md`.
3. Ler `docs/GOOGLE_ADS_INTEGRATION.md`.
4. Validar `.env.example` contra variaveis reais da Hostinger.
5. Rodar `npm.cmd run lint` e `npm.cmd run build`.
6. Publicar v60/v61 em ambiente atual.
7. Abrir `/google-ads` e corrigir credenciais ate a leitura real funcionar.
8. Conferir numeros contra o painel do Google Ads.
9. So depois planejar persistencia dos snapshots e geracao de hipoteses no Decision Engine.

## Documentos mais importantes

- `docs/PRODUCT_STRATEGY.md`
- `docs/DECISIONS.md`
- `docs/GOOGLE_ADS_INTEGRATION.md`
- `docs/AUTH_AND_DATABASE.md`
- `docs/HOSTINGER.md`
- `docs/CHANGELOG.md`
- `docs/SUPERVISED_CORE_COMPLETION.md`
- `docs/CONTEXT_INTELLIGENCE.md`
- `docs/CONTEXT_RESEARCH.md`
- `docs/FUNNEL_TRACKING.md`
- `docs/DECISION_ENGINE.md`
- `docs/RULE_VALIDATOR.md`
- `docs/EXECUTION_ENGINE.md`
