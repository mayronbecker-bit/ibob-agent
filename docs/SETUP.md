# Setup

Este documento registra como preparar o projeto localmente.

## Pre-requisitos atuais

- VS Code.
- Git.
- Terminal PowerShell.

## Stack atual

- Frontend/app principal: Next.js em `apps/web`.
- Linguagem: TypeScript.
- Estilo: Tailwind CSS.
- Lint: ESLint.
- Gerenciador de pacotes: npm.
- Cloud alvo: Hostinger.
- Blueprint funcional: `docs/CLAUDE_BLUEPRINT_INTEGRATION.md`.

## Ambiente local

1. Criar `.env` a partir de `.env.example`.
2. Preencher segredos somente no `.env` local ou diretamente na plataforma cloud.
3. Rodar o app localmente.
4. Rodar validacoes antes de deploy.

## Comandos

No root do projeto:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run audit:web
```

Direto no app:

```powershell
cd apps/web
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

Observacao: neste Windows, o PowerShell bloqueou o shim `npm.ps1`. Por isso, use `npm.cmd`.

## Validacao atual

Validado em 2026-05-12:

- `npm.cmd run lint`: passou.
- `npm.cmd run build`: passou.
- `npm.cmd run hostinger:build`: passou apos parar o servidor dev local.

## Auditoria de dependencias

`npm.cmd run audit:web` reportou 2 vulnerabilidades moderadas ligadas a `postcss` dentro de `next`.

O `npm audit fix --force` nao foi aplicado porque a correcao sugerida instalaria uma versao antiga e quebradora do Next.js. Acompanhar atualizacao upstream do Next.js antes de alterar a versao.

## Observacao de seguranca

Nunca colocar valores reais de tokens, senhas ou chaves em arquivos versionados.

## Blueprint da Claude

O pacote original da Claude foi importado em:

```text
docs/claude-blueprint/ibob_agente_projeto/
```

Use `docs/CLAUDE_BLUEPRINT_INTEGRATION.md` como ponte entre o blueprint original e a implementacao atual em Next.js + Hostinger.
