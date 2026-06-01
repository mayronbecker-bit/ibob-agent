# Autenticacao e banco de dados

Data: 2026-05-16

## Objetivo

Preparar a fundacao real de autenticacao e persistencia para transformar o piloto iBob em produto vendavel e multi-cliente.

Esta etapa ainda nao substitui o Basic Auth temporario da Hostinger. O app continua protegido por usuario/senha enquanto o Supabase Auth e validado em ambiente controlado.

## Fontes oficiais usadas

- Supabase SSR para Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started

Pontos relevantes:

- Supabase recomenda `@supabase/supabase-js` e `@supabase/ssr` para apps Next.js com SSR.
- Tabelas expostas no schema `public` devem ter Row Level Security habilitado.
- A CLI pode ser usada via `npx supabase`, e requer Node.js 20 ou superior.

## O que foi preparado

### App Next.js

Dependencias adicionadas em `apps/web`:

```text
@supabase/supabase-js
@supabase/ssr
```

Helpers criados:

```text
apps/web/src/lib/supabase/env.ts
apps/web/src/lib/supabase/client.ts
apps/web/src/lib/supabase/server.ts
apps/web/src/lib/supabase/database.types.ts
apps/web/src/lib/auth/roles.ts
```

Esses arquivos permitem criar clientes Supabase de browser e server quando as variaveis estiverem configuradas.

### Variaveis de ambiente

Adicionadas em `.env.example`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Nunca preencher esses valores reais no repositorio.

### Schema inicial

Migration criada:

```text
infra/supabase/migrations/20260516170000_initial_platform_auth.sql
```

Inclui:

- `clients`
- `user_profiles`
- `client_memberships`
- `agent_versions`
- `data_sources`
- `raw_metrics`
- `proposals`
- `approvals`
- `decision_memory`
- `execution_logs`

Tambem inclui enums, indices, triggers de `updated_at`, funcoes auxiliares para roles e policies de RLS por `client_id`.

### Roles

Modelo inicial:

```text
owner
admin
approver
viewer
```

Regra geral:

- `owner/admin`: gerenciam cliente, membros, fontes, propostas e logs.
- `approver`: le dados e cria aprovacoes.
- `viewer`: somente leitura.

## Fluxo recomendado

1. Criar projeto no Supabase.
2. Configurar Auth com email/senha.
3. Revisar a migration SQL.
4. Aplicar a migration com autorizacao do usuario.
5. Criar o primeiro usuario no Supabase Auth.
6. Vincular esse usuario ao cliente `client-ibob` em `client_memberships` com role `owner`.
7. Configurar as variaveis no ambiente local.
8. Criar tela de login real.
9. Testar localmente.
10. So entao planejar substituicao gradual do Basic Auth temporario.

## Comandos previstos

Depois que o projeto Supabase existir:

```powershell
npx supabase login
npx supabase --workdir infra init
npx supabase --workdir infra link --project-ref <project-ref>
npx supabase --workdir infra db push
```

Esses comandos nao devem ser executados contra ambiente real sem confirmacao explicita do usuario.

## Estado atual

- Dependencias instaladas.
- Helpers criados.
- Schema SQL versionado e aplicado no projeto Supabase `euedumaappfxqabgdizi`.
- `/settings` mostra se o Supabase esta configurado.
- `/login` criado com Supabase Auth por email/senha.
- Dashboard protegido no browser por sessao Supabase.
- Botao `Sair` criado na Sidebar.
- Nenhum deploy realizado nesta etapa.
- Variaveis publicas configuradas apenas em `apps/web/.env.local`, ignorado pelo Git.

## Validacao da migration

Validado em 2026-05-16:

```text
npx.cmd supabase --workdir infra db push
npx.cmd supabase --workdir infra migration list
npx.cmd supabase --workdir infra gen types typescript --linked --schema public
```

Resultado:

- Migration remota `20260516170000` aplicada.
- Tabelas, enums e funcoes aparecem na geracao de tipos remotos.

