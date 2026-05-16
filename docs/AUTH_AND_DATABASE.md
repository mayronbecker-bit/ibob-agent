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
- Schema SQL versionado.
- `/settings` mostra se o Supabase esta configurado.
- Nenhum deploy realizado nesta etapa.
- Nenhuma chave real configurada.

## Proxima etapa tecnica

Criar a tela de login real e a protecao de rotas por Supabase Auth em paralelo ao Basic Auth temporario. O Basic Auth so deve ser removido depois de validar login, sessao e RLS.
