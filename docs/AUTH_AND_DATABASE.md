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