## Proxima etapa tecnica

Validar login real localmente. Depois, configurar as variaveis publicas do Supabase na Hostinger, gerar o ZIP v9 e reimplantar com Basic Auth ainda ativo. O Basic Auth so deve ser removido depois de validar login, sessao e RLS em producao.

## Variaveis para deploy

Configurar na Hostinger antes do proximo deploy:

```text
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Essas chaves sao publicas para o browser. Ainda assim, nao devem ser escritas em arquivos versionados.

## Owner inicial

Migration preparada em 2026-05-17:

```text
infra/supabase/migrations/20260517100000_link_ibob_initial_owner.sql
```

Ela vincula o primeiro usuario criado no Supabase Auth como `owner` do cliente `client-ibob`, sem armazenar senha ou secrets.

Aplicada em 2026-05-17 e validada com:

```text
client_id: client-ibob
role: owner
status: active
```

Migration de substituicao preparada em 2026-05-17:

```text
infra/supabase/migrations/20260517103000_link_replacement_ibob_owner.sql
```

Ela adiciona um novo usuario autenticado como `owner` ativo, mantendo owners existentes ate validacao do novo login.

Aplicada em 2026-05-17 e validada com:

```text
client_id: client-ibob
role: owner
status: active
```

Depois da validacao do novo login, o usuario antigo foi removido manualmente no painel Supabase pelo usuario. Consulta remota confirmou que apenas o novo `owner` ativo permanece em `client-ibob`.

## Deploy v9

Pacote gerado em 2026-05-17:

```text
deploy/hostinger/ibob-agent-web-hostinger-v9-supabase-auth.zip
```

Validacoes:

```text
npm.cmd run lint
npm.cmd run build
npm.cmd run hostinger:build
```

Tambem foi validado build dentro da pasta empacotada com as variaveis publicas do Supabase injetadas por ambiente.

Publicacao validada em 2026-05-17:

- `https://adsia.ia.br` carregou apos Basic Auth e login Supabase.
- Usuario `owner` novo conseguiu acessar o dashboard.
- Acesso sem Basic Auth em `/` e `/login` retorna HTTP 401, mantendo a camada externa ativa.

## Primeira tela com dados reais

Implementado em 2026-05-17:

- `/settings` le do Supabase o usuario autenticado, membership, cliente ativo e versao ativa do agente.
- A leitura usa o cliente Supabase do browser, aproveitando a sessao validada pelo login.
- RLS limita a leitura ao usuario autenticado e ao `client_id` vinculado em `client_memberships`.
- Data sources ainda aparecem como mock, com contagem separada de registros reais no Supabase.

Pacote gerado:

```text
deploy/hostinger/ibob-agent-web-hostinger-v10-settings-supabase.zip
```

Publicacao validada em 2026-05-17:

- Usuario confirmou `/settings` funcionando com dados reais.
- Acesso anonimo externo em `/settings` retorna HTTP 401 por Basic Auth.

## Data Trust com fontes reais

Migration aplicada em 2026-05-17:

```text
infra/supabase/migrations/20260517120000_seed_ibob_data_sources.sql
```

Ela cria ou atualiza as fontes iniciais do cliente `client-ibob` em `public.data_sources`, sem armazenar credenciais de APIs externas.

Fontes validadas no Supabase remoto:

- Google Ads API
- Meta Marketing API
- GA4 / Analytics
- Orbita (margem)
- CRM / Leads

Implementado no app:

- `/data-trust` le `client_memberships` e `data_sources` pelo Supabase usando a sessao autenticada.
- RLS limita a leitura ao `client_id` do usuario logado.
- A tela mostra o badge `Supabase` quando a leitura real funciona e volta para `Mock` apenas em fallback.

Pacote gerado em 2026-05-17:

```text
deploy/hostinger/ibob-agent-web-hostinger-v11-data-sources.zip
```

Validacoes:

```text
npm.cmd run lint
npm.cmd run build
npm.cmd run hostinger:build
```

