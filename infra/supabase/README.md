# Supabase

Fundacao de banco e autenticacao para transformar o piloto iBob em produto multi-cliente.

## Estado

- Migration inicial criada em `migrations/20260516170000_initial_platform_auth.sql`.
- Ainda nao aplicada em producao.
- Nenhum segredo do Supabase deve ser salvo no repositorio.

## Variaveis

Configurar localmente em `.env.local` dentro de `apps/web` ou no ambiente da Hostinger:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

`SUPABASE_SECRET_KEY` e somente para tarefas server-side futuras. Nunca usar em componentes de browser.

## Como aplicar a migration

Quando o projeto Supabase existir:

```powershell
npx supabase login
npx supabase --workdir infra init
npx supabase --workdir infra link --project-ref <project-ref>
npx supabase --workdir infra db push
```

Antes de aplicar em qualquer ambiente real, revisar o SQL e confirmar com o usuario.

## Primeiro cliente

A migration cria o cliente piloto:

```text
id: client-ibob
slug: ibob
plan: pilot
```

O primeiro usuario/admin deve ser criado no Supabase Auth e vinculado via SQL controlado usando a tabela `client_memberships`.
