# iBob - Agent

Projeto em preparacao local para desenvolvimento assistido no VS Code, com organizacao de app, configuracao, validacao e deploy supervisionado.

## Estado atual

- Estrutura base criada em 2026-05-11.
- Git sera usado para historico local do projeto.
- Stack escolhida: Next.js em `apps/web`.
- Cloud escolhida: Hostinger.
- Diretriz de produto: iBob como piloto/MVP, com evolucao planejada para produto vendavel e escalavel.
- Nenhum segredo deve ser salvo no repositorio.

## Estrutura

```text
.
  apps/
    web/
    api/
  packages/
    shared/
  infra/
    docker/
    cloud/
  scripts/
  tests/
  docs/
```

## Fluxo de trabalho

1. Trabalhar no app Next.js em `apps/web`.
2. Configurar variaveis em `.env` local, mantendo apenas `.env.example` versionado.
3. Rodar validacoes locais.
4. Preparar ambiente Hostinger.
5. Fazer deploy somente com autorizacao explicita do usuario.
6. Registrar mudancas em `docs/CHANGELOG.md` e decisoes em `docs/DECISIONS.md`.

## Comandos principais

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

Os comandos do root encaminham para `apps/web`.

## Documentos

- [Setup](docs/SETUP.md)
- [Deploy](docs/DEPLOY.md)
- [Hostinger](docs/HOSTINGER.md)
- [Checklist do primeiro deploy](docs/FIRST_DEPLOY_CHECKLIST.md)
- [Estrategia de produto](docs/PRODUCT_STRATEGY.md)
- [Decisoes](docs/DECISIONS.md)
- [Changelog](docs/CHANGELOG.md)