Tambem foi validado build dentro da pasta empacotada com as variaveis publicas do Supabase injetadas por ambiente.

Publicacao validada em 2026-05-17:

- Usuario confirmou que a v11 funcionou em producao.
- `/data-trust` passou a operar com fontes reais do Supabase para `client-ibob`.

## Propostas com dados reais

Migration aplicada em 2026-05-17:

```text
infra/supabase/migrations/20260517133000_seed_ibob_proposals.sql
```

Ela cria ou atualiza as propostas iniciais do cliente `client-ibob` em `public.proposals`, em modo supervisionado/dry-run. Nenhuma acao e enviada para contas externas.

Propostas validadas no Supabase remoto:

- 2 pendentes
- 1 aprovada
- 1 rejeitada
- 1 executada

Implementado no app:

- `/proposals` le `client_memberships` e `proposals` pelo Supabase usando a sessao autenticada.
- RLS limita a leitura ao `client_id` do usuario logado.
- A tela mostra o badge `Supabase` quando a leitura real funciona e volta para `Mock` apenas em fallback.
- Aprovacoes continuam fora desta etapa; a fila e somente leitura em producao.

Pacote gerado em 2026-05-17:

```text
deploy/hostinger/ibob-agent-web-hostinger-v12-proposals-supabase.zip
```

Validacoes:

```text
npm.cmd run lint
npm.cmd run build
npm.cmd run hostinger:build
```

Tambem foi validado build dentro da pasta empacotada com as variaveis publicas do Supabase injetadas por ambiente.

Publicacao validada em 2026-05-17:

- Usuario confirmou que a v12 funcionou em producao.
- `/proposals` passou a operar com propostas reais do Supabase para `client-ibob`.

## Aprovacoes com dados reais

Migration aplicada em 2026-05-17:

```text
infra/supabase/migrations/20260517150000_seed_ibob_approvals.sql
```

Ela cria ou atualiza o historico inicial de aprovacoes do cliente `client-ibob` em `public.approvals` e adiciona a funcao segura:

```text
public.record_proposal_decision(target_proposal_id, decision, justification)
```

Essa funcao:

- exige usuario autenticado;
- exige role `owner`, `admin` ou `approver` no cliente da proposta;
- aceita apenas propostas ainda `pending`;
- grava a decisao em `public.approvals`;
- atualiza o status da proposta para `approved`, `rejected` ou `deferred`;
- nao executa nenhuma acao externa em Google Ads ou Meta.

Validado no Supabase remoto:

- migration `20260517150000` aplicada;
- funcao `record_proposal_decision` criada como `SECURITY DEFINER`;
- 3 aprovacoes historicas registradas;
- fila de propostas manteve 2 pendentes para decisao supervisionada.

Implementado no app:

- `/approvals` le `proposals`, `approvals` e `user_profiles` pelo Supabase usando a sessao autenticada.
- A tela mostra o badge `Supabase` quando a leitura real funciona e volta para `Mock` apenas em fallback.
- Botoes `Aprovar`, `Rejeitar` e `Adiar` persistem a decisao via RPC Supabase.
- Nenhum executor externo foi criado nesta etapa.

Pacote gerado em 2026-05-17:

```text
deploy/hostinger/ibob-agent-web-hostinger-v13-approvals-supabase.zip
```

Validacoes:

```text
npm.cmd run lint
npm.cmd run build
npm.cmd run hostinger:build
```

Tambem foi validado build dentro da pasta empacotada com as variaveis publicas do Supabase injetadas por ambiente.

Publicacao validada em 2026-05-17:

- Usuario confirmou que a v13 funcionou em producao.
- `/approvals` passou a operar com aprovacoes reais do Supabase para `client-ibob`.
- O fluxo de decisao grava no banco, mas nao executa nenhuma acao externa.

## Memoria de decisao com dados reais

Migration aplicada em 2026-05-17:

```text
infra/supabase/migrations/20260517163000_seed_ibob_decision_memory.sql
```

