# Checklist do primeiro deploy

Data: 2026-05-12

## Objetivo

Preparar o primeiro deploy supervisionado do piloto iBob na Hostinger, mantendo o projeto pronto para evoluir para produto vendavel e escalavel.

## Antes do deploy

- Confirmar plano Hostinger com suporte a Node.js Web Apps.
- Confirmar acesso ao hPanel.
- Confirmar dominio ou URL temporaria.
- Confirmar metodo de deploy:
  - GitHub integration, recomendado.
  - ZIP de `apps/web`, alternativa.
- Confirmar se o primeiro ambiente sera:
  - Preview/staging.
  - Producao inicial.
- Confirmar variaveis de ambiente necessarias.
- Garantir que nenhum segredo foi salvo no Git.
- Criar primeiro commit local.
- Criar repositorio remoto, caso use GitHub.

## Validacao local obrigatoria

Rodar no root do projeto:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run hostinger:build
```

Se o servidor dev estiver ligado e `hostinger:build` falhar com arquivo em uso, parar o servidor local e repetir.

## Configuracao sugerida na Hostinger

Se usar o repositorio inteiro:

- Framework: Next.js.
- Node.js: 24.x, se disponivel.
- Install command: `npm run hostinger:install`
- Build command: `npm run hostinger:build`
- Start command: `npm run hostinger:start`
- Output directory, se solicitado: `apps/web/.next`

Se usar ZIP da pasta `apps/web`:

- Build command: `npm run build`
- Start command: `npm run start`
- Output directory, se solicitado: `.next`

ZIP preparado para Hostinger:

```text
deploy/hostinger/ibob-agent-web-hostinger.zip
```

Se aparecer erro de estrutura invalida no GitHub import, usar o ZIP acima.

## Variaveis esperadas

Comecar sem secrets se o app ainda for apenas a tela inicial.

Quando houver integracoes, configurar no hPanel:

- `APP_ENV`
- `NEXT_PUBLIC_APP_URL`
- `HOSTINGER_DOMAIN`
- `DATABASE_URL`, se houver banco.
- Chaves de provedores externos, apenas quando necessarias.

## Validacao apos deploy

- Abrir URL publicada.
- Confirmar que a pagina carrega com status 200.
- Confirmar que o texto `iBob Agent` aparece.
- Conferir logs no hPanel.
- Registrar URL, data e resultado em `docs/CHANGELOG.md`.

## Nao fazer sem confirmacao

- Alterar DNS.
- Configurar dominio de producao.
- Inserir secrets reais em qualquer arquivo local.
- Fazer deploy em producao se o alvo ainda nao estiver claro.
- Apagar ou substituir uma aplicacao existente na Hostinger.