Ela cria ou atualiza as entradas iniciais de memoria do cliente `client-ibob` em `public.decision_memory`.

Validado no Supabase remoto:

- migration `20260517163000` aplicada;
- 4 entradas de memoria registradas;
- 2 aprendizados aprovados com impacto medido;
- 2 aprendizados rejeitados sem impacto medido.

Implementado no app:

- `/memory` le `client_memberships` e `decision_memory` pelo Supabase usando a sessao autenticada.
- RLS limita a leitura ao `client_id` do usuario logado.
- A tela mostra o badge `Supabase` quando a leitura real funciona e volta para `Mock` apenas em fallback.

Pacote gerado em 2026-05-17:

```text
deploy/hostinger/ibob-agent-web-hostinger-v14-memory-supabase.zip
```

Validacoes:

```text
npm.cmd run lint
npm.cmd run build
npm.cmd run hostinger:build
```

Tambem foi validado build dentro da pasta empacotada com as variaveis publicas do Supabase injetadas por ambiente.

Publicacao validada em 2026-05-18:

- Usuario confirmou que a v14 funcionou em producao.
- `/memory` passou a operar com memoria de decisao real do Supabase para `client-ibob`.

## Raw metrics e dashboard com dados reais

Migration aplicada em 2026-05-18:

```text
infra/supabase/migrations/20260518100000_seed_ibob_raw_metrics.sql
```

Ela cria ou atualiza metricas brutas iniciais do cliente `client-ibob` em `public.raw_metrics`, referenciando as fontes Google Ads e Meta Ads ja cadastradas. Os dados ainda sao seed controlado; nao ha integracao externa ativa.

Validado no Supabase remoto:

- migration `20260518100000` aplicada;
- 12 registros de metricas brutas criados;
- periodo atual `2026-05-18`: gasto R$ 18.400, receita R$ 77.300, ROAS 4,20, 271 leads, CPA R$ 67,90;
- periodo anterior `2026-05-11`: gasto R$ 17.200, receita R$ 67.080, ROAS 3,90, 239 leads, CPA R$ 71,97.

Implementado no app:

- `/` le `raw_metrics`, `data_sources`, `proposals`, `approvals` e `user_profiles` pelo Supabase usando a sessao autenticada.
- Os cards de metricas sao derivados de `raw_metrics`.
- O dashboard mostra o badge `Supabase` quando a leitura real funciona e volta para `Mock` apenas em fallback.
- Nenhuma integracao Google Ads, Meta, GA4 ou CRM foi ativada nesta etapa.

Pacote gerado em 2026-05-18:

```text
deploy/hostinger/ibob-agent-web-hostinger-v15-raw-metrics-dashboard.zip
```

Validacoes:

```text
npm.cmd run lint
npm.cmd run build
npm.cmd run hostinger:build
```

Tambem foi validado build dentro da pasta empacotada com as variaveis publicas do Supabase injetadas por ambiente.

Publicacao validada em 2026-05-18:

- Usuario confirmou que a v15 funcionou em producao.
- `/` passou a operar com dashboard derivado de `raw_metrics` reais do Supabase para `client-ibob`.

## Audit events

Migration preparada em 2026-05-19:

```text
infra/supabase/migrations/20260519093000_create_audit_events.sql
```

Ela prepara a tabela `public.audit_events` para registrar eventos de produto, seguranca e operacao por cliente.

Estado atual:

- migration `20260519093000` aplicada no Supabase remoto em 2026-05-19;
- tabela `public.audit_events` validada no remoto;
- RLS ativo em `public.audit_events`;
- policy `members can read audit events` criada para leitura por membros do cliente;
- policy `admins can write audit events` criada para insercao por owners/admins;
- evento inicial `platform.audit_foundation_created` registrado para `client-ibob`.

Uso planejado:

- registrar aprovacoes, rejeicoes e adiamentos relevantes;
- registrar hardenings e mudancas operacionais;
- registrar eventos futuros do Decision Engine, rule_validator e Execution Engine dry-run;
- manter trilha de auditoria antes de conectar integracoes externas.

Implementado no app:

- `/audit` le `client_memberships` e `audit_events` pelo Supabase usando a sessao autenticada.
- RLS limita a leitura ao `client_id` do usuario logado.
- A tela mostra contadores por severidade, lista eventos recentes e volta para mock apenas em fallback.
- O menu lateral passa a incluir a entrada `Auditoria`.

## Context Intelligence

Migration preparada em 2026-05-19:

```text
infra/supabase/migrations/20260519133000_create_context_intelligence.sql
```

Ela prepara a base para o diagnostico inteligente da empresa antes de Decision Engine, rule_validator ou integracoes externas de Ads.

Inclui:

- enums de status, categoria de pergunta, tipo de resposta, fonte de resposta, status de lacuna e severidade;
- `business_contexts`;
- `context_questions`;
- `context_answers`;
- `context_versions`;
- `context_gaps`;
- indices por cliente/status/categoria;
- triggers de `updated_at`;
- RLS por `client_id`;
- leitura por membros do cliente;
- escrita por `owner` e `admin`;
- seed de 19 perguntas intencionais;
- contexto draft inicial para `client-ibob`;
- lacuna aberta para migrar o contexto comercial ja levantado da iBob.

Estado atual:

- migration aplicada no Supabase remoto em 2026-05-19;
- historico remoto validado com `npx.cmd supabase --workdir infra migration list`;
- tipos remotos validaram `business_contexts`, `context_questions`, `context_answers`, `context_versions`, `context_gaps` e `context_status`;
- tipos TypeScript atualizados no app;
- Roadmap atualizado para marcar Context Intelligence em andamento.

Proxima acao:

Migrar o contexto comercial ja levantado da iBob para `context_answers`.

## Tela de diagnostico inteligente

Implementado em 2026-05-19:

- rota `/context`;
- item `Diagnostico` no menu lateral;
- leitura real de `business_contexts`, `context_questions`, `context_answers` e `context_gaps` via Supabase;
- fallback controlado para mocks quando a leitura real falhar;
- salvamento de respostas em `context_answers`;
- recalculo de `business_contexts.completeness_score` apos salvar resposta;
- exibicao de lacunas abertas antes de liberar Decision Engine.

Nenhuma integracao externa de Ads foi conectada nesta etapa.

## Context Research Layer

Migration preparada localmente em 2026-05-19:

```text
infra/supabase/migrations/20260519160000_create_context_research_layer.sql
```

Ela prepara a camada para o agente pesquisar o site da empresa e concorrentes antes do Decision Engine.

Inclui:

- `context_research_runs`;
- `context_research_sources`;
- `context_research_findings`;
- `competitor_profiles`;
- `competitor_insights`;
- `context_memory_items`;
- RLS por `client_id`;
- leitura por membros do cliente;
- escrita por `owner` e `admin`;
- lacuna inicial `ibob.company_site_required` para pedir o site oficial da iBob.

Estado atual:

- migration `20260519160000_create_context_research_layer.sql` aplicada no Supabase remoto em 2026-05-19;
- migration `20260519163000_seed_ibob_context_research_run.sql` aplicada no Supabase remoto em 2026-05-19;
- site oficial `https://www.ibob.com.br` registrado em `context_research_runs` como run `queued`;
- tipos TypeScript atualizados no app;
- Roadmap atualizado com a etapa `Context Research Layer`.

Proxima acao:

Criar o executor/agente de pesquisa supervisionado para coletar fontes do site oficial e concorrentes, registrar achados e exigir revisao humana antes de promover para memoria contextual.

## Console de pesquisa supervisionada

Implementado em 2026-05-19:

- rota `/research`;
- item `Pesquisa` no menu lateral;
- leitura real de `context_research_runs`, `context_research_sources`, `context_research_findings`, `competitor_profiles`, `competitor_insights` e `context_memory_items`;
- fallback controlado para mocks;
- criacao de novos runs supervisionados em `context_research_runs`;
- nenhum acesso automatico a sites externos;
- nenhuma promocao automatica de achados para memoria.

Proxima acao:

Criar o executor/agente que consulta o site oficial e concorrentes, registra fontes e achados, e deixa tudo pendente de revisao humana.

## Achados supervisionados da pesquisa iBob

Preparado e aplicado no Supabase remoto em 2026-05-20:

```text
infra/supabase/migrations/20260520100000_seed_ibob_supervised_research_findings.sql
```

Ela registra a primeira carga de pesquisa publica da iBob:

- fontes oficiais da iBob e loja oficial;
- fontes de concorrentes candidatos;
- achados de posicionamento, canais, processo comercial, localizacao e oportunidades;
- perfis de concorrentes candidatos;
- insights concorrenciais pendentes de revisao;
- itens de memoria contextual em `draft`;
- lacuna `ibob.research_findings_review_pending`.

Estado:

- migration versionada localmente e aplicada no remoto;
- historico remoto validado com `supabase migration list`;
- nenhum achado vira contexto ativo sem revisao humana;
- nenhum item de memoria vira `active` nesta etapa.

Proxima acao:

Revisar os achados em `/research` e promover apenas o que for validado para memoria contextual ativa.

## Revisao operacional de achados

Implementado em 2026-05-20:

- `/research` permite aceitar ou rejeitar `context_research_findings`;
- `/research` permite aceitar ou rejeitar `competitor_insights`;
- `/research` permite ativar ou descartar `competitor_profiles`;
- `/research` permite ativar ou arquivar `context_memory_items`;
- ao ativar uma memoria vinculada a um achado ou insight, o item de origem e marcado como `converted_to_memory`;
- todas as acoes usam a sessao Supabase do usuario logado e filtram por `client_id`;
- nenhuma integracao externa de Ads foi conectada nesta etapa.

Proxima acao:

Validar a revisao com poucos itens primeiro, antes de promover toda a memoria contextual da iBob.

## Organizacao da fila de revisao

Implementado em 2026-05-21:

- filtros por status dos achados em `/research`;
- painel de fontes publicas com tipo, publisher, trecho e link;
- indicador de prontidao da revisao com total revisado, pendencias e memorias ativas;
- contadores separados para concorrentes ativos e memorias ativas.

Proxima acao:

Validar a fila organizada antes de revisar/promover o restante dos achados da iBob.

## Auditoria da revisao contextual

Implementado em 2026-05-21:

- `/research` recebe uma nota opcional de revisao;
- criacao de runs registra `context_research.run_created` em `audit_events`;
- revisao de achados registra `context_research.finding_reviewed`;
- revisao de insights registra `context_research.competitor_insight_reviewed`;
- ativacao/descarte de concorrentes registra `context_research.competitor_status_updated`;
- ativacao/arquivamento de memoria registra `context_research.memory_status_updated`;
- os eventos guardam `client_id`, usuario ator, entidade, status e nota de revisao em metadata;
- nenhuma tabela nova foi criada nesta etapa.

Proxima acao:

Validar em producao uma acao controlada de revisao e conferir o evento correspondente em `/audit`.

## Tracking e Funil Real

Preparado localmente em 2026-05-24:

```text
infra/supabase/migrations/20260524100000_create_funnel_tracking.sql
```

Ela prepara:

- `funnel_import_batches`;
- `funnel_events`;
- enums `funnel_event_stage`, `funnel_event_source` e `funnel_import_status`;
- RLS por `client_id`;
- leitura por membros do cliente;
- escrita por `owner` e `admin`.

Tambem foram criados:

- rota `/funnel`;
- template `docs/templates/funnel_events_import_template.csv`;
- documentacao `docs/FUNNEL_TRACKING.md`.

Estado:

- migration aplicada no Supabase remoto em 2026-05-24;
- tabelas, enums e policies RLS validados por consulta remota;
- nenhuma integracao externa conectada;
- nenhuma escrita em contas de Ads.

Proxima acao:

V43 implementa entrada manual em `/funnel` para gravar eventos reais em `funnel_events` e registrar `funnel.event_created` em `audit_events`.

Proxima acao:

Validar um evento manual controlado e conferir leitura em `/funnel` e auditoria em `/audit`.

## Decision Engine supervisionado

Implementado localmente em 2026-05-25.

V45 cria `/decision` sem nova migration.

A tela le as tabelas existentes de contexto, pesquisa, funil e Data Trust para avaliar gates antes de qualquer proposta:

- contexto ativo e completo;
- lacunas criticas resolvidas;
- achados, memoria e concorrentes revisados;
- funil real minimo com lead qualificado, oportunidade, proposta, venda e margem;
- nota CMO de `/strategy` como consolidacao estrategica;
- Data Trust sem fonte vermelha;
- execucao externa bloqueada.

O modo permanece `SUPERVISED_DRY_RUN`. Google Ads MCP, Meta Ads MCP e qualquer escrita externa seguem fora do fluxo ate rule_validator, aprovacao humana e dry-run de execucao ficarem prontos.

Proxima acao:

Validar `/decision` em producao e usar os bloqueios exibidos como base para o proximo schema de `rule_validator`.

## Rule Validator

Preparado localmente em 2026-05-25:

```text
infra/supabase/migrations/20260525100000_create_rule_validator.sql
```

Ela prepara:

- `rule_validator_rules`;
- `rule_validator_runs`;
- `rule_validator_checks`;
- enums `rule_validator_rule_category`, `rule_validator_rule_severity`, `rule_validator_rule_status` e `rule_validator_result`;
- RLS por `client_id`;
- catalogo inicial de regras v1.

Tambem foi criada a rota `/validator` para executar dry-run local das regras.

Estado:

- migration aplicada no Supabase remoto em 2026-05-26;
- tipos TypeScript atualizados;
- tabelas, enums, policies RLS e 8 regras ativas validadas por consulta remota;
- v49 registra dry-runs em `rule_validator_runs` e `rule_validator_checks` pela tela `/validator`;
- cada registro cria auditoria `rule_validator.run_recorded`;
- v50 lista os ultimos dry-runs e checks em `/validator`, permitindo conferencia operacional antes de qualquer promocao para proposta;
- v51 permite certificar uma proposta existente quando o dry-run esta aprovado, atualizando `proposals.rule_validator_passed` e gravando auditoria `rule_validator.proposal_certified`;
- nenhuma proposta nova gravada automaticamente;
- nenhuma integracao externa conectada.

Proxima acao:

Validar `/validator` em producao, certificar uma proposta apta e conferir `/proposals`, `/approvals` e `/audit`.

## Execution Engine

Estado v52:

- `/execution` usa a tabela existente `execution_logs`;
- nenhuma migration nova foi necessaria;
- a tela lista propostas aprovadas e certificadas pelo `rule_validator`;
- `Simular execucao` grava `result = simulated` e `is_dry_run = true`;
- cada simulacao cria auditoria `execution.dry_run_recorded`;
- Google Ads, Meta Ads e MCPs seguem bloqueados.

Estado v53:

- `/execution` mostra preflight por proposta;
- simulacoes bloqueadas exibem o motivo antes de gravar qualquer log;
- plano de rollback fica visivel antes do dry-run;
- preflight e rollback sao gravados nos campos JSON de `execution_logs`;
- nenhuma migration nova foi necessaria.

Proxima acao:

Validar `/execution` em producao, conferir preflight/rollback, registrar um dry-run e conferir o evento em `/audit`.

## Nucleo supervisionado validado

Estado v54:

- etapas 5 a 12 consolidadas como concluidas no Roadmap;
- nenhum conector externo em modo escrita foi liberado;
- o fluxo validado termina em `execution_logs` com `is_dry_run = true`;
- a proxima fase planejada e `Produto escalavel`, antes das integracoes finais.
